import { ClipboardList, DollarSign, CalendarDays, Bike, UtensilsCrossed, Users, Clock, CheckCircle2, XCircle, Flame, TrendingUp as TrendingUpIcon } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatMoney } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = trpc.dashboard.summary.useQuery(undefined, { refetchInterval: 15000 });
  const { currency } = useSettings();

  if (isLoading || !data) return <p className="py-20 text-center text-muted-foreground">Cargando resumen...</p>;

  const maxRevenue = Math.max(1, ...data.salesByDay.map((s) => s.revenue));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Resumen del <span className="gold-text">negocio</span></h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Ingresos de hoy" value={formatMoney(data.today.revenueToday, currency)} sub={`${data.today.ordersToday} pedidos hoy`} />
        <StatCard icon={TrendingUpIcon} label="Ingresos totales" value={formatMoney(data.totals.totalRevenue, currency)} sub={`${data.totals.totalOrders} pedidos históricos`} />
        <StatCard icon={ClipboardList} label="Pedidos pendientes" value={data.totals.pendingOrders} sub={`${data.totals.preparing} en preparación`} />
        <StatCard icon={CalendarDays} label="Reservas pendientes" value={data.reservations?.pendingReservations ?? 0} sub={`${data.reservations?.peopleExpected ?? 0} comensales esperados`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Entregados" value={data.totals.delivered} />
        <StatCard icon={XCircle} label="Cancelados" value={data.totals.cancelled} />
        <StatCard icon={Bike} label="Envíos activos" value={data.deliveries?.activeDeliveries ?? 0} sub={`${data.drivers?.active ?? 0}/${data.drivers?.total ?? 0} repartidores activos`} />
        <StatCard icon={UtensilsCrossed} label="Platos en carta" value={data.dishes?.total ?? 0} sub={`${data.dishes?.available ?? 0} disponibles`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ventas últimos 7 días */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><Flame className="h-5 w-5 text-primary" /> Ventas — últimos 7 días</h2>
          {data.salesByDay.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay ventas registradas.</p>
          ) : (
            <div className="flex h-44 items-end gap-2">
              {data.salesByDay.map((s) => (
                <div key={s.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-primary">{formatMoney(s.revenue, currency)}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${(s.revenue / maxRevenue) * 100}%`, minHeight: 6 }} />
                  <span className="text-[10px] text-muted-foreground">{s.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platos más vendidos */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><Users className="h-5 w-5 text-primary" /> Platos más vendidos</h2>
          {data.topDishes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay datos.</p>
          ) : (
            <ul className="space-y-3">
              {data.topDishes.map((d, i) => (
                <li key={d.dishName} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="flex-1 truncate text-sm">{d.dishName}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{d.qty} uds</span>
                  <span className="text-sm font-bold text-primary">{formatMoney(d.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-primary" /> Reservas aceptadas</p>
          <p className="mt-1 text-2xl font-bold">{data.reservations?.accepted ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><XCircle className="h-4 w-4 text-red-400" /> Reservas rechazadas</p>
          <p className="mt-1 text-2xl font-bold">{data.reservations?.rejected ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bike className="h-4 w-4 text-primary" /> Pedidos delivery vs local</p>
          <p className="mt-1 text-2xl font-bold">{data.totals.deliveryOrders} / {data.totals.localOrders}</p>
        </div>
      </div>
    </div>
  );
}
