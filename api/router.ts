import { authRouter } from "./auth-router";
import { menuRouter, cartRouter, ordersRouter } from "./store-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  menu: menuRouter,
  cart: cartRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
