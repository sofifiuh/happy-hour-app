// The A Little Hang Awards: once a year, the best and cheapest happy hours,
// picked from the data alone (no nominations, no fees, no votes).
//
//   node scripts/awards.mjs 2026      picks the winners from public/venues.json
//                                     (run `npm run sync` first) and freezes
//                                     them in awards/<year>.json
//
// The frozen file is what the site shows: awards don't change with the
// nightly data. prerender.mjs renders /awards/<year>/ and an award badge
// per win (badge/award/<year>/<id>-<n>.svg) from it.
//
// Categories, per region (the Lower Mainland, Calgary):
//   best      highest Hangout Score (the #1 on the region's best-of list)
//   pint, wine, highball, oyster
//             the cheapest, by the Happy Hour Index's rules (price-index.mjs:
//             one cheapest fixed price per venue, no small pours); ties share it
// and per neighbourhood and city with a best-of list: its #1.
// Only venues re-confirmed in the last two weeks can win, as on the lists.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAlberta } from "./seo-data.mjs";
import { cheapestOf, KINDS } from "./price-index.mjs";

const CHEAP = [
  { key: "pint", title: "Cheapest pint" },
  { key: "wine", title: "Cheapest glass of wine" },
  { key: "highball", title: "Cheapest highball" },
  { key: "oyster", title: "Cheapest oysters" },
];
const REGIONS = [
  { key: "lower-mainland", name: "the Lower Mainland", short: "the Lower Mainland", best: "metro", test: (v) => !isAlberta(v) },
  { key: "calgary", name: "Calgary", short: "Calgary", best: "calgary", test: isAlberta },
];
const MAX_TIE = 4;

const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const whereOf = (v) => (v.area ? v.area.name : v.city || "");
const win = (v, why) => ({ id: v.id, name: v.name, where: whereOf(v), why });

export function pickAwards({ venues, best, year }) {
  const byId = new Map(venues.map((v) => [v.id, v]));
  const asOf = venues.map((v) => v.confirmed).filter(Boolean).sort().pop();
  const since = new Date(Date.parse(asOf) - 14 * 864e5).toISOString().slice(0, 10);
  const fresh = venues.filter((v) => v.confidence !== "low" && v.confirmed >= since);
  const scoreWhy = (v) => `Hangout Score ${v.score.total.toFixed(1)} out of 10`;
  const regions = REGIONS.map((r) => {
    const pool = fresh.filter(r.test);
    const awards = [];
    const list = best.find((b) => b.slug === r.best);
    const top = list && byId.get(list.ids[0]);
    if (top) awards.push({ key: "best", title: "Best happy hour", winners: [win(top, scoreWhy(top))] });
    for (const c of CHEAP) {
      const kind = KINDS.find((k) => k.key === c.key);
      const rows = pool.map((v) => ({ v, ...cheapestOf(v, kind) })).filter((x) => x.p != null).sort((a, b) => a.p - b.p);
      if (!rows.length) continue;
      const low = rows[0].p;
      const tied = rows.filter((x) => x.p === low);
      if (tied.length > MAX_TIE) continue; // a five-way tie isn't an award
      awards.push({ key: c.key, title: c.title, price: low, winners: tied.map((x) => win(x.v, `${money(low)} ${x.d.name}`)) });
    }
    return { key: r.key, name: r.name, short: r.short, awards };
  });
  const places = best
    .filter((b) => b.slug !== "metro" && b.slug !== "calgary" && b.index)
    .map((b) => {
      const v = byId.get(b.ids[0]);
      return v && { slug: b.slug, name: b.name, kind: b.kind, winner: win(v, scoreWhy(v)) };
    })
    .filter(Boolean);
  return { year, asOf, venues: fresh.length, regions, places };
}

