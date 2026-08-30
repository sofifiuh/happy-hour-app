# Happy hour data pipeline

Build-time pipeline that populates venue happy-hour data from each venue's
**own official website** — never from aggregators (their ToS forbid reuse)
and never by scraping Google Maps (same). It currently runs as a **scoring
harness**: extractions are compared against the 31 hand-verified records in
`venues-data.js` to measure whether automation can be trusted before it is
allowed to write anything.

## Phases

```
node pipeline/crawl.js              # 1. fetch homepage + candidate HH/menu pages -> cache/
node pipeline/extract.js            # 2. Claude turns cached pages into structured JSON -> results/
node pipeline/score.js --write      # 3. compare vs hand-verified seed -> REPORT.md
```

Useful flags: `--only <venue-id>` (crawl/extract), `--force` (extract: redo
venues that already have results), `--model <id>` (extract, default
`claude-haiku-4-5`), `--concurrency N`.

1. **Crawl** (`crawl.js`) — fetches each venue's homepage via `curl`
   (honors the environment proxy/CA), discovers candidate pages by scoring
   link href+text for happy-hour/specials/menu keywords, and caches up to 5
   candidates per venue. PDFs are detected and cached as-is. Cross-domain
   links are only followed when they explicitly mention happy hour.
2. **Extract** (`extract.js`) — per venue, converts cached HTML to text and
   prompts Claude for a strict JSON object (schema in the prompt): days as
   `0=Sun..6=Sat` (the app's `Date.getDay()` convention), 24h `HH:MM`
   times, deals with name/price/category. PDF menus are read natively via
   the model's Read tool. Guardrails in the prompt: ignore sister
   restaurants in shared group-site navigation, match the exact address
   (chains), primary window only (extras go in `notes`), never guess —
   `found: false` beats fabrication. Output is validated (`lib/claude.js`)
   and a venue that fails validation is reported, not trusted.
3. **Score** (`score.js`) — per venue: day-set equality, start/end minute
   deltas, greedy fuzzy matching of seed deals against extracted deals
   (recall/precision + price accuracy), rolled into verdicts
   (PERFECT/GOOD/PARTIAL/WRONG/NOT-FOUND/NO-DATA). `--write` saves
   `pipeline/REPORT.md`.

## Engine & auth

`lib/claude.js` calls headless `claude -p` — it reuses the machine's
existing Claude Code auth, so the harness needs **no API key**. When this
moves to a scheduled GitHub Action, swap that one file for
`@anthropic-ai/sdk` + an `ANTHROPIC_API_KEY` secret (the Batches API halves
cost and fits a nightly job); nothing else changes.

## Rules that must survive into any write-back step

- `happy_hour` on hand-verified records (`verified: true`) is never
  overwritten automatically; automated extractions land as
  `verified: false` with their `source_url`, for human review.
- Aggregator sites may be used for **leads only** (venue names), never as
  the source of any stored fact.
- Google Places (if added later, for discovery/identity fields) has limited
  field-caching terms — sync on a schedule rather than committing
  long-lived copies, and don't re-host Places photos; `cover_image` stays
  sourced from venues' own sites with credit.

## Known limitations (by design, reported not hidden)

- JS-rendered sites yield empty text (`no usable page content`) — a
  Playwright/Chromium render fallback is the fix if the count warrants it.
- Sites that block non-browser clients will show as homepage HTTP 403.
- One primary window per venue (matches the app schema); late-night second
  windows are captured in `notes` only.

`cache/` and `results/` are gitignored scratch; `REPORT.md` is committed as
the record of each harness run. `discovered.json` is the committed canonical
store of discovered venues — `venues-extracted.js` is a pure render of the
inputs and can always be regenerated.

## Weekly re-sync (venues change their offers)

The full adaptation loop, runnable by hand or on a schedule:

```
node pipeline/crawl.js --render auto
node pipeline/extract.js --model claude-opus-5 --out extracted-opus.json --force
node pipeline/score.js --write
node pipeline/crawl.js --venues pipeline/discovered.json --render auto
node pipeline/extract.js --venues pipeline/discovered.json --out extracted-discovered.json --force
node pipeline/places-sync.js   # needs GOOGLE_PLACES_API_KEY (env or gitignored pipeline/secrets.json); skips itself if absent
node pipeline/writeback.js     # emits venues.json — the merged dataset the app fetches
node pipeline/build-pages.js   # regenerates spots/*.html, sitemap.xml (crawlable per-venue pages)
```

Then browser-validate index.html locally and commit. Every regeneration
stamps `EXTRACTED_DATA_VERSION` into venues-extracted.js, which app.js folds
into `SEED_VERSION` — cached clients reseed automatically, no hand-bump.
Hand-verified schedules still never auto-change (disagreements accumulate in
`results/review-queue.json` for a human); unverified discovered venues update
freely on each re-sync.
