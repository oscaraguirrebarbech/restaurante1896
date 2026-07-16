import { trpc } from "@/providers/trpc";

export function useSettings() {
  const { data } = trpc.settings.public.useQuery(undefined, { staleTime: 60_000 });
  return {
    name: data?.restaurant_name || "Restaurante 1896",
    slogan: data?.restaurant_slogan || "Sabor que trasciende generaciones",
    address: data?.restaurant_address || "",
    phone: data?.restaurant_phone || "",
    hours: data?.restaurant_hours || "",
    currency: data?.currency_symbol || "$",
    mapsKey: data?.google_maps_api_key || "",
    whatsapp: data?.whatsapp_admin_number || "",
  };
}
