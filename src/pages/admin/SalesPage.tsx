import { trpc } from "@/providers/trpc";
import { formatMoney } from "@/lib/helpers";
import { useSettings } from "@/hooks/useSettings";

export default function SalesPage() {
  const { data, isLoading } = trpc.dashboard.sales.useQuery(undefined, { refetchInterval: 30000 });
  const { currency } = useSettings();

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Cargando ventas...</p>;

  const rows = data ?? [];
  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const totalOrders = rows.reduce((a, r) => a + r.orders, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Gestión de <span className="gold-text">ventas</span></h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Ingresos (30 días)</p>
          <p className="mt-1 font-display text-3xl font-bold text-primary">{formatMoney(totalRevenue, currency)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pedidos (30 días)</p>
          <p className="mt-1 font-display text-3xl font-bold">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Ticket promedio</p>
          <p className="mt-1 font-display text-3xl font-bold">{formatMoney(avgTicket, currency)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Pedidos</th>
              <th className="px-5 py-3 font-medium">Delivery</th>
              <th className="px-5 py-3 font-medium">Local</th>
              <th className="px-5 py-3 font-medium">Ticket prom.</th>
              <th className="px-5 py-3 text-right font-medium">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Aún no hay ventas registradas.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.day} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                <td className="px-5 py-3 font-medium">{r.day}</td>
                <td className="px-5 py-3">{r.orders}</td>
                <td className="px-5 py-3">{r.delivery}</td>
                <td className="px-5 py-3">{r.local}</td>
                <td className="px-5 py-3">{formatMoney(r.avgTicket, currency)}</td>
                <td className="px-5 py-3 text-right font-bold text-primary">{formatMoney(r.revenue, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
