import { trpc } from "@/providers/trpc";
import { RESERVATION_STATUS } from "@/lib/helpers";
import { Check, X, Users } from "lucide-react";

export default function ReservationsAdmin() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.reservations.list.useQuery(undefined, { refetchInterval: 10000 });
  const setStatus = trpc.reservations.setStatus.useMutation({ onSuccess: () => utils.reservations.list.invalidate() });

  const sorted = [...(data ?? [])].sort((a, b) => a.reservationNumber - b.reservationNumber);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold">Gestión de <span className="gold-text">reservas</span></h1>
      <p className="text-sm text-muted-foreground">Ordenadas por turno de reserva. Acepta o rechaza cada solicitud; el cliente es notificado.</p>

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">Cargando reservas...</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">No hay reservas registradas.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => {
            const st = RESERVATION_STATUS[r.status];
            return (
              <div key={Number(r.id)} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Turno</p>
                    <p className="font-display text-2xl font-black text-primary">#{r.reservationNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{r.fullName} {r.source === "chatbot" && <span title="Vía chatbot">🤖</span>}</p>
                    <p className="text-sm text-muted-foreground">{r.phone}{r.email ? ` · ${r.email}` : ""}</p>
                    <p className="mt-1 text-sm">
                      🗓️ {String(r.reservationDate)} · ⏰ {String(r.reservationTime).slice(0, 5)} · <Users className="inline h-3.5 w-3.5" /> {r.people} personas
                      {r.occasion ? ` · 🎉 ${r.occasion}` : ""}
                    </p>
                    {r.notes && <p className="mt-1 text-xs text-muted-foreground">📝 {r.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${st.color}`}>{st.label}</span>
                  {r.status !== "aceptada" && (
                    <button
                      onClick={() => setStatus.mutate({ id: Number(r.id), status: "aceptada" })}
                      className="flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <Check className="h-4 w-4" /> Aceptar
                    </button>
                  )}
                  {r.status !== "rechazada" && (
                    <button
                      onClick={() => setStatus.mutate({ id: Number(r.id), status: "rechazada" })}
                      className="flex items-center gap-1 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <X className="h-4 w-4" /> Rechazar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
