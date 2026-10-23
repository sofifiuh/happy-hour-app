// Turns the alittlehang.com build (dist-site) into a crawlable directory:
//   spots/<id>.html          one page per venue at the old site's URLs: title,
//                            description, share image, JSON-LD graph (venue,
//                            happy hour menu, breadcrumb) and the venue's
//                            details pre-rendered inside #root
//   happy-hour/<slug>/       hub pages (city, neighbourhood, day, deal, and
//                            place + topic), static HTML without the app
//   happy-hour/<place>/best/ best-of lists ranked by Hangout Score, and
//   happy-hour/best/         Metro Vancouver's (static, like the hubs)
//   spots/index.html         A–Z of every venue
//   og/<id>.jpg              1200×630 share card per venue
//   map/, saved/, about/, privacy/, terms/, welcome/, menu.html, 404.html
//   sitemap.xml (index) + sitemap-{pages,venues,hubs}.xml, robots.txt, CNAME
// The app boots on every page except the hubs and takes over from the
// static markup. Venue copy (titles, about, questions) comes from
// src/lib/seo.ts, which the app uses too, so both say the same thing.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";
import { fmtRange } from "../src/lib/hours.ts";
import { dayRuns, dealPhrase, fmtDate, money, nearby, parsePrice, runLabel, scheduleSummary, sourceLabel, topDeals, venueAbout, venueDescription, venueFaq, venueTitle } from "../src/lib/seo.ts";
import { AREAS, BEST_FLOOR, BEST_FRESH_DAYS, bestPath, buildHubs, hubPath } from "./seo-data.mjs";
import { cheapestDrink, hoursFacts, isNonAlc, WEIGHTS } from "./hang-score.mjs";

const BASE = "https://alittlehang.com";
const SITE = "A Little Hang";
const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");
const dist = resolve(web, "dist-site");
const cache = resolve(web, "node_modules/.cache/og");
mkdirSync(cache, { recursive: true });

// Preload the two font files the first screen paints with.
const fontFiles = readdirSync(resolve(dist, "assets")).filter((f) => f.endsWith(".woff2"));
const fonts = fontFiles.filter((f) => /^funnel-(display-latin-800|sans-latin-400)-normal-.*\.woff2$/.test(f));
const template = readFileSync(resolve(dist, "index.html"), "utf8")
  // public/ files are linked relatively in index.html; pages live in
  // subfolders (spots/, about/), so make them root-relative.
  .replace(/(href|src)="(icon\.svg|icon-\d+\.png|manifest\.webmanifest|venues\.json|og\.png)"/g, '$1="/$2"')
  .replace('<html lang="en">', '<html lang="en-CA">')
  .replace(
    "</head>",
    `${fonts.map((f) => `    <link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join("\n")}\n  </head>`,
  );
writeFileSync(resolve(dist, "index.html"), template);
const { venues, best: bestIndex = [] } = JSON.parse(readFileSync(resolve(web, "public/venues.json"), "utf8"));
// Fields the app doesn't ship (Google place id, price level) from the source.
const source = new Map(JSON.parse(readFileSync(resolve(web, "../venues.json"), "utf8")).venues.map((v) => [v.id, v]));
const logo = readFileSync(resolve(web, "src/components/logo-path.ts"), "utf8").match(/LOGO_PATH =\s*"([^"]+)"/)[1];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const summary = scheduleSummary;
const absPhoto = (p) => (/^https?:/.test(p) ? p : `${BASE}/${p}`);
const newest = (list) => list.map((v) => v.checked).filter(Boolean).sort().pop() ?? null;
const sitemapDates = new Map();

// Hubs (also annotates venues with city + area slugs; sync-data already
// stored area objects, which buildHubs recomputes identically).
const { places, topics, combos } = buildHubs(venues);
for (const v of venues) v.area = v.area ? { slug: v.area, name: AREAS[v.area] } : null;
const placeBySlug = new Map(places.map((p) => [p.slug, p]));
const cityHub = (v) => places.find((p) => p.kind === "city" && p.name === v.city) ?? null;
const areaHub = (v) => (v.area ? (placeBySlug.get(v.area.slug) ?? null) : null);

// Best-of lists, ranked in sync-data.mjs (scripts/seo-data.mjs buildBest).
const venueById = new Map(venues.map((v) => [v.id, v]));
const bestLists = bestIndex.map((b) => ({ ...b, venues: b.ids.map((id) => venueById.get(id)).filter(Boolean) }));
const bestBySlug = new Map(bestLists.map((b) => [b.slug, b]));
// Where a venue places on its own neighbourhood's or city's list (not Metro's).
const rankOf = (v) => {
  for (const slug of [v.area?.slug, cityHub(v)?.slug]) {
    const b = slug && bestBySlug.get(slug);
    const i = b ? b.venues.indexOf(v) : -1;
    if (i >= 0) return { list: b, rank: i + 1 };
  }
  return null;
};
// The year in "Best happy hours in Gastown (2026)": the data's, not the build machine's.
const YEAR = (newest(venues) ?? new Date().toISOString()).slice(0, 4);
const bestH1 = (b) => `Best happy hours in ${b.name} (${YEAR})`;

// ---------- page assembly ----------
// Share titles drop the "| A Little Hang" suffix (og:site_name carries it),
// except where the rest would be a bare word like "About".
const ogTitle = (title) => {
  const bare = title.replace(` | ${SITE}`, "");
  return bare.length < 20 ? `${bare} · ${SITE}` : bare;
};
function page({ path, title, description, image = `${BASE}/og.png`, imageAlt = `${SITE}: Vancouver happy hours right now`, type = "website", jsonld, body = "", preload, robots, extraHead = [] }) {
  const url = BASE + path;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(ogTitle(title))}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(image)}" />`);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${robots ?? "index,follow,max-image-preview:large"}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="en_CA" />`,
    `<meta property="og:image:type" content="${image.endsWith(".png") ? "image/png" : "image/jpeg"}" />`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}" />`,
    ...extraHead,
    preload && `<link rel="preload" href="${preload}" as="image" fetchpriority="high" />`,
    jsonld && ldScript(jsonld),
  ].filter(Boolean);
  html = html.replace("</head>", `    ${head.join("\n    ")}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

const ldScript = (jsonld) => `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>`;

function write(rel, html) {
  const file = resolve(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// ---------- structured data ----------
const WEBSITE_ID = `${BASE}/#website`;
const ORG_ID = `${BASE}/#organization`;
const FOUNDER_ID = `${BASE}/about/#jason`;
const DESIGNER_ID = `${BASE}/about/#sofia`;

function breadcrumb(id, items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${id}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path && i < items.length - 1 ? { item: BASE + it.path } : {}) })),
  };
}

