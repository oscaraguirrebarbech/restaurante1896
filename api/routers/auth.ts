import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { adminProcedure, hashPassword, signAdminToken, verifyPassword } from "../auth/adminAuth";
import { getDb } from "../queries/connection";
import { adminUsers } from "@db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createRouter({
  /** Login del administrador (usuario ADMIN / contraseña encriptada con bcrypt) */
  login: publicQuery
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, input.username.trim().toUpperCase()));
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
      }
      return { token: signAdminToken(Number(user.id), user.username), username: user.username };
    }),

  /** Verifica que el token siga siendo válido */
  me: adminProcedure.query(({ ctx }) => ({ username: ctx.admin.username })),

  /** Cambiar contraseña del administrador */
  changePassword: adminProcedure
    .input(z.object({ currentPassword: z.string(), newPassword: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, ctx.admin.sub));
      if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "La contraseña actual no es correcta" });
      }
      await db.update(adminUsers).set({ passwordHash: hashPassword(input.newPassword) }).where(eq(adminUsers.id, user.id));
      return { ok: true };
    }),
});
