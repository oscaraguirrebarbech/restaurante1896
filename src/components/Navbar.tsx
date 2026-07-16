import { Link, useNavigate } from "react-router";
import { ShoppingCart, Lock, Flame, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";

/**
 * Barra de navegación principal.
 * Acceso oculto al panel: DOBLE CLIC en el candado, el logo o el título.
 */
export default function Navbar() {
  const { count, setOpen } = useCart();
  const settings = useSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const secretAccess = () => navigate("/admin/login");

  const links = [
    { to: "/", label: "Inicio" },
    { to: "/menu", label: "Menú" },
    { to: "/reservas", label: "Reservas" },
    { to: "/delivery", label: "Delivery" },
    { to: "/seguimiento", label: "Mi Pedido" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2 select-none" onDoubleClick={secretAccess} title="">
          <Flame className="h-7 w-7 text-primary" />
          <Link to="/" className="font-display text-xl font-bold tracking-wide">
            <span className="gold-text">{settings.name}</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="relative rounded-full border border-border p-2 transition-colors hover:border-primary"
            aria-label="Ver carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            onDoubleClick={secretAccess}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
            aria-label="Candado"
            title=""
          >
            <Lock className="h-4 w-4" />
          </button>
          <button className="rounded-full border border-border p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menú">
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
