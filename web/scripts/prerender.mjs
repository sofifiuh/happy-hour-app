// Turns the alittlehang.com build (dist-site) into a crawlable site:
//   spots/<id>.html   one page per venue at the old site's URLs, with its
//                     own title, description, share image and JSON-LD, and
//                     the venue's details pre-rendered inside #root
//   spots/index.html  A–Z of every venue
//   og/<id>.jpg       1200×630 share card per venue
//   map/, saved/, about/, privacy/, terms/, welcome/, menu.html, 404.html
//   sitemap.xml, robots.txt, CNAME
// The app boots on every page and takes over from the static markup.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BASE = "https://alittlehang.com";
const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");
const dist = resolve(web, "dist-site");
const cache = resolve(web, "node_modules/.cache/og");
mkdirSync(cache, { recursive: true });

// Preload the two font files the first screen paints with.
const fonts = readdirSync(resolve(dist, "assets")).filter((f) => /^funnel-(display-latin-800|sans-latin-400)-normal-.*\.woff2$/.test(f));
const template = readFileSync(resolve(dist, "index.html"), "utf8")
  // public/ files are linked relatively in index.html; pages live in
  // subfolders (spots/, about/), so make them root-relative.
  .replace(/(href|src)="(icon\.svg|icon-\d+\.png|manifest\.webmanifest|venues\.json|og\.png)"/g, '$1="/$2"')
  .replace(
  "</head>",
  `${fonts.map((f) => `    <link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join("\n")}\n  </head>`,
);
writeFileSync(resolve(dist, "index.html"), template);
const { venues } = JSON.parse(readFileSync(resolve(web, "public/venues.json"), "utf8"));
const logo = readFileSync(resolve(web, "src/components/logo-path.ts"), "utf8").match(/LOGO_PATH =\s*"([^"]+)"/)[1];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- time formatting (mirrors src/lib/hours.ts) ----------
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function fmtTime(hhmm, withPeriod = true) {
  if (!hhmm) return "close";
  const [h, m] = hhmm.split(":").map(Number);
  if (h === 23 && m === 59) return "close";
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${withPeriod ? (h >= 12 ? "pm" : "am") : ""}`;
}
function fmtRange(start, end) {
  const endLabel = fmtTime(end);
  const same = endLabel !== "close" && Number(start.split(":")[0]) >= 12 === Number(end.split(":")[0]) >= 12;
  return `${fmtTime(start, !same)}–${endLabel}`;
}
const windows = (v) => [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra];
function dayRuns(v) {
  const runs = [];
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const wins = windows(v).filter((w) => w.days.includes(d) && w.start).sort((a, b) => a.start.localeCompare(b.start));
    const key = wins.map((w) => `${w.start}-${w.end}`).join();
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.days.push(d);
    else runs.push({ days: [d], key, wins });
  }
  return runs;
}
function runLabel(days) {
  if (days.length === 7) return "Every day";
  if (days.length === 1) return DAY_FULL[days[0]];
  if (days.length === 2) return `${DAY_SHORT[days[0]]} & ${DAY_SHORT[days[1]]}`;
  return `${DAY_SHORT[days[0]]}–${DAY_SHORT[days[days.length - 1]]}`;
}
const summary = (v) =>
  dayRuns(v)
    .filter((r) => r.wins.length)
    .map((r) => `${runLabel(r.days)} ${r.wins.map((w) => fmtRange(w.start, w.end)).join(" & ")}`)
    .join(", ");

