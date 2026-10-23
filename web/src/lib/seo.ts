// Search copy for a venue: page title, meta description, the "About"
// paragraph and the questions block. The app (spot screen) and the static
// build (scripts/prerender.mjs, which imports this file directly) both use
// it, so crawlers see the same words before and after the app boots.
// Every sentence is built from data fields; nothing is invented.
import { DAY_FULL, DAY_SHORT, fmtRange, windowsForDay } from "./hours.ts";
import type { Deal, Venue } from "./types";

export const SITE = "A Little Hang";

// Consecutive days (Mon-first) with the same windows collapse into one
// run: "Every day", "Mon–Fri", "Sat & Sun".
const WEEK = [1, 2, 3, 4, 5, 6, 0];
export function dayRuns(v: Venue) {
  const runs: { days: number[]; key: string; wins: ReturnType<typeof windowsForDay> }[] = [];
  for (const d of WEEK) {
    const wins = windowsForDay(v, d);
    const key = wins.map((w) => `${w.start}-${w.end}`).join();
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.days.push(d);
    else runs.push({ days: [d], key, wins });
  }
  return runs;
}

export function runLabel(days: number[]) {
  if (days.length === 7) return "Every day";
  if (days.length === 1) return DAY_FULL[days[0]];
  if (days.length === 2) return `${DAY_SHORT[days[0]]} & ${DAY_SHORT[days[1]]}`;
  return `${DAY_SHORT[days[0]]}–${DAY_SHORT[days[days.length - 1]]}`;
}

const runText = (r: ReturnType<typeof dayRuns>[number]) => `${runLabel(r.days)} ${r.wins.map((w) => fmtRange(w.start, w.end)).join(" & ")}`;

// "Mon–Fri 3–6pm, Sat & Sun 2–5pm"
export function scheduleSummary(v: Venue) {
  return dayRuns(v)
    .filter((r) => r.wins.length)
    .map(runText)
    .join(", ");
}

