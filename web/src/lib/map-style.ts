import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

// MapLibre looks for its worker next to its own module, which a bundle
// doesn't have; point it at the copy Vite emits.
maplibregl.setWorkerUrl(workerUrl);

// Dark vector basemap. CARTO Dark Matter needs no key, which suits the
// preview; production can point VITE_MAP_STYLE at a Mapbox/MapTiler style.
export const MAP_STYLE: string =
  import.meta.env.VITE_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Plain canvas used when the basemap host can't be reached (offline, or a
// sandboxed preview that blocks it), so pins and cards still work.
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#1b1b1b" } }],
};

let stylePromise: Promise<StyleSpecification> | null = null;

export function loadMapStyle(): Promise<StyleSpecification> {
  stylePromise ??= fetch(MAP_STYLE, { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? (r.json() as Promise<StyleSpecification>) : Promise.reject(r.status)))
    .catch(() => {
      stylePromise = null; // try the real basemap again next time
      return FALLBACK_STYLE;
    });
  return stylePromise;
}

export const PIN_COLORS = {
  live: "#ecfe54",
  upcoming: "#ffb530",
  scheduled: "#ecfe54",
  none: "#6b675f",
} as const;
