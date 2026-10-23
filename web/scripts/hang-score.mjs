// The Hangout Score: our own 0–10 rating of how good a happy hour is, worked
// out from the deals and times we publish, so anyone can check it.
//
//   Value      40%  deal prices against what Vancouver spots charge for the same thing
//   Selection  25%  how many deals, across which kinds of drink, with food or not
//   Hours      20%  hours of happy hour a week, weekends and late night
//   Vibe       15%  patio, live music, good for groups, near transit
//
// Value, Selection and Hours rank each venue against every other scored one
// (a percentile), so the scores spread out and a 9 means top 10% of the city.
// Nothing here reads Google ratings (Maps terms don't allow deriving data from
// them) and nothing a venue pays for can move a score.
//
// A venue with fewer than 3 deals, fewer than 2 priced ones, or low-confidence
// times gets no score: we'd rather say "not scored yet" than guess.

export const WEIGHTS = { value: 0.4, selection: 0.25, hours: 0.2, vibe: 0.15 };

// Things bought by the bottle, jug or platter aren't comparable to a glass or a plate.
const BULK_RE = /\bbottles?\b|\bjugs?\b|\bpitchers?\b|\bcarafes?\b|\bbuckets?\b|\bdozen\b|\bplatters?\b|\btowers?\b|\bflights?\b|\bfor two\b|\bto share\b|\bbtl\b|\b(500|750|1000) ?ml\b/i;
// Name and price only: "5oz glass (bottle $50)" in a description is still a glass.
// A description that's only a size ("750 ml bottle") with no glass or pour counts.
const POUR = /\bglass\b|\boz\b|\d\s*oz|\bpint|\bsleeve|\bschooner|\bsingle\b|\bdouble\b/i;
const BULK = {
  test: (d) =>
    BULK_RE.test(`${d.name} ${d.price || ""}`) || (BULK_RE.test(d.description || "") && !POUR.test(d.description || "")),
};
// Drink-plus-food combos ("Beer & Pho $20") aren't a drink price.
const COMBO = /\bcombo\b|\bmeal\b|\+|\b(pho|burgers?|wings?|pizzas?|tacos?|fries|nachos|sliders?|ramen|noodles?|sandwich(es)?|vermicelli|rice|grill|hot ?dogs?)\b/i;
const isCombo = (d) => d.category === "drink" && COMBO.test(`${d.name} ${d.description || ""}`);
// Soft drinks, juice, tea, shakes, energy drinks and alcohol-free beer
// aren't what a happy hour drink price means, so Value and "drinks from"
// leave them out. Mixers in a description ("clamato juice", "soda water")
// don't count when the drink names a spirit, beer, wine or cocktail.
const NO_ALCOHOL = /non[- ]?alc|alcohol[- ]free|zero[- ]proof|spirit[- ]free|(?<![\d.])0(\.0)? ?%|\bvirgin\b|mocktails?|\bn\/a\b|\bna (beer|lager|cocktail)/i;
const SOFT = /\bsoft drinks?|\bsodas?\b|\bpop\b|root beer|lemonade|\bteas?\b|milkshakes?|\bshakes?\b|red bull|energy drink|\bjuices?\b|coffee|latte|espresso|kombucha|\bcokes?\b|sprite|ginger ale|lassi|smoothie|slush|refresher|coca[- ]?cola|pepsi|\bwater\b|perrier|pellegrino/i;
const BOOZE = /vodka|\bgin\b|\brum\b|tequila|whisk|bourbon|\brye\b|mezcal|scotch|brandy|cognac|\bsake\b|soju|\bbeers?\b|lager|\bales?\b|\bipa\b|pilsner|stout|cider|\bwines?\b|prosecco|\bcava\b|champagne|sparkling|spritz|margarita|martini|mojito|negroni|caesar|cocktail|highball|\bwell\b|\bshots?\b|liqueur|limoncello|aperol|campari|vermouth|sangria|mimosa|daiquiri|paloma|\bmule\b|\bsour\b|old fashioned|fire ?ball|baileys|long island|ranch water|bacardi|jameson|cuervo|lot 40|choya|boozy|spiked|\bhard\b|\bspirits?\b|wheat|\babv\b|\b[1-9](\.\d)? ?%|\b[12](\.5)? ?oz\b/i;
export const isNonAlc = (d) => {
  if (d.category !== "drink") return false;
  // "Aperol, Campari … or Fre-Spritz (non-alc)": an alcohol-free option on an alcoholic drink.
  const text = `${d.name} ${(d.description || "").replace(/\bor\b[^,;]*non[- ]?alc[^,;]*/gi, "")}`;
  if (NO_ALCOHOL.test(text)) return true;
  return SOFT.test(text) && !BOOZE.test(text.replace(/root beer|ginger beer|ginger ale|sparkling (lemonade|water|soda|juice)/gi, ""));
};
const skip = (d) => BULK.test(d) || isCombo(d) || isNonAlc(d);

