import { asset, queryParams } from "@/lib/routes";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AREAS, distanceKm, nearestArea, type Area, type LatLng } from "./geo";
import { occurrence, occurrenceAt } from "./hours";
import type { BestList, Hub, Occurrence, Venue } from "./types";

const CACHE_KEY = "alh:venues";
const VERSION_KEY = "alh:venues-version";
// Bump when sync-data.mjs changes the venue shape, so old caches refresh.
const SCHEMA = "3";
const FILTERS_KEY = "alh:filters";
const SAVED_KEY = "alh:saved";
const AREA_KEY = "alh:area";

export type TimeTab = "all" | "live" | "upcoming" | "plan";
export type AmenityKey = "patio" | "food" | "drink" | "transit" | "lateNight" | "topScore";
const AMENITY_KEYS: AmenityKey[] = ["patio", "food", "drink", "transit", "lateNight", "topScore"];

export interface Plan {
  day: number;
  time: string; // "HH:MM"
}

export interface Filters {
  tab: TimeTab;
  plan: Plan | null;
  amenities: AmenityKey[];
  query: string;
}

const DEFAULT_FILTERS: Filters = { tab: "all", plan: null, amenities: [], query: "" };

export interface Row {
  venue: Venue;
  occ: Occurrence;
  km: number | null;
}

interface Store {
  venues: Venue[];
  hubs: Record<string, Hub>; // hub pages by slug, once the network copy arrives
  best: BestList[]; // best-of lists, once the network copy arrives
  loading: boolean;
  now: Date;
  location: LatLng; // device location, else the neighbourhood (Downtown by default)
  deviceLocation: LatLng | null;
  origin: Area; // the picked neighbourhood, or Downtown
  locationState: "idle" | "asking" | "granted" | "denied";
  requestLocation: () => void;
  area: Area | null; // neighbourhood picked instead of sharing location
  setArea: (a: Area | null) => void;
  saved: string[];
  toggleSaved: (id: string) => boolean; // returns the new saved state
  online: boolean;
  loadFailed: boolean; // no network copy and nothing cached
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  rows: Row[]; // filtered, sorted
  byId: (id: string) => Venue | undefined;
}

const Ctx = createContext<Store | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: the in-memory value still works this session
  }
}

// Name, address, city and nearest neighbourhood, so "kits" or "gastown" works.
const searchCache = new WeakMap<Venue, string>();
function searchText(v: Venue) {
  let t = searchCache.get(v);
  if (!t) {
    const hood = v.lat != null && v.lng != null ? nearestArea({ lat: v.lat, lng: v.lng }).name : "";
    t = [v.name, v.address, v.city, hood].join(" ").toLowerCase();
    searchCache.set(v, t);
  }
  return t;
}

