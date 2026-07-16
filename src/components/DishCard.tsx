import { Plus, UtensilsCrossed } from "lucide-react";
import { formatMoney } from "@/lib/helpers";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";

export type Dish = {
  id: number | bigint;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  available: boolean;
  featured: boolean;
};

export default function DishCard({ dish }: { dish: Dish }) {
  const { add } = useCart();
  const { currency } = useSettings();

  return (
    <div className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-44 overflow-hidden bg-secondary">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <UtensilsCrossed className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {dish.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
            Destacado
          </span>
        )}
        {!dish.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full border border-red-400 px-4 py-1 text-sm font-semibold text-red-300">Agotado</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-tight">{dish.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{dish.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{formatMoney(dish.price, currency)}</span>
          <button
            disabled={!dish.available}
            onClick={() => add({ dishId: Number(dish.id), name: dish.name, price: Number(dish.price), imageUrl: dish.imageUrl })}
            className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