// The page's visible Q&As, word for word (Google requires the match).
function faqPage(id, qs) {
  return {
    "@type": "FAQPage",
    "@id": `${id}#faq`,
    isPartOf: { "@id": id },
    mainEntity: qs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

// Home › City › Neighbourhood, for a venue or a hub page.
function trail(city, area) {
  return [{ name: "Happy hours", path: "/" }, city && { name: city.name, path: hubPath(city.slug) }, area && { name: area.name, path: hubPath(area.slug) }].filter(Boolean);
}

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PRICE_RANGE = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

// Google's primaryType (pipeline/places-sync.js) -> schema.org type and
// cuisine. Every venue on the site serves drinks, so unknowns stay both.
function venueType(primary) {
  if (!primary) return { type: ["Restaurant", "BarOrPub"] };
  if (/brewery|brewpub/.test(primary)) return { type: "Brewery" };
  if (/winery/.test(primary)) return { type: "Winery" };
  if (/(^|_)(bar|pub)$|night_club|lounge/.test(primary)) return { type: "BarOrPub" };
  const cuisine = primary.match(/^(.+)_restaurant$/)?.[1];
  const skip = new Set(["fast_food", "family", "fine_dining", "buffet"]);
  return { type: "Restaurant", ...(cuisine && !skip.has(cuisine) ? { cuisine: cuisine.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") } : {}) };
}

// Places periods ({open: {day, hour, minute}, close: …}) -> one
// OpeningHoursSpecification per distinct open/close pair.
function openingHours(periods) {
  const hhmm = (t) => `${String(t.hour).padStart(2, "0")}:${String(t.minute ?? 0).padStart(2, "0")}`;
  const groups = new Map();
  for (const p of periods ?? []) {
    if (!p.open) continue;
    const key = `${hhmm(p.open)}-${p.close ? hhmm(p.close) : "23:59"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(SCHEMA_DAYS[p.open.day]);
  }
  return [...groups].map(([key, days]) => {
    const [opens, closes] = key.split("-");
    return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
  });
}

function menuItem(d) {
  const p = parsePrice(d.price);
  const description = [d.description, !p && d.price].filter(Boolean).join(" · ");
  return {
    "@type": "MenuItem",
    name: d.name,
    ...(description ? { description } : {}),
    ...(p
      ? {
          offers:
            p.low === p.high
              ? { "@type": "Offer", price: p.low, priceCurrency: "CAD" }
              : { "@type": "AggregateOffer", lowPrice: p.low, highPrice: p.high, priceCurrency: "CAD" },
        }
      : {}),
  };
}

function venueJsonLd(v, image) {
  const src = source.get(v.id) ?? {};
  const url = `${BASE}/spots/${v.id}.html`;
  const windows = [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra].filter((w) => w.start && w.days?.length);
  const street = v.address.split(",")[0];
  const sections = [
    ["Drinks", v.hh.deals.filter((d) => d.category === "drink")],
    ["Food", v.hh.deals.filter((d) => d.category === "food")],
  ].filter(([, list]) => list.length);
  const features = [
    {
      "@type": "LocationFeatureSpecification",
      name: "Happy hour",
      value: true,
      hoursAvailable: windows.map((w) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: w.days.map((d) => SCHEMA_DAYS[d]),
        opens: w.start,
        closes: w.end || "23:59",
      })),
    },
    v.amenities.patio && { "@type": "LocationFeatureSpecification", name: "Patio", value: true },
    v.amenities.liveMusic && { "@type": "LocationFeatureSpecification", name: "Live music", value: true },
    v.amenities.groups && { "@type": "LocationFeatureSpecification", name: "Good for groups", value: true },
  ].filter(Boolean);
  const city = cityHub(v);
  const area = areaHub(v);
  const kind = venueType(src.primary_type);
  const hours = openingHours(src.opening_hours?.periods);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: venueTitle(v).replace(` | ${SITE}`, ""),
        description: venueDescription(v),
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${url}#venue` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        primaryImageOfPage: image,
        ...(v.source ? { isBasedOn: v.source.url } : {}),
        ...(v.checked ? { dateModified: v.checked } : {}),
        inLanguage: "en-CA",
      },
      {
        "@type": kind.type,
        "@id": `${url}#venue`,
        name: v.name,
        ...(v.website ? { url: v.website, sameAs: [v.website] } : {}),
        image: v.photo ? [absPhoto(v.photo), image] : image,
        address: {
          "@type": "PostalAddress",
          streetAddress: street,
          addressLocality: v.city || "Vancouver",
          addressRegion: "BC",
          ...(src.address_components?.postal_code ? { postalCode: src.address_components.postal_code } : {}),
          addressCountry: "CA",
        },
        ...(v.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } } : {}),
        ...(v.area ? { containedInPlace: { "@type": "Place", name: `${v.area.name}, Vancouver`, ...(area ? { url: BASE + hubPath(area.slug) } : {}) } } : {}),
        ...(src.maps_url || src.place_id ? { hasMap: src.maps_url ?? `https://www.google.com/maps/place/?q=place_id:${src.place_id}` } : {}),
        ...(kind.cuisine ? { servesCuisine: kind.cuisine } : {}),
        ...(hours.length ? { openingHoursSpecification: hours } : {}),
        ...(src.reservable != null ? { acceptsReservations: src.reservable } : {}),
        ...(v.phone ? { telephone: v.phone } : {}),
        ...(PRICE_RANGE[src.price_level] ? { priceRange: PRICE_RANGE[src.price_level] } : {}),
        amenityFeature: features,
        ...(sections.length
          ? {
              hasMenu: {
                "@type": "Menu",
                name: `${v.name} happy hour menu`,
                hasMenuSection: sections.map(([name, list]) => ({ "@type": "MenuSection", name, hasMenuItem: list.map(menuItem) })),
              },
            }
          : {}),
      },
      breadcrumb(url, [...trail(city, area), { name: v.name }]),
      faqPage(url, venueFaq(v)),
      ...SITE_GRAPH,
    ],
  };
}

const SITE_GRAPH = [
  { "@type": "WebSite", "@id": WEBSITE_ID, url: `${BASE}/`, name: SITE, alternateName: ["alittlehang.com", "A Little Hang Vancouver Happy Hours"], description: `Directory of happy hour times and deals at ${venues.length} bars and restaurants in Vancouver and Metro Vancouver, BC.`, inLanguage: "en-CA", publisher: { "@id": ORG_ID } },
  { "@type": "Organization", "@id": ORG_ID, name: SITE, url: `${BASE}/`, logo: `${BASE}/icon-512.png`, description: "A Little Hang lists Vancouver happy hours: times, prices and deals taken from each venue's own menu and rechecked nightly.", email: "jason@setsail.ca", founder: [{ "@id": FOUNDER_ID }, { "@id": DESIGNER_ID }], areaServed: { "@type": "City", name: "Vancouver", containedInPlace: { "@type": "AdministrativeArea", name: "British Columbia" } } },
  { "@type": "Person", "@id": FOUNDER_ID, name: "Jason", jobTitle: "Founder", url: `${BASE}/about/#jason`, worksFor: [{ "@id": ORG_ID }, { "@type": "Organization", name: "Setsail Marketing", url: "https://setsail.ca/" }], spouse: { "@id": DESIGNER_ID } },
  { "@type": "Person", "@id": DESIGNER_ID, name: "Sofia Alvarenga", jobTitle: "Product designer", url: `${BASE}/about/#sofia`, worksFor: { "@id": ORG_ID }, spouse: { "@id": FOUNDER_ID } },
];

// ---------- static markup shared by venue pages ----------
// Shown before the app boots (and to crawlers / no-JS). Inline styles only:
// it must look right without the app's CSS classes.
const S = {
  wrap: "max-width:42rem;margin:0 auto;padding:24px 20px 64px;font-family:'Funnel Sans',system-ui,sans-serif;color:#f3efe4",
  eyebrow: "display:block;font-family:'Funnel Sans',system-ui,sans-serif;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#f7b2b7;margin-bottom:6px",
  h1: "font-family:'Funnel Display',system-ui,sans-serif;font-weight:800;font-size:34px;line-height:1.02;letter-spacing:-.025em;margin:16px 0 8px",
  h2: "font-family:'Funnel Display',system-ui,sans-serif;font-weight:700;font-size:20px;margin:28px 0 10px",
  h3: "font-size:15px;font-weight:600;margin:16px 0 4px",
  muted: "color:#a7a196;font-size:15px;margin:0",
  p: "color:#a7a196;font-size:15px;line-height:1.6;margin:0",
  row: "display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #3a3835;font-size:15px",
  link: "color:#ff4900;font-weight:600",
  plain: "color:#f3efe4",
  chip: "display:inline-block;margin:0 8px 8px 0;padding:8px 14px;border-radius:999px;background:#242322;color:#f3efe4;text-decoration:none;font-size:14px",
};

const crumbHtml = (items, style = S.muted) =>
  `<nav aria-label="Breadcrumb"><p style="${style}">${items
    .map((it, i) => (it.path && i < items.length - 1 ? `<a href="${it.path}" style="${i === 0 ? S.link : "color:#a7a196"}">${esc(i === 0 ? SITE : it.name)}</a>` : `<span>${esc(it.name)}</span>`))
    .join(" › ")}</p></nav>`;

const hubLabel = (slug) => {
  const p = placeBySlug.get(slug);
  if (p) return `Happy hours in ${p.name}`;
  return topics.find((t) => t.slug === slug)?.label ?? slug;
};

function dealRows(list) {
  return list
    .map((d) => `<div style="${S.row}"><span>${esc(d.name)}${d.description ? `<br><small style="color:#a7a196">${esc(d.description)}</small>` : ""}</span><span style="color:#f7b2b7;font-weight:700">${esc(d.price)}</span></div>`)
    .join("\n");
}

function venueBody(v) {
  const drinks = v.hh.deals.filter((d) => d.category === "drink");
  const food = v.hh.deals.filter((d) => d.category === "food");
  const city = cityHub(v);
  const area = areaHub(v);
  const near = nearby(v, venues);
  const hubs = v.hubs ?? [];
  const ranked = rankOf(v);
  // The photo matches the app's venue header (full width, same height) so
  // the page doesn't jump when the app takes over.
  return `<main style="max-width:42rem;margin:0 auto">
${v.photo ? `<img src="${esc(/^https?:/.test(v.photo) ? v.photo : `/${v.photo}`)}" alt="${esc(`${v.name}${v.area ? ` in ${v.area.name}` : v.city ? ` in ${v.city}` : ""}`)}" fetchpriority="high" style="display:block;width:100%;height:min(42vh,340px);object-fit:cover;background:#2f2d2b" />` : ""}
</main>
<main style="${S.wrap}">
${crumbHtml([...trail(city, area), { name: v.name }])}
<h1 style="${S.h1}"><span style="${S.eyebrow}">Happy hour${v.area ? ` · ${esc(v.area.name)}` : v.city ? ` · ${esc(v.city)}` : ""}</span> ${esc(v.name)}</h1>
<p style="${S.muted}">${esc(v.address)}</p>
<h2 style="${S.h2}">Happy hour deals</h2>
${
  v.hh.deals.length
    ? [drinks.length && `<h3 style="${S.h3}">Drinks</h3>\n${dealRows(drinks)}`, food.length && `<h3 style="${S.h3}">Food</h3>\n${dealRows(food)}`].filter(Boolean).join("\n")
    : `<p style="${S.muted}">This spot runs a happy hour but doesn't publish its deals online.${v.website ? ` <a href="${esc(v.website)}" rel="noopener" style="${S.link}">Check their menu</a>.` : ""}</p>`
}
${
  // Our own Hangout Score as plain text only: no Review/Rating markup, since
  // it's a computed score rather than reviews from people.
  v.score
    ? `<h2 style="${S.h2}">How this happy hour scores</h2>
<p><b>Hangout Score ${v.score.total.toFixed(1)} out of 10.</b> <span style="color:#a7a196">From the deals and times on this page; <a href="/about" style="${S.link}">how we score</a>.</span>${ranked ? ` Ranked #${ranked.rank} in <a href="${bestPath(ranked.list.slug)}" style="${S.link}">the best happy hours in ${esc(ranked.list.name)}</a>.` : ""}</p>
${[["Value", "value"], ["Selection", "selection"], ["Hours", "hours"], ["Vibe", "vibe"]]
  .map(([label, k]) => `<div style="${S.row}"><span>${label}<br><small style="color:#a7a196">${esc(v.score.notes[k])}</small></span><span>${v.score[k].toFixed(1)}</span></div>`)
  .join("\n")}`
    : ""
}
<h2 style="${S.h2}">Happy hour times</h2>
${dayRuns(v)
  .map((r) => `<div style="${S.row}"><span>${runLabel(r.days)}</span><span>${r.wins.length ? r.wins.map((w) => `${w.label ? `${esc(w.label)} ` : ""}${fmtRange(w.start, w.end)}`).join(" · ") : "None"}</span></div>`)
  .join("\n")}
<p style="${S.muted};margin-top:12px">${v.hh.verified ? "Verified against their menu" : "From their website"}${v.checked ? `, times checked ${esc(fmtDate(v.checked))}` : ""}.${v.source ? ` Source: <a href="${esc(v.source.url)}" rel="nofollow noopener" style="${S.plain}">${esc(sourceLabel(v))}</a>.` : ""}</p>
<h2 style="${S.h2}">About ${esc(v.name)}</h2>
<p style="${S.p}">${esc(venueAbout(v))}</p>
<h2 style="${S.h2}">Find us here</h2>
<p style="${S.p}">${esc(v.address)}${v.phone ? ` · <a href="tel:${esc(v.phone)}" style="${S.plain}">${esc(v.phone)}</a>` : ""}${v.website ? ` · <a href="${esc(v.website)}" rel="noopener" style="${S.plain}">Website</a>` : ""}</p>
${
  near.length
    ? `<h2 style="${S.h2}">Happy hours nearby</h2>\n${near.map((o) => `<div style="${S.row}"><a href="/spots/${o.id}.html" style="${S.plain}">${esc(o.name)}</a><span style="color:#a7a196">${fmtRange(o.hh.start, o.hh.end || "23:59")}</span></div>`).join("\n")}`
    : ""
}
${hubs.length || ranked ? `<nav aria-label="More happy hours" style="margin-top:24px">${ranked ? `<a href="${bestPath(ranked.list.slug)}" style="${S.chip}">#${ranked.rank} of the best in ${esc(ranked.list.name)}</a>` : ""}${hubs.map((p) => `<a href="${p}" style="${S.chip}">${esc(hubLabel(p.split("/").filter(Boolean).pop()))}</a>`).join("")}</nav>` : ""}
<h2 style="${S.h2}">${esc(v.name)} happy hour questions</h2>
${venueFaq(v)
  .map((f) => `<h3 style="${S.h3}">${esc(f.q)}</h3>\n<p style="${S.p}">${esc(f.a)}</p>`)
  .join("\n")}
</main>`;
}
// ---------- share cards ----------
const FONT_DISPLAY = resolve(here, "fonts/FunnelDisplay-ExtraBold.ttf");
const FONT_SANS = resolve(here, "fonts/FunnelSans-Medium.ttf");
// Text is drawn as glyph outlines (opentype.js) rather than through
// libvips/pango, which picks fonts via fontconfig and fell back to DejaVu
// on the CI runner.
const faces = { display: opentype.loadSync(FONT_DISPLAY), sans: opentype.loadSync(FONT_SANS) };

