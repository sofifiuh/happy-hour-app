import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { type CSSProperties } from "react";
import { Link } from "react-router";
import type { HangScore, ScorePart } from "@/lib/types";
import { cn } from "@/lib/utils";

// The Hangout Score (scripts/hang-score.mjs): our own 0-10 rating of a happy
// hour from its prices, deals, hours and setting. Shown out of 10, never as
// stars, so it doesn't read as a review score.

const PARTS: { key: ScorePart; label: string; weight: string; what: string }[] = [
  { key: "value", label: "Value", weight: "40%", what: "deal prices against what Vancouver spots charge" },
  { key: "selection", label: "Selection", weight: "25%", what: "how many deals and kinds of drink, plus food" },
  { key: "hours", label: "Hours", weight: "20%", what: "hours a week, weekends and late night" },
  { key: "vibe", label: "Vibe", weight: "15%", what: "patio, live music, groups, transit" },
];

export const fmtScore = (n: number) => n.toFixed(1);

// 7.5+ is roughly the top sixth of the city, and what the "Top happy hours" filter keeps.
export const TOP_SCORE = 7.5;
export function scoreWord(n: number) {
  return n >= TOP_SCORE ? "Great happy hour" : n >= 6 ? "Good happy hour" : n >= 4.5 ? "Decent happy hour" : "Basic happy hour";
}

// Small pill for list rows and the venue header.
export function ScoreChip({ score, className }: { score: HangScore; className?: string }) {
  return (
    <span
      title={`Hangout Score ${fmtScore(score.total)} out of 10`}
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px font-display text-[12px] leading-[1.3] font-bold tabular",
        score.total >= TOP_SCORE ? "bg-score text-on-pop" : "bg-ink-3 text-cream",
        className,
      )}
    >
      <span className="sr-only">Hangout Score </span>
      {fmtScore(score.total)}
    </span>
  );
}

// Venue page card: the number out of 10, a word for it, and a bar plus one
// plain line per part. Weights live on the "How we score" page.
export function ScoreCard({ score }: { score: HangScore }) {
  return (
    <div className="rounded-[22px] bg-ink-2 p-4">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid size-16 shrink-0 place-items-center rounded-2xl font-display text-[28px] leading-none font-extrabold tabular",
            score.total >= TOP_SCORE ? "bg-score text-on-pop" : "bg-ink-3 text-cream",
          )}
        >
          <span className="flex flex-col items-center">
            {fmtScore(score.total)}
            <span className="mt-1 text-[11px] font-bold opacity-70">/ 10</span>
          </span>
        </span>
        <div className="min-w-0">
          <p className="font-display text-[18px] leading-tight font-bold">{scoreWord(score.total)}</p>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Scores <b className="font-semibold text-cream">{fmtScore(score.total)} out of 10</b>
          </p>
        </div>
      </div>
      <p className="mt-4 text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">What we look at</p>
      <ul className="mt-2.5 space-y-3.5">
        {PARTS.map((p, i) => (
          <li key={p.key}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-semibold">
                {p.label}
              </span>
              <span className="font-display font-bold tabular">{fmtScore(score[p.key])}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-3" aria-hidden>
              <div
                style={{ "--w": `${score[p.key] * 10}%`, animationDelay: `${120 + i * 70}ms` } as CSSProperties}
                className="animate-grow h-full w-(--w) origin-left rounded-full bg-score"
              />
            </div>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{score.notes[p.key]}</p>
          </li>
        ))}
      </ul>
      <HowWeScore />
    </div>
  );
}

// Opens on hover with a mouse and on tap on phones, so nobody leaves the page
// to find out what the number means. The full method stays on /about.
function HowWeScore() {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={120}
        className="mt-3 inline-flex min-h-11 cursor-help items-center gap-1.5 text-[13px] font-semibold text-orange-fg underline-offset-4 hover:underline data-[popup-open]:underline"
      >
        <Info className="size-3.5" /> How we score
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6} collisionPadding={12} className="z-50">
          <Popover.Popup className="w-[min(320px,calc(100vw-24px))] origin-(--transform-origin) rounded-2xl bg-ink-3 p-4 text-[13px] leading-snug text-muted-foreground shadow-xl ring-1 ring-edge/10 transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Popover.Title className="font-display text-[15px] font-bold text-cream">How the score works</Popover.Title>
            <Popover.Description className="mt-1">Out of 10, from the deals and times on this page, the same way for every spot:</Popover.Description>
            <ul className="mt-2 space-y-1">
              {PARTS.map((p) => (
                <li key={p.key}>
                  <b className="font-semibold text-cream">
                    {p.label} {p.weight}
                  </b>
                  : {p.what}
                </li>
              ))}
            </ul>
            <p className="mt-2">No venue can pay for a score, and Google ratings aren't part of it.</p>
            <Link to="/about#hang-score" className="mt-1 inline-flex min-h-9 items-center font-semibold text-orange-fg underline-offset-4 hover:underline">
              Full method
            </Link>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
