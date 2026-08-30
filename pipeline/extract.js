// Phase 2: run Claude over each venue's cached pages and emit structured
// happy-hour JSON to pipeline/results/extracted.json.
// Usage: node pipeline/extract.js [--model claude-haiku-4-5] [--only <id>]
//        [--concurrency 3] [--force]
import fs from "node:fs";
import path from "node:path";
import { loadSeed, parseArgs, CACHE_DIR, RESULTS_DIR } from "./lib/venues.js";
import { mapConcurrent } from "./lib/curl.js";
import { htmlToText } from "./lib/html.js";
import { callClaude, parseJsonReply, validateExtraction, DEFAULT_MODEL } from "./lib/claude.js";

const args = parseArgs(process.argv.slice(2));
const MODEL = args.model || DEFAULT_MODEL;
const PER_PAGE_CHARS = 12000;
const TOTAL_CHARS = 45000;
const OUT_FILE = path.join(RESULTS_DIR, args.out || "extracted.json");

const only = args.only ? String(args.only).split(",") : null;
const venues = loadSeed().filter((v) => !only || only.includes(v.id));
fs.mkdirSync(RESULTS_DIR, { recursive: true });
const previous = !args.force && fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) : {};

const SCHEMA = `{
  "found": boolean,            // true only if this venue's happy hour was located
  "confidence": number,        // 0.0-1.0, how confident you are in the extraction
  "source_url": string|null,   // URL of the page the info came from
  "happy_hour": null | {
    "days": number[],          // days of week it runs; 0=Sunday, 1=Monday ... 6=Saturday
    "start": "HH:MM",          // 24-hour clock, e.g. "15:00"
    "end": "HH:MM",
    "deals": [ { "name": string, "price": string, "category": "food"|"drink", "description": string } ]
  },
  "notes": string              // ambiguities: second late-night window, seasonal, per-location caveats, etc.
}`;

function buildPrompt(venue, pages, pdfPaths) {
  const pageBlocks = pages
    .map((p) => `--- PAGE (${p.role}) ${p.url} ---\n${p.text}`)
    .join("\n\n");
  const pdfBlock = pdfPaths.length
    ? `\nSome menus are PDF files. Read each of these with your Read tool before answering:\n${pdfPaths.map((p) => `- ${p.file} (from ${p.url})`).join("\n")}\n`
    : "";
  return `You are a strict data-extraction engine for a happy hour app. Output ONLY one JSON object matching the schema below — no markdown fences, no commentary before or after.

TARGET VENUE (extract for this exact venue and location only):
  Name: ${venue.name}
  Address: ${venue.formatted_address}
  Website: ${venue.website}

Schema:
${SCHEMA}

Rules:
1. Extract only a genuine HAPPY HOUR (may be called happy hour, social hour, aperitivo hour, etc.). Lunch specials, brunch menus, daily prix-fixe, or event nights do NOT count unless the venue itself labels them happy hour.
2. Restaurant-group websites often list sister restaurants in shared navigation or footers. Ignore anything that belongs to a different restaurant or a different location of this chain — the extraction must match the venue name AND address above. If the site only shows another location's happy hour, set found=false and explain in notes.
3. If there are multiple happy hour windows (e.g. afternoon + late night), put the PRIMARY afternoon/early-evening window in happy_hour and describe the others in notes.
4. days uses 0=Sunday through 6=Saturday. "Daily"/"every day" = [0,1,2,3,4,5,6]. "Weekdays" = [1,2,3,4,5].
5. Times are 24-hour "HH:MM". "5pm" = "17:00". If an end time is "close"/"late", use the venue's stated closing time if shown, otherwise omit the window entirely and set found=false with a note.
6. Deal prices are short strings exactly as advertised: "$8", "$3 off", "50% off", "$11-19", "$3 ea". category is "food" or "drink". Keep deal names short (the item), details in description.
7. NEVER invent or guess. If the pages don't contain the happy hour schedule, found=false, happy_hour=null. An empty deals list is fine if times are stated but deals aren't.
${pdfBlock}
=== CACHED PAGES FOR THIS VENUE ===

${pageBlocks}`;
}

async function extractVenue(venue) {
  if (previous[venue.id] && !previous[venue.id].error) return previous[venue.id];

  const dir = path.join(CACHE_DIR, venue.id);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return { id: venue.id, error: "not crawled" };
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const okPages = manifest.pages.filter((p) => p.status >= 200 && p.status < 400);
  if (okPages.length === 0) return { id: venue.id, error: `no fetched pages (homepage ${manifest.pages[0]?.status || "n/a"} ${manifest.pages[0]?.error || ""})`.trim() };

  const pdfPaths = [];
  const textPages = [];
  let budget = TOTAL_CHARS;
  // Highest-score candidates first, homepage last (usually nav boilerplate).
  const ordered = [...okPages].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  for (const p of ordered) {
    const file = path.join(dir, p.file);
    if (!fs.existsSync(file)) continue;
    if (p.file.endsWith(".pdf")) {
      pdfPaths.push({ file, url: p.url });
      continue;
    }
    if (budget <= 0) continue;
    const text = htmlToText(fs.readFileSync(file, "utf8")).slice(0, Math.min(PER_PAGE_CHARS, budget));
    if (text.length < 40) continue; // JS-rendered shell or empty page
    budget -= text.length;
    textPages.push({ url: p.url, role: p.role, text });
  }
  if (textPages.length === 0 && pdfPaths.length === 0) {
    return { id: venue.id, error: "no usable page content (JS-rendered site?)" };
  }

  const prompt = buildPrompt(venue, textPages, pdfPaths);
  let reply = await callClaude(prompt, { model: MODEL, allowRead: pdfPaths.length > 0, cwd: dir });
  let costUsd = reply.costUsd;
  let extraction = null;
  let parseError = null;

  for (let attempt = 0; attempt < 2 && !extraction; attempt++) {
    if (attempt > 0) {
      reply = await callClaude(prompt + "\n\nREMINDER: reply with ONLY the JSON object.", { model: MODEL, allowRead: pdfPaths.length > 0, cwd: dir });
      costUsd += reply.costUsd;
    }
    if (!reply.ok) { parseError = reply.error; continue; }
    try {
      extraction = parseJsonReply(reply.text);
      parseError = null;
    } catch (e) {
      parseError = `${e.message}; raw: ${reply.text.slice(0, 200)}`;
    }
  }

  if (!extraction) return { id: venue.id, error: `extraction failed: ${parseError}`, costUsd };
  const problems = validateExtraction(extraction);
  const record = {
    id: venue.id,
    model: MODEL,
    pages_used: textPages.map((p) => p.url),
    pdfs_used: pdfPaths.map((p) => p.url),
    costUsd,
    validation_problems: problems,
    extraction,
  };
  const status = extraction.found ? `found (conf ${extraction.confidence})` : "not found";
  console.log(`${venue.id.padEnd(28)} ${status}${problems.length ? `  INVALID: ${problems.join("; ")}` : ""}  $${costUsd.toFixed(4)}`);
  return record;
}

const records = await mapConcurrent(venues, Number(args.concurrency) || 3, extractVenue);
const out = { ...previous };
for (const r of records) out[r.id] = r;
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));

const done = records.filter((r) => !r.error);
const totalCost = records.reduce((s, r) => s + (r.costUsd || 0), 0);
console.log(`\n${done.length}/${records.length} venues extracted. Model: ${MODEL}. Cost this run: $${totalCost.toFixed(3)}`);
console.log(`Results: ${OUT_FILE}`);
for (const r of records.filter((r) => r.error)) console.log(`  SKIPPED ${r.id}: ${r.error}`);