function readCache(): Venue[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Screens overview embeds each screen in an iframe with "?frame=1&tab=…";
// those frames take their filters from the URL and never persist them.
function frameParams() {
  const p = queryParams();
  return p.get("frame") === "1" ? p : null;
}

export const IS_FRAME = frameParams() !== null;

function readFilters(): Filters {
  const fp = frameParams();
  if (fp) {
    return {
      ...DEFAULT_FILTERS,
      tab: (fp.get("tab") as TimeTab) || "all",
      query: fp.get("q") || "",
      amenities: (fp.get("amenities")?.split(",").filter(Boolean) as AmenityKey[]) || [],
      plan: fp.get("plan") ? { day: Number(fp.get("plan")!.split("@")[0]), time: fp.get("plan")!.split("@")[1] } : null,
    };
  }
  try {
    const f: Filters = { ...DEFAULT_FILTERS, ...JSON.parse(sessionStorage.getItem(FILTERS_KEY) || "{}") };
    return { ...f, amenities: f.amenities.filter((a) => AMENITY_KEYS.includes(a)) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function matchesAmenity(v: Venue, key: AmenityKey) {
  switch (key) {
    case "food":
      return v.hh.deals.some((d) => d.category === "food");
    case "drink":
      return v.hh.deals.some((d) => d.category === "drink");
    case "topScore":
      return (v.score?.total ?? 0) >= 7.5; // TOP_SCORE in components/hang-score.tsx
    case "lateNight":
      // An evening window still running at 9pm: ends 21:00+, runs past
      // midnight, or "until close" from 6pm on (all-day specials don't count).
      return [v.hh, ...v.hh.extra].some((w) =>
        !w.end ? w.start >= "18:00" : w.end >= "21:00" || (w.end < w.start && w.start >= "12:00"),
      );
    default:
      return v.amenities[key] === true;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(readCache);
  const [loading, setLoading] = useState(venues.length === 0);
  const [hubs, setHubs] = useState<Record<string, Hub>>({});
  const [best, setBest] = useState<BestList[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [deviceLocation, setLocation] = useState<LatLng | null>(null);
  const [area, setAreaState] = useState<Area | null>(() => (IS_FRAME ? null : readJSON<Area | null>(AREA_KEY, null)));
  const fp = frameParams();
  const [saved, setSaved] = useState<string[]>(() => fp?.get("saved")?.split(",").filter(Boolean) ?? readJSON<string[]>(SAVED_KEY, []));
  const [online, setOnline] = useState(() => (fp?.get("offline") === "1" ? false : navigator.onLine));
  const [loadFailed, setLoadFailed] = useState(fp?.get("error") === "1");
  // Without a device location or a picked neighbourhood, sort from
  // Downtown so the top of the list is central, not alphabetical.
  const origin = area ?? AREAS[0];
  const location = deviceLocation ?? origin;
  const [locationState, setLocationState] = useState<Store["locationState"]>("idle");
  const [filters, setFiltersState] = useState<Filters>(readFilters);

  // Cached copy renders instantly; the network copy replaces it only when
  // the pipeline's data_version changed.
  useEffect(() => {
    fetch(asset("venues.json"), { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ data_version, hubs: index, best: lists, venues: fresh }: { data_version: string; hubs?: Record<string, Hub>; best?: BestList[]; venues: Venue[] }) => {
        setHubs(index ?? {});
        setBest(lists ?? []);
        let cached: string | null = null;
        try {
          cached = localStorage.getItem(VERSION_KEY);
        } catch {
          // storage blocked: always take the network copy
        }
        const version = `${data_version}/${SCHEMA}`;
        if (cached !== version || venues.length === 0) {
          setVenues(fresh);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
            localStorage.setItem(VERSION_KEY, version);
          } catch {
            // storage full or blocked: the in-memory copy still works
          }
        }
      })
      .catch(() => setLoadFailed(readCache().length === 0))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const setArea = useCallback((a: Area | null) => {
    setAreaState(a);
    writeJSON(AREA_KEY, a);
  }, []);

  const toggleSaved = useCallback(
    (id: string) => {
      const next = saved.includes(id) ? saved.filter((s) => s !== id) : [id, ...saved];
      setSaved(next);
      if (!IS_FRAME) writeJSON(SAVED_KEY, next);
      return next.includes(id);
    },
    [saved],
  );

  // Statuses flip on the minute ("ends in 4 min"), not every second.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      return;
    }
    setLocationState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { maximumAge: 120_000, timeout: 10_000 },
    );
  }, []);

  // Ask silently on load only if the browser already granted it before.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => p.state === "granted" && requestLocation())
      .catch(() => {});
  }, [requestLocation]);

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...f };
      if (!IS_FRAME) {
        try {
          sessionStorage.setItem(FILTERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters({ ...DEFAULT_FILTERS, query: filters.query }), [setFilters, filters.query]);

  const rows = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const plan = filters.tab === "plan" ? filters.plan : null;
    const out: Row[] = [];
    for (const venue of venues) {
      if (q && !searchText(venue).includes(q)) continue;
      if (!filters.amenities.every((a) => matchesAmenity(venue, a))) continue;
      const occ = plan ? occurrenceAt(venue, plan.day, plan.time) : occurrence(venue, now);
      if (filters.tab === "live" && occ.status !== "live") continue;
      if (filters.tab === "upcoming" && occ.status !== "upcoming") continue;
      if (plan && occ.status !== "scheduled") continue;
      const km = location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null;
      out.push({ venue, occ, km });
    }
    const rank = { live: 0, scheduled: 0, upcoming: 1, none: 2 } as const;
    // Times compare in 30-minute buckets so a spot nearby beats one across
    // town that starts or ends a few minutes sooner.
    const bucket = (d: Date | null | undefined) => (d ? Math.floor(d.getTime() / 1_800_000) : 0);
    out.sort((a, b) => {
      if (rank[a.occ.status] !== rank[b.occ.status]) return rank[a.occ.status] - rank[b.occ.status];
      // Further than 10 km sinks below everything closer in the same group.
      const far = Number((a.km ?? 0) > 10) - Number((b.km ?? 0) > 10);
      if (far) return far;
      // Happening now: least time left first. Upcoming: soonest first. Then nearest.
      if (a.occ.status === "live" && bucket(a.occ.end) !== bucket(b.occ.end)) return bucket(a.occ.end) - bucket(b.occ.end);
      if (a.occ.status === "upcoming" && bucket(a.occ.start) !== bucket(b.occ.start)) return bucket(a.occ.start) - bucket(b.occ.start);
      if (a.km != null && b.km != null && Math.abs(a.km - b.km) > 0.05) return a.km - b.km;
      return a.venue.name.localeCompare(b.venue.name);
    });
    return out;
  }, [venues, filters, now, location]);

  const index = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);
  const byId = useCallback((id: string) => index.get(id), [index]);

  const value: Store = {
    venues,
    hubs,
    best,
    loading,
    now,
    location,
    deviceLocation,
    origin,
    locationState,
    requestLocation,
    area,
    setArea,
    saved,
    toggleSaved,
    online,
    loadFailed,
    filters,
    setFilters,
    resetFilters,
    rows,
    byId,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
