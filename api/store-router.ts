import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, cartItems, orders, orderItems } from "../db/schema";
import { TRPCError } from "@trpc/server";

export const BRANCHES = [
  "旺角", "尖沙咀", "中環", "銅鑼灣", "沙田", "將軍澳", "九龍塘", "觀塘",
] as const;

/** Dine-in stores (high-speed line / 高速線 = bullet-train delivery). */
export const STORES: Array<{
  id: string; name: string; address: string; highSpeed: boolean;
}> = [
  { id: "northpoint-aia", name: "北角友邦廣場元気寿司高速線", address: "北角電氣道183號友邦廣場地下7-13部份舖", highSpeed: true },
  { id: "mongkok", name: "旺角元気寿司", address: "旺角彌敦道610號荷李活商業中心地庫", highSpeed: false },
  { id: "tst", name: "尖沙咀元気寿司", address: "尖沙咀厚福街11號地下", highSpeed: false },
  { id: "central", name: "中環元気寿司", address: "中環皇后大道中100號地下", highSpeed: false },
  { id: "causeway", name: "銅鑼灣元気寿司高速線", address: "銅鑼灣駱克道463-483號銅鑼灣廣場二期地下", highSpeed: true },
  { id: "shatin", name: "沙田元気寿司", address: "沙田正街21-27號沙田廣場3樓", highSpeed: false },
  { id: "tko", name: "將軍澳元気寿司高速線", address: "將軍澳重華路8號東港城2樓", highSpeed: true },
  { id: "klnbay", name: "九龍塘元気寿司", address: "九龍塘達之路80號又一城LG2樓", highSpeed: false },
];

