// Frontend logger. Its one job is to make browser-side errors readable by the
// building agent, which only sees the sandbox — a plain console.error never
// reaches it. Everything logged here is POSTed to /api/log, which the backend
// appends to /tmp/kimi-logs/app.log, the same file the server writes.
type Level = "info" | "warn" | "error";

const ENDPOINT = "/api/log";
let queue: Array<{ level: Level; msg: string; ctx?: Record<string, unknown> }> =
  [];
let scheduled = false;

// Bounded queue: an error storm can out-run the flush, and an unbounded array is
// an OOM in the very process the agent is trying to diagnose. Beyond the cap the
// OLDEST entries are dropped and the loss is recorded in the log itself.
const QUEUE_MAX = 500;
let dropped = 0;

// Chunks are capped at the server's per-request line limit.
const SEND_MAX_LINES = 50;

// Correlation with the server's request id: ids are kept in a short window and
// only used when exactly one candidate exists; an ambiguous emit is left
// unstamped rather than mislabelled.
const CORRELATION_WINDOW_MS = 2000;
let recentIds: Array<{ id: string; at: number }> = [];

function rememberRequestId(id: string): void {
  const now = Date.now();
  recentIds.push({ id, at: now });
  recentIds = recentIds.filter(e => now - e.at <= CORRELATION_WINDOW_MS);
}

function unambiguousRequestId(): string | undefined {
  const now = Date.now();
  recentIds = recentIds.filter(e => now - e.at <= CORRELATION_WINDOW_MS);
  const distinct = new Set(recentIds.map(e => e.id));
  return distinct.size === 1 ? recentIds[recentIds.length - 1].id : undefined;
}

if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    try {
      const id = response.headers.get("x-request-id");
      if (id) rememberRequestId(id);
    } catch {
      // An opaque/error response with unreadable headers is not a reason to
      // lose the response itself.
    }
    return response;
  };
}

function flush(): void {
  scheduled = false;
  const batch = queue;
  queue = [];
  if (batch.length === 0 && dropped === 0) return;
  if (dropped > 0) {
    batch.push({
      level: "warn",
      msg: "client log queue overflowed; oldest entries dropped",
      ctx: { dropped },
    });
    dropped = 0;
  }
  const requestId = unambiguousRequestId();
  const stamped = requestId
    ? batch.map(item => ({
        ...item,
        ctx: { requestId, ...item.ctx },
      }))
    : batch;
  // Chunk the send: a rejected chunk cannot take the others down with it.
  for (let i = 0; i < stamped.length; i += SEND_MAX_LINES) {
    send(stamped.slice(i, i + SEND_MAX_LINES));
  }
}

function send(chunk: Array<{ level: Level; msg: string; ctx?: Record<string, unknown> }>): void {
  try {
    const body = JSON.stringify(chunk);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" })
      );
      return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never surface a logging failure to the app.
  }
}

function emit(level: Level, msg: string, ctx?: Record<string, unknown>): void {
  if (level === "error") console.error(msg, ctx ?? "");
  else if (level === "warn") console.warn(msg, ctx ?? "");
  else console.log(msg, ctx ?? "");

  if (queue.length >= QUEUE_MAX) {
    queue.shift();
    dropped += 1;
  }
  queue.push({ level, msg, ctx });
  if (!scheduled) {
    scheduled = true;
    // queueMicrotask keeps ordering while still batching a synchronous burst.
    queueMicrotask(flush);
  }
}

export const log = {
  info: (msg: string, ctx?: Record<string, unknown>) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) =>
    emit("error", msg, ctx),
};

// Capture the crashes a try/catch cannot.
if (typeof window !== "undefined") {
  window.addEventListener("error", e => {
    emit("error", e.message || "window.onerror", {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack,
    });
  });
  window.addEventListener("unhandledrejection", e => {
    const reason = e.reason;
    emit("error", "unhandledrejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

export default log;
