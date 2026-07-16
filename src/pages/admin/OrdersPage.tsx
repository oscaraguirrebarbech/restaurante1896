import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { formatMoney, ORDER_STATUS } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";
import { RefreshCw } from "lucide-react";

const STATUS_FLOW = ["pendiente", "confirmado", "en_preparacion", "listo", "en_camino", "entregado", "cancelado"] as const;

export default function OrdersPage() {
  const [filter, setFilter] = useState("todos");
  const [view, setView] = useState<"turno" | "comanda">("turno");
  const { currency } = useSettings();
  const utils = trpc.useUtils();

  const { data: orders, isLoading, refetch, isFetching } = trpc.orders.list.useQuery(
    { status: filter },
    { refetchInterval: 10000 }
  );

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => utils.orders.list.invalidate(),
  });

  const sorted = [...(orders ?? [])].sort((a, b) =>
    view === "comanda" ? a.comandaNumber - b.comandaNumber : a.orderNumber - b.orderNumber
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Gestión de <span className="gold-text">pedidos</span></h1>
        <button onClick={() => refetch()} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:border-primary">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl border border-border p-1">
          <button onClick={() => setView("turno")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${view === "turno" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Por turno</button>
          <button onClick={() => setView("comanda")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${view === "comanda" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Orden de comanda</button>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-input bg-card px-4 py-2 text-sm outline-none">
          <option value="todos">Todos los estados</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">Cargando pedidos...</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">No hay pedidos con ese filtro.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((o) => {
            const st = ORDER_STATUS[o.status];
            return (
              <div key={Number(o.id)} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-muted-foreground">Turno</p>
                      <p className="font-display text-2xl font-black text-primary">#{o.orderNumber}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase text-muted-foreground">Comanda</p>
                      <p className="text-lg font-bold">#{o.comandaNumber}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-sm text-muted-foreground">{o.customerPhone} · {o.orderType}{o.source === "chatbot" ? " · 🤖 chatbot" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className="font-bold text-primary">{formatMoney(o.total, currency)}</span>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  {o.items.map((it) => (
                    <li key={Number(it.id)} className="flex justify-between">
                      <span>{it.quantity}x {it.dishName}{it.notes ? ` (${it.notes})` : ""}</span>
                      <span className="text-muted-foreground">{formatMoney(Number(it.unitPrice) * it.quantity, currency)}</span>
                    </li>
                  ))}
                </ul>
                {o.deliveryAddress && <p className="mt-2 text-sm text-muted-foreground">📍 {o.deliveryAddress}</p>}
                {o.notes && <p className="mt-1 text-sm text-muted-foreground">📝 {o.notes}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_FLOW.filter((s) => s !== o.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus.mutate({ id: Number(o.id), status: s })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${ORDER_STATUS[s].color} hover:brightness-125`}
                    >
                      → {ORDER_STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
