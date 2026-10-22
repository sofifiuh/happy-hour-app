import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "@/lib/use-media";
import { cn } from "@/lib/utils";

// Non-interactive locator map for the venue page, drawn with the same
// vector basemap as the full map (Dark Matter, or Positron in light mode). MapLibre is loaded only when
// the box scrolls into view and the main thread is idle, so it never
// competes with the venue page's first paint.
export function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();

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
        Promise.all([import("maplibre-gl"), import("@/lib/map-style"), import("maplibre-gl/dist/maplibre-gl.css")]).then(async ([ml, { loadMapStyle }]) => {
          const style = await loadMapStyle(scheme);
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
  }, [lat, lng, scheme]);

  return (
    <div className={cn("relative overflow-hidden bg-ink-3", className)} aria-hidden>
      <div ref={box} className={cn("absolute inset-0 transition-opacity duration-500", ready ? "opacity-100" : "opacity-0")} />
      <span className="pointer-events-none absolute top-1/2 left-1/2 size-5 -translate-1/2 rounded-full border-2 border-on-pop bg-orange ring-4 ring-orange/30" />
      <span className="pointer-events-none absolute right-1.5 bottom-1 text-[10px] text-cream/80">© OpenStreetMap © CARTO</span>
    </div>
  );
}
