import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { orders, orderItems, turnCounters, deliveries } from "@db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { notifyWhatsapp } from "../services/whatsapp";

/** Incrementa y devuelve el siguiente turno para un contador ('order' | 'comanda' | 'reservation') */
export async function nextTurn(key: string): Promise<number> {
  const db = getDb();
  await db
    .insert(turnCounters)
    .values({ counterKey: key, currentValue: 1 })
    .onDuplicateKeyUpdate({ set: { currentValue: sql`${turnCounters.currentValue} + 1` } });
  const [row] = await db.select().from(turnCounters).where(eq(turnCounters.counterKey, key));
  return row?.currentValue ?? 1;
}

const itemInput = z.object({
  dishId: z.number().int().positive(),
  quantity: z.number().int().positive().max(50),
  notes: z.string().max(255).optional(),
});

export const ordersRouter = createRouter({
  /** Cliente crea un pedido: recibe turno y número de comanda, y se notifica a WhatsApp */
  create: publicQuery
    .input(
      z.object({
        customerName: z.string().min(2).max(120),
        customerPhone: z.string().min(6).max(40),
        orderType: z.enum(["local", "delivery", "recojo"]).default("local"),
        deliveryAddress: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        source: z.enum(["web", "chatbot"]).default("web"),
        items: z.array(itemInput).min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Traer precios reales desde la BD (seguridad: nunca confiar en el cliente)
      const { dishes } = await import("@db/schema");
      const dbDishes = await db.select().from(dishes);
      const priceMap = new Map(dbDishes.map((d) => [Number(d.id), d]));
      for (const it of input.items) {
        const d = priceMap.get(it.dishId);
        if (!d || !d.available) throw new TRPCError({ code: "BAD_REQUEST", message: `El plato #${it.dishId} no está disponible` });
      }
      const lines = input.items.map((it) => {
        const d = priceMap.get(it.dishId)!;
        return { dish: d, qty: it.quantity, notes: it.notes, line: Number(d.price) * it.quantity };
      });
      const subtotal = lines.reduce((a, l) => a + l.line, 0);
      const total = subtotal;

      const orderNumber = await nextTurn("order");
      const comandaNumber = await nextTurn("comanda");

      const [r] = await db.insert(orders).values({
        orderNumber,
        comandaNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        orderType: input.orderType,
        deliveryAddress: input.deliveryAddress ?? null,
        notes: input.notes ?? null,
        source: input.source,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
      });
      const orderId = Number(r.insertId);
      await db.insert(orderItems).values(
        lines.map((l) => ({
          orderId,
          dishId: Number(l.dish.id),
          dishName: l.dish.name,
          unitPrice: Number(l.dish.price).toFixed(2),
          quantity: l.qty,
          notes: l.notes,
        }))
      );

      if (input.orderType === "delivery") {
        await db.insert(deliveries).values({ orderId, destAddress: input.deliveryAddress ?? null });
      }

      const itemsText = lines.map((l) => `• ${l.qty}x ${l.dish.name} — $${l.line.toFixed(2)}`).join("\n");
      const message =
        `🍽️ *NUEVO PEDIDO #${orderNumber}* (Comanda #${comandaNumber})\n` +
        `👤 Cliente: ${input.customerName}\n📞 Tel: ${input.customerPhone}\n` +
        `📦 Tipo: ${input.orderType}${input.deliveryAddress ? `\n📍 Dirección: ${input.deliveryAddress}` : ""}\n` +
        `${input.notes ? `📝 Notas: ${input.notes}\n` : ""}\n*Detalle:*\n${itemsText}\n\n💵 *TOTAL: $${total.toFixed(2)}*`;
      const notify = await notifyWhatsapp({ kind: "pedido", refId: orderId, message });

      return { orderId, orderNumber, comandaNumber, total: total.toFixed(2), whatsapp: notify };
    }),

  /** Seguimiento público del pedido por número de turno + teléfono */
  track: publicQuery
    .input(z.object({ orderNumber: z.number().int().positive(), phone: z.string().min(6) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, input.orderNumber)).orderBy(desc(orders.id)).limit(1);
      if (!order || !order.customerPhone.replace(/\D/g, "").endsWith(input.phone.replace(/\D/g, "").slice(-6))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado. Verifica el número de turno y tu teléfono." });
      }
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, order.id));
      return { order, items, delivery: delivery ?? null };
    }),

  /* ------------------ ADMIN ------------------ */
  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.select().from(orders).orderBy(desc(orders.id)).limit(200);
      const items = await db.select().from(orderItems);
      const byOrder = new Map<number, typeof items>();
      for (const it of items) {
        const k = Number(it.orderId);
        if (!byOrder.has(k)) byOrder.set(k, []);
        byOrder.get(k)!.push(it);
      }
      let filtered = all;
      if (input?.status && input.status !== "todos") filtered = all.filter((o) => o.status === input.status);
      return filtered.map((o) => ({ ...o, items: byOrder.get(Number(o.id)) ?? [] }));
    }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["pendiente", "confirmado", "en_preparacion", "listo", "en_camino", "entregado", "cancelado"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { ok: true };
    }),
});
