import { Link } from "react-router";
import { ArrowRight, CalendarDays, Bike, UtensilsCrossed, Star } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useSettings } from "@/hooks/useSettings";
import DishCard from "@/components/DishCard";

export default function Home() {
  const s = useSettings();
  const { data: menu } = trpc.menu.publicMenu.useQuery();
  const featured = menu?.dishes.filter((d) => d.featured && d.available).slice(0, 6) ?? [];
  const topCats = menu?.categories.filter((c) => !c.parentId).slice(0, 8) ?? [];

  return (
    <div>
      {/* HERO */}
      <section className="hero-pattern relative overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:py-32">
          <p className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary">
            <Star className="h-4 w-4" /> Desde siempre, a tu mesa <Star className="h-4 w-4" />
          </p>
          <h1 className="font-display text-5xl font-black leading-tight md:text-7xl">
            <span className="gold-text">{s.name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{s.slogan}. Asados a la brasa, cocina criolla y coctelería de autor.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/menu" className="flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground hover:brightness-110">
              Ver Menú <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/reservas" className="flex items-center gap-2 rounded-full border border-primary/50 px-7 py-3 font-semibold text-primary hover:bg-primary/10">
              <CalendarDays className="h-4 w-4" /> Reservar Mesa
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-6 font-display text-3xl font-bold">Explora nuestra carta</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {topCats.map((c) => (
            <Link
              key={c.id}
              to={`/menu#${c.slug}`}
              className="whitespace-nowrap rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold">Platos destacados</h2>
          <Link to="/menu" className="text-sm font-semibold text-primary hover:underline">Ver todo →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => (
            <DishCard key={Number(d.id)} dish={d} />
          ))}
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 text-center card-hover">
            <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="font-display text-xl font-bold">Pedidos en línea</h3>
            <p className="mt-2 text-sm text-muted-foreground">Arma tu orden desde la carta, recibe tu número de turno y sigue tu comanda en tiempo real.</p>
            <Link to="/menu" className="mt-4 inline-block font-semibold text-primary hover:underline">Ordenar ahora →</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center card-hover">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="font-display text-xl font-bold">Reservas</h3>
            <p className="mt-2 text-sm text-muted-foreground">Reserva tu mesa en segundos. Recibirás confirmación directa por WhatsApp.</p>
            <Link to="/reservas" className="mt-4 inline-block font-semibold text-primary hover:underline">Reservar →</Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center card-hover">
            <Bike className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="font-display text-xl font-bold">Delivery en vivo</h3>
            <p className="mt-2 text-sm text-muted-foreground">Sigue el recorrido de tu pedido en el mapa hasta tu puerta, en tiempo real.</p>
            <Link to="/seguimiento" className="mt-4 inline-block font-semibold text-primary hover:underline">Rastrear pedido →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
