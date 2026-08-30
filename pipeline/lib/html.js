// Minimal HTML utilities — no dependencies. Good enough for menu pages;
// JS-rendered sites are a known limitation reported by the harness.

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "’",
  lsquo: "‘", ldquo: "“", rdquo: "”", bull: "•",
  eacute: "é", amp_: "&",
};

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export function htmlToText(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|iframe|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article|\/header|\/td|\/th)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract [{href, text}] from raw HTML. */
export function extractLinks(html) {
  const links = [];
  const re = /<a\b[^>]*?href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "").trim();
    const text = htmlToText(m[5] ?? "").replace(/\n/g, " ").slice(0, 120);
    if (href) links.push({ href, text });
  }
  return links;
}

const POSITIVE = [
  [/happy[\s_-]?hour/, 100],
  [/\bhh\b/, 10],
  [/special/, 25],
  [/\bdeal/, 20],
  [/drink/, 15],
  [/menu/, 12],
  [/hour/, 6],
];
const NEGATIVE = /(brunch|career|job|gift|reservation|private|event|contact|about-?us|blog|press|catering|franchis|privacy|terms|login|cart|instagram\.com|facebook\.com|twitter|tiktok|youtube|opentable|mailto:|tel:)/;

export function scoreLink(href, text) {
  const s = (href + " " + text).toLowerCase();
  let score = 0;
  for (const [re, pts] of POSITIVE) if (re.test(s)) score += pts;
  if (NEGATIVE.test(s)) score -= 40;
  if (/\.pdf(\?|#|$)/.test(href.toLowerCase())) score += 5;
  return score;
}

function registrableDomain(hostname) {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  return parts.slice(-2).join(".");
}

/**
 * From a page's links, pick candidate happy-hour/menu URLs.
 * Same-site links need score > 0; cross-domain links only pass when they
 * explicitly mention happy hour (menus hosted on popmenu/spotapps/etc).
 */
export function pickCandidates(links, baseUrl, { max = 5 } = {}) {
  const base = new URL(baseUrl);
  const baseDomain = registrableDomain(base.hostname);
  const seen = new Set();
  const scored = [];
  for (const { href, text } of links) {
    let u;
    try { u = new URL(href, baseUrl); } catch { continue; }
    if (!/^https?:$/.test(u.protocol)) continue;
    u.hash = "";
    const key = u.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    const score = scoreLink(u.pathname + u.search, text);
    const sameSite = registrableDomain(u.hostname) === baseDomain;
    if (sameSite ? score <= 0 : score < 100) continue;
    scored.push({ url: key, text, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}