const SEED: Array<{
  nameZh: string; nameEn: string; category: "sushi" | "sashimi" | "rolls" | "set" | "noodles" | "dessert" | "drinks";
  priceHkd: number; plateColor: "red" | "gold" | "silver" | "black" | "blue";
  isNew?: boolean; isLimited?: boolean; description: string;
}> = [
  { nameZh: "德島產 真鯛壽司", nameEn: "Tokushima Sea Bream", category: "sushi", priceHkd: 16, plateColor: "red", isNew: true, isLimited: true, description: "每日數量限定，德島直送真鯛" },
  { nameZh: "德島產 鰤魚壽司", nameEn: "Tokushima Yellowtail", category: "sushi", priceHkd: 22, plateColor: "gold", isNew: true, isLimited: true, description: "每日數量限定，油香豐腴" },
  { nameZh: "大切り 炙燒三文魚", nameEn: "Seared Salmon (Thick Cut)", category: "sushi", priceHkd: 22, plateColor: "gold", isNew: true, description: "大切厚燒，入口即化" },
  { nameZh: "吞拿魚蓉軍艦", nameEn: "Minced Tuna Gunkan", category: "sushi", priceHkd: 28, plateColor: "black", description: "滿滿吞拿魚蓉配芝麻" },
  { nameZh: "炙燒左口魚邊", nameEn: "Seared Flounder Fin", category: "sushi", priceHkd: 26, plateColor: "black", description: "火炙逼出油香，加蔥花更佳" },
  { nameZh: "北海道 帆立貝", nameEn: "Hokkaido Scallop", category: "sushi", priceHkd: 24, plateColor: "black", description: "北海道直送，鮮甜彈牙" },
  { nameZh: "三文魚壽司", nameEn: "Salmon Nigiri", category: "sushi", priceHkd: 12, plateColor: "red", description: "經典人氣之選" },
  { nameZh: "特大甜蝦", nameEn: "Jumbo Sweet Shrimp", category: "sushi", priceHkd: 19, plateColor: "gold", description: "鮮甜濃郁，蝦味十足" },
  { nameZh: "蒲燒鰻魚", nameEn: "Grilled Eel", category: "sushi", priceHkd: 18, plateColor: "gold", description: "濃厚蒲燒汁，配飯一流" },
  { nameZh: "玉子燒", nameEn: "Sweet Egg Omelette", category: "sushi", priceHkd: 8, plateColor: "red", description: "香甜軟滑" },
  { nameZh: "極上吞拿魚腩", nameEn: "Premium Fatty Tuna", category: "sashimi", priceHkd: 38, plateColor: "blue", isLimited: true, description: "大拖羅級數，霜降油花" },
  { nameZh: "三文魚刺身 (5切)", nameEn: "Salmon Sashimi 5pc", category: "sashimi", priceHkd: 32, plateColor: "blue", description: "厚切三文魚刺身" },
  { nameZh: "北海道帶子刺身 (3切)", nameEn: "Scallop Sashimi 3pc", category: "sashimi", priceHkd: 29, plateColor: "blue", description: "鮮甜帶子，爽口彈牙" },
  { nameZh: "八爪魚刺身", nameEn: "Octopus Sashimi", category: "sashimi", priceHkd: 22, plateColor: "blue", description: "爽脆鮮甜" },
  { nameZh: "加州卷 (6件)", nameEn: "California Roll 6pc", category: "rolls", priceHkd: 24, plateColor: "gold", description: "牛油果蟹柳蟹籽" },
  { nameZh: "炸蝦天婦羅卷 (6件)", nameEn: "Tempura Shrimp Roll 6pc", category: "rolls", priceHkd: 28, plateColor: "black", description: "脆炸大蝦配甜辣醬" },
  { nameZh: "炙燒芝士三文魚卷 (6件)", nameEn: "Seared Cheese Salmon Roll", category: "rolls", priceHkd: 30, plateColor: "black", isNew: true, description: "芝士焦香，三文魚濃郁" },
  { nameZh: "牛油果軟殼蟹卷 (6件)", nameEn: "Soft Shell Crab Roll 6pc", category: "rolls", priceHkd: 32, plateColor: "blue", description: "酥炸軟殼蟹配牛油果" },
  { nameZh: "元氣盛合 (12件)", nameEn: "Genki Platter 12pc", category: "set", priceHkd: 88, plateColor: "blue", description: "廚師精選12件壽司盛合" },
  { nameZh: "二人前盛合 (20件)", nameEn: "Party Platter 20pc", category: "set", priceHkd: 148, plateColor: "blue", description: "聚會首選，適合2-3人" },
  { nameZh: "無敵家 醬油拉麵", nameEn: "Mutekiya Soy Ramen", category: "noodles", priceHkd: 35, plateColor: "black", isNew: true, description: "東京池袋名店直送" },
  { nameZh: "叉燒豚骨拉麵", nameEn: "Tonkotsu Ramen", category: "noodles", priceHkd: 32, plateColor: "black", description: "濃厚豚骨湯底" },
  { nameZh: "鰻魚茶漬飯", nameEn: "Eel Ochazuke", category: "noodles", priceHkd: 30, plateColor: "gold", description: "蒲燒鰻魚配高湯茶漬" },
  { nameZh: "抹茶雪糕", nameEn: "Matcha Ice Cream", category: "dessert", priceHkd: 12, plateColor: "silver", description: "濃厚宇治抹茶" },
  { nameZh: "北海道牛乳布甸", nameEn: "Hokkaido Milk Pudding", category: "dessert", priceHkd: 15, plateColor: "silver", description: "滑溜牛乳布甸" },
  { nameZh: "日式芝士蛋糕", nameEn: "Japanese Cheesecake", category: "dessert", priceHkd: 14, plateColor: "silver", isNew: true, description: "輕盈半熟口感" },
  { nameZh: "冷泡綠茶", nameEn: "Cold Brew Green Tea", category: "drinks", priceHkd: 8, plateColor: "silver", description: "清爽回甘" },
  { nameZh: "波子汽水", nameEn: "Ramune", category: "drinks", priceHkd: 10, plateColor: "silver", description: "原味經典波子汽水" },
  { nameZh: "白桃烏龍茶", nameEn: "Peach Oolong Tea", category: "drinks", priceHkd: 10, plateColor: "silver", description: "香甜白桃配烏龍" },
];

