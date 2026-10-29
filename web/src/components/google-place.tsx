import { cn } from "@/lib/utils";

// Google map for the venue page. With a browser key set (VITE_GOOGLE_MAPS_KEY,
// restricted to our domain) the venue page swaps its mini-map for a Google
// embed, whose place card carries Google's own rating. We used to fetch the
// rating ourselves too, but that is a Place Details Enterprise call on every
// view: US$20 per 1,000 past a 1,000/month allowance the pipeline already
// uses. The embed is free and unlimited, so it shows the rating instead.
export const GOOGLE_KEY: string | null = import.meta.env.VITE_GOOGLE_MAPS_KEY || null;

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
