// A Places API (New) place -> the candidate stub crawl/extract/writeback
// consume. Same shape places-discover.js writes; used by places-rotate.js.
import { normName } from "./venues.js";
import { splitAddress } from "./region.js";

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

export { splitAddress };

export function toCandidate(p) {
  const name = p.displayName?.text || "";
  const { city, prov, street } = splitAddress(p.formattedAddress);
  return {
    id: normName(name).replace(/ /g, "-"),
    name,
    website: p.websiteUri,
    formatted_address: `${street ? street + ", " : ""}${city}, ${prov}`,
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
