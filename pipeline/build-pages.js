// Phase 8: pre-rendered static pages. One crawlable HTML page per venue from
// venues.json, plus an A–Z index, sitemap.xml, and robots.txt — the dataset
// becomes indexable instead of living behind a client-rendered ?id= page.
// Usage: node pipeline/build-pages.js   (run after writeback)
import fs from "node:fs";
import path from "node:path";
import { readJson, REPO_ROOT } from "./lib/venues.js";

const BASE = "https://sofifiuh.github.io/happy-hour-app/";

// Covers are either absolute (venue's own og:image) or repo-relative
// ("photos/x.jpg" from the Places backfill); spot pages live in spots/, so
// relative ones must be absolutized.
const coverUrl = (v) => {
  const u = v.cover_image?.url;
  return u ? (u.startsWith("http") ? u : BASE + u) : null;
};
const { venues } = readJson(path.join(REPO_ROOT, "venues.json"));
const OUT = path.join(REPO_ROOT, "spots");
fs.mkdirSync(OUT, { recursive: true });

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fmtTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${period}` : `${hour}${period}`;
}
const winLabel = (w) => `${fmtTime(w.start)}–${w.end ? fmtTime(w.end) : "close"}`;

function scheduleRows(v) {
  const hh = v.happy_hour;
  const windows = [{ days: hh.days, start: hh.start, end: hh.end }, ...(hh.extra_windows || [])];
  return DAY_NAMES.map((name, d) => {
    const labels = windows.filter((w) => w.days.includes(d) && w.start).map(winLabel);
    return `<tr><th>${name}</th><td>${labels.length ? esc(labels.join(" & ")) : "—"}</td></tr>`;
  }).join("\n      ");
}

function dealRows(v) {
  return (v.happy_hour.deals || [])
    .map((d) => `<li><strong>${esc(d.name)}</strong>${d.price ? ` <span class="price">${esc(d.price)}</span>` : ""}${d.description ? `<br><small>${esc(d.description)}</small>` : ""}</li>`)
    .join("\n      ");
}

const CSS = `body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#faf7f2;color:#1a1a1a;line-height:1.5}
main{max-width:640px;margin:0 auto;padding:20px 16px 48px}
a{color:#b8860b}
h1{font-size:1.7rem;letter-spacing:-.01em;margin:.2em 0 .1em}
.meta{color:#666;margin:0 0 4px}
.rating{color:#b8860b;font-weight:700}
img.cover{width:100%;max-height:320px;object-fit:cover;border-radius:14px;margin:14px 0 4px}
.credit{font-size:.75rem;color:#999}
table{border-collapse:collapse;width:100%;margin:8px 0 20px}
th{text-align:left;padding:5px 12px 5px 0;font-weight:600;width:7.5em}
td{padding:5px 0}
tr{border-bottom:1px solid #eee6d8}
ul.deals{list-style:none;padding:0}
ul.deals li{padding:7px 0;border-bottom:1px solid #eee6d8}
.price{color:#b8860b;font-weight:700;margin-left:6px}
.cta{display:inline-block;background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600;margin:10px 12px 10px 0}
.note{font-size:.85rem;color:#777;margin-top:22px}
footer{font-size:.75rem;color:#999;margin-top:30px;border-top:1px solid #eee6d8;padding-top:12px}`;

function venuePage(v) {
  const hh = v.happy_hour;
  const daysText = hh.days.length === 7 ? "daily" : hh.days.map((d) => DAY_NAMES[d]).join(", ");
  const title = `${v.name} Happy Hour — Times & Deals | Vancouver`;
  const desc = `${v.name} happy hour: ${fmtTime(hh.start)}–${fmtTime(hh.end)} ${daysText}${hh.deals?.length ? `, ${hh.deals.length} deals` : ""}. ${v.formatted_address}.`;
  const url = `${BASE}spots/${v.id}.html`;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: v.name,
    address: { "@type": "PostalAddress", streetAddress: (v.formatted_address || "").split(",")[0], addressLocality: "Vancouver", addressRegion: "BC", addressCountry: "CA" },
    ...(v.geometry?.location ? { geo: { "@type": "GeoCoordinates", latitude: v.geometry.location.lat, longitude: v.geometry.location.lng } } : {}),
    ...(v.website ? { url: v.website } : {}),
    ...(v.formatted_phone_number ? { telephone: v.formatted_phone_number } : {}),
    ...(coverUrl(v) ? { image: coverUrl(v) } : {}),
    ...(v.price_level ? { priceRange: "$".repeat(v.price_level) } : {}),
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${coverUrl(v) ? `<meta property="og:image" content="${esc(coverUrl(v))}">` : ""}
<meta property="og:url" content="${url}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style>
</head>
<body>
<main>
  <p class="meta"><a href="index.html">← All Vancouver happy hour spots</a></p>
  <h1>${esc(v.name)}</h1>
  ${v.rating ? `<p class="meta"><span class="rating">★ ${v.rating}</span>${v.user_ratings_total ? ` (${Number(v.user_ratings_total).toLocaleString()} Google reviews)` : ""}${v.price_level ? ` · ${"$".repeat(v.price_level)}` : ""}</p>` : ""}
  <p class="meta">${esc(v.formatted_address)}${v.formatted_phone_number ? ` · ${esc(v.formatted_phone_number)}` : ""}</p>
  ${coverUrl(v) ? `<img class="cover" src="${esc(coverUrl(v))}" alt="${esc(v.name)}">
  <p class="credit">Photo: <a href="${esc(v.cover_image.credit_url || v.website || "#")}" rel="noopener">${esc(v.cover_image.credit_name || v.name)}</a></p>` : ""}

  <h2>Happy hour times</h2>
  <table>
      ${scheduleRows(v)}
  </table>

  ${hh.deals?.length ? `<h2>Deals</h2>
  <ul class="deals">
      ${dealRows(v)}
  </ul>` : ""}

  <a class="cta" href="../menu.html?id=${encodeURIComponent(v.id)}">Open in the app</a>
  ${v.website ? `<a class="cta" style="background:#b8860b" href="${esc(v.website)}" rel="noopener">Venue website</a>` : ""}

  <p class="note">${hh.verified
    ? `✓ Verified against the venue's official menu${hh.verified_source ? ` (<a href="${esc(hh.verified_source)}" rel="noopener">source</a>)` : ""}.`
    : `Times and deals read automatically from <a href="${esc(hh.source_url || v.website || "#")}" rel="noopener">the venue's own menu</a> — not yet human-verified. Confirm with the venue before making the trip.`}</p>

  <footer>Part of <a href="../index.html">Vancouver Happy Hour</a> · venue identity data © Google / © OpenStreetMap contributors · happy-hour details from each venue's own website</footer>
</main>
</body>
</html>`;
}

// Per-venue pages
for (const v of venues) fs.writeFileSync(path.join(OUT, `${v.id}.html`), venuePage(v));

// A–Z index
const sorted = [...venues].sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>All Vancouver Happy Hour Spots — A–Z</title>
<meta name="description" content="Every happy hour we track in Vancouver: ${venues.length} bars and restaurants with times and deals from their own menus.">
<link rel="canonical" href="${BASE}spots/index.html">
<style>${CSS}</style>
</head>
<body>
<main>
  <p class="meta"><a href="../index.html">← Vancouver Happy Hour app</a></p>
  <h1>All spots A–Z</h1>
  <p class="meta">${venues.length} venues, times and deals from each venue's own menu.</p>
  <ul class="deals">
      ${sorted.map((v) => `<li><a href="${v.id}.html"><strong>${esc(v.name)}</strong></a>${v.rating ? ` <span class="price">★ ${v.rating}</span>` : ""}<br><small>${esc(v.formatted_address)}</small></li>`).join("\n      ")}
  </ul>
</main>
</body>
</html>`);

// sitemap + robots
const urls = [BASE, `${BASE}spots/index.html`, ...venues.map((v) => `${BASE}spots/${v.id}.html`)];
fs.writeFileSync(path.join(REPO_ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(REPO_ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

console.log(`${venues.length} venue pages + index -> spots/, sitemap.xml (${urls.length} urls), robots.txt`);
