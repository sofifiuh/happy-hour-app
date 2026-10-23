import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { loadMapStyle, spreadMarkers } from "@/lib/map-style";

interface Pin {
  n: number;
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: string;
  when: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Pins come from the JSON the page carries next to the map; a tap opens a
// small card linking to the spot's write-up below and to its own page.
export async function mount(el: HTMLElement) {
  const pins: Pin[] = JSON.parse(document.getElementById("best-map-data")?.textContent || "[]");
  if (!pins.length) return;
  const scheme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const style = await loadMapStyle(scheme);
  const bounds = new maplibregl.LngLatBounds();
  for (const p of pins) bounds.extend([p.lng, p.lat]);
  el.classList.add("ready");
  const map = new maplibregl.Map({
    container: el,
    style,
    bounds,
    fitBoundsOptions: { padding: 44, maxZoom: 15.5 },
    attributionControl: { compact: true },
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

  const popup = new maplibregl.Popup({ closeButton: true, offset: 20, maxWidth: "260px", focusAfterOpen: false });
  let on: HTMLElement | null = null;
  const markers: maplibregl.Marker[] = [];
  for (const p of pins) {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `pin${p.n <= 3 ? " top" : ""}`;
    pin.textContent = String(p.n);
    pin.setAttribute("aria-label", `${p.n}. ${p.name}, Hangout Score ${p.score}`);
    pin.addEventListener("click", (e) => {
      e.stopPropagation();
      on?.classList.remove("on");
      on = pin;
      pin.classList.add("on");
      popup
        .setLngLat([p.lng, p.lat])
        .setHTML(
          `<p class="pop-n">#${p.n} · ${esc(p.score)}/10</p><h3>${esc(p.name)}</h3><p class="pop-when">${esc(p.when)}</p><p class="pop-links"><a href="#rank-${p.n}">Why it ranks</a><a href="/spots/${encodeURIComponent(p.id)}.html">Deals &amp; times</a></p>`,
        )
        .addTo(map);
    });
    // Higher ranks sit on top where pins overlap.
    pin.style.zIndex = String(100 - p.n);
    markers.push(new maplibregl.Marker({ element: pin }).setLngLat([p.lng, p.lat]).addTo(map));
  }
  const spread = () => spreadMarkers(map, markers);
  map.once("idle", spread);
  map.on("zoomend", spread);
  popup.on("close", () => {
    on?.classList.remove("on");
    on = null;
  });
}
