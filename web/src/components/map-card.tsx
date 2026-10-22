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

// Swipeable card under the map. Compact row so the map keeps most of the
// screen: thumbnail, then name and time as the two loudest things (per
// Sofia's Sep 10 card iterations), then one action.
export function MapCard({ row, now, active }: { row: Row; now: Date; active: boolean }) {
  const { venue, occ, km } = row;
  const soon = endingSoon(occ, now);
  const walk = km != null ? walkLabel(km) : null;
  const countdown = occ.start && occ.end && occ.status !== "scheduled" && occ.status !== "none" ? statusLabel(occ, now) : null;
  return (
    <Link
      to={spotPath(venue.id)}
      viewTransition
      onClick={(e) => markHero(e.currentTarget, venue.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-[22px] bg-ink-2 p-2.5 pr-3 shadow-[0_12px_40px_rgb(0_0_0/0.5)] ring-1 transition-[transform,opacity,box-shadow] duration-300 ease-out active:scale-[0.98]",
        active ? "ring-white/15" : "scale-[0.95] opacity-75 ring-white/5",
      )}
    >
      <VenuePhoto venue={venue} className="size-[72px] shrink-0 rounded-[16px]" />
      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-1.5 font-display text-[17px] leading-tight font-extrabold tracking-tight">
          <span className="truncate">{venue.name}</span>
          {venue.hh.verified && <BadgeCheck aria-label="Verified" className="size-4 shrink-0 text-sky" />}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] whitespace-nowrap">
          <StatusDot occ={occ} />
          {occ.start && occ.end ? (
            <span className="font-display font-bold tabular">{fmtRange(occ.start, occ.end)}</span>
          ) : (
            <span className="text-muted-foreground">No times listed</span>
          )}
        </p>
        {/* Countdown gets its own line so it never truncates; walk time
            gives way first. */}
        {(countdown || walk) && (
          <p className="mt-1 flex items-center gap-1.5 text-[12px] whitespace-nowrap">
            {countdown && <Countdown label={countdown} className={cn("shrink-0", soon ? "font-semibold text-orange" : "text-muted-foreground")} />}
            {countdown && walk && <span className="text-muted-foreground">·</span>}
            {walk && (
              <span className="flex min-w-0 items-center gap-1 text-sky">
                <Footprints className="size-3.5 shrink-0" />
                {/* The footprints say "walk"; keep the visible label short. */}
                <span className="truncate">
                  {walk.replace(/ walk$/, "")}
                  {walk.endsWith(" walk") && <span className="sr-only"> walk</span>}
                </span>
              </span>
            )}
          </p>
        )}
      </div>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <ArrowRight className="size-[18px]" />
      </span>
    </Link>
  );
}