// Word-wrapped text as a transparent PNG, `width` wide at most.
async function text(str, font, size, color, width) {
  const lines = [];
  for (const word of str.split(/\s+/)) {
    const tryLine = lines.length ? `${lines[lines.length - 1]} ${word}` : word;
    if (lines.length && font.getAdvanceWidth(tryLine, size) <= width) lines[lines.length - 1] = tryLine;
    else lines.push(word);
  }
  const scale = size / font.unitsPerEm;
  const ascent = font.ascender * scale, descent = -font.descender * scale, lh = size * 1.08;
  const h = Math.ceil(ascent + descent + lh * (lines.length - 1));
  const paths = lines.map((l, i) => font.getPath(l, 0, ascent + i * lh, size).toPathData(2)).join(" ");
  const w = Math.ceil(Math.max(...lines.map((l) => font.getAdvanceWidth(l, size)))) + 2;
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${paths}" fill="${color}"/></svg>`)).png().toBuffer();
}

const localPhoto = (v) => (v.photo && !/^https?:/.test(v.photo) && existsSync(resolve(web, "public", v.photo)) ? resolve(web, "public", v.photo) : null);

function shareCard(v) {
  return renderCard({ id: v.id, title: v.name, line: `Happy hour · ${summary(v) || "Happy hour times on the page"}`, photo: localPhoto(v) });
}

