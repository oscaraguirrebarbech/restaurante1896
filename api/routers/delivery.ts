import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { deliveries, drivers, orders } from "@db/schema";
import { desc, eq } from "drizzle-orm";

const driverInput = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  cedula: z.string().min(5).max(30),
  phone: z.string().min(6).max(40),
  address: z.string().optional().nullable(),
  vehiclePlate: z.string().min(3).max(20),
  vehicleType: z.string().max(60).optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export const deliveryRouter = createRouter({
  /** Registro público de repartidores (queda pendiente de activación por el admin) */
  registerDriver: publicQuery.input(driverInput).mutation(async ({ input }) => {
    const db = getDb();
    const [r] = await db.insert(drivers).values({ ...input, active: false });
    return { id: Number(r.insertId) };
  }),

  /** Tracking público por ID de pedido (para el mapa en tiempo real) */
  trackByOrder: publicQuery
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, input.orderId));
      if (!delivery) return null;
      const [driver] = delivery.driverId ? await db.select().from(drivers).where(eq(drivers.id, delivery.driverId)) : [null];
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId));
      return { delivery, driver: driver ?? null, order: order ?? null };
    }),

  /* ------------------ ADMIN ------------------ */
  listDrivers: adminProcedure.query(async () => {
    const db = getDb();
    return db.select().from(drivers).orderBy(desc(drivers.id));
    }),

  createDriver: adminProcedure.input(driverInput).mutation(async ({ input }) => {
    const db = getDb();
    const [r] = await db.insert(drivers).values({ ...input, active: true });
    return { id: Number(r.insertId) };
  }),

  updateDriver: adminProcedure
    .input(driverInput.partial().extend({ id: z.number().int().positive(), active: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(drivers).set(data).where(eq(drivers.id, id));
      return { ok: true };
    }),

  deleteDriver: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(drivers).where(eq(drivers.id, input.id));
    return { ok: true };
  }),

  /** Asignar repartidor a un envío */
  assign: adminProcedure
    .input(z.object({ deliveryId: z.number().int().positive(), driverId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(deliveries).set({ driverId: input.driverId, status: "asignado" }).where(eq(deliveries.id, input.deliveryId));
      return { ok: true };
    }),

  setDeliveryStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["asignado", "recogiendo", "en_camino", "entregado"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(deliveries).set({ status: input.status }).where(eq(deliveries.id, input.id));
      return { ok: true };
    }),

  listDeliveries: adminProcedure.query(async () => {
    const db = getDb();
    const all = await db.select().from(deliveries).orderBy(desc(deliveries.id)).limit(200);
    const allDrivers = await db.select().from(drivers);
    const allOrders = await db.select().from(orders);
    const dMap = new Map(allDrivers.map((d) => [Number(d.id), d]));
    const oMap = new Map(allOrders.map((o) => [Number(o.id), o]));
    return all.map((d) => ({ ...d, driver: d.driverId ? dMap.get(Number(d.driverId)) ?? null : null, order: oMap.get(Number(d.orderId)) ?? null }));
  }),

  /** Actualizar coordenadas del repartidor (GPS real o simulación desde el panel) */
  updateLocation: adminProcedure
    .input(z.object({ id: z.number().int().positive(), lat: z.number(), lng: z.number(), destLat: z.number().optional(), destLng: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(deliveries).set({
        currentLat: input.lat,
        currentLng: input.lng,
        ...(input.destLat !== undefined ? { destLat: input.destLat } : {}),
        ...(input.destLng !== undefined ? { destLng: input.destLng } : {}),
      }).where(eq(deliveries.id, input.id));
      return { ok: true };
    }),
});
