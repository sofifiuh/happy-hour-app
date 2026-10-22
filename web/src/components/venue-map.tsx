import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap, MapMouseEvent, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_CENTER } from "@/lib/geo";
import { loadMapStyle, PIN_COLORS } from "@/lib/map-style";
import { reducedMotion } from "@/lib/motion";
import { useStore, type Row } from "@/lib/store";
import { cn } from "@/lib/utils";

// The pin map shared by the phone Map view and the desktop list-beside-map
// layout. `focusOffset` shifts the selected pin up so it clears whatever
// sits over the bottom of the map (the card strip on phones).
export function VenueMap({
  rows,
  selected,
  hovered,
  onSelect,
  focusOffset = 0,
  locateClassName,
}: {
  rows: Row[];
  selected: string | null;
  hovered?: string | null;
  onSelect: (id: string | null) => void;
  focusOffset?: number;
  locateClassName?: string;
}) {
  const { deviceLocation: location, requestLocation, locationState } = useStore();
  const [ready, setReady] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  // Map setup, once.
  useEffect(() => {
    let created: maplibregl.Map | undefined;
    let cancelled = false;
    loadMapStyle().then((style) => {
      if (cancelled || !container.current) return;
      init(container.current, style);
    });
    return () => {
      cancelled = true;
      created?.remove();
    };

    function init(el: HTMLDivElement, style: StyleSpecification) {
      const m = new maplibregl.Map({
        container: el,
        style,
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
          filter: ["any", ["==", ["get", "selected"], true], ["==", ["get", "hovered"], true]],
          paint: {
            "circle-radius": ["case", ["==", ["get", "selected"], true], 16, 13],
            "circle-color": ["case", ["==", ["get", "selected"], true], "#ff4900", "#f3efe4"],
            "circle-opacity": 0.3,
            "circle-radius-transition": { duration: 250 },
          },
        });
        m.addLayer({
          id: "venue-pins",
          type: "circle",
          source: "venues",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              10, ["case", ["==", ["get", "selected"], true], 8, 4.5],
              14, ["case", ["==", ["get", "selected"], true], 10, 7.5],
              17, ["case", ["==", ["get", "selected"], true], 11, 9],
            ],
            "circle-color": ["case", ["==", ["get", "selected"], true], "#ff4900", ["get", "color"]],
            "circle-stroke-color": ["case", ["==", ["get", "hovered"], true], "#f3efe4", "#1b1b1b"],
            "circle-stroke-width": ["case", ["==", ["get", "hovered"], true], 2.5, 1.5],
          },
        });
        // Invisible 44px finger target around each pin; a tap between
        // close pins goes to the nearest one.
        m.addLayer({
          id: "venue-hit",
          type: "circle",
          source: "venues",
          paint: { "circle-radius": 22, "circle-color": "#000", "circle-opacity": 0 },
        });
        const nearest = (e: MapMouseEvent) => {
          let best: string | undefined;
          let bestD = Infinity;
          for (const f of m.queryRenderedFeatures(e.point, { layers: ["venue-hit"] })) {
            const [lng, lat] = (f.geometry as { coordinates: [number, number] }).coordinates;
            const p = m.project([lng, lat]);
            const d = (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2;
            if (d < bestD) {
              bestD = d;
              best = f.properties?.id as string | undefined;
            }
          }
          return best;
        };
        m.on("click", (e: MapMouseEvent) => select.current(nearest(e) ?? null));
        m.on("mouseenter", "venue-hit", () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mouseleave", "venue-hit", () => (m.getCanvas().style.cursor = ""));
        setReady(true);
      });
      map.current = created = m;
    }
  }, []);

  // Pins follow the filtered rows, the selection and the hovered row.
  useEffect(() => {
    if (!ready || !map.current) return;
    const src = map.current.getSource("venues") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.venue.lng!, r.venue.lat!] },
        properties: { id: r.venue.id, color: PIN_COLORS[r.occ.status], selected: r.venue.id === selected, hovered: r.venue.id === hovered },
      })),
    });
  }, [ready, rows, selected, hovered]);

  // Selecting pans the selected pin into view.
  useEffect(() => {
    if (!ready || !selected || !map.current) return;
    const r = rows.find((x) => x.venue.id === selected);
    if (r) map.current.easeTo({ center: [r.venue.lng!, r.venue.lat!], offset: [0, -focusOffset], duration: reducedMotion() ? 0 : 450 });
    // Only on a new selection, not every time the rows refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selected]);

  // User location dot + recenter.
  useEffect(() => {
    if (!ready || !map.current || !location) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "size-4 rounded-full bg-sky ring-4 ring-sky/30 shadow-[0_0_0_10px_rgb(191_219_230/0.12)]";
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([location.lng, location.lat]).addTo(map.current);
      map.current.easeTo({ center: [location.lng, location.lat], zoom: 14.5, duration: reducedMotion() ? 0 : 600 });
    } else {
      userMarker.current.setLngLat([location.lng, location.lat]);
    }
  }, [ready, location]);

  return (
    <>
      <div ref={container} className={cn("absolute inset-0 size-full transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")} />
      <button
        onClick={() => {
          if (location && map.current) map.current.easeTo({ center: [location.lng, location.lat], zoom: 15, duration: reducedMotion() ? 0 : 500 });
          else requestLocation();
        }}
        aria-label="Center on my location"
        className={cn(
          "absolute right-4 z-10 grid size-11 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-white/10 transition-[bottom,transform] duration-300 active:scale-90",
          locationState === "asking" && "animate-pulse",
          locateClassName,
        )}
      >
        <LocateFixed className="size-5" />
      </button>
    </>
  );
}
