import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent, MapMouseEvent } from "maplibre-gl";
import { LocateFixed } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { FiltersDrawer } from "@/components/filters-drawer";
import { MapCard } from "@/components/map-card";
import { PlanDrawer } from "@/components/plan-drawer";
import { SearchBar } from "@/components/search-bar";
import { TimeTabs } from "@/components/time-tabs";
import { ViewToggle } from "@/components/view-toggle";
import { DEFAULT_CENTER } from "@/lib/geo";
import { MAP_STYLE, PIN_COLORS } from "@/lib/map-style";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CAROUSEL_MAX = 40;

export function MapScreen() {
  const { rows, now, location, requestLocation, locationState } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const cards = useMemo(() => {
    const top = mappable.slice(0, CAROUSEL_MAX);
    if (selected && !top.some((r) => r.venue.id === selected)) {
      const sel = mappable.find((r) => r.venue.id === selected);
      if (sel) top.unshift(sel);
    }
    return top;
  }, [mappable, selected]);

  // Map setup, once.
  useEffect(() => {
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: MAP_STYLE,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 13.2,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    m.on("load", () => {
      m.addSource("venues", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "venue-halo",
        type: "circle",
        source: "venues",
        filter: ["==", ["get", "selected"], true],
        paint: { "circle-radius": 16, "circle-color": "#ff4900", "circle-opacity": 0.35 },
      });
      m.addLayer({
        id: "venue-pins",
        type: "circle",
        source: "venues",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], true], 9, ["interpolate", ["linear"], ["zoom"], 10, 3.5, 14, 6.5]],
          "circle-color": ["case", ["==", ["get", "selected"], true], "#ff4900", ["get", "color"]],
          "circle-stroke-color": "#1b1b1b",
          "circle-stroke-width": 1.5,
        },
      });
      m.on("click", "venue-pins", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelected(id);
      });
      m.on("click", (e: MapMouseEvent) => {
        if (!m.queryRenderedFeatures(e.point, { layers: ["venue-pins"] }).length) setSelected(null);
      });
      m.on("mouseenter", "venue-pins", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "venue-pins", () => (m.getCanvas().style.cursor = ""));
      setReady(true);
    });
    map.current = m;
    return () => m.remove();
  }, []);

  // Pins follow the filtered rows and the selection.
  useEffect(() => {
    if (!ready || !map.current) return;
    const src = map.current.getSource("venues") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: mappable.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.venue.lng!, r.venue.lat!] },
        properties: { id: r.venue.id, color: PIN_COLORS[r.occ.status], selected: r.venue.id === selected },
      })),
    });
  }, [ready, mappable, selected]);

  // Selecting (pin tap or card swipe) pans the map and the strip.
  useEffect(() => {
    if (!selected) return;
    const r = mappable.find((x) => x.venue.id === selected);
    if (r && map.current) {
      map.current.easeTo({ center: [r.venue.lng!, r.venue.lat!], offset: [0, -110], duration: 450 });
    }
    const el = strip.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selected)}"]`);
    if (el && strip.current) {
      programmaticScroll.current = true;
      strip.current.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
      setTimeout(() => (programmaticScroll.current = false), 500);
    }
  }, [selected, mappable]);

  // User location dot + recenter.
  useEffect(() => {
    if (!ready || !map.current || !location) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "size-4 rounded-full bg-sky ring-4 ring-sky/30 shadow-[0_0_0_10px_rgb(191_219_230/0.12)]";
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([location.lng, location.lat]).addTo(map.current);
      map.current.easeTo({ center: [location.lng, location.lat], zoom: 14.5, duration: 600 });
    } else {
      userMarker.current.setLngLat([location.lng, location.lat]);
    }
  }, [ready, location]);

  const onStripScroll = () => {
    if (programmaticScroll.current || !strip.current) return;
    const s = strip.current;
    const mid = s.scrollLeft + s.clientWidth / 2;
    let best: string | null = null;
    let bestD = Infinity;
    s.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = el.dataset.id!;
      }
    });
    if (best && best !== selected) setSelected(best);
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-ink">
      <div ref={container} className="absolute inset-0" />

      <header className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-ink via-ink/80 to-transparent pt-safe pb-6">
        <SearchBar className="px-4 pt-3" onOpenFilters={() => setFiltersOpen(true)} />
        <TimeTabs className="pt-3" onOpenPlan={() => setPlanOpen(true)} />
      </header>

      <button
        onClick={() => {
          if (location && map.current) map.current.easeTo({ center: [location.lng, location.lat], zoom: 15, duration: 500 });
          else requestLocation();
        }}
        aria-label="Center on my location"
        className={cn(
          "absolute right-4 z-10 grid size-11 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-white/10 transition-[bottom]",
          cards.length ? "bottom-[302px]" : "bottom-28",
          locationState === "asking" && "animate-pulse",
        )}
      >
        <LocateFixed className="size-5" />
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[max(env(safe-area-inset-bottom),20px)]">
        {cards.length > 0 ? (
          <div
            ref={strip}
            onScroll={onStripScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4"
          >
            {cards.map((r) => (
              <div key={r.venue.id} data-id={r.venue.id} className="w-[calc(100vw-56px)] max-w-[360px] shrink-0 snap-start">
                <MapCard row={r} now={now} active={r.venue.id === selected} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-4 mb-4 rounded-[24px] bg-ink-2">
            <EmptyState emoji="🗺️" title="No spots on the map" body="Nothing matches here. Try another time or fewer filters." />
          </div>
        )}
        <div className="flex justify-center">
          <ViewToggle view="map" />
        </div>
      </div>

      <FiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <PlanDrawer open={planOpen} onOpenChange={setPlanOpen} />
    </div>
  );
}
