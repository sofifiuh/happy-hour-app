import { spotPath } from "@/lib/routes";
import { ArrowRight, BadgeCheck, Footprints } from "lucide-react";
import { Link } from "react-router";
import { walkLabel } from "@/lib/geo";
import { endingSoon, fmtRange, statusLabel } from "@/lib/hours";
import { markHero } from "@/lib/motion";
import type { Row } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Countdown, StatusDot } from "./status";
import { VenuePhoto } from "./venue-photo";

// Swipeable card under the map: photo, then name and time as the two
// loudest things (per Sofia's Sep 10 card iterations), then one action.
export function MapCard({ row, now, active }: { row: Row; now: Date; active: boolean }) {
  const { venue, occ, km } = row;
  const soon = endingSoon(occ, now);
  return (
    <Link
      to={spotPath(venue.id)}
      viewTransition
      onClick={(e) => markHero(e.currentTarget, venue.id)}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[24px] bg-ink-2 shadow-[0_12px_40px_rgb(0_0_0/0.5)] ring-1 transition-[transform,opacity,box-shadow] duration-300 ease-out active:scale-[0.98]",
        active ? "ring-white/15" : "scale-[0.95] opacity-75 ring-white/5",
      )}
    >
      <div className="relative">
        <VenuePhoto venue={venue} className="h-[132px] w-full" />
        {km != null && walkLabel(km) && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-sky backdrop-blur">
            <Footprints className="size-3.5" /> {walkLabel(km)}
          </span>
        )}
        {soon && (
          <span className="absolute top-3 right-3 rounded-full bg-orange px-2.5 py-1 text-xs font-semibold text-ink">Ending soon</span>
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 font-display text-[20px] leading-tight font-extrabold tracking-tight">
            <span className="truncate">{venue.name}</span>
            {venue.hh.verified && <BadgeCheck aria-label="Verified" className="size-[18px] shrink-0 text-sky" />}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-[14px]">
            <StatusDot occ={occ} />
            {occ.start && occ.end ? (
              <>
                <span className="font-display font-bold tabular">{fmtRange(occ.start, occ.end)}</span>
                {occ.status !== "scheduled" && <Countdown label={statusLabel(occ, now)} className="truncate text-muted-foreground" />}
              </>
            ) : (
              <span className="text-muted-foreground">No times listed</span>
            )}
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <ArrowRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}
