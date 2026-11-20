// The live happy hour widget any website can embed (alittlehang.com/embed/).
// prerender.mjs writes:
//   embed/widget.js   scripts/widget.js with the tokens filled in
//   embed/data.json   every venue, slimmed to what the widget shows
//   embed/index.html  the builder page (pick a place, copy the code)
// The embed code always carries plain credit links, which stay in the host
// page's HTML and show in the widget's footer. That's the point: every site
// that embeds it links back to the place or venue page and to the home page.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fmtRange } from "../src/lib/hours.ts";
import { dayRuns, dealPhrase, parsePrice, runLabel, topDeals } from "../src/lib/seo.ts";
import { isAlberta } from "./seo-data.mjs";

const mins = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const mask = (days) => days.reduce((m, d) => m | (1 << d), 0);
const r5 = (n) => Math.round(n * 1e5) / 1e5;

// venues: the app's venues (public/venues.json); places: buildHubs' places.
export function embedData(venues, places, { version, top }) {
  const pIndex = new Map(places.map((p, i) => [p.slug, i]));
  const where = (v) => (v.area ? v.area.name : v.city || "");
  const out = venues
    .filter((v) => v.lat != null && v.hh?.start && v.confidence !== "low")
    .map((v) => {
      const windows = [{ days: v.hh.days, start: v.hh.start, end: v.hh.end }, ...v.hh.extra].filter((w) => w.start && w.days?.length);
      const slugs = places.filter((p) => p.venues.includes(v)).map((p) => pIndex.get(p.slug));
      return {
        i: v.id,
        n: v.name,
        a: r5(v.lat),
        o: r5(v.lng),
        z: isAlberta(v) ? 1 : 0,
        r: where(v),
        p: slugs,
        s: v.score?.total ?? 0,
        // [days bitmask, start, end] in minutes; "until close" is 1439.
        w: windows.map((w) => [mask(w.days), mins(w.start), w.end ? mins(w.end) : 1439]),
        d: topDeals(v, 2).map(dealPhrase),
        // For the one-venue widget: the week ("Mon–Fri", "3–6pm") and the five cheapest deals.
        h: dayRuns(v)
          .filter((r) => r.wins.length)
          .map((r) => [runLabel(r.days), r.wins.map((w) => fmtRange(w.start, w.end)).join(" & ")]),
        f: topDeals(v, 5).map((d) => {
          const p = parsePrice(d.price);
          return [d.price.replace(/\s*ea(ch)?\.?$/i, "").trim() || (p ? `$${p.low}` : ""), d.name];
        }),
      };
    });
  const centre = (list) => (list.length ? [r5(list.reduce((s, v) => s + v.lat, 0) / list.length), r5(list.reduce((s, v) => s + v.lng, 0) / list.length)] : [null, null]);
  return {
    version,
    top,
    p: places.map((p, x) => {
      const [a, o] = centre(p.venues.filter((v) => v.lat != null));
      return { x, s: p.slug, n: p.name, k: p.kind, c: p.venues.length, a, o };
    }),
    v: out,
  };
}

// Dark by default, light on request, or "auto" to follow the visitor.
// Same tokens as the app (src/index.css) and the hub pages.
const DARK = "--ink:#1b1b1b;--ink2:#242322;--ink3:#2f2d2b;--line:#3a3835;--cream:#f3efe4;--dim:#a7a196;--orange:#ff4900;--orangefg:#ff6a2b;--lime:#ecfe54;--limefg:#ecfe54;--amber:#ffb530;--amberfg:#ffb530;--pink:#f7b2b7;--sky:#bfdbe6;--glow:rgb(236 254 84/.55);--ring:transparent";
const LIGHT = "--ink:#f5f1e7;--ink2:#fffdf8;--ink3:#ebe5d8;--line:#d8d0c0;--cream:#1b1b1b;--dim:#625c53;--orange:#ff4900;--orangefg:#bd3600;--lime:#ecfe54;--limefg:#465200;--amber:#ffb530;--amberfg:#94560a;--pink:#b03a55;--sky:#2b6478;--glow:rgb(122 138 0/.45);--ring:rgb(27 27 27/.55)";

