// Per-request correlation for the sandbox log: the server mints one id per
// inbound request, echoes it on the `X-Request-Id` response header, and stamps
// it on every server log line written while that request is in flight. The
// browser reads the header and attaches the same id to lines it POSTs to
// /api/log. AsyncLocalStorage survives `await` boundaries, so a handler that
// logs after an await still carries the right id.
import { AsyncLocalStorage } from "async_hooks";

export const REQUEST_ID_HEADER = "x-request-id";

const storage = new AsyncLocalStorage<string>();

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return storage.run(requestId, fn);
}

export function currentRequestId(): string | undefined {
  return storage.getStore();
}
