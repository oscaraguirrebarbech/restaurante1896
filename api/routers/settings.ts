import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { settings, chatbotFaqs } from "@db/schema";
import { asc, eq } from "drizzle-orm";

const PUBLIC_KEYS = ["restaurant_name", "restaurant_slogan", "restaurant_address", "restaurant_phone", "restaurant_hours", "google_maps_api_key", "currency_symbol", "whatsapp_admin_number"];

export const settingsRouter = createRouter({
  /** Configuración pública (nombre, dirección, maps key, etc.) */
  public: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    for (const r of rows) if (PUBLIC_KEYS.includes(r.key)) map[r.key] = r.value ?? "";
    return map;
  }),

  /* ------------------ ADMIN ------------------ */
  all: adminProcedure.query(async () => {
    const db = getDb();
    const rows = await db.select().from(settings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  }),

  update: adminProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [key, value] of Object.entries(input)) {
        await db
          .insert(settings)
          .values({ key, value })
          .onDuplicateKeyUpdate({ set: { value } });
      }
      return { ok: true };
    }),

  /* -------- FAQs del chatbot -------- */
  listFaqs: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(chatbotFaqs).where(eq(chatbotFaqs.active, true)).orderBy(asc(chatbotFaqs.sortOrder));
  }),

  adminListFaqs: adminProcedure.query(async () => {
    const db = getDb();
    return db.select().from(chatbotFaqs).orderBy(asc(chatbotFaqs.sortOrder));
  }),

  upsertFaq: adminProcedure
    .input(z.object({
      id: z.number().int().optional(),
      keywords: z.string().min(1),
      question: z.string().min(1),
      answer: z.string().min(1),
      active: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (input.id) {
        const { id, ...data } = input;
        await db.update(chatbotFaqs).set(data).where(eq(chatbotFaqs.id, id));
        return { id };
      }
      const { id: _id, ...data } = input;
      const [r] = await db.insert(chatbotFaqs).values(data);
      return { id: Number(r.insertId) };
    }),

  deleteFaq: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(chatbotFaqs).where(eq(chatbotFaqs.id, input.id));
    return { ok: true };
  }),
});
