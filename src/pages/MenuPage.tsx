import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import DishCard from "@/components/DishCard";

export default function MenuPage() {
  const { data: menu, isLoading } = trpc.menu.publicMenu.useQuery();
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [query, setQuery] = useState("");

  const parents = useMemo(() => menu?.categories.filter((c) => !c.parentId) ?? [], [menu]);
  const childrenOf = (id: number) => menu?.categories.filter((c) => c.parentId === id) ?? [];

  const visibleDishes = useMemo(() => {
    if (!menu) return [];
    let dishes = menu.dishes;
    if (activeCat !== "all") {
      const childIds = childrenOf(activeCat).map((c) => Number(c.id));
      const ids = [activeCat, ...childIds];
      dishes = dishes.filter((d) => ids.includes(Number(d.categoryId)));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      dishes = dishes.filter((d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
    }
    return dishes;
  }, [menu, activeCat, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Nuestro <span className="gold-text">Menú</span></h1>
      <p className="mt-2 text-muted-foreground">Selecciona tus platos favoritos y arma tu pedido.</p>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar plato, bebida o postre..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mt-6 overflow-x-auto bg-background/95 px-4 py-3 backdrop-blur no-scrollbar">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCat("all")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${activeCat === "all" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary"}`}
          >
            Todo
          </button>
          {parents.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(Number(c.id))}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${activeCat === Number(c.id) ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:border-primary"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="py-20 text-center text-muted-foreground">Cargando menú...</p>
      ) : activeCat === "all" && !query ? (
        parents.map((cat) => {
          const childCats = childrenOf(Number(cat.id));
          const directDishes = menu!.dishes.filter((d) => Number(d.categoryId) === Number(cat.id));
          if (directDishes.length === 0 && childCats.length === 0) return null;
          return (
            <section key={cat.id} id={cat.slug} className="mt-10 scroll-mt-32">
              <h2 className="mb-5 font-display text-2xl font-bold text-primary">{cat.name}</h2>
              {directDishes.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {directDishes.map((d) => <DishCard key={Number(d.id)} dish={d} />)}
                </div>
              )}
              {childCats.map((sub) => {
                const subDishes = menu!.dishes.filter((d) => Number(d.categoryId) === Number(sub.id));
                if (subDishes.length === 0) return null;
                return (
                  <div key={sub.id} className="mt-6">
                    <h3 className="mb-4 font-display text-xl font-semibold text-muted-foreground">{sub.name}</h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {subDishes.map((d) => <DishCard key={Number(d.id)} dish={d} />)}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDishes.length === 0 ? (
            <p className="col-span-full py-16 text-center text-muted-foreground">No encontramos platos con ese criterio.</p>
          ) : (
            visibleDishes.map((d) => <DishCard key={Number(d.id)} dish={d} />)
          )}
        </div>
      )}
    </div>
  );
}