// 1200×630 card: photo (or brand gradient), logo top right, title and one
// lime line at the bottom. Cached by content in node_modules/.cache/og.
async function renderCard({ id, title, line, photo }) {
  const key = createHash("sha1").update(JSON.stringify([title, line, photo ? readFileSync(photo).length : 0, 5])).digest("hex").slice(0, 10);
  const cached = resolve(cache, `${id}-${key}.jpg`);
  if (existsSync(cached)) return cached;

  const W = 1200, H = 630;
  const bg = photo
    ? await sharp(photo).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.9 }).toBuffer()
    : await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4900"/><stop offset="1" stop-color="#751927"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)).png().toBuffer();
  const shade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b1b" stop-opacity=".15"/><stop offset=".45" stop-color="#1b1b1b" stop-opacity=".55"/><stop offset="1" stop-color="#1b1b1b" stop-opacity=".97"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#s)"/></svg>`);
  const mark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 124" width="150" height="143"><path d="${logo}" fill="#f3efe4"/></svg>`);
  const nameSize = title.length > 34 ? 60 : title.length > 22 ? 72 : 84;
  const name = await text(title, faces.display, nameSize, "#f3efe4", 900);
  const times = await text(line, faces.sans, 34, "#ecfe54", 900);
  const nameH = (await sharp(name).metadata()).height;
  const timesH = (await sharp(times).metadata()).height;
  await sharp(bg)
    .composite([
      { input: shade },
      { input: mark, top: 48, left: W - 150 - 56 },
      { input: name, left: 64, top: H - 64 - timesH - 18 - nameH },
      { input: times, left: 64, top: H - 64 - timesH },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(cached);
  return cached;
}

// ---------- hub pages ----------
// Static pages, no app: a list of venues plus links to related hubs. They
// carry their own small stylesheet (hub.css) in the brand's colours and
// fonts, light or dark with the system setting.
const font = (re) => fontFiles.find((f) => re.test(f));
const HUB_CSS = `@font-face{font-family:"Funnel Display";font-weight:800;font-display:swap;src:url(/assets/${font(/^funnel-display-latin-800-/)}) format("woff2")}
@font-face{font-family:"Funnel Display";font-weight:700;font-display:swap;src:url(/assets/${font(/^funnel-display-latin-700-/)}) format("woff2")}
@font-face{font-family:"Funnel Sans";font-weight:400;font-display:swap;src:url(/assets/${font(/^funnel-sans-latin-400-/)}) format("woff2")}
@font-face{font-family:"Funnel Sans";font-weight:600;font-display:swap;src:url(/assets/${font(/^funnel-sans-latin-600-/)}) format("woff2")}
:root{--ink:#1b1b1b;--ink-2:#242322;--ink-3:#2f2d2b;--line:#3a3835;--cream:#f3efe4;--dim:#a7a196;--orange:#ff4900;--pink:#f7b2b7;--lime:#ecfe54;color-scheme:dark}
@media (prefers-color-scheme:light){:root{--ink:#f5f1e7;--ink-2:#fffdf7;--ink-3:#ebe5d6;--line:#ddd5c4;--cream:#1b1b1b;--dim:#6b6559;--orange:#c23700;--pink:#a8384b;--lime:#5f6e00;color-scheme:light}}
*{box-sizing:border-box}
body{margin:0;background:var(--ink);color:var(--cream);font:16px/1.55 "Funnel Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}
.top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px max(20px,env(safe-area-inset-right)) 12px max(20px,env(safe-area-inset-left));background:color-mix(in srgb,var(--ink) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font:800 18px/1 "Funnel Display",system-ui,sans-serif;letter-spacing:-.02em}
.brand svg{width:46px;height:44px;fill:var(--orange)}
.cta{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border-radius:999px;background:var(--orange);color:#1b1b1b;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap}
@media (prefers-color-scheme:light){.cta{color:#fff}}
main{max-width:46rem;margin:0 auto;padding:20px max(20px,env(safe-area-inset-right)) 72px max(20px,env(safe-area-inset-left))}
.crumbs{font-size:14px;color:var(--dim);margin:4px 0 0}
.crumbs a{color:var(--dim)}
h1{font:800 clamp(32px,7vw,44px)/1.02 "Funnel Display",system-ui,sans-serif;letter-spacing:-.025em;margin:14px 0 12px;text-wrap:balance}
h2{font:700 21px/1.2 "Funnel Display",system-ui,sans-serif;letter-spacing:-.01em;margin:40px 0 12px}
h3{font-size:16px;font-weight:600;margin:0}
.lede{font-size:17px;max-width:62ch;margin:0}
.meta{color:var(--dim);font-size:14px;margin:10px 0 0}
.cards{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.card{display:flex;gap:14px;align-items:center;padding:10px;border-radius:20px;background:var(--ink-2);text-decoration:none;outline-offset:2px}
.card:hover{background:var(--ink-3)}
.card img,.card .ph{flex:none;width:84px;height:84px;border-radius:14px;object-fit:cover;background:var(--ink-3)}
.card .ph{display:grid;place-items:center;font:800 28px "Funnel Display",sans-serif;color:var(--orange)}
.card div{min-width:0}
.when{margin:3px 0 0;font-size:14px;font-weight:600;color:var(--lime);font-variant-numeric:tabular-nums}
.deals{margin:2px 0 0;font-size:14px;color:var(--pink)}
.where{margin:2px 0 0;font-size:13px;color:var(--dim)}
.chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.chips a{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;background:var(--ink-2);text-decoration:none;font-size:14px}
.chips small{color:var(--dim)}
.best{list-style:none;padding:0;margin:0;border-radius:20px;background:var(--ink-2);padding:0 16px}
.best li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:15px}
.best li:last-child{border:0}
.best b{color:var(--pink);font-variant-numeric:tabular-nums;white-space:nowrap}
.faq h3{margin-top:20px}
.faq p{margin:4px 0 0;color:var(--dim);max-width:62ch}
footer{border-top:1px solid var(--line);margin-top:56px;padding-top:24px;font-size:14px;color:var(--dim)}
footer .chips a{background:transparent;border:1px solid var(--line);min-height:36px}
a:focus-visible{outline:2px solid var(--orange)}
.bestlink{display:flex;align-items:center;gap:12px;margin:18px 0 0;padding:14px 16px;border-radius:20px;background:var(--ink-2);text-decoration:none;font-weight:600}
.bestlink:hover{background:var(--ink-3)}
.bestlink .tag{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--lime);color:var(--ink);font:800 15px "Funnel Display",sans-serif}
.bestlink small{display:block;font-weight:400;color:var(--dim);font-size:13px}
.lede+.lede{margin-top:12px}
.byline{margin:0 0 14px;font-size:14px;color:var(--dim)}
.glance{margin:24px 0 0;padding:16px 18px;border-radius:20px;background:var(--ink-2)}
.glance h2{margin:0 0 8px;font-size:17px}
.glance ol{margin:0;padding-left:22px;columns:2 14rem;column-gap:24px}
.glance li{margin:3px 0;break-inside:avoid;font-size:15px}
.glance li b{color:var(--dim);font-weight:600;font-variant-numeric:tabular-nums;margin-left:4px}
.bestmap{position:relative;height:min(62vh,420px);margin:16px 0 0;border-radius:24px;overflow:hidden;background:var(--ink-2);display:grid;place-items:center;color:var(--dim);font-size:14px}
.bestmap.ready{display:block}
.bestmap.ready>p{display:none}
.pin{width:30px;height:30px;padding:0;border:0;border-radius:999px;background:none;cursor:pointer}
.pin span{display:flex;align-items:center;justify-content:center;width:30px;height:30px;box-sizing:border-box;border:2px solid var(--ink);border-radius:999px;background:var(--cream);color:var(--ink);font:800 14px/1 "Funnel Display",sans-serif;box-shadow:0 4px 14px rgb(0 0 0/.35);transition:transform .2s}
.pin.top span{background:var(--lime)}
.pin.on span,.pin:hover span{transform:scale(1.2);background:var(--orange);color:#1b1b1b}
.bestmap .maplibregl-popup{z-index:200}
.bestmap .maplibregl-popup-content{background:var(--ink-2);color:var(--cream);border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgb(0 0 0/.35);font:14px/1.4 "Funnel Sans",system-ui,sans-serif}
.bestmap .maplibregl-popup-tip{display:none}
.bestmap .maplibregl-popup-close-button{color:var(--dim);font-size:18px;width:28px;height:28px}
.bestmap .maplibregl-popup-content h3{margin:2px 0;font:700 16px/1.2 "Funnel Display",sans-serif;padding-right:16px}
.pop-n{margin:0;font-size:12px;font-weight:600;color:var(--lime)}
.pop-when{margin:0;color:var(--dim);font-size:13px}
.pop-links{display:flex;gap:14px;margin:6px 0 0}
.pop-links a{color:var(--orange);font-weight:600}
.entry{margin:44px 0 0;scroll-margin-top:80px}
.entry header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;column-gap:14px;align-items:center}
.entry h2{margin:0;line-height:1.15}
.entry h2 a{text-decoration:none}
.entry h2 a:hover{text-decoration:underline}
.entry .num{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:var(--ink-3);font:800 18px/1 "Funnel Display",sans-serif;font-variant-numeric:tabular-nums;text-box:trim-both cap alphabetic}
.entry .num.top{background:var(--orange);color:#1b1b1b}
.entry .sc{display:flex;align-items:baseline;gap:3px;padding:9px 12px;border-radius:14px;background:var(--ink-3);font:800 22px/1 "Funnel Display",sans-serif;font-variant-numeric:tabular-nums;white-space:nowrap}
.entry .sc.top{background:var(--lime);color:var(--ink)}
.entry .sc small{font:600 12px/1 "Funnel Sans",sans-serif}
.entry .where{margin:4px 0 0;font-size:14px;color:var(--dim)}
.entry img{display:block;width:100%;height:auto;aspect-ratio:2/1;object-fit:cover;border-radius:20px;margin:14px 0 0;background:var(--ink-3)}
.entry>p:not(.where):not(.parts){font-size:17px;max-width:62ch;margin:14px 0 0}
.parts{margin:8px 0 0;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums}
.more{display:inline-flex;align-items:center;min-height:44px;color:var(--orange);font-weight:600;font-size:15px}
.method{margin:0;padding-left:20px;max-width:62ch}
.method li{margin:4px 0}
.open{display:inline-flex;align-items:center;min-height:44px;margin-top:16px;padding:0 18px;border-radius:999px;background:var(--ink-2);text-decoration:none;font-weight:600;font-size:14px}
`;
write("hub.css", HUB_CSS);
const cssHash = createHash("sha1").update(HUB_CSS).digest("hex").slice(0, 8);

const logoSvg = `<svg viewBox="0 0 130 124" aria-hidden="true"><path d="${logo}"/></svg>`;

function hubDoc({ path, title, description, jsonld, body, robots, image, script }) {
  const url = BASE + path;
  return `<!doctype html>
<html lang="en-CA">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark light" />
    <meta name="theme-color" content="#1b1b1b" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f5f1e7" media="(prefers-color-scheme: light)" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="${robots ?? "index,follow,max-image-preview:large"}" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="preload" href="/assets/${font(/^funnel-display-latin-800-/)}" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/hub.css?v=${cssHash}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE}" />
    <meta property="og:title" content="${esc(title.replace(` | ${SITE}`, ""))}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${esc(image.url)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(image.alt)}" />
    <meta property="og:locale" content="en_CA" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image:alt" content="${esc(image.alt)}" />
    ${ldScript(jsonld)}
  </head>
  <body>
    <header class="top"><a class="brand" href="/" aria-label="${SITE} home">${logoSvg}</a><a class="cta" href="/">Happening now</a></header>
    <main>
${body}
${footerHtml()}
    </main>
${script ? `    <script type="module" src="${script}"></script>\n` : ""}  </body>
</html>
`;
}

function footerHtml() {
  const cities = places.filter((p) => p.kind === "city");
  return `<footer>
<ul class="chips">${cities.map((c) => `<li><a href="${hubPath(c.slug)}">${esc(c.name)}</a></li>`).join("")}${bestBySlug.has("metro") ? `<li><a href="${bestPath("metro")}">Best happy hours, ranked</a></li>` : ""}<li><a href="/spots/">All spots A–Z</a></li><li><a href="/about/">About</a></li></ul>
<p>Times and deals come from each venue's own menu and are re-checked every night. Something wrong? Tell us from the venue's page.</p>
</footer>`;
}

const titleCase = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
const fitTitle = (...options) => options.find((t) => t.length <= 60) ?? options[options.length - 1];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// The deal that earns a venue its place on a deal hub ("$3 oysters").
function matchingDeal(v, topic) {
  if (!topic || topic.kind !== "deal") return null;
  const hits = v.hh.deals.filter((d) => !isNonAlc(d) && topic.test({ ...v, hh: { ...v.hh, deals: [d] } }));
  return hits.map((d) => ({ d, p: parsePrice(d.price) })).sort((a, b) => (a.p?.low ?? 1e9) - (b.p?.low ?? 1e9))[0]?.d ?? null;
}

function sortFor(list, topic) {
  const score = { high: 0, medium: 1, low: 2 };
  return [...list].sort((a, b) => {
    if (topic?.kind === "deal") {
      const pa = parsePrice(matchingDeal(a, topic)?.price ?? "")?.low ?? 1e9;
      const pb = parsePrice(matchingDeal(b, topic)?.price ?? "")?.low ?? 1e9;
      if (pa !== pb) return pa - pb;
    }
    return (score[a.confidence] ?? 1) - (score[b.confidence] ?? 1) || b.hh.deals.length - a.hh.deals.length || a.name.localeCompare(b.name);
  });
}

// "Gastown, Vancouver", "Downtown Vancouver", "Burnaby"
const whereLabel = (v) => (v.area ? (v.area.name.includes(v.city) ? v.area.name : `${v.area.name}, ${v.city}`) : (v.city ?? ""));

const dayIndex = (topic) => (topic?.kind === "day" && topic.slug !== "weekend" ? SCHEMA_DAYS.findIndex((d) => d.toLowerCase() === topic.slug) : -1);

function card(v, topic) {
  const d = dayIndex(topic);
  const when =
    d >= 0
      ? [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra]
          .filter((w) => w.start && w.days.includes(d))
          .map((w) => fmtRange(w.start, w.end || "23:59"))
          .join(" & ")
      : summary(v);
  const hit = matchingDeal(v, topic);
  const deals = hit ? [hit, ...topDeals(v, 2).filter((x) => x !== hit)].slice(0, 2) : topDeals(v, 2);
  const img = v.photo
    ? `<img src="${esc(/^https?:/.test(v.photo) ? v.photo : `/${v.photo}`)}" alt="" loading="lazy" width="84" height="84" />`
    : `<span class="ph" aria-hidden="true">${esc(v.name[0])}</span>`;
  return `<li><a class="card" href="/spots/${v.id}.html">${img}<div><h3>${esc(v.name)}</h3><p class="when">${esc(d >= 0 ? `${SCHEMA_DAYS[d]} ${when}` : when)}</p>${
    deals.length ? `<p class="deals">${esc(deals.map(dealPhrase).join(" · "))}</p>` : ""
  }<p class="where">${esc(whereLabel(v))}</p></div></a></li>`;
}

// Cheapest priced deal per kind among a list of venues.
const BEST = [
  ["Pint or beer", topics.find((t) => t.slug === "beer")],
  ["Glass of wine", topics.find((t) => t.slug === "wine")],
  ["Cocktail", topics.find((t) => t.slug === "cocktails")],
  ["Oysters", topics.find((t) => t.slug === "oysters")],
  ["Wings", topics.find((t) => t.slug === "wings")],
  ["Tacos", topics.find((t) => t.slug === "tacos")],
].filter(([, t]) => t);
function bestDeals(list) {
  const out = [];
  for (const [label, t] of BEST) {
    let best = null;
    for (const v of list) {
      const d = matchingDeal(v, t);
      const p = d && parsePrice(d.price);
      if (p && p.low > 0 && (!best || p.low < best.p.low)) best = { v, d, p };
    }
    if (best) out.push({ label, ...best });
  }
  return out;
}

function hubFaq(list, where) {
  const qs = [];
  const drink = bestDeals(list).find((b) => ["Pint or beer", "Glass of wine", "Cocktail"].includes(b.label));
  if (drink) qs.push({ q: `What's the cheapest happy hour drink ${where.in}?`, a: `${dealPhrase(drink.d)} at ${drink.v.name}, from the prices on each venue's own menu.` });
  const sunday = list.filter((v) => [{ days: v.hh.days }, ...v.hh.extra].some((w) => w.days?.includes(0)));
  qs.push({
    q: `Which happy hours ${where.in} run on Sunday?`,
    a: sunday.length ? `${sunday.length} of the ${list.length} spots here, including ${sunday.slice(0, 4).map((v) => v.name).join(", ")}.` : "None of the spots on this page run a Sunday happy hour.",
  });
  const late = list.filter((v) => [{ start: v.hh.start }, ...v.hh.extra].some((w) => w.start >= "20:00"));
  qs.push({
    q: `Is there a late-night happy hour ${where.in}?`,
    a: late.length ? `Yes, ${late.length === 1 ? "one spot runs one" : `${late.length} spots run one`}: ${late.slice(0, 4).map((v) => v.name).join(", ")}${late.length > 4 ? " and more" : ""}.` : "Not on this list. Every happy hour here finishes by the evening.",
  });
  qs.push({ q: `How do you check these happy hour times?`, a: "We read each venue's own website and menu, and re-check them every night. Each spot's page shows when its times were last confirmed." });
  return qs;
}

// Average point of a place's venues, for "nearby neighbourhoods".
const centre = (list) => ({ lat: list.reduce((s, v) => s + v.lat, 0) / list.length, lng: list.reduce((s, v) => s + v.lng, 0) / list.length });
const dist2 = (a, b) => (a.lat - b.lat) ** 2 + ((a.lng - b.lng) * 0.65) ** 2;

async function hubPage({ slug, h1, listTitle, where, title, description, list, topic, crumbs, intro, related, best: bestList }) {
  const path = hubPath(slug);
  const url = BASE + path;
  const sorted = sortFor(list, topic);
  const updated = newest(list);
  const best = bestDeals(list);
  const faq = hubFaq(list, where);
  // Share card: the hub's first venue with a photo, its count and two cheapest deals.
  const cardFile = `hub-${slug.replace(/\//g, "--")}`;
  const own = (x) => topic && x.label.toLowerCase() === topic.short.toLowerCase();
  const top = [...best].sort((x, y) => own(y) - own(x)).slice(0, 2).map((b) => `${SHORT_LABEL[b.label] ?? b.label.toLowerCase()} from ${money(b.p.low)}`);
  const cover = sorted.map(localPhoto).find(Boolean) ?? null;
  copyFileSync(await renderCard({ id: cardFile, title: h1, line: [`${sorted.length} spots`, ...top].join(" · "), photo: cover }), resolve(dist, "og", `${cardFile}.jpg`));
  const image = { url: `${BASE}/og/${cardFile}.jpg`, alt: `${h1}: ${sorted.length} spots${top.length ? `, ${top.join(", ")}` : ""}` };
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      ...SITE_GRAPH,
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: h1,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": `${url}#list` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...(updated ? { dateModified: updated } : {}),
        inLanguage: "en-CA",
        primaryImageOfPage: { "@type": "ImageObject", url: image.url, width: 1200, height: 630 },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: h1,
        numberOfItems: sorted.length,
        itemListElement: sorted.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/spots/${v.id}.html`, name: v.name })),
      },
      breadcrumb(url, crumbs),
      faqPage(url, faq),
    ],
  };
  const body = `<nav class="crumbs" aria-label="Breadcrumb">${crumbs
    .map((c, i) => (i < crumbs.length - 1 ? `<a href="${c.path}">${esc(i === 0 ? SITE : c.name)}</a>` : `<span>${esc(c.name)}</span>`))
    .join(" › ")}</nav>
<h1>${esc(h1)}</h1>
<p class="lede">${esc(intro)}</p>
<p class="meta">${sorted.length} spots${updated ? ` · updated ${esc(fmtDate(updated))}` : ""}</p>
${bestList ? `<a class="bestlink" href="${bestPath(bestList.slug)}"><span class="tag">#1</span><span>The ${bestList.venues.length} best happy hours in ${esc(bestList.name)}<small>Ranked by Hangout Score · #1 is ${esc(bestList.venues[0].name)}</small></span></a>` : ""}
<h2>${esc(listTitle)}</h2>
<ul class="cards">
${sorted.map((v) => card(v, topic)).join("\n")}
</ul>
${
  best.length
    ? `<h2>Best happy hour deals ${esc(where.in)}</h2>
<ul class="best">${best.map((b) => `<li><span>${esc(b.label)} · <a href="/spots/${b.v.id}.html">${esc(b.v.name)}</a></span><b>${esc(dealPhrase(b.d))}</b></li>`).join("")}</ul>`
    : ""
}
${related
  .filter((r) => r.links.length)
  .map((r) => `<h2>${esc(r.title)}</h2>\n<ul class="chips">${r.links.map((l) => `<li><a href="${l.path}">${esc(l.label)}${l.count ? ` <small>${l.count}</small>` : ""}</a></li>`).join("")}</ul>`)
  .join("\n")}
<h2>Questions about happy hours ${esc(where.in)}</h2>
<div class="faq">${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</div>`;
  write(`happy-hour/${slug}/index.html`, hubDoc({ path, title, description, jsonld, body, image }));
  sitemapDates.set(path, updated);
  return path;
}

const SHORT_LABEL = { "Pint or beer": "beer", "Glass of wine": "wine", Cocktail: "cocktails" };
function describe(where, list, topic) {
  // A deal hub leads with its own deal ("oysters from $1.50").
  const best = bestDeals(list).sort((a, b) => (topic && b.label.toLowerCase() === topic.short.toLowerCase()) - (topic && a.label.toLowerCase() === topic.short.toLowerCase()));
  const top = best.slice(0, 2).map((b) => `${SHORT_LABEL[b.label] ?? b.label.toLowerCase()} from ${money(b.p.low)}`);
  const updated = newest(list);
  const text = `Every happy hour ${where.in} in one list: ${list.length} spots with times and real prices from each menu.${top.length ? ` ${cap(top.join(", "))}.` : ""}${updated ? ` Updated ${fmtDate(updated)}.` : ""}`;
  return text.length <= 160 ? text : text.replace(/ Updated .*$/, "");
}

function placeIntro(p, list) {
  const every = list.filter((v) => v.hh.days.length === 7).length;
  const patio = list.filter((v) => v.amenities.patio).length;
  const drink = bestDeals(list).find((b) => b.label !== "Oysters" && b.label !== "Wings" && b.label !== "Tacos");
  return `${list.length} bars and restaurants in ${p.name} run a happy hour. ${every ? `${every} of them go every day` : "Most run on weekdays"}${patio ? `, ${patio} have a patio` : ""}${drink ? `, and the cheapest drink deal is ${dealPhrase(drink.d)} at ${drink.v.name}` : ""}. Times and prices come from each venue's own menu.`;
}

function topicIntro(t, list, placeLabel) {
  const where = placeLabel ?? "Metro Vancouver";
  if (t.kind === "deal") {
    const cheapest = sortFor(list, t)[0];
    const d = cheapest && matchingDeal(cheapest, t);
    return `${list.length} ${where} spots put ${t.short.toLowerCase()} on their happy hour menu.${d ? ` The cheapest is ${dealPhrase(d)} at ${cheapest.name}.` : ""} Sorted by price, with times from each venue's own menu.`;
  }
  if (t.kind === "day") {
    const d = dayIndex(t);
    const starts = list
      .flatMap((v) => [{ days: v.hh.days, start: v.hh.start }, ...v.hh.extra].filter((w) => w.start && (d < 0 ? w.days.includes(0) || w.days.includes(6) : w.days.includes(d))).map((w) => Number(w.start.slice(0, 2))))
      .sort((a, b) => a - b);
    const mid = starts[Math.floor(starts.length / 2)];
    return `${list.length} ${where} spots run a happy hour on ${d >= 0 ? `${SCHEMA_DAYS[d]}s` : "weekends"}${mid != null ? `; most start around ${mid % 12 || 12}${mid >= 12 ? "pm" : "am"}` : ""}. Each listing shows that day's times and the best deals.`;
  }
  if (t.slug === "late-night") return `${list.length} ${where} spots run a late-night happy hour starting at 8pm or later, for after dinner or after the show.`;
  if (t.slug === "patio") return `${list.length} ${where} spots with a patio run a happy hour, so you can take the deals outside when the weather's on your side.`;
  if (t.slug === "live-music") return `${list.length} ${where} spots pair their happy hour with live music on at least some nights. Check each venue for the schedule.`;
  return `${list.length} ${where} spots match.`;
}

const combosFor = (pred) => combos.filter(pred).map((c) => ({ path: hubPath(c.slug), label: c.topic.label.replace(/ happy hours$/, "").replace(/^Happy hours with /, ""), count: c.venues.length }));
const topicLinks = (except) => topics.filter((t) => t.slug !== except).map((t) => ({ path: hubPath(t.slug), label: t.short, count: t.venues.length }));

mkdirSync(resolve(dist, "og"), { recursive: true });
let hubCount = 0;
const vancouver = places.find((p) => p.slug === "vancouver");
for (const p of places) {
  const isArea = p.kind === "area";
  const where = { in: `in ${p.name}` };
  const crumbs = isArea ? [...trail(vancouver, null), { name: p.name }] : [{ name: "Happy hours", path: "/" }, { name: p.name }];
  const others = places.filter((o) => o.kind === p.kind && o.slug !== p.slug);
  const here = centre(p.venues);
  const nearbyPlaces = others.sort((a, b) => dist2(centre(a.venues), here) - dist2(centre(b.venues), here)).slice(0, isArea ? 5 : 6);
  const areasHere = p.slug === "vancouver" ? places.filter((o) => o.kind === "area") : [];
  await hubPage({
    slug: p.slug,
    h1: `Happy hours in ${p.name}`,
    listTitle: `All ${p.venues.length} ${p.name} happy hours`,
    where,
    title: fitTitle(`${p.name} Happy Hours: ${p.venues.length} Spots, Times & Deals | ${SITE}`, `${p.name} Happy Hours: ${p.venues.length} Spots | ${SITE}`, `${p.name} Happy Hours: ${p.venues.length} Spots`),
    description: describe(where, p.venues),
    list: p.venues,
    crumbs,
    intro: placeIntro(p, p.venues),
    best: bestBySlug.get(p.slug),
    related: [
      { title: "Vancouver neighbourhoods", links: areasHere.map((a) => ({ path: hubPath(a.slug), label: a.name, count: a.venues.length })) },
      { title: `More ways to browse ${p.name}`, links: combosFor((c) => c.place.slug === p.slug) },
      { title: isArea ? "Nearby neighbourhoods" : "Nearby cities", links: nearbyPlaces.map((o) => ({ path: hubPath(o.slug), label: o.name, count: o.venues.length })) },
      { title: "Happy hours by day and deal", links: topicLinks() },
    ],
  });
  hubCount++;
}

for (const t of topics) {
  const where = { in: t.kind === "deal" ? `for ${t.short.toLowerCase()} in Metro Vancouver` : t.kind === "day" ? `on ${t.slug === "weekend" ? "weekends" : SCHEMA_DAYS[dayIndex(t)] + "s"} in Metro Vancouver` : `in Metro Vancouver (${t.short.toLowerCase()})` };
  // Topic hubs cover every city; "Vancouver" is the city hub's combos.
  const label = `${t.label} in Metro Vancouver`;
  await hubPage({
    slug: t.slug,
    h1: label,
    listTitle: `All ${t.venues.length} ${t.label.toLowerCase().replace(/^happy hours with/, "spots with")}`,
    where,
    title: fitTitle(`${titleCase(t.label)} in Metro Vancouver: ${t.venues.length} Spots | ${SITE}`, `${titleCase(t.label)} in Metro Vancouver | ${SITE}`, `${titleCase(t.label)} in Metro Vancouver`),
    description: describe(where, t.venues, t),
    list: t.venues,
    topic: t,
    crumbs: [{ name: "Happy hours", path: "/" }, { name: cap(t.label) }],
    intro: topicIntro(t, t.venues),
    related: [
      { title: `${t.short} by neighbourhood and city`, links: combos.filter((c) => c.topic.slug === t.slug).map((c) => ({ path: hubPath(c.slug), label: c.place.name, count: c.venues.length })) },
      { title: "More ways to browse", links: topicLinks(t.slug) },
    ],
  });
  hubCount++;
}

for (const c of combos) {
  const { place: p, topic: t } = c;
  const where = { in: `in ${p.name}` };
  const h1 = `${t.label} in ${p.name}`;
  const crumbs = [...(p.kind === "area" ? trail(vancouver, null) : [{ name: "Happy hours", path: "/" }]), { name: p.name, path: hubPath(p.slug) }, { name: cap(t.label.replace(/ happy hours$/, "").replace(/^Happy hours with /, "")) }];
  await hubPage({
    slug: c.slug,
    h1,
    listTitle: `All ${c.venues.length} ${t.label.toLowerCase().replace(/^happy hours with/, "spots with")} in ${p.name}`,
    where,
    title: fitTitle(`${titleCase(t.label)} in ${p.name}: ${c.venues.length} Spots | ${SITE}`, `${titleCase(t.label)} in ${p.name} | ${SITE}`, `${titleCase(t.label)} in ${p.name}`),
    description: describe({ in: `${t.kind === "deal" ? `for ${t.short.toLowerCase()} ` : ""}in ${p.name}` }, c.venues, t),
    list: c.venues,
    topic: t,
    crumbs,
    intro: topicIntro(t, c.venues, p.name),
    related: [
      { title: `All happy hours in ${p.name}`, links: [{ path: hubPath(p.slug), label: p.name, count: p.venues.length }] },
      { title: `More in ${p.name}`, links: combosFor((o) => o.place.slug === p.slug && o.slug !== c.slug) },
      { title: `${t.short} elsewhere`, links: [{ path: hubPath(t.slug), label: `All of Metro Vancouver`, count: t.venues.length }, ...combos.filter((o) => o.topic.slug === t.slug && o.slug !== c.slug).map((o) => ({ path: hubPath(o.slug), label: o.place.name, count: o.venues.length }))] },
    ],
  });
  hubCount++;
}

// ---------- best-of pages ----------
// The map script (src/best-map.ts, a fixed-name Vite entry), versioned by content.
const bestMapFile = resolve(dist, "assets/best-map.js");
const BEST_MAP_JS = existsSync(bestMapFile) ? `/assets/best-map.js?v=${createHash("sha1").update(readFileSync(bestMapFile)).digest("hex").slice(0, 8)}` : null;
// When the best-of lists first went up, for the article's datePublished.
const BEST_PUBLISHED = "2026-10-23";
// "Best happy hours in Gastown (2026)": the place's top Hangout Scores, with
// the method on the page. The score stays plain text and a ranked ItemList:
// no Review or AggregateRating markup, since it's our computed score and
// not reviews from people (see scripts/hang-score.mjs).
const PART_LABELS = [["Value", "value"], ["Selection", "selection"], ["Hours", "hours"], ["Vibe", "vibe"]];
const pct = (k) => `${Math.round(WEIGHTS[k] * 100)}%`;
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1);
// A score note's value line, minus "priced around or above the Vancouver
// norm" where the sentence is praising the spot.
const valueLine = (n) => lowerFirst(/around or above/.test(n.value) ? n.value.split(", ")[0] : n.value);

// One short write-up per ranked spot, built only from what we publish
// about it: its score and the part it's strongest on, its cheapest deals,
// its times, and patio / transit / music facts. Nothing is made up.
const PART_LEADS = {
  // The note's "priced around or above the norm" would contradict "strongest", so keep its first half then.
  value: (n, s) => `Value is its strongest part (${s.value.toFixed(1)}): ${valueLine(n)}.`,
  selection: (n) => `Its strength is choice, with ${n.selection}.`,
  hours: (n) => `It earns its place on time: ${n.hours}.`,
  vibe: (n) => `The setting lifts it: ${n.vibe.split(" · ").join(", ").toLowerCase()}.`,
};
const partWord = { value: "value", selection: "selection", hours: "hours", vibe: "vibe" };
// Two cheapest drinks and the cheapest food, skipping add-ons and extras.
const ADD_ON = /add[- ]?on|\bextra\b|\bupgrade\b|side of|\bcombo\b|\bshots?\b/i;
function standouts(v) {
  const ok = topDeals({ ...v, hh: { ...v.hh, deals: v.hh.deals.filter((d) => !isNonAlc(d) && !ADD_ON.test(`${d.name} ${d.description}`)) } }, 12);
  return [...ok.filter((d) => d.category === "drink").slice(0, 2), ...ok.filter((d) => d.category === "food").slice(0, 1)];
}

// What sets a spot apart from the others on this list, from the data: the
// list's cheapest drink, most deals, most hours, or a feature few others
// have. The same spot reads differently on each list it's on.
function listFacts(v, b, first) {
  const list = b.venues;
  const facts = [];
  const cheap = (x) => cheapestDrink(x)?.p ?? Infinity;
  const c = cheapestDrink(v);
  if (c && list.every((o) => o === v || cheap(o) > c.p)) facts.push({ deal: c.d, text: `Its ${dealPhrase(c.d)} is the cheapest drink on this list.` });
  const hrs = (x) => hoursFacts(x).minutes;
  const h = hrs(v);
  if (first !== "hours" && list.every((o) => o === v || hrs(o) < h)) facts.push({ text: `No spot on this list runs a longer happy hour: ${Math.round(h / 60)} hours a week.` });
  const nd = v.hh.deals.length;
  if (first !== "selection" && list.every((o) => o === v || o.hh.deals.length < nd)) facts.push({ text: `With ${nd} deals, it has the most choice of the ${list.length}.` });
  const few = (test, what, amenity) => {
    if (!test(v)) return;
    const k = list.filter(test).length;
    if (k === 1) facts.push({ amenity, text: `It's the only one here with ${what}.` });
    else if (k === 2) facts.push({ amenity, text: `It's one of just two on this list with ${what}.` });
  };
  few((x) => hoursFacts(x).late, "a late-night happy hour");
  few((x) => hoursFacts(x).weekend > 0, "happy hour on weekends");
  few((x) => x.amenities.patio, "a patio", "patio");
  few((x) => x.amenities.liveMusic, "live music", "liveMusic");
  return facts.slice(0, 2);
}

// A stable pick per spot and list, so openers don't all read the same.
const pick = (key, xs) => xs[parseInt(createHash("sha1").update(key).digest("hex").slice(0, 6), 16) % xs.length];

function writeup(v, rank, b) {
  const s = v.score;
  const parts = PART_LABELS.map(([, k]) => k).sort((x, y) => s[y] - s[x]);
  const [first, second] = parts;
  const score = s.total.toFixed(1);
  const key = `${b.slug}/${v.id}`;
  const lead =
    rank === 1
      ? `${v.name} takes the top spot in ${b.name} with a Hangout Score of ${score}.`
      : pick(key, [
          `${v.name} comes in at number ${rank} with ${score}.`,
          `Number ${rank} is ${v.name}, at ${score}.`,
          `${v.name} lands at number ${rank}, scoring ${score}.`,
        ]);
  const facts = listFacts(v, b, first);
  const out = [lead, PART_LEADS[first](s.notes, s)];
  if (s[second] >= 7) out.push(`It's strong on ${partWord[second]} too (${s[second].toFixed(1)}).`);
  out.push(...facts.map((f) => f.text));
  const used = new Set(facts.map((f) => f.deal?.name).filter(Boolean));
  const said = new Set(facts.map((f) => f.amenity).filter(Boolean));
  const deals = standouts(v).filter((d) => !used.has(d.name)).map(dealPhrase);
  if (deals.length) out.push(`${pick(`${key}/menu`, ["On the menu", "Worth ordering", "Deals include"])}: ${deals.length < 3 ? deals.join(" and ") : `${deals.slice(0, -1).join(", ")} and ${deals.at(-1)}`}.`);
  out.push(`Happy hour runs ${summary(v).replace(/^Every/, "every")}.`);
  const a = v.amenities;
  const extras = [a.patio && !said.has("patio") && "there's a patio", a.liveMusic && !said.has("liveMusic") && "there's live music on some nights", a.groups && "it's good for groups"].filter(Boolean);
  if (extras.length) out.push(`${cap(extras.length < 3 ? extras.join(" and ") : `${extras.slice(0, -1).join(", ")} and ${extras.at(-1)}`)}.`);
  if (a.transitStation) out.push(`The nearest SkyTrain is ${a.transitStation}.`);
  return out.join(" ");
}

function bestEntry(v, i, b) {
  const s = v.score;
  const n = i + 1;
  const photo = v.photo ? `<img src="${esc(/^https?:/.test(v.photo) ? v.photo : `/${v.photo}`)}" alt="${esc(`${v.name}, ${whereLabel(v)}`)}" loading="${i < 2 ? "eager" : "lazy"}" width="720" height="360" />` : "";
  return `<article class="entry" id="rank-${n}">
<header><span class="num${n <= 3 ? " top" : ""}" aria-hidden="true">${n}</span><div><h2><a href="/spots/${v.id}.html">${esc(v.name)}</a></h2><p class="where">${esc(whereLabel(v))} · ${esc(v.address.split(",")[0]).replace(/ (?=\S+$)/, "&nbsp;")}</p></div><span class="sc${s.total >= 7.5 ? " top" : ""}" aria-label="Hangout Score ${s.total.toFixed(1)} out of 10">${s.total.toFixed(1)}<small>/10</small></span></header>
${photo}
<p>${esc(writeup(v, n, b))}</p>
<p class="parts">${PART_LABELS.map(([l, k]) => `${l} ${s[k].toFixed(1)}`).join(" · ")}${v.confirmed ? ` · times confirmed on their menu ${esc(fmtDate(v.confirmed))}` : ""}</p>
<a class="more" href="/spots/${v.id}.html">All ${v.hh.deals.length} deals and times at ${esc(v.name)}</a>
</article>`;
}

// The second intro paragraph: what the list has in common, from its data.
function bestIntro2(b) {
  const list = b.venues;
  const every = list.filter((v) => v.hh.days.length === 7).length;
  const patio = list.filter((v) => v.amenities.patio).length;
  const weekend = list.filter((v) => [v.hh, ...v.hh.extra].some((w) => w.days?.includes(0) || w.days?.includes(6))).length;
  const drink = list.map((v) => ({ v, c: cheapestDrink(v) })).filter((x) => x.c).sort((a, b) => a.c.p - b.c.p)[0];
  const bits = [
    every ? `${every} of the ${list.length} run every day` : weekend ? `${weekend} of the ${list.length} run on weekends` : `all ${list.length} are weekday happy hours`,
    patio ? `${patio} ${patio === 1 ? "has" : "have"} a patio` : null,
    drink ? `the cheapest drink on the list is ${dealPhrase(drink.c.d)} at ${drink.v.name}` : null,
  ].filter(Boolean);
  const hi = list[0].score.total.toFixed(1);
  const lo = list.at(-1).score.total.toFixed(1);
  return `${cap(bits.length < 3 ? bits.join(" and ") : `${bits.slice(0, -1).join(", ")}, and ${bits.at(-1)}`)}. Scores on this list run from ${hi} down to ${lo}.`;
}

function bestFaq(b) {
  const [a, c, d] = b.venues;
  const f = (v) => `${v.name} (${v.score.total.toFixed(1)})`;
  return [
    {
      q: `What's the best happy hour in ${b.name}?`,
      a: `${a.name}, with a Hangout Score of ${a.score.total.toFixed(1)} out of 10: ${valueLine(a.score.notes)}.${c ? ` ${f(c)}${d ? ` and ${f(d)}` : ""} round out the top ${d ? "three" : "two"}.` : ""}`,
    },
    {
      q: `How are these happy hours ranked?`,
      a: `By the Hangout Score, worked out the same way for every spot from the deals and times we publish: value against typical Vancouver prices (${pct("value")}), selection (${pct("selection")}), hours (${pct("hours")}) and vibe (${pct("vibe")}).`,
    },
    { q: `Can a bar pay to rank higher?`, a: "No. Nothing a venue pays for changes its score or its place on a list, and we don't use Google star ratings. Scores change only when a venue's own menu does." },
  ];
}

async function bestPage(b) {
  const path = bestPath(b.slug);
  const url = BASE + path;
  const list = b.venues;
  const h1 = bestH1(b);
  const place = b.kind === "metro" ? null : placeBySlug.get(b.slug);
  const pool = place ? place.venues : venues;
  const updated = newest(pool);
  const top = list[0];
  const faq = bestFaq(b);
  const crumbs =
    b.kind === "area"
      ? [...trail(vancouver, null), { name: b.name, path: hubPath(b.slug) }, { name: "Best" }]
      : b.kind === "city"
        ? [{ name: "Happy hours", path: "/" }, { name: b.name, path: hubPath(b.slug) }, { name: "Best" }]
        : [{ name: "Happy hours", path: "/" }, { name: "Best happy hours" }];
  const title = fitTitle(
    `Best Happy Hours in ${b.name} (${YEAR}): Top ${list.length} Ranked | ${SITE}`,
    `Best Happy Hours in ${b.name} (${YEAR}): Top ${list.length} | ${SITE}`,
    `Best Happy Hours in ${b.name} (${YEAR}) | ${SITE}`,
    `Best Happy Hours in ${b.name} (${YEAR})`,
  );
  let description = `The ${list.length} best happy hours in ${b.name}, ranked by our Hangout Score from real menu prices, deals and hours. #1: ${top.name}.${updated ? ` Updated ${fmtDate(updated)}.` : ""}`;
  if (description.length > 160) description = description.replace(/ Updated .*$/, "");
  const intro = `We scored ${b.scored} ${b.kind === "metro" ? "Metro Vancouver" : b.name} happy hours on the deals and times we publish, the same way for every spot, and these ${list.length} came out on top. ${top.name} leads at ${top.score.total.toFixed(1)} out of 10: ${valueLine(top.score.notes)}.`;

  const cardFile = `best-${b.slug}`;
  const cover = list.map(localPhoto).find(Boolean) ?? null;
  copyFileSync(await renderCard({ id: cardFile, title: h1, line: `#1 ${top.name} · ${top.score.total.toFixed(1)}/10`, photo: cover }), resolve(dist, "og", `${cardFile}.jpg`));
  const image = { url: `${BASE}/og/${cardFile}.jpg`, alt: `${h1}: number one is ${top.name}, Hangout Score ${top.score.total.toFixed(1)} out of 10` };

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      ...SITE_GRAPH,
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: h1,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": `${url}#list` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        ...(updated ? { dateModified: updated } : {}),
        inLanguage: "en-CA",
        primaryImageOfPage: { "@type": "ImageObject", url: image.url, width: 1200, height: 630 },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: h1,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: list.length,
        itemListElement: list.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/spots/${v.id}.html`, name: v.name })),
      },
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: h1,
        description,
        mainEntityOfPage: { "@id": url },
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        datePublished: BEST_PUBLISHED,
        ...(updated ? { dateModified: updated } : {}),
        image: image.url,
        inLanguage: "en-CA",
        about: { "@id": `${url}#list` },
      },
      breadcrumb(url, crumbs),
      faqPage(url, faq),
    ],
  };

  // Other lists: nearest first for a place; every list for Metro.
  const others = bestLists.filter((o) => o.slug !== b.slug && o.kind !== "metro");
  const here = centre(list);
  const nearbyLists = place ? others.filter((o) => o.kind === b.kind).sort((x, y) => dist2(centre(x.venues), here) - dist2(centre(y.venues), here)).slice(0, 6) : [];
  const chipsFor = (ls) => `<ul class="chips">${ls.map((o) => `<li><a href="${bestPath(o.slug)}">${esc(o.name)}</a></li>`).join("")}</ul>`;
  const unscored = pool.length - b.scored;

  const body = `<nav class="crumbs" aria-label="Breadcrumb">${crumbs
    .map((c, i) => (i < crumbs.length - 1 ? `<a href="${c.path}">${esc(i === 0 ? SITE : c.name)}</a>` : `<span>${esc(c.name)}</span>`))
    .join(" › ")}</nav>
<h1>${esc(h1)}</h1>
<p class="byline">By the <a href="/about">${SITE} team</a>${updated ? ` · Updated <time datetime="${updated}">${esc(fmtDate(updated))}</time>` : ""} · Ranked from ${b.scored} scored spots</p>
<p class="lede">${esc(intro)}</p>
<p class="lede">${esc(bestIntro2(b))}</p>
<nav class="glance" aria-label="The list at a glance"><h2>At a glance</h2><ol>${list.map((v, i) => `<li><a href="#rank-${i + 1}">${esc(v.name)}</a> <b>${v.score.total.toFixed(1)}</b></li>`).join("")}</ol></nav>
<div id="best-map" class="bestmap" role="region" aria-label="Map of the ${list.length} best happy hours in ${esc(b.name)}"><p>Loading the map…</p></div>
<script type="application/json" id="best-map-data">${JSON.stringify(list.filter((v) => v.lat != null).map((v) => ({ n: list.indexOf(v) + 1, id: v.id, name: v.name, lat: v.lat, lng: v.lng, score: v.score.total.toFixed(1), when: summary(v) }))).replace(/</g, "\\u003c")}</script>
<a class="open" href="/best/?in=${b.slug}">Open this list in the app</a>
${list.map((v, i) => bestEntry(v, i, b)).join("\n")}
<h2>How we rank</h2>
<p class="lede">Every spot gets a Hangout Score out of 10 from what's on its page, worked out the same way for every venue:</p>
<ul class="method">
<li><b>Value (${pct("value")})</b>: each deal's price against what Vancouver spots typically charge for the same thing, plus the cheapest drink.</li>
<li><b>Selection (${pct("selection")})</b>: how many deals, how many kinds of drink, and whether there's food.</li>
<li><b>Hours (${pct("hours")})</b>: hours of happy hour a week, weekends and late night.</li>
<li><b>Vibe (${pct("vibe")})</b>: patio, live music, good for groups and near transit.</li>
</ul>
<p class="meta">Spots need at least 3 deals, 2 with prices, and confirmed times to be scored${unscored > 0 ? `, so ${unscored} of the ${pool.length} spots ${b.kind === "metro" ? "we track" : `in ${esc(b.name)}`} aren't ranked yet` : ""}. A spot needs ${BEST_FLOOR} or more to make a best-of list. No venue pays to be listed or ranked, and we don't use Google star ratings. Every spot here had its times confirmed on its own menu within the last ${BEST_FRESH_DAYS} days (oldest: ${esc(fmtDate(list.map((v) => v.confirmed).sort()[0]))}); a spot whose page stops showing our times drops off until it's confirmed again. Menus are re-checked every night and the list updates with them. <a href="/about/#hang-score">Full method</a>.</p>
${place ? `<h2>All happy hours in ${esc(b.name)}</h2>\n<ul class="chips"><li><a href="${hubPath(b.slug)}">Every ${esc(b.name)} happy hour <small>${place.venues.length}</small></a></li></ul>` : ""}
${nearbyLists.length ? `<h2>Best happy hours nearby</h2>\n${chipsFor(nearbyLists)}` : ""}
${!place ? `<h2>Best happy hours by neighbourhood</h2>\n${chipsFor(others.filter((o) => o.kind === "area"))}\n<h2>Best happy hours by city</h2>\n${chipsFor(others.filter((o) => o.kind === "city"))}` : `<h2>More best-of lists</h2>\n<ul class="chips"><li><a href="${bestPath("metro")}">All of Metro Vancouver</a></li></ul>`}
<h2>Questions about the best happy hours in ${esc(b.name)}</h2>
<div class="faq">${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</div>`;
  write(`${path.slice(1)}index.html`, hubDoc({ path, title, description, jsonld, body, image, script: BEST_MAP_JS, robots: b.index ? undefined : "noindex,follow" }));
  // Lists close to their place's hub page (few scored spots) stay for people but out of search.
  if (b.index) sitemapDates.set(path, updated);
}

for (const b of bestLists) {
  await bestPage(b);
  hubCount++;
}

// ---------- venue pages ----------
mkdirSync(resolve(dist, "og"), { recursive: true });
let n = 0;
for (const v of venues) {
  copyFileSync(await shareCard(v), resolve(dist, "og", `${v.id}.jpg`));
  const image = `${BASE}/og/${v.id}.jpg`;
  const when = summary(v);
  const deals = topDeals(v, 2).map(dealPhrase);
  const path = `/spots/${v.id}.html`;
  write(
    `spots/${v.id}.html`,
    page({
      path,
      title: venueTitle(v),
      description: venueDescription(v),
      image,
      imageAlt: `${v.name}${when ? `, happy hour ${when.replace(/^Every day/, "every day")}` : ""}`,
      type: "place",
      jsonld: venueJsonLd(v, image),
      preload: v.photo && !/^https?:/.test(v.photo) ? `/${v.photo}` : undefined,
      body: venueBody(v),
      // Low-confidence times stay out of search until they're confirmed.
      robots: v.confidence === "low" ? "noindex,follow" : undefined,
      extraHead: [
        v.lat != null && `<meta property="place:location:latitude" content="${v.lat}" />`,
        v.lng != null && `<meta property="place:location:longitude" content="${v.lng}" />`,
        `<meta name="twitter:title" content="${esc(`${v.name} happy hour`)}" />`,
        `<meta name="twitter:description" content="${esc([when, ...deals].filter(Boolean).join(" · "))}" />`,
      ],
    }),
  );
  if (v.confidence !== "low") sitemapDates.set(path, v.checked);
  n++;
}

// ---------- A–Z, home and app routes ----------
const sorted = [...venues].sort((a, b) => a.name.localeCompare(b.name));
const azUrl = `${BASE}/spots/`;
write(
  "spots/index.html",
  page({
    path: "/spots/",
    title: "All Metro Vancouver Happy Hour Spots, A–Z | A Little Hang",
    description: `Every happy hour we track across Metro Vancouver: ${venues.length} bars and restaurants with times and deals from their own menus.`,
    jsonld: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", "@id": azUrl, url: azUrl, name: "All happy hour spots A–Z", isPartOf: { "@id": WEBSITE_ID }, mainEntity: { "@id": `${azUrl}#list` }, breadcrumb: { "@id": `${azUrl}#breadcrumb` } },
        { "@type": "ItemList", "@id": `${azUrl}#list`, numberOfItems: sorted.length, itemListElement: sorted.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${BASE}/spots/${v.id}.html` })) },
        breadcrumb(azUrl, [{ name: "Happy hours", path: "/" }, { name: "All spots A–Z" }]),
      ],
    },
    body: `<main style="${S.wrap}">${crumbHtml([{ name: "Happy hours", path: "/" }, { name: "All spots A–Z" }])}<h1 style="${S.h1}">All happy hour spots A–Z</h1><ul style="list-style:none;padding:0">${sorted
      .map((v) => `<li style="${S.row}"><a href="/spots/${v.id}.html" style="${S.plain}">${esc(v.name)}</a><span style="color:#a7a196">${esc(whereLabel(v))}</span></li>`)
      .join("")}</ul></main>`,
  }),
);
sitemapDates.set("/spots/", newest(venues));

// About: who made it and why, in static markup for crawlers (the app shows
// the same story in screens/info.tsx), plus AboutPage + founders schema.
const ABOUT_DESC = "Why A Little Hang exists, who it's for, and the people behind it: founder Jason (Setsail Marketing) and designer Sofia Alvarenga.";
function aboutLd() {
  const url = `${BASE}/about/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "AboutPage", "@id": url, url, name: `About ${SITE}`, description: ABOUT_DESC, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": ORG_ID }, mentions: [{ "@id": FOUNDER_ID }, { "@id": DESIGNER_ID }], inLanguage: "en-CA", breadcrumb: { "@id": `${url}#breadcrumb` } },
      breadcrumb(url, [{ name: "Happy hours", path: "/" }, { name: "About" }]),
      ...SITE_GRAPH,
    ],
  };
}
function aboutHtml() {
  return `<p style="${S.p}">A Little Hang shows you which Vancouver bars and restaurants have happy hour on right now, what's starting soon, and what the deals are, so you can pick a spot in seconds.</p>
<h2 style="${S.h2}">Why we made it</h2>
<blockquote style="margin:0;padding-left:16px;border-left:2px solid #ff4900">
<p style="${S.p}">I've run Setsail Marketing for the past ten years, and the best parts have been the times spent with people: travelling, trying new places, and sharing a good time with friends and strangers alike.</p>
<p style="${S.p};margin-top:12px">I've never seen anything bring people together like a good happy hour. It's easy on the wallet, so it works for people from every side of the planet and every background. But there was nothing out there that helped you find a good hangout spot without spending a fortune on a night out. So we set out to find the best happy hours and hangout spots in Vancouver, and put them in one place.</p>
<p style="${S.p};margin-top:12px">What I hope it does is simple: a livelier city and a livelier community, with more people getting together, more conversations, more good laughs and more good moments. There's nothing more precious than happy time spent with loved ones, friends and strangers, wherever it happens.</p>
<p style="${S.muted};margin-top:12px;font-size:13px">Jason, founder</p>
</blockquote>
<h2 style="${S.h2}">Who it's for</h2>
<p style="${S.p}">Anyone who wants a good time with people without a big bill: friends picking a spot after work, newcomers and visitors getting to know the city, couples and families after an easy evening out. It's free, there's no account, and you'll know where to go in seconds. For venues it's free too: every listing comes from your own menu and links back to your site.</p>
<h2 style="${S.h2}">The people behind it</h2>
<h3 id="jason" style="${S.h3}">Jason, founder</h3>
<p style="${S.p}">Founder of Setsail Marketing, which he's run for ten years. Loves travelling and a good time with people, wherever he is.</p>
<h3 id="sofia" style="${S.h3}">Sofia Alvarenga, designer</h3>
<p style="${S.p}">A product designer for many years. She designed how A Little Hang looks and works, from the first screen to the last tap.</p>
<p style="${S.p};margin-top:12px">Jason and Sofia are married, and built A Little Hang together.</p>
<h2 style="${S.h2}">Where the times come from</h2>
<p style="${S.p}">We read happy hour times and deals from each venue's own website, menu PDF or menu photo, re-check every source each night, and link each spot to the exact page we read.</p>
<h2 id="hang-score" style="${S.h2}">How the Hangout Score works</h2>
<p style="${S.p}">Every happy hour with enough deal info gets a Hangout Score out of 10, worked out the same way for every venue: value (40%), selection (25%), hours (20%) and vibe (15%). No venue can pay for a score or a higher one, and Google ratings aren't part of it.</p>
<p style="${S.muted};margin-top:24px">Questions or corrections: <a href="mailto:jason@setsail.ca" style="${S.link}">jason@setsail.ca</a></p>`;
}

