import { spotPath } from "@/lib/routes";
import { Link } from "react-router";
import { walkLabel } from "@/lib/geo";
import { endingSoon, fmtRange, statusLabel } from "@/lib/hours";
import { heroName, markHero } from "@/lib/motion";
import type { Row } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Countdown, StatusDot } from "./status";
import { VenuePhoto } from "./venue-photo";

// Photo, then name and time on one line as the two loudest things (as in
// Sofia's list rows), address and status underneath.
export function VenueRow({ row, now, onHover }: { row: Row; now: Date; onHover?: (id: string | null) => void }) {
  const { venue, occ, km } = row;
  const street = venue.address.split(",")[0];
  const soon = endingSoon(occ, now);
  const walk = km != null ? walkLabel(km) : "";
  return (
    <Link
      to={spotPath(venue.id)}
      viewTransition
      onClick={(e) => markHero(e.currentTarget, venue.id)}
      onMouseEnter={onHover && (() => onHover(venue.id))}
      onMouseLeave={onHover && (() => onHover(null))}
      className="flex items-stretch gap-3.5 overflow-hidden rounded-2xl bg-ink-2 pr-4 transition-[background-color,transform] duration-200 ease-out hover:bg-ink-3/70 active:scale-[0.985] active:bg-ink-3"
    >
      <VenuePhoto venue={venue} hero={heroName(venue.id)} className="min-h-[88px] w-[80px] shrink-0 self-stretch" />
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
          {walk && <span className="text-sky-fg"> · {walk}</span>}
        </span>
        {occ.status !== "scheduled" && (
          <Countdown label={statusLabel(occ, now)} className={cn("text-[12px] font-medium", soon ? "text-orange-fg" : occ.status === "live" ? "text-lime-fg/80" : "text-muted-foreground")} />
        )}
      </div>
    </Link>
  );
}
