import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "@/lib/use-media";
import { cn } from "@/lib/utils";

// Non-interactive locator map for the venue page, drawn with the same
// vector basemap as the full map (Dark Matter, or Positron in light mode). MapLibre is loaded only when
// the box scrolls into view and the main thread is idle, so it never
// competes with the venue page's first paint. `others` (nearby spots) are
// drawn as smaller dots, and the view widens to take in the close ones
// while keeping this venue in the middle.
export function MiniMap({ lat, lng, others = [], className }: { lat: number; lng: number; others?: { lat: number; lng: number }[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();
  const dots = others.map((o) => `${o.lng},${o.lat}`).join(";");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let remove: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
        idle(() => {
        if (cancelled) return;
        Promise.all([import("maplibre-gl"), import("@/lib/map-style"), import("maplibre-gl/dist/maplibre-gl.css")]).then(async ([ml, { loadMapStyle, PIN_COLORS, PIN_PAINT }]) => {
          const style = await loadMapStyle(scheme);
          if (cancelled) return;
          const pts = dots ? dots.split(";").map((d) => d.split(",").map(Number) as [number, number]) : [];
          // Box centred on the venue, wide enough for the nearby spots
          // within ~1.2 km (further ones would zoom out too far).
          let dLat = 0;
          let dLng = 0;
          for (const [x, y] of pts) {
            if (Math.abs(y - lat) > 0.011 || Math.abs(x - lng) > 0.017) continue;
            dLat = Math.max(dLat, Math.abs(y - lat));
            dLng = Math.max(dLng, Math.abs(x - lng));
          }
          const m = new ml.Map({
            container: el,
            style,
            center: [lng, lat],
            zoom: 15.5,
            ...(dLat || dLng
              ? { bounds: [[lng - dLng, lat - dLat], [lng + dLng, lat + dLat]] as [[number, number], [number, number]], fitBoundsOptions: { padding: { top: 22, left: 22, right: 22, bottom: 34 }, maxZoom: 15.5 } }
              : {}),
            interactive: false,
            attributionControl: false,
          });
          if (pts.length)
            m.once("load", () => {
              m.addSource("nearby", {
                type: "geojson",
                data: { type: "FeatureCollection", features: pts.map((c) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: c } })) },
              });
              m.addLayer({
                id: "nearby",
                type: "circle",
                source: "nearby",
                paint: { "circle-radius": 5.5, "circle-color": PIN_COLORS.upcoming, "circle-stroke-color": PIN_PAINT[scheme].stroke, "circle-stroke-width": PIN_PAINT[scheme].strokeWidth },
              });
            });
          m.once("idle", () => !cancelled && setReady(true));
          remove = () => m.remove();
        });
        });
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      remove?.();
      setReady(false);
    };
  }, [lat, lng, dots, scheme]);

  return (
    <div className={cn("relative overflow-hidden bg-ink-3", className)} aria-hidden>
      <div ref={box} className={cn("absolute inset-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")} />
      <span className="pointer-events-none absolute top-1/2 left-1/2 size-5 -translate-1/2 rounded-full border-2 border-on-pop bg-orange ring-4 ring-orange/30" />
      <span className="pointer-events-none absolute right-1.5 bottom-1 text-[10px] text-cream/80">© OpenStreetMap © CARTO</span>
    </div>
  );
}