// ---------- page assembly ----------
function page({ path, title, description, image = `${BASE}/og.png`, type = "website", jsonld, body = "", preload }) {
  const url = BASE + path;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${type}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(image)}" />`);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    preload && `<link rel="preload" href="${preload}" as="image" fetchpriority="high" />`,
    jsonld && `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>`,
  ].filter(Boolean);
  html = html.replace("</head>", `    ${head.join("\n    ")}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function write(rel, html) {
  const file = resolve(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Static markup shown before the app boots (and to crawlers / no-JS).
// Inline styles only: it must look right without the app's CSS classes.
const S = {
  wrap: "max-width:42rem;margin:0 auto;padding:24px 20px 64px;font-family:'Funnel Sans',system-ui,sans-serif;color:#f3efe4",
  h1: "font-family:'Funnel Display',system-ui,sans-serif;font-weight:800;font-size:34px;line-height:1.02;letter-spacing:-.025em;margin:16px 0 8px",
  h2: "font-family:'Funnel Display',system-ui,sans-serif;font-weight:700;font-size:20px;margin:28px 0 10px",
  muted: "color:#a7a196;font-size:15px;margin:0",
  row: "display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #3a3835;font-size:15px",
  link: "color:#ff4900;font-weight:600",
};

function venueBody(v) {
  const deals = v.hh.deals;
  // The photo matches the app's venue header (full width, same height) so
  // the page doesn't jump when the app takes over.
  return `<main style="max-width:42rem;margin:0 auto">
${v.photo ? `<img src="${esc(/^https?:/.test(v.photo) ? v.photo : `/${v.photo}`)}" alt="${esc(v.name)}" fetchpriority="high" style="display:block;width:100%;height:min(42vh,340px);object-fit:cover;background:#2f2d2b" />` : ""}
</main>
<main style="${S.wrap}">
<p style="${S.muted}"><a href="/" style="${S.link}">A Little Hang</a> · <a href="/spots/" style="color:#a7a196">All spots</a></p>
<h1 style="${S.h1}">${esc(v.name)}</h1>
<p style="${S.muted}">${esc(v.address)}</p>
<h2 style="${S.h2}">Happy hour times</h2>
${dayRuns(v)
  .map((r) => `<div style="${S.row}"><span>${runLabel(r.days)}</span><span>${r.wins.length ? r.wins.map((w) => fmtRange(w.start, w.end)).join(" · ") : "None"}</span></div>`)
  .join("\n")}
<h2 style="${S.h2}">Deals</h2>
${
  deals.length
    ? deals.map((d) => `<div style="${S.row}"><span>${esc(d.name)}${d.description ? `<br><small style="color:#a7a196">${esc(d.description)}</small>` : ""}</span><span style="color:#f7b2b7;font-weight:700">${esc(d.price)}</span></div>`).join("\n")
    : `<p style="${S.muted}">This spot runs a happy hour but doesn't publish its deals online.${v.website ? ` <a href="${esc(v.website)}" rel="noopener" style="${S.link}">Check their menu</a>.` : ""}</p>`
}
<p style="${S.muted};margin-top:24px">${v.hh.verified ? "Verified against their menu" : "From their website"}${v.checked ? `, times checked ${esc(v.checked)}` : ""}.</p>
</main>`;
}

function venueJsonLd(v, image) {
  return {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: v.name,
    url: `${BASE}/spots/${v.id}.html`,
    image,
    address: { "@type": "PostalAddress", streetAddress: v.address.split(",")[0], addressLocality: v.city || "Vancouver", addressRegion: "BC", addressCountry: "CA" },
    ...(v.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } } : {}),
    ...(v.phone ? { telephone: v.phone } : {}),
    ...(v.website ? { sameAs: v.website } : {}),
    ...(v.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: v.rating, reviewCount: v.ratings || 1 } } : {}),
  };
}

// ---------- share cards ----------
const FONT_DISPLAY = resolve(here, "fonts/FunnelDisplay-ExtraBold.ttf");
const FONT_SANS = resolve(here, "fonts/FunnelSans-Medium.ttf");
const pango = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function text(markup, fontfile, font, width) {
  return sharp({ text: { text: markup, font, fontfile, width, dpi: 72, rgba: true, wrap: "word" } }).png().toBuffer();
}

async function shareCard(v) {
  const photo = v.photo && !/^https?:/.test(v.photo) ? resolve(web, "public", v.photo) : null;
  const when = summary(v) || "Happy hour times on the page";
  const key = createHash("sha1").update(JSON.stringify([v.name, when, photo && existsSync(photo) ? readFileSync(photo).length : 0, 2])).digest("hex").slice(0, 10);
  const cached = resolve(cache, `${v.id}-${key}.jpg`);
  if (existsSync(cached)) return cached;

  const W = 1200, H = 630;
  const bg = photo && existsSync(photo)
    ? await sharp(photo).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.9 }).toBuffer()
    : await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4900"/><stop offset="1" stop-color="#751927"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)).png().toBuffer();
  const shade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1b1b" stop-opacity=".15"/><stop offset=".45" stop-color="#1b1b1b" stop-opacity=".55"/><stop offset="1" stop-color="#1b1b1b" stop-opacity=".97"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#s)"/></svg>`);
  const mark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 124" width="150" height="143"><path d="${logo}" fill="#f3efe4"/></svg>`);
  const nameSize = v.name.length > 34 ? 60 : v.name.length > 22 ? 72 : 84;
  const name = await text(`<span foreground="#f3efe4" font_weight="800" size="${nameSize * 1024}">${pango(v.name)}</span>`, FONT_DISPLAY, "Funnel Display Light", 900);
  const times = await text(`<span foreground="#ecfe54" size="${34 * 1024}">Happy hour · ${pango(when)}</span>`, FONT_SANS, "Funnel Sans Light", 900);
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

