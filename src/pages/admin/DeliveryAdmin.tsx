import { useEffect, useRef, useState } from "react";
import { Bike, Play, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { DELIVERY_STATUS } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";
import LiveMap from "@/components/LiveMap";

export default function DeliveryAdmin() {
  const utils = trpc.useUtils();
  const { mapsKey } = useSettings();
  const [tab, setTab] = useState<"envios" | "repartidores">("envios");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", cedula: "", phone: "", address: "", vehiclePlate: "", vehicleType: "Moto", photoUrl: "" });
  const [selected, setSelected] = useState<number | null>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: deliveries } = trpc.delivery.listDeliveries.useQuery(undefined, { refetchInterval: 8000 });
  const { data: drivers } = trpc.delivery.listDrivers.useQuery(undefined, { refetchInterval: 15000 });

  const createDriver = trpc.delivery.createDriver.useMutation({
    onSuccess: () => { utils.delivery.listDrivers.invalidate(); setShowForm(false); setForm({ firstName: "", lastName: "", cedula: "", phone: "", address: "", vehiclePlate: "", vehicleType: "Moto", photoUrl: "" }); },
  });
  const updateDriver = trpc.delivery.updateDriver.useMutation({ onSuccess: () => utils.delivery.listDrivers.invalidate() });
  const deleteDriver = trpc.delivery.deleteDriver.useMutation({ onSuccess: () => utils.delivery.listDrivers.invalidate() });
  const assign = trpc.delivery.assign.useMutation({ onSuccess: () => utils.delivery.listDeliveries.invalidate() });
  const setStatus = trpc.delivery.setDeliveryStatus.useMutation({ onSuccess: () => utils.delivery.listDeliveries.invalidate() });
  const updateLocation = trpc.delivery.updateLocation.useMutation();

  const selectedDelivery = deliveries?.find((d) => Number(d.id) === selected) ?? deliveries?.[0];

  useEffect(() => () => { if (simTimer.current) clearInterval(simTimer.current); }, []);

  /** Simula el recorrido del repartidor del origen al destino (demo del tracking en vivo) */
  const simulateRoute = () => {
    if (!selectedDelivery) return;
    if (simTimer.current) clearInterval(simTimer.current);
    const origin = { lat: selectedDelivery.originLat, lng: selectedDelivery.originLng };
    const dest = {
      lat: selectedDelivery.destLat ?? origin.lat + 0.018,
      lng: selectedDelivery.destLng ?? origin.lng + 0.022,
    };
    let step = 0;
    const steps = 30;
    setStatus.mutate({ id: Number(selectedDelivery.id), status: "en_camino" });
    simTimer.current = setInterval(() => {
      step++;
      const t = step / steps;
      const lat = origin.lat + (dest.lat - origin.lat) * t + Math.sin(t * Math.PI * 3) * 0.0012;
      const lng = origin.lng + (dest.lng - origin.lng) * t + Math.cos(t * Math.PI * 2) * 0.0012;
      updateLocation.mutate({ id: Number(selectedDelivery.id), lat, lng, destLat: dest.lat, destLng: dest.lng });
      utils.delivery.listDeliveries.invalidate();
      if (step >= steps) {
        if (simTimer.current) clearInterval(simTimer.current);
        setStatus.mutate({ id: Number(selectedDelivery.id), status: "entregado" });
      }
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Gestión de <span className="gold-text">delivery</span></h1>
        <div className="flex rounded-xl border border-border p-1">
          <button onClick={() => setTab("envios")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "envios" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Envíos</button>
          <button onClick={() => setTab("repartidores")} className={`rounded-lg px-4 py-1.5 text-sm font-medium ${tab === "repartidores" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Repartidores</button>
        </div>
      </div>

      {tab === "envios" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            {(deliveries ?? []).length === 0 && (
              <p className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">No hay envíos registrados. Los pedidos tipo delivery aparecerán aquí.</p>
            )}
            {(deliveries ?? []).map((d) => (
              <div
                key={Number(d.id)}
                onClick={() => setSelected(Number(d.id))}
                className={`cursor-pointer rounded-2xl border bg-card p-4 transition-colors ${Number(selectedDelivery?.id) === Number(d.id) ? "border-primary" : "border-border hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Pedido #{d.order?.orderNumber ?? "—"} · {d.order?.customerName ?? ""}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${DELIVERY_STATUS[d.status].color}`}>{DELIVERY_STATUS[d.status].label}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">📍 {d.destAddress ?? "Sin dirección"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={d.driverId ?? ""}
                    onChange={(e) => e.target.value && assign.mutate({ deliveryId: Number(d.id), driverId: Number(e.target.value) })}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none"
                  >
                    <option value="">Asignar repartidor...</option>
                    {(drivers ?? []).filter((dr) => dr.active).map((dr) => (
                      <option key={Number(dr.id)} value={Number(dr.id)}>{dr.firstName} {dr.lastName} · {dr.vehiclePlate}</option>
                    ))}
                  </select>
                  {(["asignado", "recogiendo", "en_camino", "entregado"] as const).filter((s) => s !== d.status).map((s) => (
                    <button key={s} onClick={() => setStatus.mutate({ id: Number(d.id), status: s })} className={`rounded-full border px-3 py-1 text-xs font-medium ${DELIVERY_STATUS[s].color}`}>
                      → {DELIVERY_STATUS[s].label}
                    </button>
                  ))}
                </div>
                {d.driver && <p className="mt-2 text-xs text-muted-foreground">🛵 {d.driver.firstName} {d.driver.lastName} — {d.driver.vehicleType} {d.driver.vehiclePlate}</p>}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Mapa en vivo</h2>
              {selectedDelivery && (
                <button onClick={simulateRoute} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110">
                  <Play className="h-4 w-4" /> Simular recorrido
                </button>
              )}
            </div>
            {selectedDelivery ? (
              <div className="h-[420px]">
                <LiveMap
                  apiKey={mapsKey || undefined}
                  origin={{ lat: selectedDelivery.originLat, lng: selectedDelivery.originLng }}
                  dest={selectedDelivery.destLat != null && selectedDelivery.destLng != null ? { lat: selectedDelivery.destLat, lng: selectedDelivery.destLng } : null}
                  current={selectedDelivery.currentLat != null && selectedDelivery.currentLng != null ? { lat: selectedDelivery.currentLat, lng: selectedDelivery.currentLng } : null}
                />
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">Selecciona un envío para ver el mapa.</p>
            )}
          </div>
        </div>
      )}

      {tab === "repartidores" && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:brightness-110">
            <Plus className="h-4 w-4" /> Nuevo repartidor
          </button>

          {showForm && (
            <form
              onSubmit={(e) => { e.preventDefault(); createDriver.mutate({ ...form, photoUrl: form.photoUrl || null, address: form.address || null, vehicleType: form.vehicleType || null }); }}
              className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-3"
            >
              <input required placeholder="Nombres *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <input required placeholder="Apellidos *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <input required placeholder="Cédula / DNI *" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <input required placeholder="Teléfono *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <input placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <input required placeholder="Placas del vehículo *" value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none">
                <option>Moto</option><option>Bicicleta</option><option>Auto</option><option>Mototaxi</option>
              </select>
              <input placeholder="URL de foto (opcional)" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-2.5 outline-none focus:border-primary" />
              <button disabled={createDriver.isPending} className="rounded-xl bg-primary py-2.5 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
                {createDriver.isPending ? "Guardando..." : "Guardar"}
              </button>
              {createDriver.error && <p className="text-sm text-red-400 md:col-span-3">{createDriver.error.message}</p>}
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(drivers ?? []).map((d) => (
              <div key={Number(d.id)} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  {d.photoUrl ? (
                    <img src={d.photoUrl} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><Bike className="h-7 w-7 text-primary" /></div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{d.firstName} {d.lastName}</p>
                    <p className="text-sm text-muted-foreground">CI: {d.cedula} · {d.phone}</p>
                    <p className="text-sm text-muted-foreground">{d.vehicleType} · Placa {d.vehiclePlate}</p>
                    <p className={`mt-1 text-xs font-semibold ${d.active ? "text-emerald-400" : "text-yellow-400"}`}>{d.active ? "● Activo" : "● Pendiente de activación"}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => updateDriver.mutate({ id: Number(d.id), active: !d.active })}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold ${d.active ? "border-yellow-500/40 text-yellow-400" : "border-emerald-500/40 text-emerald-400"}`}
                  >
                    {d.active ? <><UserX className="h-4 w-4" /> Desactivar</> : <><UserCheck className="h-4 w-4" /> Activar</>}
                  </button>
                  <button onClick={() => confirm("¿Eliminar repartidor?") && deleteDriver.mutate({ id: Number(d.id) })} className="rounded-xl border border-red-500/40 px-3 py-2 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
