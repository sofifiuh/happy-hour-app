import { X } from "lucide-react";
import { useMemo } from "react";
import { MapCard } from "@/components/map-card";
import { VenueMap } from "@/components/venue-map";
import type { Row } from "@/lib/store";

// Right-hand pane of the desktop layout: every listed spot as a pin, and
// the picked spot's card floating over the bottom of the map.
export default function DesktopMap({
  rows,
  now,
  selected,
  hovered,
  onSelect,
}: {
  rows: Row[];
  now: Date;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
}) {
  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const picked = selected ? mappable.find((r) => r.venue.id === selected) : undefined;
  return (
    <>
      <VenueMap rows={mappable} selected={selected} hovered={hovered} onSelect={onSelect} focusOffset={picked ? 120 : 0} locateClassName={picked ? "bottom-[276px]" : "bottom-5"} />
      {picked && (
        <div key={picked.venue.id} className="animate-rise absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[400px] p-4">
          <button
            onClick={() => onSelect(null)}
            aria-label="Close"
            className="absolute top-1 right-1 z-10 grid size-11 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-edge/10 transition-transform active:scale-90"
          >
            <X className="size-4" />
          </button>
          <MapCard row={picked} now={now} active />
        </div>
      )}
    </>
  );
}
