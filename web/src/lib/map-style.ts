import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Scheme } from "@/lib/use-media";

// MapLibre looks for its worker next to its own module, which a bundle
// doesn't have; point it at the copy Vite emits.
maplibregl.setWorkerUrl(workerUrl);

// Vector basemaps following the system theme: CARTO Dark Matter and
// Positron need no key, which suits the preview; production can point
// VITE_MAP_STYLE / VITE_MAP_STYLE_LIGHT at a Mapbox/MapTiler style.
export const MAP_STYLES: Record<Scheme, string> = {
  dark: import.meta.env.VITE_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: import.meta.env.VITE_MAP_STYLE_LIGHT || "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// Positron is a cool grey; nudge its land, water and buildings onto the
// app's warm paper so the map and the UI read as one surface. Layers not
// listed (or a custom style without them) are left alone.
const LIGHT_TINT: Record<string, Record<string, string>> = {
  background: { "background-color": "#f3eee3" },
  water: { "fill-color": "#c9dbe2" },
  building: { "fill-color": "#e7e0d2" },
  "building-top": { "fill-color": "#eee8dc", "fill-outline-color": "#e2dacb" },
};

function tint(style: StyleSpecification, scheme: Scheme): StyleSpecification {
  if (scheme !== "light" || import.meta.env.VITE_MAP_STYLE_LIGHT) return style;
  for (const layer of style.layers) {
    const paint = LIGHT_TINT[layer.id];
    if (paint && "paint" in layer) layer.paint = { ...layer.paint, ...paint } as typeof layer.paint;
  }
  return style;
}

// Plain canvas used when the basemap host can't be reached (offline, or a
// sandboxed preview that blocks it), so pins and cards still work.
const fallback = (scheme: Scheme): StyleSpecification => ({
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": scheme === "light" ? "#f3eee3" : "#1b1b1b" } }],
});

const stylePromises: Partial<Record<Scheme, Promise<StyleSpecification>>> = {};

export function loadMapStyle(scheme: Scheme): Promise<StyleSpecification> {
  stylePromises[scheme] ??= fetch(MAP_STYLES[scheme], { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? (r.json() as Promise<StyleSpecification>) : Promise.reject(r.status)))
    .then((s) => tint(s, scheme))
    .catch(() => {
      delete stylePromises[scheme]; // try the real basemap again next time
      return fallback(scheme);
    });
  return stylePromises[scheme];
}

export const PIN_COLORS = {
  live: "#ecfe54",
  upcoming: "#ffb530",
  scheduled: "#ecfe54",
  none: "#6b675f",
} as const;

// Pin outline and hover colours per theme. Pins keep the brand pops in
// both; on the light map they get a heavier ink outline, the same move as
// the status dots, so lime still reads on paper.
export const PIN_PAINT = {
  dark: { stroke: "#1b1b1b", strokeWidth: 1.5, hover: "#f3efe4" },
  light: { stroke: "#1b1b1b", strokeWidth: 2, hover: "#1b1b1b" },
} as const;
