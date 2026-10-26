// The venue API (api/, a Cloudflare Worker): sign-in, claims, venue edits,
// counts and reports. Everything here switches off when VITE_API_URL isn't
// set, so the site works the same without the API.
export const API_URL: string | null = import.meta.env.VITE_API_URL || null;
export const apiEnabled = API_URL !== null;

const SESSION_KEY = "alh:session";
// Venues the signed-in person manages, cached so venue pages can say
// "Manage this listing" without asking the API.
const MINE_KEY = "alh:my-venues";

export function session() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSession(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(MINE_KEY);
    }
  } catch {
    // storage blocked: signed in for this page only
  }
}

export function myVenues(): string[] {
  try {
    return session() ? (JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]") as string[]) : [];
  } catch {
    return [];
  }
}

export function setMyVenues(ids: string[]) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(ids));
  } catch {
    // storage blocked
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(method: string, path: string, body?: unknown, raw?: Blob): Promise<T> {
  if (!API_URL) throw new ApiError(0, "Venue tools aren't switched on yet");
  const token = session();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      // Owners expect their own save to show at once; the API's edge cache
      // still absorbs the load.
      cache: "no-cache",
      headers: {
        ...(token && { authorization: `Bearer ${token}` }),
        ...(body !== undefined && { "content-type": "application/json" }),
        ...(raw && { "content-type": raw.type }),
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "You seem to be offline. Try again in a moment");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) setSession(null);
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? "Something went wrong");
  }
  return data as T;
}

// A multipart POST (photos plus fields), for "Add a happy hour".
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  if (!API_URL) throw new ApiError(0, "This isn't switched on yet");
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method: "POST", body: form });
  } catch {
    throw new ApiError(0, "You seem to be offline. Try again in a moment");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? "Something went wrong");
  return data as T;
}

export type CountType = "view" | "save" | "directions" | "call" | "website" | "share";

// The numbers on a venue's dashboard. Fire and forget; the API counts each
// person once per venue, type and day, and keeps no ids.
export function count(venueId: string, type: CountType) {
  if (!API_URL || !import.meta.env.PROD) return;
  const body = JSON.stringify({ v: venueId, t: type });
  try {
    if (navigator.sendBeacon?.(`${API_URL}/e`, body)) return;
  } catch {
    // fall through to fetch
  }
  fetch(`${API_URL}/e`, { method: "POST", body, keepalive: true }).catch(() => {});
}

// ---------- Shapes the API returns ----------

export interface Me {
  email: string;
  admin: boolean;
  venues: { id: string; name: string }[];
  claims: { id: string; venue_id: string; venue_name: string; status: "pending" | "approved" | "rejected"; method: string; created_at: string }[];
}

export interface VenueEdit {
  hh?: {
    days: number[];
    start: string;
    end: string;
    extra: { days: number[]; start: string; end: string | null; label?: string | null }[];
    deals: { name: string; price: string; category: "food" | "drink"; description: string }[];
  };
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  amenities?: { patio?: boolean; liveMusic?: boolean; groups?: boolean };
  photo?: string | null;
  gallery?: string[];
  closed?: boolean;
}

export type PublicEdit = VenueEdit & { updated: string; confirmed: string };

// A happy hour published from a guest's photo this week (the site's own
// data picks it up within the hour; this makes it show at once).
export interface CommunityEdit {
  hh: NonNullable<VenueEdit["hh"]>;
  published: string; // YYYY-MM-DD
}

export interface Stats {
  week: Record<CountType, number>;
  prev: Record<CountType, number>;
  daily: { day: string; views: number }[];
}
