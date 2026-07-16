import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routers/auth";
import { menuRouter } from "./routers/menu";
import { ordersRouter } from "./routers/orders";
import { reservationsRouter } from "./routers/reservations";
import { deliveryRouter } from "./routers/delivery";
import { dashboardRouter } from "./routers/dashboard";
import { settingsRouter } from "./routers/settings";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  menu: menuRouter,
  orders: ordersRouter,
  reservations: reservationsRouter,
  delivery: deliveryRouter,
  dashboard: dashboardRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
