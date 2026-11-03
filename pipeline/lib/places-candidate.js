// A Places API (New) place -> the candidate stub crawl/extract/writeback
// consume. Same shape places-discover.js writes; used by places-rotate.js.
import { normName } from "./venues.js";

const EXCLUDE_TYPES = new Set(["fast_food_restaurant", "cafe", "coffee_shop", "bakery", "meal_takeaway", "meal_delivery", "ice_cream_shop", "sandwich_shop"]);
// Breweries and wineries count as bars: "brewery taproom" is a query, and a
// type filter that dropped them threw away Strathcona Beer Company.
const BAR_TYPES = new Set(["bar", "pub", "wine_bar", "night_club", "brewery", "winery", "bar_and_grill"]);
const PRICE_LEVELS = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4 };

export const isBar = (p) => (p.types || []).some((t) => BAR_TYPES.has(t));

// Google attaches every loosely-applicable type, so judge non-bars on
// primaryType, which is what Google considers the place actually is.
export function isWantedType(p) {
  const types = p.types || [];
  if (isBar(p)) return true;
  return !EXCLUDE_TYPES.has(p.primaryType || "") && types.includes("restaurant");
}

// Anchor on the province rather than a fixed comma slot: Google writes food
// courts, building names and unit numbers as their own parts.
export function splitAddress(formatted) {
  const parts = (formatted || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length && /^canada$/i.test(parts[parts.length - 1])) parts.pop();
  const provIdx = parts.findIndex((x) => /^(BC|British Columbia)\b/i.test(x));
  const cityIdx = provIdx > 0 ? provIdx - 1 : parts.length - 1;
  const picked = parts[cityIdx] || "";
  const city = !picked || /^(BC|British Columbia)\b/i.test(picked) ? "Vancouver" : picked;
  return { city, street: parts.slice(0, cityIdx).join(", ") };
}

export function toCandidate(p) {
  const name = p.displayName?.text || "";
  const { city, street } = splitAddress(p.formattedAddress);
  return {
    id: normName(name).replace(/ /g, "-"),
    name,
    website: p.websiteUri,
    formatted_address: `${street ? street + ", " : ""}${city}, BC`,
    address_components: null,
    geometry: { location: { lat: p.location.latitude, lng: p.location.longitude } },
    formatted_phone_number: p.nationalPhoneNumber || null,
    places: {
      place_id: p.id,
      rating: p.rating ?? null,
      user_ratings_total: p.userRatingCount ?? null,
      price_level: PRICE_LEVELS[p.priceLevel] ?? null,
      business_status: p.businessStatus ?? null,
      amenities: {
        outdoor_seating: null, serves_cocktails: null, serves_beer: null,
        serves_wine: null, live_music: null, good_for_groups: null,
      },
      matched_name: name,
      synced_at: new Date().toISOString().slice(0, 10),
    },
    place_id: p.id,
    city,
    is_bar: isBar(p),
  };
}
