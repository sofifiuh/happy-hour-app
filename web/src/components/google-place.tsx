import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Google rating and map for the venue page. Google's terms let us show Places
// content only when it's fetched live (never stored; only the place ID may be
// kept) and only alongside a Google map, not our MapLibre one. So with a
// browser key set (VITE_GOOGLE_MAPS_KEY, restricted to our domain) the venue
// page fetches the rating on view and swaps its mini-map for a Google embed;
// without one, neither appears.
export const GOOGLE_KEY: string | null = import.meta.env.VITE_GOOGLE_MAPS_KEY || null;

type Rating = { rating: number; count: number | null; url: string | null };
// In memory only, so moving between venues in one visit doesn't refetch.
const seen = new Map<string, Rating | null>();

export function useGoogleRating(placeId: string | null | undefined) {
  const [got, setGot] = useState<{ id: string; r: Rating | null } | null>(null);
  useEffect(() => {
    if (!GOOGLE_KEY || !placeId || seen.has(placeId)) return;
    const ctl = new AbortController();
    fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri" },
      signal: ctl.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((j) => {
        const r = j?.rating ? { rating: j.rating as number, count: (j.userRatingCount as number) ?? null, url: (j.googleMapsUri as string) ?? null } : null;
        seen.set(placeId, r);
        setGot({ id: placeId, r });
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [placeId]);
  if (!placeId) return null;
  return seen.get(placeId) ?? (got?.id === placeId ? got.r : null);
}

export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function GoogleRating({ placeId, className }: { placeId: string | null | undefined; className?: string }) {
  const r = useGoogleRating(placeId);
  if (!r) return null;
  const label = `${r.rating.toFixed(1)} out of 5 on Google${r.count ? `, ${r.count.toLocaleString()} reviews` : ""} (opens Google Maps)`;
  return (
    <a
      href={r.url ?? undefined}
      target="_blank"
      rel="nofollow noopener noreferrer"
      aria-label={label}
      title="Google rating"
      className={cn("-my-3 inline-flex min-h-11 items-center gap-1.5", className)}
    >
      <GoogleG className="size-3.5" />
      <span className="font-semibold">{r.rating.toFixed(1)}</span>
      {r.count ? <span className="text-muted-foreground">({r.count.toLocaleString()})</span> : null}
    </a>
  );
}

// Google Maps Embed (free, no per-view charge), lazy-loaded.
export function GoogleMapEmbed({ placeId, query, className }: { placeId?: string | null; query: string; className?: string }) {
  const q = placeId ? `place_id:${placeId}` : query;
  return (
    <iframe
      title="Map"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_KEY}&q=${encodeURIComponent(q)}&zoom=15`}
      className={cn("pointer-events-none border-0", className)}
      tabIndex={-1}
    />
  );
}
