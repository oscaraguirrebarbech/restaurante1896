import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { reservations } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { nextTurn } from "./orders";
import { notifyWhatsapp } from "../services/whatsapp";

const reservationInput = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(40),
  email: z.string().email().optional().nullable().or(z.literal("")),
  reservationDate: z.string().min(8), // YYYY-MM-DD
  reservationTime: z.string().min(4), // HH:MM
  people: z.number().int().min(1).max(60),
  occasion: z.string().max(120).optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.enum(["web", "chatbot"]).default("web"),
});

export const reservationsRouter = createRouter({
  /** Cliente crea una reserva: recibe turno y se notifica a WhatsApp */
  create: publicQuery.input(reservationInput).mutation(async ({ input }) => {
    const db = getDb();
    const reservationNumber = await nextTurn("reservation");
    const [r] = await db.insert(reservations).values({
      reservationNumber,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      people: input.people,
      occasion: input.occasion ?? null,
      notes: input.notes ?? null,
      source: input.source,
    });
    const message =
      `📅 *NUEVA RESERVA #${reservationNumber}*\n` +
      `👤 ${input.fullName}\n📞 ${input.phone}${input.email ? `\n✉️ ${input.email}` : ""}\n` +
      `🗓️ Fecha: ${input.reservationDate} ⏰ Hora: ${input.reservationTime}\n👥 Personas: ${input.people}` +
      `${input.occasion ? `\n🎉 Ocasión: ${input.occasion}` : ""}${input.notes ? `\n📝 Notas: ${input.notes}` : ""}` +
      `\n\nResponde *ACEPTAR ${reservationNumber}* o *RECHAZAR ${reservationNumber}* desde el panel.`;
    const notify = await notifyWhatsapp({ kind: "reserva", refId: Number(r.insertId), message });
    return { reservationId: Number(r.insertId), reservationNumber, whatsapp: notify };
  }),

  /* ------------------ ADMIN ------------------ */
  list: adminProcedure.query(async () => {
    const db = getDb();
    return db.select().from(reservations).orderBy(desc(reservations.id)).limit(300);
  }),

  setStatus: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["aceptada", "rechazada", "pendiente"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(reservations).set({ status: input.status }).where(eq(reservations.id, input.id));
      const [res] = await db.select().from(reservations).where(eq(reservations.id, input.id));
      if (res && input.status !== "pendiente") {
        const message =
          input.status === "aceptada"
            ? `✅ Reserva #${res.reservationNumber} ACEPTADA — ${res.fullName}, ${res.reservationDate} ${res.reservationTime}, ${res.people} personas.`
            : `❌ Reserva #${res.reservationNumber} RECHAZADA — ${res.fullName}, ${res.reservationDate} ${res.reservationTime}.`;
        await notifyWhatsapp({ kind: "respuesta", refId: res.id ? Number(res.id) : undefined, message });
      }
      return { ok: true };
    }),
});