const exploreHtml = `<h2 style="${S.h2}">Vancouver neighbourhoods</h2><nav>${places
  .filter((p) => p.kind === "area")
  .map((p) => `<a href="${hubPath(p.slug)}" style="${S.chip}">${esc(p.name)}</a>`)
  .join("")}</nav>
<h2 style="${S.h2}">Around Metro Vancouver</h2><nav>${places
  .filter((p) => p.kind === "city")
  .map((p) => `<a href="${hubPath(p.slug)}" style="${S.chip}">${esc(p.name)}</a>`)
  .join("")}</nav>
<h2 style="${S.h2}">Best happy hours, ranked</h2><nav>${bestLists.map((b) => `<a href="${bestPath(b.slug)}" style="${S.chip}">${esc(b.kind === "metro" ? "All of Metro Vancouver" : b.name)}</a>`).join("")}</nav>
<h2 style="${S.h2}">By day and deal</h2><nav>${topics.map((t) => `<a href="${hubPath(t.slug)}" style="${S.chip}">${esc(t.label)}</a>`).join("")}</nav>`;

const HOME_DESC = `Live happy hour times and deals from ${venues.length} Vancouver bars and restaurants, checked against their own menus every night.`;
write(
  "index.html",
  page({
    path: "/",
    title: `Vancouver Happy Hours Right Now | ${SITE}`,
    description: HOME_DESC,
    jsonld: { "@context": "https://schema.org", "@graph": SITE_GRAPH },
    body: `<main style="${S.wrap}"><h1 style="${S.h1}">Happy hours in Vancouver</h1><p style="${S.p}">${esc(HOME_DESC)} See what's on right now, what starts next, and where the cheapest pint is tonight.</p>${exploreHtml}<p style="${S.muted};margin-top:24px"><a href="/spots/" style="${S.link}">All ${venues.length} spots A–Z</a></p></main>`,
  }),
);
sitemapDates.set("/", newest(venues));

