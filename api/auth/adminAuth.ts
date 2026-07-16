import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../context";
import { env } from "../lib/env";

const JWT_SECRET = env.appSecret || "restaurante-1896-secret";
const TOKEN_TTL = "12h";

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}

export function signAdminToken(adminId: number, username: string) {
  return jwt.sign({ sub: adminId, username, role: "admin" }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as { sub: number; username: string; role: string };
  } catch {
    return null;
  }
}

/* Instancia tRPC propia (misma config que el servidor) para el procedure admin */
const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

/** Procedure que exige token de administrador válido (Authorization: Bearer ...) */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  const header = ctx.req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const payload = token ? verifyAdminToken(token) : null;
  if (!payload || payload.role !== "admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión de administrador inválida o expirada" });
  }
  return next({ ctx: { ...ctx, admin: payload } });
});
