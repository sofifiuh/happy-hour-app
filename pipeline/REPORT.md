# Extraction harness report

Model: `claude-opus-5` · Venues: 31 · Run cost: $8.19 · Generated: 2026-08-30

| Verdict | Count | Meaning |
|---|---|---|
| PERFECT | 2 | days+times exact, every seed deal recovered w/ right price |
| GOOD | 9 | days exact, times ≤30min off, ≥60% of seed deals recovered |
| PARTIAL | 13 | days or times right, the other wrong |
| WRONG | 1 | found a happy hour but days and times both wrong |
| NOT-FOUND | 6 | model reported no happy hour on fetched pages |
| NO-DATA | 0 | crawl/extraction failed (blocked, JS-rendered, error) |

**Usable (PERFECT+GOOD): 35%** · days accuracy 80% · times exact 92% · avg deal recall 55% · avg precision 62%

| Venue | Verdict | Days | Start Δ | End Δ | Deals (found/seed) | Recall | Price acc | Conf |
|---|---|---|---|---|---|---|---|---|
| Ancora | GOOD | ✓ | 0m | 0m | 20/6 | 67% | 50% | 0.85 |
| Earls Test Kitchen | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.95 |
| Homer St. Cafe and Bar | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.9 |
| Hapa Izakaya Yaletown | GOOD | ✓ | 0m | 0m | 17/6 | 83% | 100% | 0.94 |
| Boulevard Kitchen & Oyster Bar | GOOD | ✓ | 0m | 0m | 21/6 | 67% | 100% | 0.88 |
| Chambar Belgian Restaurant | PARTIAL | ✗ | 0m | 0m | 22/6 | 83% | 40% | 0.95 |
| D/6 Lounge | WRONG | ✗ | 300m | 0m | 7/6 | 83% | 60% | 0.85 |
| Havana | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.9 |
| Brewhall | PARTIAL | ✗ | 0m | 30m | 8/5 | 80% | 100% | 0.95 |
| Glowbal | NOT-FOUND | — | — | — | — | — | — | 0 |
| Central Restaurants Vancouver - Bentall | PARTIAL | ✓ | 0m | 0m | 1/8 | 13% | 100% | 0.92 |
| Tap & Barrel (Convention Centre) | GOOD | ✓ | 0m | 0m | 42/8 | 100% | 88% | 0.96 |
| P2B Restaurant & Bar | GOOD | ✓ | 0m | 0m | 14/8 | 100% | 88% | 0.97 |
| Relish The Pub | NOT-FOUND | — | — | — | — | — | — | 0 |
| French Creek Pub (Vancouver - Burrard) | PARTIAL | ✓ | 0m | 0m | 0/7 | 0% | — | 0.55 |
| ZUBU Ramen (Downtown) | NOT-FOUND | — | — | — | — | — | — | 0.9 |
| 1931 Gallery Bistro | GOOD | ✓ | 0m | 0m | 38/7 | 100% | 71% | 0.97 |
| Parker Rooftop | PARTIAL | ✓ | 0m | 0m | 0/8 | 0% | — | 0.8 |
| Notch8 Restaurant & Bar | PARTIAL | ✓ | 0m | 0m | 0/6 | 0% | — | 0.9 |
| Hawksworth Restaurant | GOOD | ✓ | 0m | 0m | 26/8 | 100% | 88% | 0.95 |
| Banter Room | PERFECT | ✓ | 0m | 0m | 17/8 | 100% | 100% | 0.92 |
| El Guapo | PARTIAL | ✓ | 0m | 0m | 0/8 | 0% | — | 0.6 |
| Tacofino Yaletown Burrito Bar | NOT-FOUND | — | — | — | — | — | — | 0.9 |
| The Greek by Anatoli — Yaletown | PERFECT | ✓ | 0m | 0m | 25/8 | 100% | 100% | 0.95 |
| The Parlour | GOOD | ✓ | 0m | 0m | 16/8 | 100% | 63% | 0.95 |
| The Flying Pig (Yaletown) | PARTIAL | ✗ | 0m | 0m | 24/8 | 100% | 100% | 0.95 |
| The Keg Steakhouse + Bar (Yaletown) | PARTIAL | ✗ | 0m | 0m | 0/8 | 0% | — | 0.92 |
| Earls Yaletown | PARTIAL | ✓ | 0m | 0m | 0/8 | 0% | — | 0.95 |
| Moltaqa Moroccan Restaurant | NOT-FOUND | — | — | — | — | — | — | 0 |
| Alchemy Bar & Kitchen | GOOD | ✓ | 0m | 0m | 18/8 | 100% | 88% | 0.95 |
| Yaletown Brewing Company | NOT-FOUND | — | — | — | — | — | — | 0.9 |