const PAGES = [
  ["map/index.html", "/map/", "Map of Vancouver Happy Hours", "Map of happy hours", true],
  // The app's Best of screen; the static /happy-hour/<place>/best/ pages are the indexed copies.
  ["best/index.html", "/best/", "Best Happy Hours, Ranked", "Best happy hours", false],
  ["saved/index.html", "/saved/", "Saved spots", "Saved spots", false],
  ["about/index.html", "/about/", "About", "About A Little Hang", true],
  ["privacy/index.html", "/privacy/", "Privacy", "Privacy", true],
  ["terms/index.html", "/terms/", "Terms", "Terms", true],
  ["welcome/index.html", "/welcome/", null, null, false],
];
for (const [file, path, title, h1, index] of PAGES) {
  write(
    file,
    page({
      path,
      title: title ? `${title} | ${SITE}` : `Vancouver Happy Hours Right Now | ${SITE}`,
      description: path === "/about/" ? ABOUT_DESC : HOME_DESC,
      robots: index ? undefined : "noindex,follow",
      jsonld: path === "/about/" ? aboutLd() : undefined,
      body: h1 ? `<main style="${S.wrap}">${crumbHtml([{ name: "Happy hours", path: "/" }, { name: h1 }])}<h1 style="${S.h1}">${esc(h1)}</h1>${path === "/about/" ? aboutHtml() : ""}</main>` : "",
    }),
  );
  if (index) sitemapDates.set(path, null);
}

