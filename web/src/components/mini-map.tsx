import { useEffect, useRef, useState } from "react";

// Non-interactive locator map for the venue page. A 3×3 grid of raster
// tiles from the same Dark Matter basemap as the full map, shifted so the
// venue sits in the middle: a few small images instead of the MapLibre
// bundle, so the venue page stays light.
const TILE = 256;
const ZOOM = 16;
const TILES = import.meta.env.VITE_MAP_TILES || "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png";

function project(lat: number, lng: number) {
  const n = 2 ** ZOOM;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return { x, y };
}

export function MiniMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { x, y } = project(lat, lng);
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  // Pixel offset of the venue inside its tile, then centre it in the box.
  const left = size.w / 2 - (x - tx) * TILE - TILE;
  const top = size.h / 2 - (y - ty) * TILE - TILE;
  const tiles = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      tiles.push(
        <img
          key={`${dx},${dy}`}
          src={TILES.replace("{z}", String(ZOOM)).replace("{x}", String(tx + dx)).replace("{y}", String(ty + dy))}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          decoding="async"
          className="absolute max-w-none"
          style={{ left: left + (dx + 1) * TILE, top: top + (dy + 1) * TILE }}
        />,
      );

  return (
    <div ref={box} className={`relative overflow-hidden bg-[#262626] ${className ?? ""}`} aria-hidden>
      {size.w > 0 && tiles}
      <span className="absolute top-1/2 left-1/2 size-5 -translate-1/2 rounded-full border-2 border-[#1b1b1b] bg-[#ff4900] ring-4 ring-[#ff4900]/30" />
      <span className="absolute right-1.5 bottom-1 text-[10px] text-cream/50">© OpenStreetMap © CARTO</span>
    </div>
  );
}
