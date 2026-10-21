import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { loadMapStyle } from "@/lib/map-style";

// Non-interactive locator map for the venue page.
export function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let m: maplibregl.Map | undefined;
    let cancelled = false;
    loadMapStyle().then((style) => {
      if (cancelled || !ref.current) return;
      m = new maplibregl.Map({
        container: ref.current,
        style,
        center: [lng, lat],
        zoom: 15,
        interactive: false,
        attributionControl: { compact: true },
      });
      const el = document.createElement("div");
      el.className = "size-5 rounded-full bg-[#ff4900] ring-4 ring-[#ff4900]/30 border-2 border-[#1b1b1b]";
      new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
    });
    return () => {
      cancelled = true;
      m?.remove();
    };
  }, [lat, lng]);
  return <div ref={ref} className={className} />;
}
