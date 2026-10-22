import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Non-interactive locator map for the venue page, drawn with the same
// vector Dark Matter style as the full map. MapLibre is loaded only when
// the box scrolls near the viewport, so the venue page itself stays light.
export function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let remove: (() => void) | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        Promise.all([import("maplibre-gl"), import("@/lib/map-style"), import("maplibre-gl/dist/maplibre-gl.css")]).then(async ([ml, { loadMapStyle }]) => {
          const style = await loadMapStyle();
          if (cancelled) return;
          const m = new ml.Map({
            container: el,
            style,
            center: [lng, lat],
            zoom: 15.5,
            interactive: false,
            attributionControl: false,
          });
          m.once("idle", () => !cancelled && setReady(true));
          remove = () => m.remove();
        });
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      remove?.();
    };
  }, [lat, lng]);

  return (
    <div className={cn("relative overflow-hidden bg-[#262626]", className)} aria-hidden>
      <div ref={box} className={cn("absolute inset-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")} />
      <span className="pointer-events-none absolute top-1/2 left-1/2 size-5 -translate-1/2 rounded-full border-2 border-[#1b1b1b] bg-[#ff4900] ring-4 ring-[#ff4900]/30" />
      <span className="pointer-events-none absolute right-1.5 bottom-1 text-[10px] text-cream/50">© OpenStreetMap © CARTO</span>
    </div>
  );
}
