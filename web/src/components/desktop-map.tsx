import { useMemo } from "react";
import { VenueMap } from "@/components/venue-map";
import type { Row } from "@/lib/store";

// Right-hand pane of the desktop layout: every listed spot as a pin. A pin
// click opens that venue straight away.
export default function DesktopMap({
  rows,
  selected,
  hovered,
  onSelect,
  ranked,
  coverLeft = 0,
}: {
  rows: Row[];
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  ranked?: boolean;
  // Width of the venue panel floating over the map's left edge.
  coverLeft?: number;
}) {
  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  return (
    <VenueMap
      rows={mappable}
      selected={selected}
      hovered={hovered}
      onSelect={onSelect}
      ranked={ranked}
      coverLeft={coverLeft}
      locateClassName="bottom-5"
    />
  );
}