## Failure detail
- **D/6 Lounge** (WRONG): see extracted.json
- **Glowbal** (NOT-FOUND): The Glowbal (590 W Georgia St, TELUS Garden) page has a 'HAPPY HOUR' menu tab in its menu navigation, and the group media kit PDF states guests can 'Experience 
- **Relish The Pub** (NOT-FOUND): The venue's menu page lists a 'Happy Hour' menu tab alongside 'Main Menu' and 'Group Menu', confirming Relish the Pub (888 Nelson St, Vancouver, BC) does offer 
- **ZUBU Ramen (Downtown)** (NOT-FOUND): The ZUBU Ramen Downtown menu page has a 'HAPPY HOUR' menu tab alongside FOOD and DRINK, so a happy hour offering almost certainly exists at this location, but t
- **Tacofino Yaletown Burrito Bar** (NOT-FOUND): No happy hour information for Tacofino Yaletown Burrito Bar (1025 Mainland St, Vancouver) was found in the cached pages. The locations page lists only operating
- **Moltaqa Moroccan Restaurant** (NOT-FOUND): The menu page at moltaqarestaurant.ca/menu/ includes a 'Happy Hour' tab in its section navigation (alongside Food Menu, Brunch, Tasting Menus, Cocktails, Wine L
- **Yaletown Brewing Company** (NOT-FOUND): No happy hour information appears anywhere in the cached Yaletown Brewing Company sources. The homepage, food-menu page, and drink-menu page list only regular-p

---

# Baselines & render-fallback impact

This run = Opus 5 over the **render-fallback crawl** (20 weakest venues
re-crawled with headless Chromium; 36 pages rendered). Baselines, same
prompts, static-only crawl:

| Run | Usable | Days | Times exact | Deal recall | Cost (list) |
|---|---|---|---|---|---|
| Haiku 4.5 · static | 29% | 76% | 88% | 51% | $2.02 |
| Opus 5 · static | 35% | 81% | 88% | 55% | $10.43 |
| **Opus 5 · rendered** | **35%** | 80% | **92%** | 55% | $8.19 (re-runs) |

## What rendering actually bought

- **The shell-page class is fixed.** El Guapo (a literal "Loading.." cache)
  now extracts an exact-days/exact-times schedule; Earls Test Kitchen,
  Notch8, and the Keg produced their schedules from rendered menu pages.
- **Deal recall jumped on JS-heavy menus**: Chambar 50%→83% (22 itemized
  deals), D/6 67%→83%.
- **Aggregate verdicts didn't move** because the bottleneck shifted, not
  vanished: ~8 venues show exact times with zero deals — their sites
  publish a happy hour time but no deal list as crawlable text (menus
  behind click-only widgets, iframes, or images). Two venues flipped
  negative when rendered pages displaced richer static ones (Glowbal,
  Yaletown Brewing) — rendered-vs-static selection should be per-page
  smarter than "longer text wins".

## Updated recommendation

Rendering is now table stakes for the crawl (keep `--render auto`). The
next accuracy lever is **menu-content discovery** — click-through/iframe
menu widgets and PDF links attached via JS — followed by re-verifying the
seed rows both models contradict (Chambar weekend-only, D/6 closed
Mon–Tue, both now with 80%+ deal recall backing the extractions).
