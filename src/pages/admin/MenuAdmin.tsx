import { useState } from "react";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatMoney } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";

type DishForm = {
  id?: number;
  categoryId: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  available: boolean;
  featured: boolean;
};

export default function MenuAdmin() {
  const utils = trpc.useUtils();
  const { currency } = useSettings();
  const { data } = trpc.menu.adminMenu.useQuery();
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [editing, setEditing] = useState<DishForm | null>(null);

  const invalidate = () => { utils.menu.adminMenu.invalidate(); utils.menu.publicMenu.invalidate(); };
  const createDish = trpc.menu.createDish.useMutation({ onSuccess: () => { invalidate(); setEditing(null); } });
  const updateDish = trpc.menu.updateDish.useMutation({ onSuccess: () => { invalidate(); setEditing(null); } });
  const deleteDish = trpc.menu.deleteDish.useMutation({ onSuccess: invalidate });

  const cats = data?.categories ?? [];
  const dishes = (data?.dishes ?? []).filter((d) => activeCat === "all" || Number(d.categoryId) === activeCat);

  const openNew = () => {
    const firstCat = activeCat !== "all" ? activeCat : Number(cats.find((c) => c.parentId || cats.length)?.id ?? cats[0]?.id ?? 0);
    setEditing({ categoryId: firstCat, name: "", description: "", price: "", imageUrl: "", available: true, featured: false });
  };

  const save = () => {
    if (!editing) return;
    const payload = {
      categoryId: editing.categoryId,
      name: editing.name,
      description: editing.description || null,
      price: Number(editing.price),
      imageUrl: editing.imageUrl || null,
      available: editing.available,
      featured: editing.featured,
    };
    if (editing.id) updateDish.mutate({ id: editing.id, ...payload });
    else createDish.mutate({ ...payload, sortOrder: 0 });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => setEditing({ ...editing, imageUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Gestión del <span className="gold-text">menú</span></h1>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:brightness-110">
          <Plus className="h-4 w-4" /> Nuevo plato
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={() => setActiveCat("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${activeCat === "all" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>Todas</button>
        {cats.map((c) => (
          <button key={Number(c.id)} onClick={() => setActiveCat(Number(c.id))} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${activeCat === Number(c.id) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>
            {c.parentId ? "↳ " : ""}{c.name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Plato</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((d) => {
              const cat = cats.find((c) => Number(c.id) === Number(d.categoryId));
              return (
                <tr key={Number(d.id)} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d.imageUrl ? <img src={d.imageUrl} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-secondary" />}
                      <div>
                        <p className="font-medium">{d.name} {d.featured && <span className="text-xs text-primary">★</span>}</p>
                        <p className="line-clamp-1 max-w-[280px] text-xs text-muted-foreground">{d.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{cat?.name}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatMoney(d.price, currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${d.available ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {d.available ? "Disponible" : "Agotado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing({ id: Number(d.id), categoryId: Number(d.categoryId), name: d.name, description: d.description ?? "", price: String(d.price), imageUrl: d.imageUrl ?? "", available: d.available, featured: d.featured })} className="rounded-lg border border-border p-2 hover:border-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => confirm(`¿Eliminar “${d.name}”?`) && deleteDish.mutate({ id: Number(d.id) })} className="rounded-lg border border-red-500/40 p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{editing.id ? "Editar plato" : "Nuevo plato"}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none">
              {cats.map((c) => <option key={Number(c.id)} value={Number(c.id)}>{c.parentId ? "— " : ""}{c.name}</option>)}
            </select>
            <input placeholder="Nombre del plato *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
            <textarea placeholder="Descripción" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" min="0" placeholder="Precio *" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary" />
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-primary">
                <Upload className="h-4 w-4" /> {editing.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
            </div>
            {editing.imageUrl && <img src={editing.imageUrl} className="h-24 w-full rounded-xl object-cover" />}
            <input placeholder="o pega una URL de imagen" value={editing.imageUrl.startsWith("data:") ? "" : editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary" />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} className="h-4 w-4 accent-primary" /> Disponible</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4 accent-primary" /> Destacado</label>
            </div>
            {(createDish.error || updateDish.error) && <p className="text-sm text-red-400">{(createDish.error || updateDish.error)?.message}</p>}
            <button onClick={save} disabled={!editing.name || !editing.price || createDish.isPending || updateDish.isPending} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
              {createDish.isPending || updateDish.isPending ? "Guardando..." : "Guardar plato"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
