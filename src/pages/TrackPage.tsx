import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatMoney, ORDER_STATUS, DELIVERY_STATUS } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";
import LiveMap from "@/components/LiveMap";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState<{ orderNumber: number; phone: string } | null>(null);
  const { currency, mapsKey } = useSettings();

  const { data, error, isFetching } = trpc.orders.track.useQuery(search!, {
    enabled: !!search,
    refetchInterval: 8000,
  });

  const delivery = data?.delivery;
  const status = ORDER_STATUS[data?.order.status ?? "pendiente"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <PackageSearch className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-4xl font-bold">Seguimiento de <span className="gold-text">pedido</span></h1>
        <p className="mt-2 text-muted-foreground">Ingresa tu número de turno y teléfono para ver el estado en vivo.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row">
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ""))} placeholder="Nº de turno (ej: 12)" className="flex-1 rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono registrado" className="flex-1 rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
        <button
          onClick={() => orderNumber && phone && setSearch({ orderNumber: Number(orderNumber), phone })}
          className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:brightness-110"
        >
          Buscar
        </button>
      </div>

      {isFetching && search && <p className="mt-6 text-center text-muted-foreground">Buscando...</p>}
      {error && <p className="mt-6 text-center text-red-400">{error.message}</p>}

      {data && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Turno</p>
                <p className="font-display text-3xl font-black gold-text">#{data.order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comanda</p>
                <p className="text-xl font-bold">#{data.order.comandaNumber}</p>
              </div>
              <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>

            {/* Línea de progreso */}
            <div className="mt-6 flex items-center">
              {["pendiente", "confirmado", "en_preparacion", "listo", data.order.orderType === "delivery" ? "en_camino" : "entregado", "entregado"].filter((v, i, a) => a.indexOf(v) === i).map((s, i, arr) => {
                const order = ["pendiente", "confirmado", "en_preparacion", "listo", "en_camino", "entregado"];
                const reached = order.indexOf(data.order.status) >= order.indexOf(s);
                return (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${reached ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className={`h-0.5 flex-1 ${reached && order.indexOf(data.order.status) > order.indexOf(s) ? "bg-primary" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>

            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {data.items.map((it) => (
                <li key={Number(it.id)} className="flex justify-between text-sm">
                  <span>{it.quantity}x {it.dishName}</span>
                  <span className="text-muted-foreground">{formatMoney(Number(it.unitPrice) * it.quantity, currency)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-border pt-2 font-bold">
                <span>Total</span>
                <span className="text-primary">{formatMoney(data.order.total, currency)}</span>
              </li>
            </ul>
          </div>

          {delivery && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Tu repartidor en vivo</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${DELIVERY_STATUS[delivery.status]?.color}`}>
                  {DELIVERY_STATUS[delivery.status]?.label}
                </span>
              </div>
              <LiveMap
                apiKey={mapsKey || undefined}
                origin={{ lat: delivery.originLat, lng: delivery.originLng }}
                dest={delivery.destLat != null && delivery.destLng != null ? { lat: delivery.destLat, lng: delivery.destLng } : null}
                current={delivery.currentLat != null && delivery.currentLng != null ? { lat: delivery.currentLat, lng: delivery.currentLng } : null}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
