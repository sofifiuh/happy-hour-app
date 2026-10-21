import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { distanceKm, type LatLng } from "./geo";
import { occurrence, occurrenceAt } from "./hours";
import type { Occurrence, Venue } from "./types";

const CACHE_KEY = "alh:venues";
const VERSION_KEY = "alh:venues-version";
const FILTERS_KEY = "alh:filters";

export type TimeTab = "all" | "live" | "upcoming" | "plan";
export type AmenityKey = "patio" | "glutenFree" | "food" | "drink" | "transit" | "parking" | "lateNight";

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
  loading: boolean;
  now: Date;
  location: LatLng | null;
  locationState: "idle" | "asking" | "granted" | "denied";
  requestLocation: () => void;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  rows: Row[]; // filtered, sorted
  byId: (id: string) => Venue | undefined;
}

const Ctx = createContext<Store | null>(null);

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
  const q = window.location.hash.split("?")[1];
  const p = new URLSearchParams(q || "");
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
    return { ...DEFAULT_FILTERS, ...JSON.parse(sessionStorage.getItem(FILTERS_KEY) || "{}") };
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
    case "lateNight":
      return v.hh.start >= "20:00" || v.hh.extra.some((w) => w.start >= "20:00");
    default:
      return v.amenities[key] === true;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(readCache);
  const [loading, setLoading] = useState(venues.length === 0);
  const [now, setNow] = useState(() => new Date());
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationState, setLocationState] = useState<Store["locationState"]>("idle");
  const [filters, setFiltersState] = useState<Filters>(readFilters);

  // Cached copy renders instantly; the network copy replaces it only when
  // the pipeline's data_version changed.
  useEffect(() => {
    fetch("venues.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ data_version, venues: fresh }: { data_version: string; venues: Venue[] }) => {
        let cached: string | null = null;
        try {
          cached = localStorage.getItem(VERSION_KEY);
        } catch {
          // storage blocked: always take the network copy
        }
        if (cached !== data_version || venues.length === 0) {
          setVenues(fresh);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
            localStorage.setItem(VERSION_KEY, data_version);
          } catch {
            // storage full or blocked: the in-memory copy still works
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (q && !venue.name.toLowerCase().includes(q) && !venue.address.toLowerCase().includes(q)) continue;
      if (!filters.amenities.every((a) => matchesAmenity(venue, a))) continue;
      const occ = plan ? occurrenceAt(venue, plan.day, plan.time) : occurrence(venue, now);
      if (filters.tab === "live" && occ.status !== "live") continue;
      if (filters.tab === "upcoming" && occ.status !== "upcoming") continue;
      if (plan && occ.status !== "scheduled") continue;
      const km = location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null;
      out.push({ venue, occ, km });
    }
    const rank = { live: 0, scheduled: 0, upcoming: 1, none: 2 } as const;
    out.sort((a, b) => {
      if (rank[a.occ.status] !== rank[b.occ.status]) return rank[a.occ.status] - rank[b.occ.status];
      if (a.km != null && b.km != null && Math.abs(a.km - b.km) > 0.05) return a.km - b.km;
      if (a.occ.status === "live") return a.occ.end!.getTime() - b.occ.end!.getTime();
      if (a.occ.status === "upcoming") return a.occ.start!.getTime() - b.occ.start!.getTime();
      return a.venue.name.localeCompare(b.venue.name);
    });
    return out;
  }, [venues, filters, now, location]);

  const index = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);
  const byId = useCallback((id: string) => index.get(id), [index]);

  const value: Store = {
    venues,
    loading,
    now,
    location,
    locationState,
    requestLocation,
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
