import { getDb } from "../queries/connection";
import { settings, whatsappLogs } from "@db/schema";

/** Obtiene la configuración de WhatsApp desde la tabla settings */
export async function getWhatsappConfig() {
  const db = getDb();
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  return {
    adminNumber: map["whatsapp_admin_number"] || "", // ej. 51999999999
    provider: (map["whatsapp_provider"] || "wame") as "twilio" | "meta" | "wame",
    twilioSid: map["twilio_account_sid"] || "",
    twilioToken: map["twilio_auth_token"] || "",
    twilioFrom: map["twilio_whatsapp_from"] || "", // ej. whatsapp:+14155238886
    metaToken: map["meta_whatsapp_token"] || "",
    metaPhoneId: map["meta_phone_number_id"] || "",
  };
}

export function buildWaMeLink(number: string, message: string) {
  const clean = number.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Envía una notificación de WhatsApp al administrador.
 * - Si hay credenciales Twilio/Meta configuradas, envía automáticamente por API.
 * - Si no, registra el mensaje y devuelve un enlace wa.me para envío manual con 1 clic.
 */
export async function notifyWhatsapp(opts: {
  kind: "pedido" | "reserva" | "respuesta";
  refId?: number;
  message: string;
}) {
  const cfg = await getWhatsappConfig();
  const db = getDb();
  let status = "pendiente";
  let channel: "twilio" | "meta" | "wame" = "wame";
  let waMeLink = cfg.adminNumber ? buildWaMeLink(cfg.adminNumber, opts.message) : null;
  let apiResult: string | null = null;

  if (cfg.adminNumber) {
    try {
      if (cfg.provider === "twilio" && cfg.twilioSid && cfg.twilioToken && cfg.twilioFrom) {
        channel = "twilio";
        const to = cfg.adminNumber.startsWith("whatsapp:") ? cfg.adminNumber : `whatsapp:+${cfg.adminNumber.replace(/[^\d]/g, "")}`;
        const body = new URLSearchParams({ From: cfg.twilioFrom, To: to, Body: opts.message });
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${cfg.twilioSid}:${cfg.twilioToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
        apiResult = await resp.text();
        status = resp.ok ? "enviado" : "error";
      } else if (cfg.provider === "meta" && cfg.metaToken && cfg.metaPhoneId) {
        channel = "meta";
        const resp = await fetch(`https://graph.facebook.com/v20.0/${cfg.metaPhoneId}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.metaToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cfg.adminNumber.replace(/[^\d]/g, ""),
            type: "text",
            text: { body: opts.message },
          }),
        });
        apiResult = await resp.text();
        status = resp.ok ? "enviado" : "error";
      }
    } catch (e: any) {
      status = "error";
      apiResult = String(e?.message || e);
    }
  }

  await db.insert(whatsappLogs).values({
    kind: opts.kind,
    refId: opts.refId,
    toNumber: cfg.adminNumber || null,
    message: opts.message,
    channel,
    status: apiResult ? `${status}${status === "error" ? ": " + apiResult.slice(0, 200) : ""}` : status,
  });

  return { status, channel, waMeLink };
}
