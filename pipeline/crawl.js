// Phase 1: for each venue, fetch its homepage, discover candidate
// happy-hour/menu pages, and cache everything under pipeline/cache/<id>/.
// Usage: node pipeline/crawl.js [--only <id>] [--concurrency 6]
import fs from "node:fs";
import path from "node:path";
import { loadSeed, parseArgs, CACHE_DIR } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { extractLinks, pickCandidates } from "./lib/html.js";

const args = parseArgs(process.argv.slice(2));
const venues = loadSeed().filter((v) => !args.only || v.id === args.only);

function extFor(contentType, url) {
  if (contentType.includes("pdf") || /\.pdf(\?|#|$)/i.test(url)) return "pdf";
  return "html";
}

async function crawlVenue(venue) {
  const dir = path.join(CACHE_DIR, venue.id);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = { id: venue.id, name: venue.name, website: venue.website, crawled_at: new Date().toISOString(), pages: [] };

  if (!venue.website) {
    manifest.error = "no website in seed";
  } else {
    // Homepage
    const homeFile = path.join(dir, "page0.html");
    const home = await curlGet(venue.website, homeFile);
    manifest.pages.push({ url: venue.website, role: "homepage", file: "page0.html", ...home });

    // Candidate subpages discovered from homepage links
    if (home.status >= 200 && home.status < 400 && !home.contentType.includes("pdf")) {
      const html = fs.readFileSync(homeFile, "utf8");
      const candidates = pickCandidates(extractLinks(html), home.finalUrl || venue.website);
      let i = 1;
      for (const cand of candidates) {
        const probeExt = /\.pdf(\?|#|$)/i.test(cand.url) ? "pdf" : "html";
        let file = `page${i}.${probeExt}`;
        const res = await curlGet(cand.url, path.join(dir, file));
        const realExt = extFor(res.contentType, res.finalUrl || cand.url);
        if (realExt !== probeExt) {
          const renamed = `page${i}.${realExt}`;
          try { fs.renameSync(path.join(dir, file), path.join(dir, renamed)); file = renamed; } catch {}
        }
        manifest.pages.push({ url: cand.url, role: "candidate", linkText: cand.text, score: cand.score, file, ...res });
        i++;
      }
    }
  }

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  const okPages = manifest.pages.filter((p) => p.status >= 200 && p.status < 400).length;
  console.log(`${venue.id.padEnd(28)} ${okPages}/${manifest.pages.length} pages ok` +
    (manifest.pages[0] && manifest.pages[0].status >= 400 ? `  [homepage HTTP ${manifest.pages[0].status}]` : "") +
    (manifest.pages[0] && manifest.pages[0].error ? `  [${manifest.pages[0].error}]` : ""));
  return manifest;
}

const manifests = await mapConcurrent(venues, Number(args.concurrency) || 6, crawlVenue);
const totalOk = manifests.filter((m) => m.pages.some((p) => p.status >= 200 && p.status < 400)).length;
console.log(`\n${totalOk}/${venues.length} venues have at least one fetched page.`);
