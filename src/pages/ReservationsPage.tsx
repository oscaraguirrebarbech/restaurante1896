import { useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function ReservationsPage() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", date: "", time: "", people: 2, occasion: "", notes: "" });
  const [done, setDone] = useState<{ number: number; waMeLink?: string | null } | null>(null);

  const create = trpc.reservations.create.useMutation({
    onSuccess: (data) => setDone({ number: data.reservationNumber, waMeLink: data.whatsapp?.waMeLink }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email || null,
      reservationDate: form.date,
      reservationTime: form.time,
      people: Number(form.people),
      occasion: form.occasion || null,
      notes: form.notes || null,
      source: "web",
    });
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-400" />
        <h1 className="font-display text-3xl font-bold">¡Reserva registrada!</h1>
        <p className="mt-2 text-muted-foreground">Tu número de turno de reserva es:</p>
        <p className="my-4 font-display text-6xl font-black gold-text">#{done.number}</p>
        <p className="text-sm text-muted-foreground">
          El restaurante revisará tu solicitud y la confirmará por WhatsApp. Recibirás respuesta en breve.
        </p>
        {done.waMeLink && (
          <a href={done.waMeLink} target="_blank" rel="noreferrer" className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-500">
            Enviar por WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-4xl font-bold">Reserva tu <span className="gold-text">mesa</span></h1>
        <p className="mt-2 text-muted-foreground">Completa el formulario y te asignaremos un turno de reserva.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre completo *</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Ej: María Pérez" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono / WhatsApp *</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Ej: 999 888 777" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Correo electrónico</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder="opcional" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ocasión</label>
            <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary">
              <option value="">Ninguna</option>
              <option>Cumpleaños</option>
              <option>Aniversario</option>
              <option>Reunión de negocios</option>
              <option>Celebración familiar</option>
              <option>Cita</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha *</label>
            <input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hora *</label>
            <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Número de personas *</label>
            <input required type="number" min={1} max={60} value={form.people} onChange={(e) => setForm({ ...form, people: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notas adicionales</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Alergias, silla de bebé, preferencia de mesa..." />
        </div>
        {create.error && <p className="text-sm text-red-400">{create.error.message}</p>}
        <button disabled={create.isPending} className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {create.isPending ? "Registrando..." : "Solicitar reserva"}
        </button>
        <p className="text-center text-xs text-muted-foreground">El restaurante podrá aceptar o rechazar tu reserva; recibirás la confirmación por WhatsApp.</p>
      </form>
    </div>
  );
}
