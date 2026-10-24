export type Category = "food" | "drink";

export interface Deal {
  name: string;
  price: string;
  category: Category;
  description: string;
}

export interface Window {
  days: number[];
  start: string; // "HH:MM", 24h
  end: string | null; // null = until close
  label?: string | null;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string | null;
  // Neighbourhood (City of Vancouver only), from scripts/seo-data.mjs.
  area?: { slug: string; name: string } | null;
  // Hub pages this venue links to: its area, its city, up to three topics.
  hubs?: string[];
  checked: string | null; // "YYYY-MM-DD" the times last matched the venue's own page
  confidence: "high" | "medium" | "low" | null;
  // The page, menu PDF or menu photo the times were read from. host is set
  // only when it isn't the venue's own site (a listing elsewhere).
  source?: { url: string; kind: "page" | "pdf" | "image"; host: string | null } | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratings: number | null;
  photo: string | null;
  photoCredit: string | null;
  // Extra photos after the cover, shown in the venue page gallery.
  gallery?: string[];
  hh: {
    days: number[];
    start: string;
    end: string;
    extra: Window[];
    deals: Deal[];
    verified: boolean;
    source: string | null;
  };
  // Our own 0-10 rating of the happy hour (scripts/hang-score.mjs);
  // null when there isn't enough deal info to score it fairly.
  score?: HangScore | null;
  // Set when the venue manages its own listing (lib/store.tsx lays the
  // venue's edits from the API over this nightly data).
  byVenue?: { updated: string; confirmed: string } | null;
  description?: string | null;
  closed?: boolean;
  amenities: {
    patio: boolean;
    accessible: boolean;
    transit: boolean;
    transitStation: string | null;
    liveMusic: boolean;
    groups: boolean;
  };
}

export type ScorePart = "value" | "selection" | "hours" | "vibe";
export type HangScore = Record<ScorePart | "total", number> & { notes: Record<ScorePart, string> };

export type Status = "live" | "upcoming" | "scheduled" | "none";

export interface Occurrence {
  status: Status;
  start?: Date;
  end?: Date;
}

// Hub pages listed in venues.json, by slug ("gastown", "oysters").
export type HubKind = "city" | "area" | "day" | "vibe" | "deal";
export interface Hub {
  label: string;
  short?: string; // link text for day/deal/vibe topics: "Oysters", "Live music"
  kind: HubKind;
  count: number;
}

// Best-of lists from venues.json (scripts/seo-data.mjs buildBest): a place's
// top Hangout Scores, highest first. slug "metro" is all of Metro Vancouver.
export interface BestList {
  slug: string;
  name: string;
  kind: "metro" | "city" | "area";
  scored: number; // venues with a score in the place
  ids: string[];
}
