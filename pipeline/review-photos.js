// Phase 9b: look at the photos site-photos.js picked, the way a person would.
//
// The pixel checks in web/scripts/photo-quality.mjs catch transparent logos,
// flat graphics and near-black frames, but not a staff headshot, a logo
// painted on wood, a "Special Offer" flyer or the same dessert cropped two
// ways. QA found about 1 in 10 covers like that after the first run. This
// shows Claude each venue's current cover plus the site photos (small JPEG
// copies) and keeps only the ones that show the place, its food or its
// drinks. It also picks the cover and drops near-duplicates.
//
// Runs on the Claude Code CLI (lib/claude.js), so it uses the subscription
// token, not API credits. Results are written back into site-photos.json:
//   cover / gallery    filtered and reordered
//   cover_problem      set to "review: <why>" when the current cover fails
//   review             { at, key, rejected: [{ url, why }] }
// A venue is reviewed again only when its set of photos changes.
//
// Usage: node pipeline/review-photos.js [--only id1,id2] [--max 500]
//          [--concurrency 3] [--model id]
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseArgs, readJson, CACHE_DIR, REPO_ROOT } from "./lib/venues.js";
import { curlGet, mapConcurrent } from "./lib/curl.js";
import { callClaude, parseJsonReply, DEFAULT_MODEL } from "./lib/claude.js";
import { createRequire } from "node:module";

// sharp comes with the web app's dependencies (the site build resizes photos).
const sharp = createRequire(path.join(REPO_ROOT, "web", "package.json"))("sharp");

const args = parseArgs(process.argv.slice(2));
const STORE = path.join(REPO_ROOT, "pipeline", "site-photos.json");
const WORK = path.join(CACHE_DIR, "review-photos");
const TODAY = new Date().toISOString().slice(0, 10);
const MAX = Number(args.max) || 500;
const MODEL = args.model || process.env.EXTRACT_MODEL || DEFAULT_MODEL;
const deadline = Date.now() + Number(process.env.REVIEW_PHOTOS_DEADLINE_MS || 40 * 60_000);