// Alcoholic drink deals, the thing a happy hour is for.
export const hasAlcohol = (v) => v.hh.deals.some((d) => d.category === "drink" && !isNonAlc(d));

// The cheapest priced alcoholic drink (not a bottle, pitcher or combo): { d, p } or null.
export function cheapestDrink(v) {
  let best = null;
  for (const d of v.hh.deals) {
    if (d.category !== "drink" || skip(d)) continue;
    const p = dealPrice(d);
    if (p != null && (!best || p < best.p)) best = { d, p };
  }
  return best;
}

const DRINK_TYPES = [
  ["highball", /highball|\bwell\b|\brail\b|\bshots?\b|\bhi-?ball|spirits?\b|\bbar ?pour/i],
  ["wine", /wine|prosecco|\bcava\b|champagne|bubbles|sparkling|\brosé\b|\brose\b|\bred\b|\bwhite\b/i],
  ["beer", /beer|lager|\bale\b|\bipa\b|pilsner|\bpils\b|stout|porter|guinness|draught|draft|\bpint|sleeve|cider|sake|\bhaus\b/i],
  ["cocktail", /./],
];
const FOOD_TYPES = [
  ["oyster", /oyster/i],
  ["side", /fries|poutine|onion rings|edamame|olives|chips|nuts|popcorn|bread|focaccia|pickles|tots|hummus|dip\b/i],
  ["plate", /./],
];

function dealType(d) {
  const text = `${d.name} ${d.description || ""}`;
  for (const [type, re] of d.category === "drink" ? DRINK_TYPES : FOOD_TYPES) if (re.test(text)) return type;
  return d.category;
}