// Old venue links (menu.html?id=…) and unknown paths both boot the app,
// which redirects or shows its own not-found screen.
write("menu.html", template.replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>'));
write("404.html", template.replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>'));

// ---------- sitemaps ----------
const urlset = (paths, images = new Map()) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${paths
    .map((p) => {
      const lastmod = sitemapDates.get(p);
      const img = images.get(p);
      return `  <url><loc>${BASE}${p}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${img ? `<image:image><image:loc>${esc(img)}</image:loc></image:image>` : ""}</url>`;
    })
    .join("\n")}\n</urlset>\n`;
const all = [...sitemapDates.keys()];
const venuePaths = all.filter((p) => p.startsWith("/spots/") && p !== "/spots/");
const hubPaths = all.filter((p) => p.startsWith("/happy-hour/"));
const pagePaths = all.filter((p) => !venuePaths.includes(p) && !hubPaths.includes(p));
const venueImages = new Map(venues.filter((v) => v.photo && !/^https?:/.test(v.photo)).map((v) => [`/spots/${v.id}.html`, absPhoto(v.photo)]));
write("sitemap-pages.xml", urlset(pagePaths));
write("sitemap-venues.xml", urlset(venuePaths, venueImages));
write("sitemap-hubs.xml", urlset(hubPaths));
const today = newest(venues);
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["pages", "venues", "hubs"]
    .map((k) => `  <sitemap><loc>${BASE}/sitemap-${k}.xml</loc>${today ? `<lastmod>${today}</lastmod>` : ""}</sitemap>`)
    .join("\n")}\n</sitemapindex>\n`,
);
// llms.txt: a plain-text map of the site for AI search and assistants.
const cheapest = (re) =>
  venues
    .flatMap((v) => v.hh.deals.filter((d) => d.category === "drink" && re.test(d.name)).map((d) => ({ v, p: parsePrice(d.price) })))
    .filter((x) => x.p && x.p.low > 0)
    .sort((a, b) => a.p.low - b.p.low)[0];
const beer = cheapest(/beer|lager|pint|ipa|draught|pilsner|ale\b/i);
const linkLine = (h, label) => `- [${label}](${BASE}${hubPath(h.slug)}): ${h.venues.length} spots`;
write(
  "llms.txt",
  `# ${SITE}

> ${SITE} (alittlehang.com) is a directory of happy hours in Vancouver and Metro Vancouver, BC: ${venues.length} bars and restaurants with their happy hour days, times and deal prices. Times and prices come from each venue's own menu and are rechecked every night${today ? `; last updated ${today}` : ""}.

Every venue page (${BASE}/spots/<id>.html) lists the happy hour schedule by day, every food and drink deal with its price in CAD, the address, the nearest SkyTrain station and the date the menu was last checked. Hub pages group venues by city, neighbourhood, day and deal. It was founded by Jason (founder of Setsail Marketing) and designed by product designer Sofia Alvarenga.${beer ? ` The cheapest happy hour beer right now is ${money(beer.p.low)} at ${beer.v.name}.` : ""}

## Cities
${places.filter((p) => p.kind === "city").map((p) => linkLine(p, `Happy hours in ${p.name}`)).join("\n")}

## Vancouver neighbourhoods
${places.filter((p) => p.kind === "area").map((p) => linkLine(p, `Happy hours in ${p.name}`)).join("\n")}

## Best happy hours, ranked by Hangout Score
${bestLists.filter((b) => b.index).map((b) => `- [${bestH1(b)}](${BASE}${bestPath(b.slug)}): #1 ${b.venues[0].name} (${b.venues[0].score.total.toFixed(1)}/10)`).join("\n")}

## By day and deal (Metro Vancouver)
${topics.map((t) => linkLine(t, t.label)).join("\n")}

## Optional
- [All ${venues.length} spots A–Z](${BASE}/spots/)
- [Map](${BASE}/map/)
- [About](${BASE}/about/)
- [Sitemap](${BASE}/sitemap.xml)
`,
);
write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /screens\n\nSitemap: ${BASE}/sitemap.xml\n`);
const cname = resolve(web, "../CNAME");
if (existsSync(cname)) copyFileSync(cname, resolve(dist, "CNAME"));
writeFileSync(resolve(dist, ".nojekyll"), "");

console.log(`prerender: ${n} venue pages + share cards, ${hubCount} hub pages, A–Z, home, ${PAGES.length} route pages, sitemaps (${all.length} urls)`);
