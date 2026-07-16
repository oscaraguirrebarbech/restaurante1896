import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { categories, dishes } from "@db/schema";
import { asc, eq } from "drizzle-orm";

const dishInput = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(160),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  imageUrl: z.string().optional().nullable(),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const menuRouter = createRouter({
  /** Menú completo público: categorías (con subcategorías) + platos disponibles */
  publicMenu: publicQuery.query(async () => {
    const db = getDb();
    const cats = await db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder));
    const allDishes = await db.select().from(dishes).orderBy(asc(dishes.sortOrder), asc(dishes.name));
    return { categories: cats, dishes: allDishes };
  }),

  /* ------------------ ADMIN ------------------ */
  adminMenu: adminProcedure.query(async () => {
    const db = getDb();
    const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    const allDishes = await db.select().from(dishes).orderBy(asc(dishes.sortOrder), asc(dishes.name));
    return { categories: cats, dishes: allDishes };
  }),

  createDish: adminProcedure.input(dishInput).mutation(async ({ input }) => {
    const db = getDb();
    const [r] = await db.insert(dishes).values({ ...input, price: input.price.toFixed(2) });
    return { id: Number(r.insertId) };
  }),

  updateDish: adminProcedure
    .input(dishInput.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const { id, price, ...rest } = input;
      const db = getDb();
      const data: Record<string, unknown> = { ...rest };
      if (price !== undefined) data.price = price.toFixed(2);
      await db.update(dishes).set(data).where(eq(dishes.id, id));
      return { ok: true };
    }),

  deleteDish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(dishes).where(eq(dishes.id, input.id));
    return { ok: true };
  }),

  createCategory: adminProcedure
    .input(z.object({ name: z.string().min(1), slug: z.string().min(1), parentId: z.number().optional().nullable(), sortOrder: z.number().int().default(0) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [r] = await db.insert(categories).values({ name: input.name, slug: input.slug, parentId: input.parentId ?? null, sortOrder: input.sortOrder });
      return { id: Number(r.insertId) };
    }),

  updateCategory: adminProcedure
    .input(z.object({ id: z.number().int().positive(), name: z.string().optional(), active: z.boolean().optional(), sortOrder: z.number().int().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(categories).set(data).where(eq(categories.id, id));
      return { ok: true };
    }),

  deleteCategory: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(dishes).where(eq(dishes.categoryId, input.id));
    await db.delete(categories).where(eq(categories.id, input.id));
    return { ok: true };
  }),
});
