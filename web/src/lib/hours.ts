import type { Occurrence, Venue } from "./types";

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Every recurring window a venue advertises: the primary plus extras
// (late night etc.). A null end means "until close", read as 23:59.
export interface ResolvedWindow {
  days: number[];
  start: string;
  end: string;
  label: string | null;
}

export function venueWindows(v: Venue): ResolvedWindow[] {
  return [
    { days: v.hh.days, start: v.hh.start, end: v.hh.end || "23:59", label: null },
    ...v.hh.extra.map((w) => ({ days: w.days, start: w.start, end: w.end || "23:59", label: w.label ?? null })),
  ];
}

function at(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// live / upcoming relative to `now`, across every window the venue runs.
export function occurrence(v: Venue, now: Date): Occurrence {
  let live: Occurrence | null = null;
  let next: Occurrence | null = null;
  const windows = venueWindows(v);
  for (let offset = -1; offset <= 7; offset++) {
    const day = addDays(now, offset);
    for (const w of windows) {
      if (!w.days.includes(day.getDay())) continue;
      const start = at(day, w.start);
      let end = at(day, w.end);
      if (end <= start) end = addDays(end, 1); // runs past midnight
      if (now >= start && now < end) {
        if (!live || end > live.end!) live = { status: "live", start, end };
      } else if (start > now && (!next || start < next.start!)) {
        next = { status: "upcoming", start, end };
      }
    }
  }
  return live ?? next ?? { status: "none" };
}

// Against a planned day-of-week + time ("Wed at 4pm") instead of now.
export function occurrenceAt(v: Venue, day: number, hhmm: string): Occurrence {
  const windows = venueWindows(v);
  for (const w of windows) {
    if (!w.days.includes(day)) continue;
    const overnight = w.end <= w.start;
    const inside = overnight ? hhmm >= w.start || hhmm < w.end : hhmm >= w.start && hhmm < w.end;
    if (!inside) continue;
    const base = new Date(2026, 0, 4 + day); // a week whose dates line up with getDay()
    return { status: "scheduled", start: at(base, w.start), end: at(base, overnight ? "23:59" : w.end) };
  }
  return { status: "none" };
}

export function windowsForDay(v: Venue, day: number) {
  return venueWindows(v)
    .filter((w) => w.days.includes(day))
    .sort((a, b) => a.start.localeCompare(b.start));
}

// "2pm", "2:30pm" — the compact style used across Sofia's screens.
export function fmtTime(input: string | Date, withPeriod = true) {
  let h: number, m: number;
  if (typeof input === "string") [h, m] = input.split(":").map(Number);
  else [h, m] = [input.getHours(), input.getMinutes()];
  if (h === 23 && m === 59) return "close";
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${withPeriod ? period : ""}`;
}

// "2–6pm", "11am–2pm", "9pm–close"
export function fmtRange(start: string | Date, end: string | Date) {
  const s = typeof start === "string" ? start : `${start.getHours()}:${start.getMinutes()}`;
  const e = typeof end === "string" ? end : `${end.getHours()}:${end.getMinutes()}`;
  const sPm = Number(s.split(":")[0]) >= 12;
  const ePm = Number(e.split(":")[0]) >= 12;
  const endLabel = fmtTime(end);
  const samePeriod = sPm === ePm && endLabel !== "close";
  return `${fmtTime(start, !samePeriod)}–${endLabel}`;
}

export function minutesUntil(date: Date, now: Date) {
  return Math.round((date.getTime() - now.getTime()) / 60000);
}

// Human status line: "Ends in 25 min", "Starts at 3pm", "Tomorrow, 2:30pm"
export function statusLabel(occ: Occurrence, now: Date) {
  if (occ.status === "none" || !occ.start || !occ.end) return "No happy hour listed";
  if (occ.status === "scheduled") return fmtRange(occ.start, occ.end);
  if (occ.status === "live") {
    const left = minutesUntil(occ.end, now);
    if (left <= 60) return `Ends in ${left} min`;
    return `Until ${fmtTime(occ.end)}`;
  }
  const until = minutesUntil(occ.start, now);
  if (until <= 60) return `Starts in ${until} min`;
  const sameDay = occ.start.toDateString() === now.toDateString();
  if (sameDay) return `Starts at ${fmtTime(occ.start)}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (occ.start.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${fmtTime(occ.start)}`;
  return `${DAY_SHORT[occ.start.getDay()]}, ${fmtTime(occ.start)}`;
}

export function endingSoon(occ: Occurrence, now: Date) {
  return occ.status === "live" && !!occ.end && minutesUntil(occ.end, now) <= 30;
}

export function nowHHMM(d = new Date()) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