export const WIDGET_CSS = `:host{display:block;max-width:100%;contain:content}
.w{${DARK};box-sizing:border-box;width:100%;padding:16px;border-radius:24px;background:var(--ink);color:var(--cream);font:400 14px/1.4 "ALH Sans",ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;text-align:left;container-type:inline-size}
.w[data-theme=light]{${LIGHT};box-shadow:inset 0 0 0 1px var(--line)}
@media (prefers-color-scheme:light){.w[data-theme=auto]{${LIGHT};box-shadow:inset 0 0 0 1px var(--line)}}
.w *{box-sizing:border-box}
a{color:inherit;text-decoration:none}
.head{display:flex;align-items:center;gap:12px}
.tile{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--orange)}
.tile svg{width:26px;height:25px;fill:#1b1b1b}
.ttl{flex:1;min-width:0}
.k{margin:0;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
h2{margin:2px 0 0;font:800 22px/1.05 "ALH Display","ALH Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.clock{flex:none;align-self:flex-start;padding:5px 9px;border-radius:999px;background:var(--ink2);color:var(--dim);font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 10px}
.chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:999px;background:var(--ink2);color:var(--dim);font-size:12px;font-weight:600}
.chip.on{background:var(--lime);color:#1b1b1b}
.chip.on .dot{background:#1b1b1b;box-shadow:none;animation:none}
.chip.later{color:var(--amberfg)}
.dot{display:inline-block;flex:none;width:8px;height:8px;border-radius:999px;font-style:normal;box-shadow:0 0 0 1px var(--ring)}
.dot.live{background:var(--lime);animation:pulse 2s ease-out infinite}
.dot.up{background:var(--amber)}
@keyframes pulse{0%{box-shadow:0 0 0 0 var(--glow)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
.rows{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:6px}
.rows li{min-width:0}
.rows a{min-width:0;overflow:hidden;display:flex;flex-direction:column;gap:4px;padding:11px 14px;border-radius:16px;background:var(--ink2);transition:background-color .2s,transform .2s}
.rows a:hover{background:var(--ink3)}
.rows a:active{transform:scale(.985)}
.rows a:focus-visible,.all:focus-visible,.score:focus-visible{outline:2px solid var(--orange);outline-offset:2px}
.l1,.l2{display:flex;align-items:baseline;justify-content:space-between;gap:12px;min-width:0}
.nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 16px/1.2 "ALH Display","ALH Sans",ui-sans-serif,system-ui,sans-serif}
.tm{flex:none;display:inline-flex;align-items:center;gap:6px;font:700 15px/1.2 "ALH Display","ALH Sans",ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums}
.dl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--pink);font-size:13px}
.walk{color:var(--sky)}
.st{flex:none;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.st.live,.hs.live{color:var(--limefg)}
.st.soon,.hs.soon{color:var(--orangefg)}
.st.next,.hs.next{color:var(--amberfg)}
.empty{margin:14px 0 4px;padding:14px;border-radius:16px;background:var(--ink2);color:var(--dim)}
.foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
.credit{min-width:0;color:var(--dim);font-size:12px;line-height:1.35}
::slotted(a){color:var(--dim)!important;font-weight:600;text-decoration:underline!important;text-decoration-color:var(--line)!important;text-underline-offset:2px}
.all{flex:none;display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 14px;border-radius:999px;background:var(--orange);color:#1b1b1b;font-size:13px;font-weight:600;white-space:nowrap;transition:transform .2s}
.all:hover{transform:translateY(-1px)}
.score{flex:none;align-self:flex-start;padding:6px 10px;border-radius:999px;background:var(--pink);color:#1b1b1b;font:800 14px/1 "ALH Display","ALH Sans",sans-serif;font-variant-numeric:tabular-nums}
.w[data-theme=light] .score{color:#fff}
@media (prefers-color-scheme:light){.w[data-theme=auto] .score{color:#fff}}
.hero{margin:14px 0 0;padding:14px 16px;border-radius:18px;background:var(--ink2)}
.badge{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:var(--lime);color:#1b1b1b;font-size:12px;font-weight:600}
.badge .dot{background:#1b1b1b;animation:none;box-shadow:none}
.badge.up{background:var(--amber)}
.hk{margin:0;color:var(--dim)}
.big{margin:8px 0 0;font:800 32px/1 "ALH Display","ALH Sans",ui-sans-serif,system-ui,sans-serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.hs{margin:6px 0 0;font-size:13px;font-weight:600}
.sched,.deals{list-style:none;margin:10px 0 0;padding:0 2px}
.sched li,.deals li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}
.sched li:last-child,.deals li:last-child{border:0}
.sched span{color:var(--dim)}
.sched b{font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
.deals{margin-top:6px}
.deals li{justify-content:flex-start}
.deals b{flex:none;min-width:3.6em;color:var(--pink);font-variant-numeric:tabular-nums}
.deals span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.enter .rows li,.enter .hero,.enter .sched,.enter .deals{animation:rise .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*45ms)}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
@container (max-width:330px){.clock{display:none}.foot{flex-direction:column;align-items:stretch}.all{justify-content:center}.l2{flex-direction:column;align-items:stretch;gap:2px}.st{order:-1}}
@media (prefers-reduced-motion:reduce){.dot.live{animation:none}.enter .rows li,.enter .hero,.enter .sched,.enter .deals{animation:none}.rows a,.all{transition:none}}`;

