/**
 * Venue "database" for the Happy Hour app.
 *
 * Field names deliberately mirror the Google Places API (Place Details)
 * response shape 1:1 — place_id, formatted_address, geometry.location,
 * formatted_phone_number, opening_hours, price_level, rating, types,
 * business_status, photos — so that filling these records from a real
 * Places API call later is a direct field assignment, not a rewrite.
 *
 * IMPORTANT: scraping Google Maps pages directly violates Google's Terms
 * of Service. The supported path to populate the Google-sourced fields
 * below is the official Places API (Place Search + Place Details), which
 * has a free monthly usage credit. Until that sync exists, every
 * Google-owned field below is either null or a best-effort placeholder —
 * see `data_source` / `last_synced_at` on each record.
 *
 * `happy_hour` is our own extension — Google has no concept of it — and
 * is the only block a real Places sync should never overwrite.
 *
 * `cover_image` is also our own extension, not a Places field: a photo
 * pulled from the venue's own official website (never scraped from
 * Google/Yelp — see their respective ToS), used for display until a real
 * Places `photos` sync exists. `website` values were verified by hand
 * against each restaurant's real site, independent of any Places sync.
 */

const PLACE_TYPES_RESTAURANT_BAR = ["restaurant", "bar", "food", "point_of_interest", "establishment"];

