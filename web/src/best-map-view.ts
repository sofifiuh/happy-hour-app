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

  const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, offset: 20, maxWidth: "260px", focusAfterOpen: false });
  // The popup opens off the pin where it's drawn: spread pins sit away from their true spot.
  const R = 20;
  const D = Math.round(R * 0.7);
  const popAt = (mk: maplibregl.Marker) => {
    const { x, y } = mk.getOffset();
    const at = (dx: number, dy: number): [number, number] => [x + dx, y + dy];
    popup.setOffset({
      center: at(0, 0),
      top: at(0, R),
      bottom: at(0, -R),
      left: at(R, 0),
      right: at(-R, 0),
      "top-left": at(D, D),
      "top-right": at(-D, D),
      "bottom-left": at(D, -D),
      "bottom-right": at(-D, -D),
    });
  };
  let on: HTMLElement | null = null;
  let onMarker: maplibregl.Marker | null = null;
  const markers: maplibregl.Marker[] = [];
  for (const p of pins) {
    // maplibre positions the marker element with a transform, so the pin's
    // hover scale goes on an inner face: scaling the element itself would
    // scale that translate too and throw the pin away from the pointer.
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = `pin${p.n <= 3 ? " top" : ""}`;
    const face = document.createElement("span");
    face.textContent = String(p.n);
    pin.append(face);
    pin.setAttribute("aria-label", `${p.n}. ${p.name}, Hangout Score ${p.score}`);
    pin.addEventListener("click", (e) => {
      e.stopPropagation();
      on?.classList.remove("on");
      on = pin;
      onMarker = marker;
      pin.classList.add("on");
      popAt(marker);
      popup
        .setLngLat([p.lng, p.lat])
        .setHTML(
          `<p class="pop-n">#${p.n} · ${esc(p.score)}/10</p><h3>${esc(p.name)}</h3><p class="pop-when">${esc(p.when)}</p><p class="pop-links"><a href="#rank-${p.n}">Why it ranks</a><a href="/spots/${encodeURIComponent(p.id)}.html">Deals &amp; times</a></p>`,
        )
        .addTo(map);
    });
    // Higher ranks sit on top where pins overlap.
    pin.style.zIndex = String(100 - p.n);
    const marker = new maplibregl.Marker({ element: pin }).setLngLat([p.lng, p.lat]).addTo(map);
    markers.push(marker);
  }
  const spread = () => {
    spreadMarkers(map, markers);
    if (onMarker) popAt(onMarker);
  };
  // Spread as soon as the map can project, not when tiles finish: a tap before then would see its pin jump.
  map.once("load", spread);
  map.on("zoomend", spread);
  // Closes on a tap on the map, not on the tap on a pin that opened it.
  map.on("click", (e) => {
    if (!(e.originalEvent.target as HTMLElement | null)?.closest(".pin")) popup.remove();
  });
  popup.on("close", () => {
    on?.classList.remove("on");
    on = null;
    onMarker = null;
  });
}