// ---------- write everything ----------
mkdirSync(resolve(dist, "og"), { recursive: true });
let n = 0;
for (const v of venues) {
  copyFileSync(await shareCard(v), resolve(dist, "og", `${v.id}.jpg`));
  const image = `${BASE}/og/${v.id}.jpg`;
  const when = summary(v);
  write(
    `spots/${v.id}.html`,
    page({
      path: `/spots/${v.id}.html`,
      title: `${v.name} happy hour: times and deals | A Little Hang`,
      description: `${v.name} happy hour${when ? `: ${when}` : ""}${v.hh.deals.length ? `. ${v.hh.deals.length} deals` : ""}. ${v.address}.`,
      image,
      type: "place",
      jsonld: venueJsonLd(v, image),
      preload: v.photo && !/^https?:/.test(v.photo) ? `/${v.photo}` : undefined,
      body: venueBody(v),
    }),
  );
  n++;
}

const sorted = [...venues].sort((a, b) => a.name.localeCompare(b.name));
write(
  "spots/index.html",
  page({
    path: "/spots/",
    title: "All Metro Vancouver happy hour spots, A–Z | A Little Hang",
    description: `Every happy hour we track across Metro Vancouver: ${venues.length} bars and restaurants with times and deals from their own menus.`,
    body: `<main style="${S.wrap}"><h1 style="${S.h1}">All spots A–Z</h1><ul style="list-style:none;padding:0">${sorted
      .map((v) => `<li style="${S.row}"><a href="/spots/${v.id}.html" style="color:#f3efe4">${esc(v.name)}</a><span style="color:#a7a196">${esc(v.city || "")}</span></li>`)
      .join("")}</ul></main>`,
  }),
);

const PAGES = [
  ["map/index.html", "/map", "Map of happy hours near you"],
  ["saved/index.html", "/saved", "Saved spots"],
  ["about/index.html", "/about", "About"],
  ["privacy/index.html", "/privacy", "Privacy"],
  ["terms/index.html", "/terms", "Terms"],
  ["welcome/index.html", "/welcome", null],
];
for (const [file, path, title] of PAGES) {
  write(file, page({ path, title: title ? `${title} | A Little Hang` : "A Little Hang: happy hours near you, right now", description: "Live happy hour times and deals from 450+ Vancouver bars and restaurants." }));
}
// Old venue links (menu.html?id=…) and unknown paths both boot the app,
// which redirects or shows its own not-found screen.
write("menu.html", template.replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>'));
write("404.html", template.replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>'));

const urls = ["/", "/spots/", "/about", "/privacy", "/terms", ...venues.map((v) => `/spots/${v.id}.html`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${BASE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
const cname = resolve(web, "../CNAME");
if (existsSync(cname)) copyFileSync(cname, resolve(dist, "CNAME"));
writeFileSync(resolve(dist, ".nojekyll"), "");

console.log(`prerender: ${n} venue pages + share cards, A–Z, ${PAGES.length} route pages, sitemap (${urls.length} urls)`);
