import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { LayoutDashboard, ClipboardList, TrendingUp, CalendarDays, Bike, UtensilsCrossed, Bot, Settings, LogOut, Flame } from "lucide-react";
import { trpc } from "@/providers/trpc";

const NAV = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/pedidos", icon: ClipboardList, label: "Pedidos" },
  { to: "/admin/ventas", icon: TrendingUp, label: "Ventas" },
  { to: "/admin/reservas", icon: CalendarDays, label: "Reservas" },
  { to: "/admin/delivery", icon: Bike, label: "Delivery" },
  { to: "/admin/menu", icon: UtensilsCrossed, label: "Menú" },
  { to: "/admin/chatbot", icon: Bot, label: "Chatbot" },
  { to: "/admin/config", icon: Settings, label: "Configuración" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");
  const { data, error, isLoading } = trpc.auth.me.useQuery(undefined, { enabled: !!token, retry: false });

  useEffect(() => {
    if (!token || error) {
      localStorage.removeItem("admin_token");
      navigate("/admin/login");
    }
  }, [token, error, navigate]);

  if (!token || isLoading || !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Verificando sesión...</div>;
  }

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6">
      <aside className="sticky top-20 hidden h-fit w-56 shrink-0 rounded-2xl border border-border bg-card p-3 md:block">
        <div className="mb-3 flex items-center gap-2 border-b border-border px-3 pb-3">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-display font-bold gold-text">Panel Admin</span>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as any}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`
              }
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Navegación móvil */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar md:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as any}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${isActive ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`
              }
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
          <button onClick={logout} className="flex shrink-0 items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