const VENUES_SEED = [
  {
    id: "ancora",
    place_id: null,
    name: "Ancora",
    formatted_address: "1600 Howe St, Vancouver, BC",
    address_components: {
      street_number: "1600",
      route: "Howe St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2738039, lng: -123.1326024 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.ancoradining.com/falsecreek",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://static.wixstatic.com/media/fe927f_e8401739db154961a768366f355e2d5d.jpg",
      credit_name: "Ancora Waterfront Dining and Patio",
      credit_url: "https://www.ancoradining.com/falsecreek",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "14:30",
      end: "17:00",
      verified: true,
      verified_source: "https://www.ancoradining.com/contact",
      deals: [
        { name: "Granville Island beer", price: "$8", category: "drink", description: "16oz." },
        { name: "Cocktails", price: "$11–19", category: "drink", description: "" },
        { name: "Wine", price: "$10", category: "drink", description: "" },
        { name: "Oysters", price: "$3 ea", category: "food", description: "" },
        { name: "Brussels sprouts", price: "$8", category: "food", description: "" },
        { name: "Sashimi", price: "$16", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Yaletown-Roundhouse",
        distance_m: 800,
        walkable: false
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "earls-test-kitchen",
    place_id: null,
    name: "Earls Test Kitchen",
    formatted_address: "905 Hornby St, Vancouver, BC",
    address_components: {
      street_number: "905",
      route: "Hornby St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2815936, lng: -123.123754 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://earls.ca/locations/test-kitchen/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://earls.ca/wp-content/uploads/2025/03/edit_testkitchen_0144.jpg__2000x0_q80_crop-smart_subsampling-2_upscale.jpg",
      credit_name: "Earls Test Kitchen",
      credit_url: "https://earls.ca/locations/test-kitchen/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "15:00",
      end: "18:00",
      verified: true,
      verified_source: "https://earls.ca/locations/test-kitchen/menu/happy-hour/",
      deals: [
        { name: "Select beers", price: "$3 off", category: "drink", description: "" },
        { name: "Wine, cocktails, margarita, spritz", price: "50% off", category: "drink", description: "" },
        { name: "Oysters", price: "$3.50 ea", category: "food", description: "" },
        { name: "Fries", price: "$5", category: "food", description: "" },
        { name: "Tacos", price: "$7", category: "food", description: "" },
        { name: "Pizza", price: "$15", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Vancouver City Centre",
        distance_m: 380,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "homer-st-cafe-and-bar",
    place_id: null,
    name: "Homer St. Cafe and Bar",
    formatted_address: "898 Homer St, Vancouver, BC",
    address_components: {
      street_number: "898",
      route: "Homer St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2784178, lng: -123.118217 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.homerstreetcafebar.com/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://static.wixstatic.com/media/fc95b3_a90972eda53b4d9785a37282f5584515~mv2.jpeg",
      credit_name: "Homer St. Cafe and Bar",
      credit_url: "https://www.homerstreetcafebar.com/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "14:30",
      end: "17:30",
      deals: [
        { name: "Beer", price: "$5–8", category: "drink", description: "" },
        { name: "Wine", price: "$7", category: "drink", description: "By the glass." },
        { name: "Highballs", price: "$5", category: "drink", description: "" },
        { name: "House-made puff pastry", price: "$6", category: "food", description: "" },
        { name: "Rolls", price: "$8", category: "food", description: "" },
        { name: "Burger", price: "$22", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Granville",
        distance_m: 476,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "hapa-izakaya-yaletown",
    place_id: null,
    name: "Hapa Izakaya Yaletown",
    formatted_address: "1193 Hamilton St, Vancouver, BC",
    address_components: {
      street_number: "1193",
      route: "Hamilton St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.275171, lng: -123.122572 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://hapaizakaya.com/locations-yaletown/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://hapaizakaya.com/wp-content/uploads/hapa_izakaya_yaletown_patio.jpg",
      credit_name: "Hapa Izakaya Yaletown",
      credit_url: "https://hapaizakaya.com/locations-yaletown/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "16:00",
      end: "18:00",
      verified: true,
      verified_source: "https://hapaizakaya.com/yaletown-menu/",
      deals: [
        { name: "Draft beer", price: "$5", category: "drink", description: "" },
        { name: "Wine", price: "$6", category: "drink", description: "" },
        { name: "Cocktails", price: "$3 off", category: "drink", description: "" },
        { name: "Edamame", price: "$8", category: "food", description: "" },
        { name: "Takoyaki", price: "$9", category: "food", description: "" },
        { name: "Rolls", price: "$10–12", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Yaletown-Roundhouse",
        distance_m: 120,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "boulevard-kitchen-oyster-bar",
    place_id: null,
    name: "Boulevard Kitchen & Oyster Bar",
    formatted_address: "845 Burrard St, Vancouver, BC",
    address_components: {
      street_number: "845",
      route: "Burrard St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2829266, lng: -123.123798 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://boulevardvancouver.ca/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://boulevardvancouver.ca/wp-content/uploads/2024/12/Best-seafood-restaurant-in-vancouver-BC-Boulevard-Kitchen-and-Oyster-Bar-e1733947768621.jpg",
      credit_name: "Boulevard Kitchen & Oyster Bar",
      credit_url: "https://boulevardvancouver.ca/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "15:00",
      end: "17:00",
      verified: true,
      verified_source: "https://boulevardvancouver.ca/happy-hour/",
      deals: [
        { name: "Beer", price: "$7", category: "drink", description: "" },
        { name: "Wine", price: "$8", category: "drink", description: "" },
        { name: "Cocktails", price: "$10–15", category: "drink", description: "" },
        { name: "Oysters", price: "$2 ea", category: "food", description: "" },
        { name: "Marcona almonds", price: "$8", category: "food", description: "" },
        { name: "Fries", price: "$10", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Vancouver City Centre",
        distance_m: 363,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "chambar",
    place_id: null,
    name: "Chambar Belgian Restaurant",
    formatted_address: "568 Beatty St, Vancouver, BC",
    address_components: {
      street_number: "568",
      route: "Beatty St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2801513, lng: -123.109872 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.chambar.com/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://www.chambar.com/media/740x9999/COCKTAIL_LO_BlueFig_ScottLittle_IMG_5848%20Annecdote%20Blue%20Fig.jpg",
      credit_name: "Chambar Belgian Restaurant",
      credit_url: "https://www.chambar.com/",
      source: "official_website",
    },
    happy_hour: {
      days: [1, 2, 3, 4, 5],
      start: "15:00",
      end: "16:30",
      verified: true,
      verified_source: "https://www.chambar.com/menus/happyhour/",
      deals: [
        { name: "Beer", price: "$3 off", category: "drink", description: "" },
        { name: "Cocktails", price: "$9–10", category: "drink", description: "" },
        { name: "Wine", price: "$2 off", category: "drink", description: "" },
        { name: "Focaccia", price: "$6", category: "food", description: "" },
        { name: "Frites", price: "$8", category: "food", description: "" },
        { name: "Salads", price: "$13–16", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Stadium-Chinatown",
        distance_m: 101,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "d6-bar-lounge",
    place_id: null,
    // Corrected after initial research pointed at the wrong building —
    // D/6 is the rooftop lounge atop the DOUGLAS, Autograph Collection
    // (Parq Vancouver), not Rosewood Hotel Georgia. Verified against its
    // own happy hour menu PDF.
    name: "D/6 Lounge",
    formatted_address: "39 Smithe St, Vancouver, BC",
    address_components: {
      street_number: "39",
      route: "Smithe St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2756315, lng: -123.1134717 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.parqcasino.com/d-6-lounge",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://static.wixstatic.com/media/6eb957_a0b0c870489f44fd823ac376555b0126~mv2.jpg",
      credit_name: "D/6 Lounge",
      credit_url: "https://www.parqcasino.com/d-6-lounge",
      source: "official_website",
    },
    happy_hour: {
      // Menu says "Daily until 7pm | Sunday all day" — start time isn't
      // printed, so 5pm is inferred from the "After Office" 5-7pm deal.
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "17:00",
      end: "19:00",
      verified: true,
      verified_source:
        "https://www.parqcasino.com/_files/ugd/93f176_2fd639380cfc4f2f90f0f842fdfcbd8d.pdf",
      deals: [
        { name: "Wine", price: "$12", category: "drink", description: "6oz." },
        { name: "Sake", price: "$12", category: "drink", description: "5oz." },
        { name: "Beer", price: "$7", category: "drink", description: "14oz. Madri or Granville Island IPA." },
        { name: "Truffle fries", price: "$16", category: "food", description: "Triple cooked, parmigiano reggiano, truffle aioli." },
        {
          name: "Jumbo prawn cocktail",
          price: "$31",
          category: "food",
          description: "Tiger prawns, wasabi cocktail sauce. Gluten-free.",
        },
        { name: "Chicken kara-age", price: "$21", category: "food", description: "Agave citrus, red chili dip." },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: true,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Stadium-Chinatown",
        distance_m: 504,
        walkable: false
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "havana",
    place_id: null,
    name: "Havana",
    formatted_address: "1212 Commercial Dr, Vancouver, BC",
    address_components: {
      street_number: "1212",
      route: "Commercial Dr",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.273703, lng: -123.0693627 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.havanavancouver.com/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://images.squarespace-cdn.com/content/5dc5cfa1f5318a3348ec2af7/1737403669798-S9OBN78HPKPZY25SCABA/havana-vancouver-dining.jpeg",
      credit_name: "Havana Vancouver",
      credit_url: "https://www.havanavancouver.com/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "15:00",
      end: "17:00",
      verified: true,
      verified_source: "https://www.havanavancouver.com/",
      deals: [
        { name: "Beer", price: "$7", category: "drink", description: "16oz." },
        { name: "Wine", price: "$7–10", category: "drink", description: "" },
        { name: "Margaritas", price: "$11", category: "drink", description: "" },
        { name: "Fries", price: "$5–7", category: "food", description: "" },
        { name: "Sandwich", price: "$12", category: "food", description: "" },
        { name: "Ceviche", price: "$16", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Commercial-Broadway",
        distance_m: 1235,
        walkable: false
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "brewhall",
    place_id: null,
    name: "Brewhall",
    formatted_address: "97 E 2nd Ave, Vancouver, BC",
    address_components: {
      street_number: "97",
      route: "E 2nd Ave",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2695303, lng: -123.1036822 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://brewhall.com/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://brewhall.com/wp-content/uploads/2026/05/KristinaLorissaPhotography-24.png",
      credit_name: "Brewhall",
      credit_url: "https://brewhall.com/",
      source: "official_website",
    },
    happy_hour: {
      days: [2, 3, 4, 5],
      start: "14:00",
      end: "18:00",
      verified: true,
      verified_source: "https://brewhall.com/",
      deals: [
        { name: "Beer", price: "$5–6.25", category: "drink", description: "" },
        { name: "Wine", price: "50% off", category: "drink", description: "" },
        { name: "Cocktails", price: "25% off", category: "drink", description: "" },
        { name: "Full food menu", price: "25% off", category: "food", description: "" },
        { name: "Burger", price: "$10", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: {
        paid_lot: true
      },
      transit: {
        nearest_station: "Main St-Science World",
        distance_m: 506,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
  {
    id: "glowbal",
    place_id: null,
    name: "Glowbal",
    formatted_address: "590 W Georgia St, Vancouver, BC",
    address_components: {
      street_number: "590",
      route: "W Georgia St",
      locality: "Vancouver",
      administrative_area_level_1: "BC",
      postal_code: null,
      country: "CA",
    },
    geometry: { location: { lat: 49.2814683, lng: -123.117244 } },
    formatted_phone_number: null,
    international_phone_number: null,
    website: "https://www.glowbalgroup.com/glowbal/",
    types: PLACE_TYPES_RESTAURANT_BAR,
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    cover_image: {
      url: "https://www.glowbalgroup.com/img/glow-img/resto-gallery/img2.jpg",
      credit_name: "Glowbal",
      credit_url: "https://www.glowbalgroup.com/glowbal/",
      source: "official_website",
    },
    happy_hour: {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: "14:00",
      end: "17:00",
      verified: true,
      verified_source: "https://www.glowbalgroup.com/glowbal/",
      deals: [
        { name: "Beer", price: "$6", category: "drink", description: "" },
        { name: "Wine", price: "$6–9.50", category: "drink", description: "" },
        { name: "Cocktails", price: "$10–12", category: "drink", description: "" },
        { name: "Oysters", price: "$2.50 ea", category: "food", description: "" },
        { name: "Market vegetables", price: "$10", category: "food", description: "" },
        { name: "Calamari", price: "$14", category: "food", description: "" },
      ],
    },
    // Amenities: outdoor_seating/gluten_free_options/wheelchair_accessible_entrance
    // are verified where true, otherwise null (unconfirmed, not guessed).
    // transit is computed from real SkyTrain station coordinates vs this
    // venue's geometry — not a Places field, our own addition.
    amenities: {
      outdoor_seating: true,
      gluten_free_options: null,
      wheelchair_accessible_entrance: null,
      parking: null,
      transit: {
        nearest_station: "Granville",
        distance_m: 148,
        walkable: true
      }
    },
    data_source: "manual",
    last_synced_at: null,
  },
];