// widget.js with its build-time tokens filled in.
export function widgetJs(src, { base, version, fonts, logo }) {
  return readFileSync(src, "utf8")
    .replace(/__BASE__/g, base)
    .replace(/__VERSION__/g, version)
    .replace("__FONTS__", JSON.stringify(fonts))
    .replace("__LOGO__", logo)
    .replace("__CSS__", JSON.stringify(WIDGET_CSS))
    // Plain ASCII, so "3–6pm" and "→" survive host pages that don't declare UTF-8.
    .replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

// ---------- the /embed/ page (called by prerender.mjs with its helpers) ----------
const EMBED_PATH = "/embed/";
const EMBED_FAQ = [
  { q: "Is it free?", a: "Yes. No sign-up, no account and no fee, for any website, including bars, hotels and businesses." },
  { q: "Does it track my visitors?", a: "No. The widget sets no cookies and loads nothing but our own script, fonts and venue list. It doesn't use analytics." },
  { q: "Will it slow my site down?", a: "It loads after your page, in the background, and keeps its styles to itself, so it can't clash with your design." },
  { q: "How current is it?", a: "Times and deals come from each venue's own menu and are re-checked every night. The on-now status works out the venue's local time, to the minute." },
  { q: "Can I change how it looks?", a: "Pick dark, light or match-the-visitor above. It fills the width you give it, so put it in a column or a sidebar to make it narrower." },
  { q: "My venue is missing or wrong. What do I do?", a: "Add it from our Add a happy hour page, or tap Report a problem on its page. Venues never pay to be listed or ranked." },
];
export async function embedPage(ctx) {
  const { venues, places, hubDoc, write, SITE_GRAPH, WEBSITE_ID, breadcrumb, faqPage, esc, font, logo, BASE, SITE, TOP_SCORE, newest, sitemapDates, here, web } = ctx;
  const dataVersion = JSON.parse(readFileSync(resolve(web, "public/venues.json"), "utf8")).data_version ?? newest(venues) ?? "0";
  const data = embedData(venues, places, { version: dataVersion, top: TOP_SCORE });
  const dataJson = JSON.stringify(data);
  const ver = createHash("sha1").update(dataJson).digest("hex").slice(0, 8);
  write("embed/data.json", dataJson);
  const fonts = [
    ["ALH Display", 800, font(/^funnel-display-latin-800-/)],
    ["ALH Display", 700, font(/^funnel-display-latin-700-/)],
    ["ALH Sans", 400, font(/^funnel-sans-latin-400-/)],
    ["ALH Sans", 600, font(/^funnel-sans-latin-600-/)],
  ];
  write("embed/widget.js", widgetJs(resolve(here, "widget.js"), { base: BASE, version: ver, fonts, logo }));
  const builder = readFileSync(resolve(here, "embed-builder.js"), "utf8");
  write("embed/builder.js", builder);
  const bHash = createHash("sha1").update(builder).digest("hex").slice(0, 8);
  const url = BASE + EMBED_PATH;
  const title = `Free Live Happy Hour Widget for Your Website | ${SITE}`;
  const description = `Show which happy hours are on right now near your hotel, office or neighbourhood, or your own bar's happy hour, live on your website. Free, no sign-up, updates every night.`;
  const crumbs = [{ name: "Happy hours", path: "/" }, { name: "Widget for your site" }];
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      ...SITE_GRAPH,
      { "@type": "WebPage", "@id": url, url, name: "Live happy hour widget for your website", description, isPartOf: { "@id": WEBSITE_ID }, breadcrumb: { "@id": `${url}#breadcrumb` }, inLanguage: "en-CA" },
      { "@type": "SoftwareApplication", "@id": `${url}#widget`, name: `${SITE} happy hour widget`, applicationCategory: "WebApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" }, url },
      breadcrumb(url, crumbs),
      faqPage(url, EMBED_FAQ),
    ],
  };
  const body = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">${SITE}</a> › <span>Widget for your site</span></nav>
