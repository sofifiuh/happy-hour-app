import { Link } from "react-router";
import { walkLabel } from "@/lib/geo";
import { endingSoon, fmtRange, statusLabel } from "@/lib/hours";
import type { Row } from "@/lib/store";
import { cn } from "@/lib/utils";
import { StatusDot } from "./status";
import { VenuePhoto } from "./venue-photo";

// Photo, then name and time on one line as the two loudest things (as in
// Sofia's list rows), address and status underneath.
export function VenueRow({ row, now }: { row: Row; now: Date }) {
  const { venue, occ, km } = row;
  const street = venue.address.split(",")[0];
  const soon = endingSoon(occ, now);
  const walk = km != null ? walkLabel(km) : "";
  return (
    <Link
      to={`/spot/${venue.id}`}
      className="flex items-stretch gap-3.5 overflow-hidden rounded-2xl bg-ink-2 pr-4 transition-colors active:bg-ink-3"
    >
      <VenuePhoto venue={venue} className="min-h-[88px] w-[80px] shrink-0 self-stretch" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3">
        <div className="flex items-start justify-between gap-3">
          <span className="line-clamp-2 font-display text-[16px] leading-[1.15] font-bold">{venue.name}</span>
          {occ.start && occ.end && (
            <span className="flex shrink-0 items-center gap-1.5 pt-px font-display text-[15px] leading-tight font-bold tabular">
              <StatusDot occ={occ} />
              {fmtRange(occ.start, occ.end)}
            </span>
          )}
        </div>
        <span className="truncate text-[13px] text-muted-foreground">
          {street}
          {walk && <span className="text-sky"> · {walk}</span>}
        </span>
        {occ.status !== "scheduled" && (
          <span className={cn("text-[12px] font-medium", soon ? "text-orange" : occ.status === "live" ? "text-lime/80" : "text-muted-foreground")}>
            {statusLabel(occ, now)}
          </span>
        )}
      </div>
    </Link>
  );
}
