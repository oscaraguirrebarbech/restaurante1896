import { useEffect, useRef, useState } from "react";
import { Bike, MapPin, Store } from "lucide-react";

type Props = {
  apiKey?: string;
  origin: { lat: number; lng: number };
  dest: { lat: number; lng: number } | null;
  current: { lat: number; lng: number } | null;
};

declare global {
  interface Window {
    google?: any;
  }
}

function loadGoogleMaps(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const existing = document.querySelector('script[data-gmaps]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    s.async = true;
    s.dataset.gmaps = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(s);
  });
}

/** Mapa en vivo: usa Google Maps si hay API key; si no, un mapa estilizado simulado. */
export default function LiveMap({ apiKey, origin, dest, current }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const gmap = useRef<any>(null);
  const courierMarker = useRef<any>(null);

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey)
      .then(() => setReady(true))
      .catch(() => setFailed(true));
  }, [apiKey]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const g = window.google;
    if (!gmap.current) {
      gmap.current = new g.maps.Map(mapRef.current, {
        center: origin,
        zoom: 14,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1d1a14" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#a89f8d" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#3a3226" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#10131a" }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });
      new g.maps.Marker({ map: gmap.current, position: origin, title: "Restaurante", icon: { url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" } });
    }
    const bounds = new g.maps.LatLngBounds();
    bounds.extend(origin);
    if (dest) {
      bounds.extend(dest);
      if (!gmap.current._destMarker) {
        gmap.current._destMarker = new g.maps.Marker({ map: gmap.current, position: dest, title: "Destino", icon: { url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png" } });
      } else {
        gmap.current._destMarker.setPosition(dest);
      }
    }
    const pos = current ?? origin;
    bounds.extend(pos);
    if (!courierMarker.current) {
      courierMarker.current = new g.maps.Marker({
        map: gmap.current,
        position: pos,
        title: "Repartidor",
        icon: { url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
      });
    } else {
      courierMarker.current.setPosition(pos);
    }
    if (dest && current && !gmap.current._route) {
      gmap.current._route = new g.maps.Polyline({
        map: gmap.current,
        path: [origin, current, dest],
        geodesic: true,
        strokeColor: "#d4af37",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
    } else if (gmap.current._route && current && dest) {
      gmap.current._route.setPath([origin, current, dest]);
    }
    gmap.current.fitBounds(bounds, 60);
  }, [ready, origin.lat, origin.lng, dest?.lat, dest?.lng, current?.lat, current?.lng]);

  if (apiKey && !failed) {
    return <div ref={mapRef} className="h-full min-h-[320px] w-full rounded-2xl border border-border" />;
  }

  /* -------- Mapa simulado estilizado (sin API key) -------- */
  const progress = current && dest ? Math.min(1, Math.max(0.05,
    Math.hypot(current.lat - origin.lat, current.lng - origin.lng) /
    Math.max(0.0001, Math.hypot(dest.lat - origin.lat, dest.lng - origin.lng)))) : 0.05;
  const px = 40 + progress * 520;
  const py = 260 - progress * 160 - Math.sin(progress * Math.PI) * 60;

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-border bg-[#14120e]">
      <svg viewBox="0 0 600 300" className="h-full w-full">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#241f16" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="600" height="300" fill="url(#grid)" />
        <path d="M 40 260 Q 200 120 340 160 T 560 100" fill="none" stroke="#3a3226" strokeWidth="10" strokeLinecap="round" />
        <path d="M 40 260 Q 200 120 340 160 T 560 100" fill="none" stroke="#d4af37" strokeWidth="3" strokeDasharray="8 8" />
      </svg>
      <div className="absolute" style={{ left: 28, top: 244 }}>
        <Store className="h-7 w-7 text-primary" />
      </div>
      <div className="absolute transition-all duration-1000" style={{ left: px - 12, top: py - 24 }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40">
          <Bike className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <div className="absolute" style={{ left: 548, top: 84 }}>
        <MapPin className="h-7 w-7 text-emerald-400" />
      </div>
      <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-muted-foreground">
        Vista de demostración — configura tu API key de Google Maps en el panel para el mapa real
      </div>
    </div>
  );
}
