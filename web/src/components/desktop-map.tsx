import { X } from "lucide-react";
import { useMemo } from "react";
import { MapCard } from "@/components/map-card";
import { VenueMap } from "@/components/venue-map";
import type { Row } from "@/lib/store";

// Right-hand pane of the desktop layout: every listed spot as a pin, and
// the picked spot's card popping up beside its pin.
export default function DesktopMap({
  rows,
  now,
  selected,
  hovered,
  onSelect,
  ranked,
  card = true,
  coverLeft = 0,
}: {
  rows: Row[];
  now: Date;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  ranked?: boolean;
  // false while the venue panel shows the picked spot: just its pin.
  card?: boolean;
  // Width of the venue panel floating over the map's left edge.
  coverLeft?: number;
}) {
  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const picked = selected ? mappable.find((r) => r.venue.id === selected) : undefined;
  return (
    <VenueMap
      rows={mappable}
      selected={selected}
      hovered={hovered}
      onSelect={onSelect}
      ranked={ranked}
      coverLeft={coverLeft}
      locateClassName="bottom-5"
      popover={
        picked &&
        card && (
          <>
            <MapCard row={picked} now={now} active />
            <button
              onClick={() => onSelect(null)}
              aria-label="Close"
              className="absolute -top-2.5 -right-2.5 z-10 grid size-8 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-edge/15 transition-transform hover:scale-105 active:scale-90"
            >
              <X className="size-3.5" />
            </button>
          </>
        )
      }
    />
  );
}