// Every win a venue has, numbered for its badge file: [{ n, title, where }].
export function winsOf(awards, id) {
  const out = [];
  for (const r of awards.regions) for (const a of r.awards) if (a.winners.some((w) => w.id === id)) out.push({ title: a.title, where: r.short, anchor: `${r.key}-${a.key}` });
  for (const p of awards.places) if (p.winner.id === id) out.push({ title: "Best happy hour", where: p.name, anchor: `place-${p.slug}` });
  return out.map((w, n) => ({ ...w, n: n + 1, line: `${w.title} in ${w.where}` }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const year = Number(process.argv[2]) || new Date().getFullYear();
  const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { venues, best } = JSON.parse(readFileSync(resolve(web, "public/venues.json"), "utf8"));
  const awards = pickAwards({ venues, best, year });
  mkdirSync(resolve(web, "awards"), { recursive: true });
  writeFileSync(resolve(web, `awards/${year}.json`), `${JSON.stringify(awards, null, 2)}\n`);
  for (const r of awards.regions) for (const a of r.awards) console.log(`${r.short} · ${a.title}: ${a.winners.map((w) => `${w.name} (${w.why})`).join(" / ")}`);
  for (const p of awards.places) console.log(`${p.name} · ${p.winner.name}`);
}

// ---------- pages (called by prerender.mjs with its helpers) ----------
export const AWARDS_YEAR = 2026;
export function loadAwards(web, year = AWARDS_YEAR) {
  try {
    return JSON.parse(readFileSync(resolve(web, `awards/${year}.json`), "utf8"));
  } catch {
    return null;
  }
}
export const awardsPath = (year) => `/awards/${year}/`;
// badge/award/<year>/<id>-<n>.svg (dark) and -light.svg
export const awardBadge = (year, id, n, light) => `/badge/award/${year}/${id}-${n}${light ? "-light" : ""}.svg`;
const fmtLong = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export function awardsPage(ctx, awards) {
  const { hubDoc, write, SITE_GRAPH, WEBSITE_ID, breadcrumb, esc, BASE, SITE, sitemapDates, faces, logo, badgeSvg, venueIds } = ctx;
  const { year } = awards;
  const path = awardsPath(year);
  const url = BASE + path;
  const link = (w) => (venueIds.has(w.id) ? `<a href="/spots/${w.id}">${esc(w.name)}</a>` : esc(w.name));
  const title = `The A Little Hang Awards ${year}: The Best Happy Hours | ${SITE}`;
  const description = `The best and cheapest happy hours of ${year} in the Lower Mainland and Calgary, picked from ${awards.venues} venues' menus. No nominations, no fees, no votes.`;
  const crumbs = [{ name: "Happy hours", path: "/" }, { name: "Research and data", path: "/research/" }, { name: `Awards ${year}` }];
  const allWins = [];
  for (const r of awards.regions) for (const a of r.awards) for (const w of a.winners) allWins.push({ name: `${a.title} in ${r.short}`, w });
  for (const p of awards.places) allWins.push({ name: `Best happy hour in ${p.name}`, w: p.winner });
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      ...SITE_GRAPH,
      { "@type": "CollectionPage", "@id": url, url, name: `The A Little Hang Awards ${year}`, description, isPartOf: { "@id": WEBSITE_ID }, mainEntity: { "@id": `${url}#list` }, breadcrumb: { "@id": `${url}#breadcrumb` }, datePublished: awards.asOf, inLanguage: "en-CA" },
      { "@type": "ItemList", "@id": `${url}#list`, name: `A Little Hang Awards ${year} winners`, numberOfItems: allWins.length, itemListElement: allWins.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: `${x.name}: ${x.w.name}`, url: `${BASE}/spots/${x.w.id}` })) },
      breadcrumb(url, crumbs),
    ],
  };
  const card = (r, a) => `<li class="aw${a.key === "best" ? " win1" : ""}" id="${r.key}-${a.key}"><p class="awk">${esc(a.title)}${a.winners.length > 1 ? ` <span>${a.winners.length}-way tie</span>` : ""}</p>${a.winners
    .map((w) => `<p class="awn">${link(w)}</p><p class="aww">${esc(w.where)} · <b>${esc(w.why)}</b></p>`)
    .join("")}</li>`;
  const winners = [...new Map(allWins.map((x) => [x.w.id, x.w])).values()].filter((w) => venueIds.has(w.id)).sort((a, b) => a.name.localeCompare(b.name));
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">${SITE}</a> › <a href="/research/">Research and data</a> › <span>Awards ${year}</span></nav>
<p class="eyebrow">The A Little Hang Awards</p>
<h1>The best happy hours of ${year}</h1>
<p class="lede">No nominations, no entry fees and no votes. We read the happy hour menus of ${awards.venues} bars and restaurants and let the numbers pick: the highest Hangout Score, and the cheapest pint, glass of wine, highball and oysters, in the Lower Mainland and in Calgary.</p>
<p class="meta">Winners picked <time datetime="${awards.asOf}">${esc(fmtLong(awards.asOf))}</time>, from prices on each venue's own menu.</p>
${awards.regions
  .map((r) => `<h2 id="${r.key}">${esc(r.key === "calgary" ? "Calgary" : "The Lower Mainland")}</h2>\n<ul class="awards">${r.awards.map((a) => card(r, a)).join("")}</ul>`)
  .join("\n")}