// ---------- prices ----------
// "$8" -> {low: 8, high: 8}; "$11–19" -> {low: 11, high: 19}; "$3 ea" ->
// {low: 3, high: 3}; "50% off", "$3 off", "$1.75/oz" -> null.
export function parsePrice(price: string): { low: number; high: number } | null {
  // Discounts and per-ounce pours aren't a price you can compare.
  if (!price || /off\b|%|\/\s*(oz|ml|cl)\b|per (oz|ounce)/i.test(price)) return null;
  const m = price.replace(/,/g, "").match(/\$\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*\$?\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  const low = Number(m[1]);
  const high = m[2] ? Number(m[2]) : low;
  return high >= low ? { low, high } : { low, high: low };
}

export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// "$3 oysters", "$8 Granville Island beer"
export function dealPhrase(d: Deal) {
  const p = parsePrice(d.price);
  const name = /^[A-Z][a-z]/.test(d.name) && !/^[A-Z][a-z]+ [A-Z]/.test(d.name) ? d.name[0].toLowerCase() + d.name.slice(1) : d.name;
  return p ? `${money(p.low)} ${name}` : `${name} (${d.price})`;
}

// Cheapest priced deals first, at most one per name.
export function topDeals(v: Venue, n = 3) {
  const seen = new Set<string>();
  return v.hh.deals
    .map((d) => ({ d, p: parsePrice(d.price) }))
    .filter((x) => x.p && x.p.low > 0)
    .sort((a, b) => a.p!.low - b.p!.low)
    .filter((x) => !seen.has(x.d.name.toLowerCase()) && seen.add(x.d.name.toLowerCase()))
    .slice(0, n)
    .map((x) => x.d);
}

const list = (items: string[]) => (items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

// ---------- title and description ----------
// "Ancora Happy Hour: Every day 2:30–5pm | A Little Hang", shortened step by
// step until it fits 60 characters.
export function venueTitle(v: Venue) {
  const runs = dayRuns(v).filter((r) => r.wins.length);
  const full = scheduleSummary(v);
  const first = runs[0] ? runText(runs[0]) : "";
  const options = [
    full && `${v.name} Happy Hour: ${full} | ${SITE}`,
    first && `${v.name} Happy Hour: ${first} | ${SITE}`,
    full && `${v.name} Happy Hour: ${full}`,
    first && `${v.name} Happy Hour: ${first}`,
    `${v.name} Happy Hour Times & Deals | ${SITE}`,
    `${v.name} Happy Hour | ${SITE}`,
  ].filter(Boolean) as string[];
  return options.find((t) => t.length <= 60) ?? `${v.name} Happy Hour`;
}

export function placeName(v: Venue) {
  return v.area?.name ?? v.city ?? null;
}

// Happy hour sentence fragment: "every day 2:30–5pm", "Mon–Fri 3–6pm".
function schedulePhrase(v: Venue) {
  const s = scheduleSummary(v);
  return s.startsWith("Every day") ? `every day${s.slice(9)}` : s;
}

export function venueDescription(v: Venue) {
  const where = placeName(v);
  const deals = topDeals(v, 3).map(dealPhrase);
  const when = schedulePhrase(v);
  const checked = v.checked ? ` Times checked ${fmtDate(v.checked)}.` : "";
  const head = `${v.name}'s happy hour runs ${when}${where ? ` in ${where}` : ""}`;
  for (let n = deals.length; n >= 0; n--) {
    const text = `${head}${n ? `: ${list(deals.slice(0, n))}` : ""}.${checked}`;
    if (text.length <= 160 || n === 0) return text.length <= 160 ? text : `${head}.`;
  }
  return `${head}.`;
}

// "2026-10-23" -> "Oct 23, 2026"
export function fmtDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- about paragraph ----------
export function venueAbout(v: Venue) {
  const where = placeName(v);
  const out = [`${v.name} runs happy hour ${schedulePhrase(v)}${where ? ` in ${where}` : ""}.`];
  const drinks = v.hh.deals.filter((d) => d.category === "drink").length;
  const food = v.hh.deals.filter((d) => d.category === "food").length;
  const cheap = topDeals(v, 2).map(dealPhrase);
  if (drinks + food) {
    const counts = list([drinks && `${drinks} drink deal${drinks > 1 ? "s" : ""}`, food && `${food} food deal${food > 1 ? "s" : ""}`].filter(Boolean) as string[]);
    out.push(`The menu has ${counts}${cheap.length ? `, starting with ${list(cheap)}` : ""}.`);
  } else {
    out.push("They don't publish their happy hour deals online, so check their menu before you go.");
  }
  const a = v.amenities;
  const has = [a.patio && "a patio", a.liveMusic && "live music"].filter(Boolean) as string[];
  const extras = [has.length && `has ${list(has)}`, a.groups && "is good for groups"].filter(Boolean) as string[];
  if (extras.length) out.push(`It ${list(extras)}.`);
  if (a.transitStation) out.push(`The nearest SkyTrain is ${a.transitStation}.`);
  return out.join(" ");
}

// ---------- questions ----------
export function venueFaq(v: Venue) {
  const when = scheduleSummary(v);
  const weekend = dayRuns(v).filter((r) => r.wins.length && r.days.some((d) => d === 0 || d === 6));
  const weekendText = weekend.map((r) => {
    const days = r.days.filter((d) => d === 0 || d === 6);
    return `${days.length === 2 ? "Saturday and Sunday" : DAY_FULL[days[0]]} ${r.wins.map((w) => fmtRange(w.start, w.end)).join(" & ")}`;
  });
  const deals = topDeals(v, 5);
  const others = v.hh.deals.length - deals.length;
  const where = placeName(v);
  return [
    { q: `When is ${v.name}'s happy hour?`, a: when ? `${when}.${v.checked ? ` We last checked these times against their own menu on ${fmtDate(v.checked)}.` : ""}` : "They haven't published happy hour times." },
    {
      q: `Does ${v.name} have happy hour on weekends?`,
      a: weekendText.length ? `Yes: ${list(weekendText)}.` : "No. Their happy hour runs on weekdays only.",
    },
    {
      q: `What's on ${v.name}'s happy hour menu?`,
      a: deals.length
        ? `${list(deals.map(dealPhrase))}${others > 0 ? `, plus ${others} more deal${others > 1 ? "s" : ""} listed above` : ""}.`
        : v.hh.deals.length
          ? `${list(v.hh.deals.slice(0, 5).map((d) => `${d.name} (${d.price})`))}.`
          : "They don't publish their happy hour deals online. Check their menu or ask your server.",
    },
    {
      q: `Where is ${v.name}?`,
      a: `${v.address}${where && !v.address.includes(where) ? `, in ${where}` : ""}.${v.amenities.transitStation ? ` The nearest SkyTrain station is ${v.amenities.transitStation}.` : ""}`,
    },
  ];
}

// ---------- nearby ----------
export function nearby(v: Venue, venues: Venue[], n = 6) {
  if (v.lat == null || v.lng == null) return [];
  const k = Math.cos((v.lat * Math.PI) / 180);
  return venues
    .filter((o) => o.id !== v.id && o.lat != null && o.lng != null)
    .map((o) => ({ o, d: (o.lat! - v.lat!) ** 2 + ((o.lng! - v.lng!) * k) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.o);
}
