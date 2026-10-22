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
  checked: string | null; // "YYYY-MM-DD" the pipeline last re-checked this venue
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratings: number | null;
  photo: string | null;
  photoCredit: string | null;
  hh: {
    days: number[];
    start: string;
    end: string;
    extra: Window[];
    deals: Deal[];
    verified: boolean;
    source: string | null;
  };
  amenities: {
    patio: boolean;
    accessible: boolean;
    transit: boolean;
    transitStation: string | null;
    liveMusic: boolean;
    groups: boolean;
  };
}

export type Status = "live" | "upcoming" | "scheduled" | "none";

export interface Occurrence {
  status: Status;
  start?: Date;
  end?: Date;
}
