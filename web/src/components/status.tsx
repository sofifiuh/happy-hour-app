import { endingSoon, fmtRange, statusLabel } from "@/lib/hours";
import type { Occurrence } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT = {
  live: "bg-live dot-ring animate-live",
  scheduled: "bg-live dot-ring",
  upcoming: "bg-soon dot-ring",
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
        <Countdown label={statusLabel(occ, now)} className={cn("text-xs", soon ? "font-semibold text-orange-fg" : "text-muted-foreground")} />
      )}
    </div>
  );
}

// Status line that re-enters with a short fade each time its text changes,
// so "Ends in 24 min" visibly ticks down.
export function Countdown({ label, className }: { label: string; className?: string }) {
  return (
    <span key={label} className={cn("animate-fade", className)}>
      {label}
    </span>
  );
}
