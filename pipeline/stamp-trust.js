// Stamp each venue's `trust` field (lib/trust.js) into venues.json from the
// latest freshness check, without touching any other data. writeback.js does
// the same at the end of a full regeneration; this is the cheap path for a
// check-only run.
// Usage: node pipeline/stamp-trust.js
import { readJson } from "./lib/venues.js";
import { FRESHNESS_STORE, VENUES_FILE, applyTrust, writeVenuesJson } from "./lib/trust.js";

const { venues } = readJson(VENUES_FILE);
const stamped = applyTrust(venues, readJson(FRESHNESS_STORE, {}));
const stamp = writeVenuesJson(stamped);
const tally = {};
for (const v of stamped) tally[`${v.trust.confidence}`] = (tally[v.trust.confidence] || 0) + 1;
console.log(`venues.json: trust stamped on ${stamped.length} venues (${Object.entries(tally).map(([k, n]) => `${n} ${k}`).join(", ")}) — ${stamp}`);
