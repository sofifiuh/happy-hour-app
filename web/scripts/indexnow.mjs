// Tells IndexNow (Bing, Yandex, Seznam, Naver...) which pages changed, so
// they recrawl them within hours instead of waiting for the sitemap.
// Google doesn't use IndexNow; it reads the sitemap in Search Console.
//
//   node scripts/indexnow.mjs diff    compares dist-site's sitemaps with the
//                                     live ones, writes indexnow-urls.txt
//   node scripts/indexnow.mjs submit  sends indexnow-urls.txt (run after deploy,
//                                     once the new pages and key file are live)
//
// INDEXNOW_ALL=1 makes `diff` list every URL (first submission, or a resend).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://alittlehang.com";
const HOST = "alittlehang.com";
const LIST = resolve(web, "indexnow-urls.txt");
const keyFile = readdirSync(resolve(web, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
const key = keyFile?.slice(0, -4);

// url -> lastmod for every <url> in the sitemap index's child sitemaps.
function entries(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)) out.set(m[1], m[2] ?? "");
  return out;
}
const children = (index) => [...index.matchAll(/<loc>[^<]*\/(sitemap-[\w-]+\.xml)<\/loc>/g)].map((m) => m[1]);

async function live(file) {
  try {
    const r = await fetch(`${SITE}/${file}`, { headers: { "Cache-Control": "no-cache" } });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

if (process.argv[2] === "diff") {
  const dist = resolve(web, "dist-site");
  const next = new Map();
  for (const f of children(readFileSync(resolve(dist, "sitemap.xml"), "utf8"))) for (const [u, d] of entries(readFileSync(resolve(dist, f), "utf8"))) next.set(u, d);
  const prev = new Map();
  let liveOk = process.env.INDEXNOW_ALL !== "1";
  if (liveOk) {
    const index = await live("sitemap.xml");
    if (!index) liveOk = false;
    else for (const f of children(index)) for (const [u, d] of entries((await live(f)) ?? "")) prev.set(u, d);
  }
  // New URLs, and URLs whose lastmod moved. Without the live sitemaps, everything.
  const changed = [...next].filter(([u, d]) => !liveOk || prev.get(u) !== d).map(([u]) => u);
  writeFileSync(LIST, changed.join("\n"));
  console.log(`indexnow: ${changed.length} of ${next.size} URLs changed${liveOk ? "" : " (sending all)"}`);
} else if (process.argv[2] === "submit") {
  if (!key) throw new Error("no IndexNow key file in web/public");
  const urls = existsSync(LIST) ? readFileSync(LIST, "utf8").split("\n").filter(Boolean) : [];
  if (!urls.length) {
    console.log("indexnow: nothing changed");
    process.exit(0);
  }
  // The key file must be live before engines will accept the ping.
  const k = await live(`${key}.txt`);
  if (k?.trim() !== key) throw new Error(`indexnow: ${SITE}/${key}.txt isn't live yet`);
  for (let i = 0; i < urls.length; i += 10000) {
    const urlList = urls.slice(i, i + 10000);
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList }),
    });
    console.log(`indexnow: sent ${urlList.length} URLs, HTTP ${r.status}`);
    if (r.status >= 400) throw new Error(await r.text());
  }
}
