# Extraction harness report

Model: `claude-haiku-4-5` · Venues: 31 · Run cost: $2.02 · Generated: 2026-08-30

| Verdict | Count | Meaning |
|---|---|---|
| PERFECT | 2 | days+times exact, every seed deal recovered w/ right price |
| GOOD | 7 | days exact, times ≤30min off, ≥60% of seed deals recovered |
| PARTIAL | 15 | days or times right, the other wrong |
| WRONG | 1 | found a happy hour but days and times both wrong |
| NOT-FOUND | 6 | model reported no happy hour on fetched pages |
| NO-DATA | 0 | crawl/extraction failed (blocked, JS-rendered, error) |

**Usable (PERFECT+GOOD): 29%** · days accuracy 76% · times exact 88% · avg deal recall 51% · avg precision 61%

| Venue | Verdict | Days | Start Δ | End Δ | Deals (found/seed) | Recall | Price acc | Conf |
|---|---|---|---|---|---|---|---|---|
| Ancora | PARTIAL | ✓ | 30m | 0m | 18/6 | 50% | 33% | 0.95 |
| Earls Test Kitchen | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.9 |
| Homer St. Cafe and Bar | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.95 |
| Hapa Izakaya Yaletown | GOOD | ✓ | 0m | 0m | 17/6 | 67% | 100% | 0.95 |
| Boulevard Kitchen & Oyster Bar | PARTIAL | ✗ | 0m | 0m | 22/6 | 67% | 100% | 0.85 |
| Chambar Belgian Restaurant | PARTIAL | ✗ | 0m | 0m | 6/6 | 50% | 67% | 0.95 |
| D/6 Lounge | WRONG | ✗ | 300m | 0m | 6/6 | 67% | 75% | 0.95 |
| Havana | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.95 |
| Brewhall | PARTIAL | ✗ | 0m | 30m | 8/5 | 80% | 100% | 0.95 |
| Glowbal | PARTIAL | ✓ | 0m | 0m | 9/6 | 33% | 0% | 0.95 |
| Central Restaurants Vancouver - Bentall | PARTIAL | ✓ | 0m | 0m | 2/8 | 25% | 100% | 0.85 |
| Tap & Barrel (Convention Centre) | GOOD | ✓ | 0m | 0m | 16/8 | 75% | 67% | 0.98 |
| P2B Restaurant & Bar | GOOD | ✓ | 0m | 0m | 14/8 | 100% | 88% | 0.95 |
| Relish The Pub | NOT-FOUND | — | — | — | — | — | — | 0.1 |
| French Creek Pub (Vancouver - Burrard) | PARTIAL | ✓ | 0m | 0m | 0/7 | 0% | — | 0.85 |
| ZUBU Ramen (Downtown) | NOT-FOUND | — | — | — | — | — | — | 0.2 |
| 1931 Gallery Bistro | GOOD | ✓ | 0m | 0m | 22/7 | 100% | 86% | 0.95 |
| Parker Rooftop | PARTIAL | ✓ | 0m | 0m | 0/8 | 0% | — | 0.95 |
| Notch8 Restaurant & Bar | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.85 |
| Hawksworth Restaurant | GOOD | ✓ | 0m | 0m | 11/8 | 63% | 80% | 0.95 |
| Banter Room | GOOD | ✓ | 0m | 0m | 14/8 | 88% | 100% | 0.95 |
| El Guapo | NOT-FOUND | — | — | — | — | — | — | 0 |
| Tacofino Yaletown Burrito Bar | NOT-FOUND | — | — | — | — | — | — | 0.9 |
| The Greek by Anatoli — Yaletown | PERFECT | ✓ | 0m | 0m | 25/8 | 100% | 100% | 0.98 |
| The Parlour | GOOD | ✓ | 0m | 0m | 16/8 | 100% | 63% | 0.95 |
| The Flying Pig (Yaletown) | PARTIAL | ✗ | 0m | 0m | 24/8 | 100% | 100% | 0.95 |
| The Keg Steakhouse + Bar (Yaletown) | PARTIAL | ✗ | 0m | 0m | 0/8 | 0% | — | 0.8 |
| Earls Yaletown | PARTIAL | ✓ | 0m | 0m | 0/8 | 0% | — | 0.95 |
| Moltaqa Moroccan Restaurant | NOT-FOUND | — | — | — | — | — | — | 0 |
| Alchemy Bar & Kitchen | PERFECT | ✓ | 0m | 0m | 18/8 | 100% | 100% | 0.95 |
| Yaletown Brewing Company | NOT-FOUND | — | — | — | — | — | — | 0.95 |

