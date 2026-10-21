import { endingSoon, fmtRange, statusLabel } from "@/lib/hours";
import type { Occurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT = {
  live: "bg-lime shadow-[0_0_0_3px_rgb(236_254_84/0.18)]",
  scheduled: "bg-lime",
  upcoming: "bg-amber",
  none: "bg-line",
} as const;

export function StatusDot({ occ, className }: { occ: Occurrence; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", DOT[occ.status], className)} />;
}

// Big time ("2–5pm") + small status line ("Ends in 25 min"), the pair
// Sofia's list rows and map cards lead with.
export function StatusTime({ occ, now, className }: { occ: Occurrence; now: Date; className?: string }) {
  const soon = endingSoon(occ, now);
  return (
    <div className={cn("flex flex-col items-end gap-0.5 text-right", className)}>
      {occ.start && occ.end ? (
        <span className="flex items-center gap-1.5 font-display text-[17px] font-bold tabular leading-none">
          <StatusDot occ={occ} />
          {fmtRange(occ.start, occ.end)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">No times listed</span>
      )}
      {occ.status !== "none" && occ.status !== "scheduled" && (
        <span className={cn("text-xs", soon ? "font-semibold text-orange" : "text-muted-foreground")}>{statusLabel(occ, now)}</span>
      )}
    </div>
  );
}