<p class="eyebrow">Free for any website</p>
<h1>Put live happy hours on your site</h1>
<p class="lede">One line of code shows your visitors which happy hours are on right now, and what's next, near your hotel, office or neighbourhood. Or your own bar's happy hour, with a live "on now" status. It's free, there's nothing to sign up for, and it updates itself every night from ${data.v.length} venues' own menus.</p>

<form id="wb" class="wb" data-mode="place" data-v="${ver}" autocomplete="off">
<div class="wb-controls">
<fieldset class="seg"><legend>Show</legend>
<label><input type="radio" name="mode" value="place" checked><span>Area or city</span></label>
<label><input type="radio" name="mode" value="near"><span>Near an address</span></label>
<label><input type="radio" name="mode" value="venue"><span>One venue</span></label>
</fieldset>
<div class="wb-field only-place"><label for="wb-place">Neighbourhood or city</label><select id="wb-place"><option>Loading…</option></select></div>
<div class="wb-field only-near"><label for="wb-address">Address</label><div class="wb-row"><input id="wb-address" type="search" placeholder="e.g. 900 W Georgia St, Vancouver" enterkeyhint="search"><button type="button" id="wb-find" class="wb-btn">Find</button></div>
<button type="button" id="wb-here" class="wb-link">Or use my location</button><ul id="wb-found" class="wb-found" aria-live="polite"></ul></div>
<div class="wb-field only-near"><label for="wb-label">Title <small>optional</small></label><input id="wb-label" type="text" maxlength="40" placeholder="e.g. Near the hotel"></div>
<div class="wb-field only-venue"><label for="wb-venue">Venue</label><input id="wb-venue" type="search" list="wb-venues" placeholder="Start typing a name"><datalist id="wb-venues"></datalist></div>
<div class="wb-pair">
<fieldset class="seg small"><legend>Look</legend>
<label><input type="radio" name="theme" value="dark" checked><span>Dark</span></label>
<label><input type="radio" name="theme" value="light"><span>Light</span></label>
<label><input type="radio" name="theme" value="auto"><span>Auto</span></label>
</fieldset>
<div class="wb-field not-venue"><label for="wb-limit">Spots shown</label><select id="wb-limit"><option>3</option><option selected>5</option><option>8</option></select></div>
</div>
</div>
<div class="wb-stage"><p class="wb-cap">Live preview</p><div id="wb-preview" class="wb-preview" data-surface="dark"><p class="meta">Loading the preview…</p></div></div>
<div class="wb-out">
<div class="wb-outhead"><h2>Your embed code</h2><button type="button" id="wb-copy" class="cta" disabled>Copy code</button></div>
<p class="meta">Paste it into your page's HTML where you want the widget. WordPress: a Custom HTML block. Squarespace or Wix: an Embed or Code block.</p>
<pre class="cite" id="wb-code">Loading…</pre>
</div>
</form>

<h2>Made for</h2>
<ul class="tiles uses">
<li><div><b>Hotels and short stays</b><span>"Where's good for a drink?" answered on your guest page, with walk times from your door.</span></div></li>
<li><div><b>Neighbourhood groups</b><span>Show off your area's bars and restaurants, with what's on right now.</span></div></li>
<li><div><b>Local blogs and news</b><span>A live list for your city guide that never goes stale.</span></div></li>
<li><div><b>Bars and restaurants</b><span>Your own happy hour with a live "on now" status, times and deals.</span></div></li>
</ul>

<h2>Questions</h2>
<div class="faq">${EMBED_FAQ.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</div>
<script src="/embed/widget.js?v=${ver}" async></script>
<script src="/embed/builder.js?v=${bHash}" defer></script>`;
  write(`${EMBED_PATH.slice(1)}index.html`, hubDoc({ path: EMBED_PATH, title, description, jsonld, body, image: { url: `${BASE}/og/happy-hour-index.jpg`, alt: `${SITE}'s free live happy hour widget` } }));
  sitemapDates.set(EMBED_PATH, newest(venues));
}