<h2 id="places">Best happy hour in each neighbourhood and city</h2>
<ul class="best awplaces">${awards.places.map((p) => `<li id="place-${p.slug}"><span><a href="/happy-hour/${p.slug}/best/">${esc(p.name)}</a></span><b>${link(p.winner)} <small>${esc(p.winner.why.replace(" out of 10", ""))}</small></b></li>`).join("")}</ul>

<h2 id="badges">For the winners</h2>
<div class="use">
<p class="lede">Every winner gets a free award badge for their website. It's on your venue's badge page, with the code to paste:</p>
<div class="badgeprev dark"><img src="${awardBadge(year, awards.regions[0].awards[0].winners[0].id, 1)}" alt="${esc(`${awards.regions[0].awards[0].title} in ${awards.regions[0].short}, A Little Hang Awards ${year}`)}" height="56"></div>
<ul class="chips awchips">${winners.map((w) => `<li><a href="/badge/${w.id}/">${esc(w.name)}</a></li>`).join("")}</ul>
</div>

<h2>How we picked</h2>
<ul class="method">
<li><b>Best happy hour</b> goes to the highest <a href="/about/#hang-score">Hangout Score</a>: value, selection, hours and vibe, worked out the same way for every spot. It's the #1 on each <a href="/happy-hour/best/">best-of list</a>.</li>
<li><b>Cheapest</b> uses the <a href="/happy-hour-index/">Happy Hour Index</a> rules: each venue's cheapest fixed price, a full pour (a 14oz or bigger pint, a 5oz or bigger glass of wine, a 1oz highball), oysters priced each. "$2 off" deals, pitchers and bottles don't count. Ties share the award.</li>
<li>Only venues whose menu we re-confirmed in the two weeks before judging could win, and no venue can pay for a listing, a score or an award.</li>
</ul>

<h2>Use the results</h2>
<p class="meta">Free to quote and share with a credit and a link. Copy a credit line:</p>
<pre class="cite"><code>${esc(`Source: <a href="${url}">A Little Hang Awards ${year}</a>`)}</code></pre>
<p class="meta">More numbers on the <a href="/research/">Research page</a>.</p>`;
  write(`${path.slice(1)}index.html`, hubDoc({ path, title, description, jsonld, body, image: { url: `${BASE}/og/happy-hour-index.jpg`, alt: `The A Little Hang Awards ${year}` } }));
  sitemapDates.set(path, awards.asOf);
  // Award badges, one per win.
  const seen = new Set();
  for (const x of allWins) {
    if (seen.has(x.w.id)) continue;
    seen.add(x.w.id);
    for (const w of winsOf(awards, x.w.id)) {
      const says = { top: `A Little Hang Awards ${year}`, main: w.line, alt: `${w.line}, A Little Hang Awards ${year}` };
      write(awardBadge(year, x.w.id, w.n).slice(1), badgeSvg(says, { faces, logo, award: true }));
      write(awardBadge(year, x.w.id, w.n, true).slice(1), badgeSvg(says, { faces, logo, award: true, theme: "light" }));
    }
  }
}
