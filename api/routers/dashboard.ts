import { createRouter } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { orders, orderItems, reservations, deliveries, drivers, dishes } from "@db/schema";
import { sql } from "drizzle-orm";

export const dashboardRouter = createRouter({
  /** Resumen detallado del negocio para el Dashboard */
  summary: adminProcedure.query(async () => {
    const db = getDb();

    const [totals] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN status NOT IN ('cancelado') THEN total END), 0)`,
        pendingOrders: sql<number>`SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END)`,
        preparing: sql<number>`SUM(CASE WHEN status IN ('confirmado','en_preparacion') THEN 1 ELSE 0 END)`,
        delivered: sql<number>`SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END)`,
        cancelled: sql<number>`SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END)`,
        deliveryOrders: sql<number>`SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END)`,
        localOrders: sql<number>`SUM(CASE WHEN order_type = 'local' THEN 1 ELSE 0 END)`,
      })
      .from(orders);

    const [today] = await db
      .select({
        ordersToday: sql<number>`COUNT(*)`,
        revenueToday: sql<string>`COALESCE(SUM(CASE WHEN status NOT IN ('cancelado') THEN total END), 0)`,
      })
      .from(orders)
      .where(sql`DATE(created_at) = CURDATE()`);

    const [res] = await db
      .select({
        totalReservations: sql<number>`COUNT(*)`,
        pendingReservations: sql<number>`SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END)`,
        accepted: sql<number>`SUM(CASE WHEN status = 'aceptada' THEN 1 ELSE 0 END)`,
        rejected: sql<number>`SUM(CASE WHEN status = 'rechazada' THEN 1 ELSE 0 END)`,
        peopleExpected: sql<number>`COALESCE(SUM(CASE WHEN status = 'aceptada' AND reservation_date >= CURDATE() THEN people END), 0)`,
      })
      .from(reservations);

    const [del] = await db
      .select({
        activeDeliveries: sql<number>`SUM(CASE WHEN status IN ('asignado','recogiendo','en_camino') THEN 1 ELSE 0 END)`,
        completedDeliveries: sql<number>`SUM(CASE WHEN status = 'entregado' THEN 1 ELSE 0 END)`,
      })
      .from(deliveries);

    const [drv] = await db.select({ total: sql<number>`COUNT(*)`, active: sql<number>`SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END)` }).from(drivers);
    const [dsh] = await db.select({ total: sql<number>`COUNT(*)`, available: sql<number>`SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END)` }).from(dishes);

    // Ventas de los últimos 7 días
    const salesByDay = await db
      .select({
        day: sql<string>`DATE_FORMAT(created_at, '%Y-%m-%d')`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN status NOT IN ('cancelado') THEN total END), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(sql`created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`)
      .groupBy(sql`DATE_FORMAT(created_at, '%Y-%m-%d')`)
      .orderBy(sql`DATE_FORMAT(created_at, '%Y-%m-%d')`);

    // Platos más vendidos
    const topDishes = await db
      .select({
        dishName: orderItems.dishName,
        qty: sql<number>`SUM(quantity)`,
        revenue: sql<string>`SUM(unit_price * quantity)`,
      })
      .from(orderItems)
      .groupBy(orderItems.dishName)
      .orderBy(sql`SUM(quantity) DESC`)
      .limit(8);

    return {
      totals: { ...totals, totalRevenue: Number(totals?.totalRevenue ?? 0) },
      today: { ordersToday: today?.ordersToday ?? 0, revenueToday: Number(today?.revenueToday ?? 0) },
      reservations: res,
      deliveries: del,
      drivers: drv,
      dishes: dsh,
      salesByDay: salesByDay.map((s) => ({ ...s, revenue: Number(s.revenue) })),
      topDishes: topDishes.map((t) => ({ ...t, revenue: Number(t.revenue) })),
    };
  }),

  /** Reporte de ventas (gestión de ventas) */
  sales: adminProcedure.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        day: sql<string>`DATE_FORMAT(created_at, '%Y-%m-%d')`,
        orders: sql<number>`COUNT(*)`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN status NOT IN ('cancelado') THEN total END), 0)`,
        avgTicket: sql<string>`COALESCE(AVG(CASE WHEN status NOT IN ('cancelado') THEN total END), 0)`,
        delivery: sql<number>`SUM(CASE WHEN order_type = 'delivery' THEN 1 ELSE 0 END)`,
        local: sql<number>`SUM(CASE WHEN order_type = 'local' THEN 1 ELSE 0 END)`,
      })
      .from(orders)
      .groupBy(sql`DATE_FORMAT(created_at, '%Y-%m-%d')`)
      .orderBy(sql`DATE_FORMAT(created_at, '%Y-%m-%d') DESC`)
      .limit(30);
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue), avgTicket: Number(r.avgTicket) }));
  }),
});