const { venues } = readJson(path.join(REPO_ROOT, "venues.json"), { venues: [] });
const byId = new Map(venues.map((v) => [v.id, v]));
const store = readJson(STORE, {});
const save = () => fs.writeFileSync(STORE, JSON.stringify(Object.fromEntries(Object.entries(store).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n");

// The photos a venue would show: its current cover (unless already judged
// bad and being replaced), then the site photos.
function candidates(id, sp) {
  const v = byId.get(id);
  const list = [];
  const current = v?.cover_image?.url;
  // A cover writeback already swapped in from this store is judged as a site photo.
  if (current && /^https?:/.test(current) && !sp.cover_problem && current !== sp.cover?.url) list.push({ url: current, role: "current" });
  if (sp.cover) list.push({ url: sp.cover.url, role: "site", photo: sp.cover });
  for (const g of sp.gallery || []) list.push({ url: g.url, role: "site", photo: g });
  return list.slice(0, 12);
}
const keyOf = (list) => createHash("sha1").update(list.map((c) => c.url).join("\n")).digest("hex").slice(0, 12);

const only = args.only ? new Set(String(args.only).split(",")) : null;
const targets = Object.entries(store)
  .filter(([id, sp]) => byId.has(id) && (only ? only.has(id) : true))
  .map(([id, sp]) => ({ id, sp, list: candidates(id, sp) }))
  .filter((t) => t.list.length && (only || t.sp.review?.key !== keyOf(t.list)))
  .slice(0, MAX);
console.log(`${targets.length} venues to review (model ${MODEL})`);
if (!targets.length) process.exit(0);

async function review({ id, sp, list }) {
  const v = byId.get(id);
  const dir = path.join(WORK, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const shown = [];
  for (const c of list) {
    const raw = path.join(dir, `raw${shown.length}`);
    const res = await curlGet(c.url, raw, { timeout: 20 });
    if (res.status !== 200 || !res.contentType.startsWith("image/")) continue;
    const file = `photo${shown.length + 1}.jpg`;
    try {
      await sharp(raw, { failOn: "none" }).rotate().resize({ width: 640, height: 640, fit: "inside" }).flatten({ background: "#ffffff" }).jpeg({ quality: 80 }).toFile(path.join(dir, file));
      shown.push({ ...c, file });
    } catch {
      // unreadable, leave it out
    }
    fs.rmSync(raw, { force: true });
  }
  if (!shown.length) return null;

  const prompt = `You choose photos for a venue page in a happy hour app. Output ONLY one JSON object, no markdown fences, no commentary.

Venue: ${v.name}, ${v.formatted_address || ""}

Read every one of these images with your Read tool before answering:
${shown.map((s) => `- ${s.file}`).join("\n")}

For each image decide keep true/false.
KEEP only photos that show this place or what it serves: the dining room, bar, patio, exterior or view, plated food, drinks or cocktails, a lively room with guests in it.
REJECT:
- a logo, wordmark, sign graphic or logo painted/printed on a surface, even photographed
- a flyer, poster, promo ("Special Offer"), menu, price list, gift card or any image that is mostly text
- people as the subject: staff or chef portraits, team headshots, group photos, cheque presentations, event photos of a crowd posing
- black-and-white or historic photos, screenshots, maps, illustrations, stock-looking clip art
- anything not plausibly this venue (another business, a casino floor of slot machines, a hotel lobby with no bar or restaurant in sight)
- a near-duplicate of an earlier image in the list (same dish, room or scene, even cropped or recoloured differently): keep the better one only.

Then pick the best cover among the kept images: bright, inviting, shows the room, bar or food; never a close-up of a person.

Schema:
{"photos":[{"file":"photo1.jpg","keep":true,"why":"bar interior"}],"cover":"photo1.jpg or null"}`;

  const reply = await callClaude(prompt, { model: MODEL, allowRead: true, cwd: dir, timeoutMs: 240_000 });
  fs.rmSync(dir, { recursive: true, force: true });
  if (!reply.ok) throw new Error(reply.error || "claude failed");
  const out = parseJsonReply(reply.text);
  const verdict = new Map((out.photos || []).map((p) => [p.file, p]));
  // An image the model didn't mention is not trusted.
  const kept = shown.filter((s) => verdict.get(s.file)?.keep === true);
  const rejected = shown.filter((s) => !kept.includes(s)).map((s) => ({ url: s.url, why: String(verdict.get(s.file)?.why || "not reviewed").slice(0, 80) }));
  const coverPick = kept.find((s) => s.file === out.cover) || null;
  return { shown, kept, rejected, coverPick };
}

let done = 0;
let failed = 0;
await mapConcurrent(targets, Number(args.concurrency) || 3, async (t) => {
  if (Date.now() > deadline) return;
  try {
    const r = await review(t);
    if (!r) return;
    const { sp } = t;
    const current = r.shown.find((s) => s.role === "current");
    const site = r.kept.filter((s) => s.role === "site");
    // Cover: the model's pick when it's a site photo, else the first kept
    // site photo; the current cover stays when it passed and wasn't beaten.
    const pick = r.coverPick?.role === "site" ? r.coverPick : current && r.kept.includes(current) ? null : site[0] || null;
    if (current && !r.kept.includes(current)) sp.cover_problem = `review: ${r.rejected.find((x) => x.url === current.url)?.why || "rejected"}`;
    const replacing = !!pick && (!!sp.cover_problem || r.coverPick === pick);
    if (replacing && !sp.cover_problem) sp.cover_problem = "review: a better photo";
    sp.cover = pick ? pick.photo : null;
    sp.gallery = site.filter((s) => s !== pick).map((s) => s.photo);
    sp.review = { at: TODAY, key: keyOf(candidates(t.id, sp)), rejected: r.rejected };
    done++;
    console.log(`  ${t.id.padEnd(34)} kept ${r.kept.length}/${r.shown.length}${r.rejected.length ? `  (${r.rejected.map((x) => x.why).join("; ").slice(0, 120)})` : ""}`);
  } catch (e) {
    failed++;
    console.log(`  ! ${t.id.padEnd(34)} ${String(e.message || e).slice(0, 160)}`);
  }
  save();
});
save();
console.log(`\nreview: ${done} venues reviewed, ${failed} failed`);
