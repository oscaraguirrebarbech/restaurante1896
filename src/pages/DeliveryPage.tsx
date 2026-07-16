import { useState } from "react";
import { Bike, CheckCircle2, Upload } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function DeliveryPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", cedula: "", phone: "", address: "", vehiclePlate: "", vehicleType: "Moto", photoUrl: "" });
  const [done, setDone] = useState(false);

  const register = trpc.delivery.registerDriver.useMutation({
    onSuccess: () => setDone(true),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ ...form, photoUrl: form.photoUrl || null, address: form.address || null, vehicleType: form.vehicleType || null });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-400" />
        <h1 className="font-display text-3xl font-bold">¡Registro recibido!</h1>
        <p className="mt-3 text-muted-foreground">
          Tus datos fueron enviados al restaurante. El administrador revisará tu solicitud y activará tu cuenta de repartidor.
          Te contactaremos a tu teléfono.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <Bike className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="font-display text-4xl font-bold">Únete al equipo de <span className="gold-text">Delivery</span></h1>
        <p className="mt-2 text-muted-foreground">Regístrate como repartidor. El administrador validará tus datos.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombres *</label>
            <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellidos *</label>
            <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cédula / DNI *</label>
            <input required value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono *</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Dirección *</label>
            <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Placas del vehículo *</label>
            <input required value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Ej: 1234-ABC" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de vehículo</label>
            <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary">
              <option>Moto</option>
              <option>Bicicleta</option>
              <option>Auto</option>
              <option>Mototaxi</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Foto del repartidor</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-4 hover:border-primary">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="foto" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">{form.photoUrl ? "Foto cargada — toca para cambiar" : "Subir foto (JPG/PNG)"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>
        {register.error && <p className="text-sm text-red-400">{register.error.message}</p>}
        <button disabled={register.isPending} className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
          {register.isPending ? "Enviando..." : "Registrarme como repartidor"}
        </button>
      </form>
    </div>
  );
}
