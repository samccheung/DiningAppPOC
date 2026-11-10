export const CATEGORIES = [
  { id: "sushi", label: "壽司" },
  { id: "sashimi", label: "刺身" },
  { id: "rolls", label: "卷物" },
  { id: "set", label: "盛合" },
  { id: "noodles", label: "麵食" },
  { id: "dessert", label: "甜品" },
  { id: "drinks", label: "飲品" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  placed: "已落單",
  preparing: "製作中",
  ready: "可取餐",
  completed: "已完成",
  cancelled: "已取消",
};

export function pickupSlots(): string[] {
  // next 3 hours in 15-min slots, HK time (UTC+8), 20 min lead time
  const slots: string[] = [];
  const now = new Date(Date.now() + 8 * 3600_000 + 20 * 60_000);
  const d = new Date(Math.ceil(now.getTime() / (15 * 60_000)) * (15 * 60_000));
  for (let i = 0; i < 12; i++) {
    const t = new Date(d.getTime() + i * 15 * 60_000);
    slots.push(
      `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`
    );
  }
  return slots;
}
