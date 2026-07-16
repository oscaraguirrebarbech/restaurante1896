import { useState } from "react";
import { X, Minus, Plus, Trash2, Send, PartyPopper } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { formatMoney } from "@/lib/helpers";
import { trpc } from "@/providers/trpc";

export default function CartDrawer() {
  const { items, total, setQty, remove, clear, open, setOpen } = useCart();
  const { currency } = useSettings();
  const [step, setStep] = useState<"cart" | "form" | "done">("cart");
  const [form, setForm] = useState({ name: "", phone: "", orderType: "local" as "local" | "delivery" | "recojo", address: "", notes: "" });
  const [result, setResult] = useState<{ orderNumber: number; comandaNumber: number; waMeLink?: string | null } | null>(null);

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setResult({ orderNumber: data.orderNumber, comandaNumber: data.comandaNumber, waMeLink: data.whatsapp?.waMeLink });
      setStep("done");
      clear();
    },
  });

  if (!open) return null;

  const submit = () => {
    createOrder.mutate({
      customerName: form.name,
      customerPhone: form.phone,
      orderType: form.orderType,
      deliveryAddress: form.orderType === "delivery" ? form.address : null,
      notes: form.notes || null,
      source: "web",
      items: items.map((i) => ({ dishId: i.dishId, quantity: i.quantity, notes: i.notes })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-xl font-bold">Tu Pedido</h2>
          <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-secondary" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="mt-10 text-center text-muted-foreground">Tu carrito está vacío.<br />Agrega platos desde el menú.</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li key={i.dishId} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="flex-1">
                        <p className="font-medium leading-tight">{i.name}</p>
                        <p className="text-sm text-primary">{formatMoney(i.price, currency)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(i.dishId, i.quantity - 1)} className="rounded-full border border-border p-1 hover:border-primary"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center font-semibold">{i.quantity}</span>
                        <button onClick={() => setQty(i.dishId, i.quantity + 1)} className="rounded-full border border-border p-1 hover:border-primary"><Plus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(i.dishId)} className="rounded-full p-1 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-border p-4">
                <div className="mb-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatMoney(total, currency)}</span>
                </div>
                <button onClick={() => setStep("form")} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:brightness-110">
                  Enviar pedido
                </button>
              </div>
            )}
          </>
        )}

        {step === "form" && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <h3 className="font-semibold">Datos para tu pedido</h3>
            <input className="w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="Nombre completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="Teléfono / WhatsApp *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              {(["local", "recojo", "delivery"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, orderType: t })}
                  className={`rounded-xl border px-2 py-2 text-sm font-medium ${form.orderType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {t === "local" ? "En local" : t === "recojo" ? "Recojo" : "Delivery"}
                </button>
              ))}
            </div>
            {form.orderType === "delivery" && (
              <input className="w-full rounded-xl border border-input bg-background px-4 py-3" placeholder="Dirección de entrega *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            )}
            <textarea className="w-full rounded-xl border border-input bg-background px-4 py-3" rows={3} placeholder="Notas (sin cebolla, término medio, etc.)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {createOrder.error && <p className="text-sm text-red-400">{createOrder.error.message}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("cart")} className="flex-1 rounded-xl border border-border py-3 font-semibold">Volver</button>
              <button
                onClick={submit}
                disabled={!form.name || !form.phone || (form.orderType === "delivery" && !form.address) || createOrder.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> {createOrder.isPending ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <PartyPopper className="h-14 w-14 text-primary" />
            <h3 className="font-display text-2xl font-bold">¡Pedido recibido!</h3>
            <p className="text-muted-foreground">Tu número de turno es:</p>
            <p className="font-display text-5xl font-black gold-text">#{result.orderNumber}</p>
            <p className="text-sm text-muted-foreground">Comanda de cocina: #{result.comandaNumber}</p>
            <p className="text-sm text-muted-foreground">Guarda tu número de turno para hacer seguimiento en “Mi Pedido”.</p>
            {result.waMeLink && (
              <a href={result.waMeLink} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 font-semibold text-emerald-400 hover:bg-emerald-500/20">
                Enviar pedido por WhatsApp
              </a>
            )}
            <button onClick={() => { setStep("cart"); setOpen(false); setResult(null); }} className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground">
              Listo
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