// "$8", "$11–19" (low end), "$3 ea", "$6.50". "$2 off" and "50% off" aren't prices.
export function dealPrice(d) {
  const p = (d.price || "").replace(/,/g, "");
  if (/off|%|free|half|1\/2|\/\s*oz|per\s*oz/i.test(p)) return null;
  const m = p.match(/\$\s*(\d+(?:\.\d+)?)/) || p.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 60 ? n : null;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Share of `all` strictly below x, plus half the ties: 0 (lowest) to 1 (highest).
function percentile(all, x) {
  let below = 0, same = 0;
  for (const y of all) if (y < x) below++; else if (y === x) same++;
  return (below + same / 2) / all.length;
}

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
function windowMinutes(start, end) {
  if (!start) return 0;
  // No end means "until close": count three hours.
  if (!end) return 180;
  const len = toMin(end) - toMin(start);
  return len > 0 ? len : len + 24 * 60;
}

export function hoursFacts(v) {
  const wins = [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra];
  let minutes = 0;
  const days = new Set();
  let late = false;
  for (const w of wins) {
    minutes += windowMinutes(w.start, w.end) * w.days.length;
    for (const d of w.days) days.add(d);
    // A window that starts at 8pm or later, or runs past 10pm.
    if (w.start && (toMin(w.start) >= 20 * 60 || (w.end && (toMin(w.end) >= 22 * 60 || toMin(w.end) < toMin(w.start))))) late = true;
  }
  const weekend = [0, 6].filter((d) => days.has(d)).length;
  return { minutes, days: days.size, weekend, late };
}

function scoreable(v) {
  const priced = v.hh.deals.filter((d) => dealPrice(d) != null && !skip(d));
  return v.confidence !== "low" && v.hh.deals.length >= 3 && priced.length >= 2;
}

const round1 = (x) => Math.round(x * 10) / 10;
// Percentile 0..1 onto 2..10: the weakest spot in the city still runs a happy hour.
const scale = (p) => round1(2 + 8 * p);

// Adds `score` to every venue: { total, value, selection, hours, vibe, notes } or null.
export function addHangScores(venues) {
  const pool = venues.filter(scoreable);

  // Typical (median) price per kind of deal, across every venue.
  const byType = {};
  for (const v of pool)
    for (const d of v.hh.deals) {
      const p = dealPrice(d);
      if (p == null || skip(d)) continue;
      (byType[dealType(d)] ??= []).push(p);
    }
  const typical = Object.fromEntries(Object.entries(byType).map(([t, ps]) => [t, median(ps)]));

  const raw = new Map();
  for (const v of pool) {
    // Value: average of log2(typical / price), drinks counting 1.5x; then a nudge
    // for the cheapest drink (a $5 drink is what people go to happy hour for).
    let sum = 0, weight = 0, cheapest = Infinity, under = 0, priced = 0;
    for (const d of v.hh.deals) {
      const p = dealPrice(d);
      if (p == null || skip(d)) continue;
      const t = dealType(d);
      const r = Math.min(2, Math.max(0.5, typical[t] / p));
      const w = d.category === "drink" ? 1.5 : 1;
      sum += Math.log2(r) * w;
      weight += w;
      priced++;
      if (p < typical[t]) under++;
      if (d.category === "drink") cheapest = Math.min(cheapest, p);
    }
    const discounts = v.hh.deals.filter((d) => /off|%|half|1\/2/i.test(d.price || "")).length;
    const value = sum / weight + (cheapest < Infinity ? Math.max(0, (9 - cheapest) / 12) : 0) + Math.min(discounts, 3) * 0.03;

    // Selection: deal count (to 14), kinds of drink (of 4), and food alongside drinks.
    const drinks = v.hh.deals.filter((d) => d.category === "drink" && !isNonAlc(d));
    const food = v.hh.deals.filter((d) => d.category === "food");
    const kinds = new Set(drinks.filter((d) => !isCombo(d)).map(dealType));
    // (drinks here and below are alcoholic ones; see isNonAlc)
    const selection = 0.5 * Math.min(v.hh.deals.length, 14) / 14 + 0.25 * kinds.size / 4 + 0.25 * (drinks.length && food.length ? 1 : drinks.length ? 0.5 : 0.3);

    // Hours: weekly minutes on a log scale, plus weekends and a late-night window.
    const h = hoursFacts(v);
    const hours = Math.log(1 + h.minutes / 60) + 0.12 * h.weekend + (h.late ? 0.25 : 0);

    raw.set(v.id, { value, selection, hours, cheapest, under, priced, kinds, food: food.length, drinks: drinks.length, h });
  }

  const all = { value: [], selection: [], hours: [] };
  for (const r of raw.values()) for (const k of Object.keys(all)) all[k].push(r[k]);

  for (const v of venues) {
    const r = raw.get(v.id);
    if (!r) {
      v.score = null;
      continue;
    }
    const a = v.amenities;
    // Missing amenity info isn't the same as "no patio", so vibe starts at 3.
    const vibe = round1(3 + 7 * (0.4 * a.patio + 0.25 * a.liveMusic + 0.2 * a.groups + 0.15 * a.transit));
    const s = {
      value: scale(percentile(all.value, r.value)),
      selection: scale(percentile(all.selection, r.selection)),
      hours: scale(percentile(all.hours, r.hours)),
      vibe,
    };
    const total = round1(Object.entries(WEIGHTS).reduce((t, [k, w]) => t + w * s[k], 0));
    v.score = { total, ...s, notes: notes(v, r) };
  }
  return { scored: pool.length, typical };
}

const KIND_WORDS = { beer: "beer", wine: "wine", cocktail: "cocktails", highball: "highballs" };
const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

// One plain line per part, shown under each bar.
function notes(v, r) {
  const share = r.under / r.priced;
  const value = [
    r.cheapest < Infinity ? `Drinks from ${money(r.cheapest)}` : r.drinks ? "No priced drink deals" : "Food deals only",
    share >= 0.6 ? "most deals under the Vancouver norm" : share >= 0.35 ? "about half under the Vancouver norm" : "priced around or above the Vancouver norm",
  ].join(", ");
  const kinds = ["beer", "wine", "cocktail", "highball"].filter((k) => r.kinds.has(k)).map((k) => KIND_WORDS[k]);
  const selection = `${v.hh.deals.length} deals${kinds.length ? ` across ${list(kinds)}` : ""}${r.food ? (r.drinks ? ", plus food" : ", food only") : ", no food"}`;
  const hrs = Math.round(r.h.minutes / 60);
  const hours = [
    `${hrs} hour${hrs === 1 ? "" : "s"} a week`,
    r.h.days === 7 ? "every day" : `${r.h.days} day${r.h.days === 1 ? "" : "s"}`,
    r.h.weekend ? null : "weekdays only",
    r.h.late ? "late night too" : null,
  ].filter(Boolean).join(", ");
  const a = v.amenities;
  const bits = [a.patio && "Patio", a.liveMusic && "Live music", a.groups && "Good for groups", a.transit && "Near transit"].filter(Boolean);
  const vibe = bits.length ? bits.join(" · ") : "No patio, music or group info yet";
  return { value, selection, hours, vibe };
}