## Failure detail
- **D/6 Lounge** (WRONG): see extracted.json
- **Relish The Pub** (NOT-FOUND): Website has a 'Happy Hour' navigation tab but the actual schedule, times, and deals were not captured in the provided cached pages. Contact venue directly at (6
- **ZUBU Ramen (Downtown)** (NOT-FOUND): HAPPY HOUR section listed in menu navigation for downtown location but actual schedule, times, and deals not visible in cached page content. Content appears dyn
- **El Guapo** (NOT-FOUND): Cached homepage content shows only 'Loading..' with no happy hour information visible. Page appears to be client-side rendered and was not fully loaded in cache
- **Tacofino Yaletown Burrito Bar** (NOT-FOUND): Homepage shows only regular operating hours (Sun–Thu 11am–10pm, Fri–Sat 11am–11pm). No happy hour information published. PDF provided is from Ocho (Mount Pleasa
- **Moltaqa Moroccan Restaurant** (NOT-FOUND): Menu navigation includes a 'Happy Hour' link, but the actual happy hour details are not shown in the provided cached pages. The menu page appears truncated. No 
- **Yaletown Brewing Company** (NOT-FOUND): No happy hour schedule found on website, food menu, drink menu, or menu PDF. All menu items listed at full prices with no time-based discounts or special deals 

---

# Comparison run: claude-opus-5 (same crawl cache)


Model: `claude-opus-5` · Venues: 31 · Run cost: $10.43 · Generated: 2026-08-30

| Verdict | Count | Meaning |
|---|---|---|
| PERFECT | 2 | days+times exact, every seed deal recovered w/ right price |
| GOOD | 9 | days exact, times ≤30min off, ≥60% of seed deals recovered |
| PARTIAL | 15 | days or times right, the other wrong |
| WRONG | 0 | found a happy hour but days and times both wrong |
| NOT-FOUND | 5 | model reported no happy hour on fetched pages |
| NO-DATA | 0 | crawl/extraction failed (blocked, JS-rendered, error) |

**Usable (PERFECT+GOOD): 35%** · days accuracy 81% · times exact 88% · avg deal recall 55% · avg precision 59%

| Venue | Verdict | Days | Start Δ | End Δ | Deals (found/seed) | Recall | Price acc | Conf |
|---|---|---|---|---|---|---|---|---|

## claude-haiku-4-5 vs claude-opus-5 — venue-level disagreements

| Venue | seed | claude-haiku-4-5 | claude-opus-5 |
|---|---|---|---|
| Ancora | days[0,1,2,3,4,5,6] 14:30-17:00 6 deals | days[0,1,2,3,4,5,6] 14:00-17:00 18 deals | days[0,1,2,3,4,5,6] 14:00-17:00 20 deals |
| Boulevard Kitchen & Oyster Bar | days[0,1,2,3,4,5,6] 15:00-17:00 6 deals | days[] 15:00-17:00 22 deals | days[0,1,2,3,4,5,6] 15:00-17:00 21 deals |
| Chambar Belgian Restaurant | days[1,2,3,4,5] 15:00-16:30 6 deals | days[0,6] 15:00-16:30 6 deals | days[0,6] 15:00-16:30 22 deals |
| D/6 Lounge | days[0,1,2,3,4,5,6] 17:00-19:00 6 deals | days[0,3,4,5,6] 12:00-19:00 6 deals | days[0,3,4,5,6] 17:00-19:00 11 deals |
| Tap & Barrel (Convention Centre) | days[0,1,2,3,4,5,6] 14:00-17:30 8 deals | days[0,1,2,3,4,5,6] 14:00-17:30 16 deals | days[0,1,2,3,4,5,6] 14:00-17:30 42 deals |
| 1931 Gallery Bistro | days[0,1,2,3,4,5,6] 14:00-17:00 7 deals | days[0,1,2,3,4,5,6] 14:00-17:00 22 deals | days[0,1,2,3,4,5,6] 14:00-17:00 38 deals |
| Hawksworth Restaurant | days[0,1,2,3,4,5,6] 16:00-18:00 8 deals | days[0,1,2,3,4,5,6] 16:00-18:00 11 deals | days[0,1,2,3,4,5,6] 16:00-18:00 26 deals |
| Banter Room | days[0,1,2,3,4,5,6] 14:00-17:00 8 deals | days[0,1,2,3,4,5,6] 14:00-17:00 14 deals | days[0,1,2,3,4,5,6] 14:00-17:00 17 deals |
| Yaletown Brewing Company | days[0,1,2,3,4,5,6] 15:00-18:00 8 deals | not-found | days[0,1,2,3,4,5,6] 14:00-17:00 0 deals |

22/31 venues: both models extracted identical schedules.

## Findings

1. **The crawler, not the model, is the ceiling.** Both models produced 15
   PARTIALs and ~90% exact times; nearly every deal-recall zero and
   NOT-FOUND traces to pages the depth-1 static crawl never captured
   (JS-rendered menus: El Guapo caches as "Loading..", Relish/ZUBU/Moltaqa
   have Happy Hour tabs whose content isn't in the HTML). A Playwright
   render fallback is the highest-leverage next step for either model.
2. **Model agreement is a trust signal.** 22/31 venues: identical schedules
   from both models. Where they agree against the seed, the seed is the
   suspect — both independently read Chambar as **weekend-only** (seed:
   Mon–Fri) and D/6 as **closed Mon–Tue** (seed: daily). These look like
   stale seed entries; queue for re-verification.
3. **What Opus buys over Haiku:** ~2× deal completeness on menu-dense venues
   (42 vs 16 at Tap & Barrel; 38 vs 22 at 1931), better rule-following on
   tricky windows (D/6 primary window right where Haiku merged windows;
   Boulevard days filled vs left empty), and one extra find (Yaletown
   Brewing, conf 0.6 — unverified). Schedules tie. List-price cost: $10.43
   vs $2.02 per full run.
4. **Verdict counts understate quality**: extractions routinely recover the
   venue's real itemized menu where the seed stores a 6-line summary, and
   "misses" include correct refusals (Tacofino: declined to use a sister
   location's PDF) and honest blanks (Boulevard days[]). PERFECT/GOOD vs
   the seed is a floor, not a grade.

## Recommendation

Fix the crawler first (render fallback), keep extraction on the smarter
model unless run frequency makes cost bite (at 31 venues even Opus is ~$10
list per full run; Batches API halves it), and use two-model disagreement
as the automatic trigger for the human review queue.
