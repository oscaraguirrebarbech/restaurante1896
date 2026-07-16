export function formatMoney(value: number | string, currency = "$") {
  const n = typeof value === "string" ? Number(value) : value;
  return `${currency}${n.toFixed(2)}`;
}

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  confirmado: { label: "Confirmado", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  en_preparacion: { label: "En preparación", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  listo: { label: "Listo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  en_camino: { label: "En camino", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  entregado: { label: "Entregado", color: "bg-green-600/15 text-green-500 border-green-600/30" },
  cancelado: { label: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export const RESERVATION_STATUS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  aceptada: { label: "Aceptada", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  rechazada: { label: "Rechazada", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export const DELIVERY_STATUS: Record<string, { label: string; color: string }> = {
  asignado: { label: "Asignado", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  recogiendo: { label: "Recogiendo", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  en_camino: { label: "En camino", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  entregado: { label: "Entregado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};
