import { type CSSProperties } from "react";
import { Link } from "react-router";
import type { HangScore, ScorePart } from "@/lib/types";
import { cn } from "@/lib/utils";

// The Hangout Score (scripts/hang-score.mjs): our own 0-10 rating of a happy
// hour from its prices, deals, hours and setting. Shown out of 10, never as
// stars, so it doesn't read as a review score.

const PARTS: { key: ScorePart; label: string; weight: string }[] = [
  { key: "value", label: "Value", weight: "40%" },
  { key: "selection", label: "Selection", weight: "25%" },
  { key: "hours", label: "Hours", weight: "20%" },
  { key: "vibe", label: "Vibe", weight: "15%" },
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

// Venue page card: the number, a word for it, and a bar plus one plain line per part.
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
          {fmtScore(score.total)}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[18px] leading-tight font-bold">{scoreWord(score.total)}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Hangout Score out of 10, from the deals and times on this page</p>
        </div>
      </div>
      <ul className="mt-4 space-y-3.5">
        {PARTS.map((p, i) => (
          <li key={p.key}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-semibold">
                {p.label} <span className="text-[12px] font-normal text-muted-foreground">{p.weight}</span>
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
      <Link to="/about#hang-score" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-orange-fg underline-offset-4 hover:underline">
        How we score
      </Link>
    </div>
  );
}
