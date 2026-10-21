// Dark vector basemap. CARTO Dark Matter needs no key, which suits the
// preview; production can point VITE_MAP_STYLE at a Mapbox/MapTiler style.
export const MAP_STYLE: string =
  import.meta.env.VITE_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const PIN_COLORS = {
  live: "#ecfe54",
  upcoming: "#ffb530",
  scheduled: "#ecfe54",
  none: "#6b675f",
} as const;
