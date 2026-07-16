import { Clock, MapPin, Phone, Flame } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export default function Footer() {
  const s = useSettings();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold gold-text">{s.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{s.slogan}. Tradición, brasas y hospitalidad desde siempre.</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {s.address}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {s.phone}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {s.hours}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Atención</p>
          <p>Pedidos en línea, reservas y delivery con seguimiento en tiempo real.</p>
          <p className="mt-2">Escríbenos por el chat y con gusto te atendemos.</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {s.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
