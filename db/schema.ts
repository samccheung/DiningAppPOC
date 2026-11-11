import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  nameZh: varchar("nameZh", { length: 255 }).notNull(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  category: mysqlEnum("category", ["sushi", "sashimi", "rolls", "set", "noodles", "dessert", "drinks"]).notNull(),
  priceHkd: int("priceHkd").notNull(),
  plateColor: mysqlEnum("plateColor", ["red", "gold", "silver", "black", "blue"]).notNull().default("red"),
  isNew: boolean("isNew").default(false).notNull(),
  isLimited: boolean("isLimited").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});
export type Product = typeof products.$inferSelect;

export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull().references(() => products.id),
  qty: int("qty").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CartItem = typeof cartItems.$inferSelect;

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().references(() => users.id),
  branch: varchar("branch", { length: 100 }).notNull(),
  pickupTime: varchar("pickupTime", { length: 20 }),
  note: varchar("note", { length: 500 }),
  totalHkd: int("totalHkd").notNull(),
  orderType: mysqlEnum("orderType", ["pickup", "dine_in"]).default("pickup").notNull(),
  tableNo: varchar("tableNo", { length: 20 }),
  status: mysqlEnum("status", ["placed", "preparing", "delivering", "ready", "completed", "cancelled"]).default("placed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Order = typeof orders.$inferSelect;

export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull().references(() => orders.id),
  productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
  nameZh: varchar("nameZh", { length: 255 }).notNull(),
  priceHkd: int("priceHkd").notNull(),
  qty: int("qty").notNull(),
});
export type OrderItem = typeof orderItems.$inferSelect;
