import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap, MapMouseEvent, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadMapStyle, PIN_COLORS, PIN_PAINT } from "@/lib/map-style";
import { reducedMotion } from "@/lib/motion";
import { useStore, type Row } from "@/lib/store";
import { colorScheme, useColorScheme, type Scheme } from "@/lib/use-media";
import { cn } from "@/lib/utils";

// Room kept between the popover card and the map's edges, and between the
// card and its pin.
const EDGE = 16;
const GAP = 18;

// The pin map shared by the phone Map view and the desktop list-beside-map
// layout. `popover` is the selected spot's card, drawn next to its pin and
// kept there as the map moves. `insetTop` / `insetBottom` are the strips
// covered by floating UI, which the card stays clear of. `follow` eases the
// map to a spot without selecting it (the phone card strip).
export function VenueMap({
  rows,
  selected,
  hovered,
  onSelect,
  popover,
  follow,
  insetTop = EDGE,
  insetBottom = EDGE,
  locateClassName,
}: {
  rows: Row[];
  selected: string | null;
  hovered?: string | null;
  onSelect: (id: string | null) => void;
  popover?: ReactNode;
  follow?: string | null;
  insetTop?: number;
  insetBottom?: number;
  locateClassName?: string;
}) {
  const { deviceLocation: location, location: start, area, requestLocation, locationState } = useStore();
  const scheme = useColorScheme();
  // Bumped each time the venue layers are (re)added, i.e. on first load
  // and after a light/dark basemap swap, so the pins get their data back.
  const [styleGen, setStyleGen] = useState(0);
  const ready = styleGen > 0;
  const shownScheme = useRef<Scheme>(colorScheme());
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const pop = useRef<HTMLDivElement>(null);
  const pinned = useRef<[number, number] | null>(null);
  const picked = selected ? rows.find((r) => r.venue.id === selected) : undefined;
  pinned.current = picked ? [picked.venue.lng!, picked.venue.lat!] : null;
  const insets = useRef({ top: insetTop, bottom: insetBottom });
  insets.current = { top: insetTop, bottom: insetBottom };
  // Where the map opens: you, else your neighbourhood, else Downtown.
  const opening = useRef({ center: start, zoom: location ? 14.5 : area ? 14 : 13.2 });

  // Keep the popover on its pin: above it, or below when there's no room
  // above, slid sideways to stay inside the map. Runs on every map move.
  const place = useCallback(() => {
    const m = map.current;
    const el = pop.current;
    const at = pinned.current;
    if (!m || !el || !at) return;
    const p = m.project(at);
    const W = m.getContainer().clientWidth;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const below = p.y - h - GAP < insets.current.top;
    const x = Math.max(EDGE, Math.min(W - w - EDGE, p.x - w / 2));
    const y = below ? p.y + GAP : p.y - h - GAP;
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    el.dataset.side = below ? "below" : "above";
    el.style.setProperty("--arrow-x", `${Math.max(24, Math.min(w - 24, p.x - x))}px`);
  }, []);

  // Map setup, once.
  useEffect(() => {
    let created: maplibregl.Map | undefined;
    let cancelled = false;
    loadMapStyle(shownScheme.current).then((style) => {
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
        center: [opening.current.center.lng, opening.current.center.lat],
        zoom: opening.current.zoom,
        attributionControl: { compact: true },
        pitchWithRotate: false,
        dragRotate: false,
      });
      m.touchZoomRotate.disableRotation();
      m.on("load", () => {
        addVenueLayers(m, shownScheme.current);
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
        m.on("move", place);
        m.on("resize", place);
        setStyleGen(1);
      });
      map.current = created = m;
    }
  }, [place]);

  // Follow the system theme: swap the basemap, then put the pins back.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || shownScheme.current === scheme) return;
    let cancelled = false;
    loadMapStyle(scheme).then((style) => {
      if (cancelled) return;
      shownScheme.current = scheme;
      m.once("style.load", () => {
        addVenueLayers(m, scheme);
        setStyleGen((g) => g + 1);
      });
      m.setStyle(style, { diff: false });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, scheme]);

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
  }, [styleGen, rows, selected, hovered]);

  // A new selection: place its card, then pan only as far as it takes to
  // fit the pin and the card on screen.
  const shownFor = useRef<string | null>(null);
  useLayoutEffect(() => {
    place();
    const m = map.current;
    const el = pop.current;
    const at = pinned.current;
    if (!ready || !m || !el || !at || shownFor.current === selected) return;
    shownFor.current = selected;
    const p = m.project(at);
    const W = m.getContainer().clientWidth;
    const H = m.getContainer().clientHeight;
    const half = el.offsetWidth / 2 + EDGE;
    const top = insets.current.top + el.offsetHeight + GAP;
    const bottom = H - insets.current.bottom - 12;
    const dx = p.x < half ? p.x - half : p.x > W - half ? p.x - (W - half) : 0;
    const dy = p.y < top ? p.y - top : p.y > bottom ? p.y - bottom : 0;
    if (dx || dy) m.panBy([dx, dy], { duration: reducedMotion() ? 0 : 450 });
  });
  useEffect(() => {
    if (!selected) shownFor.current = null;
  }, [selected]);

  // Escape closes the card.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && select.current(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // The phone card strip eases the map to the card in view.
  useEffect(() => {
    if (!ready || !follow || !map.current) return;
    const r = rows.find((x) => x.venue.id === follow);
    if (r) map.current.easeTo({ center: [r.venue.lng!, r.venue.lat!], offset: [0, -70], duration: reducedMotion() ? 0 : 450 });
    // Only when the followed spot changes, not every time the rows refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, follow]);

  // Picking a neighbourhood flies the map there.
  const shownArea = useRef(area?.name);
  useEffect(() => {
    if (!ready || !map.current || !area || shownArea.current === area.name) return;
    shownArea.current = area.name;
    select.current(null);
    map.current.flyTo({ center: [area.lng, area.lat], zoom: 14, duration: reducedMotion() ? 0 : 1400, essential: true });
  }, [ready, area]);

  // The map opens on you: ask once if the browser hasn't been told yet
  // (an earlier yes is picked up by the store). A no, or a picked
  // neighbourhood, keeps the neighbourhood / Downtown view.
  useEffect(() => {
    if (area || locationState !== "idle") return;
    const ask = () => requestLocation();
    if (!navigator.permissions) return ask();
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((p) => p.state === "prompt" && ask())
      .catch(ask);
    // Once, on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User location dot + recenter.
  useEffect(() => {
    if (!ready || !map.current || !location) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "size-4 rounded-full border-2 border-ink-2 bg-sky-fg ring-4 ring-sky-fg/25";
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([location.lng, location.lat]).addTo(map.current);
      const c = map.current.getCenter();
      // Already opened on you: no need to move.
      if (Math.abs(c.lat - location.lat) > 1e-4 || Math.abs(c.lng - location.lng) > 1e-4)
        map.current.flyTo({ center: [location.lng, location.lat], zoom: 14.5, duration: reducedMotion() ? 0 : 1200, essential: true });
    } else {
      userMarker.current.setLngLat([location.lng, location.lat]);
    }
  }, [ready, location]);

  return (
    <>
      <div ref={container} className={cn("absolute inset-0 size-full transition-opacity duration-300", ready ? "opacity-100" : "opacity-0")} />
      {picked && popover && (
        // Outer box follows the pin; the inner one plays the pop-in, grown
        // from the arrow so the card looks like it comes out of the pin.
        <div ref={pop} className="group/pop absolute top-0 left-0 z-10 w-[min(340px,calc(100%-32px))] will-change-transform">
          <div key={picked.venue.id} className="animate-pop-in relative origin-[var(--arrow-x)_calc(100%+18px)] group-data-[side=below]/pop:origin-[var(--arrow-x)_-18px]">
            {popover}
            <span
              aria-hidden
              className="absolute -bottom-1.5 left-[var(--arrow-x)] size-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-ink-2 ring-1 ring-edge/15 [clip-path:polygon(100%_0,100%_100%,0_100%)] group-data-[side=below]/pop:top-[-7px] group-data-[side=below]/pop:bottom-auto group-data-[side=below]/pop:[clip-path:polygon(0_0,100%_0,0_100%)]"
            />
          </div>
        </div>
      )}
      <button
        onClick={() => {
          if (location && map.current) map.current.easeTo({ center: [location.lng, location.lat], zoom: 15, duration: reducedMotion() ? 0 : 500 });
          else requestLocation();
        }}
        aria-label="Center on my location"
        className={cn(
          "absolute right-4 z-10 grid size-11 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-edge/10 transition-[bottom,transform] duration-300 active:scale-90",
          locationState === "asking" && "animate-pulse",
          locateClassName,
        )}
      >
        <LocateFixed className="size-5" />
      </button>
    </>
  );
}

// Pins live in their own source and layers on top of the basemap; they
// are added again after a basemap swap, which clears them.
function addVenueLayers(m: MLMap, scheme: Scheme) {
  const pin = PIN_PAINT[scheme];
  m.addSource("venues", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  m.addLayer({
    id: "venue-halo",
    type: "circle",
    source: "venues",
    filter: ["any", ["==", ["get", "selected"], true], ["==", ["get", "hovered"], true]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "selected"], true], 16, 13],
      "circle-color": ["case", ["==", ["get", "selected"], true], "#ff4900", pin.hover],
      "circle-opacity": scheme === "light" ? 0.22 : 0.3,
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
      "circle-stroke-color": ["case", ["==", ["get", "hovered"], true], pin.hover, pin.stroke],
      "circle-stroke-width": ["case", ["==", ["get", "hovered"], true], 2.5, pin.strokeWidth],
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
}