async function ensureSeeded() {
  const db = getDb();
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) return;
  await db.insert(products).values(
    SEED.map((p, i) => ({ ...p, isNew: p.isNew ?? false, isLimited: p.isLimited ?? false, sortOrder: i }))
  );
}

export const menuRouter = createRouter({
  list: publicQuery.query(async () => {
    await ensureSeeded();
    return getDb().select().from(products).orderBy(asc(products.sortOrder));
  }),
  branches: publicQuery.query(() => [...BRANCHES]),
  stores: publicQuery.query(() => STORES),
});

export const cartRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ cartItem: cartItems, product: products })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, ctx.user!.id));
    return rows.map((r) => ({ ...r.cartItem, product: r.product }));
  }),
  add: authedQuery
    .input(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, ctx.user!.id), eq(cartItems.productId, input.productId)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(cartItems).set({ qty: Math.min(existing[0].qty + input.qty, 20) })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await db.insert(cartItems).values({ userId: ctx.user!.id, productId: input.productId, qty: input.qty });
      }
      return { ok: true };
    }),
  setQty: authedQuery
    .input(z.object({ cartItemId: z.number().int(), qty: z.number().int().min(0).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (input.qty === 0) {
        await db.delete(cartItems).where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.userId, ctx.user!.id)));
      } else {
        await db.update(cartItems).set({ qty: input.qty })
          .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.userId, ctx.user!.id)));
      }
      return { ok: true };
    }),
  clear: authedQuery.mutation(async ({ ctx }) => {
    await getDb().delete(cartItems).where(eq(cartItems.userId, ctx.user!.id));
    return { ok: true };
  }),
});

export const ordersRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myOrders = await db.select().from(orders)
      .where(eq(orders.userId, ctx.user!.id))
      .orderBy(asc(orders.id));
    const items = myOrders.length
      ? await db.select().from(orderItems)
      : [];
    return myOrders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    }));
  }),
  create: authedQuery
    .input(z.object({
      orderType: z.enum(["pickup", "dine_in"]),
      branch: z.string().min(1).max(100),
      pickupTime: z.string().max(20).optional(),
      tableNo: z.string().max(20).optional(),
      note: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select({ cartItem: cartItems, product: products })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, ctx.user!.id));
      if (rows.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "購物車是空的" });
      if (input.orderType === "pickup" && !input.pickupTime)
        throw new TRPCError({ code: "BAD_REQUEST", message: "請選擇取餐時間" });
      if (input.orderType === "dine_in" && !input.tableNo)
        throw new TRPCError({ code: "BAD_REQUEST", message: "請輸入枱號" });
      const total = rows.reduce((s, r) => s + r.product.priceHkd * r.cartItem.qty, 0);
      const inserted = await db.insert(orders).values({
        userId: ctx.user!.id,
        branch: input.branch,
        pickupTime: input.pickupTime ?? null,
        orderType: input.orderType,
        tableNo: input.tableNo ?? null,
        note: input.note ?? null,
        totalHkd: total,
      });
      const orderId = Number(inserted[0].insertId);
      await db.insert(orderItems).values(
        rows.map((r) => ({
          orderId,
          productId: r.product.id,
          nameZh: r.product.nameZh,
          priceHkd: r.product.priceHkd,
          qty: r.cartItem.qty,
        }))
      );
      await db.delete(cartItems).where(eq(cartItems.userId, ctx.user!.id));
      return { orderId, totalHkd: total };
    }),
  cancel: authedQuery
    .input(z.object({ orderId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db.select().from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.userId, ctx.user!.id)))
        .limit(1);
      if (row.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "找不到訂單" });
      if (!["placed", "preparing"].includes(row[0].status))
        throw new TRPCError({ code: "BAD_REQUEST", message: "此訂單已不能取消" });
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, input.orderId));
      return { ok: true };
    }),
});
