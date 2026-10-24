import { asset } from "@/lib/routes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Venue } from "@/lib/types";

// Warm fallback for venues without a usable photo, tinted per venue so a
// list of them doesn't read as one repeated block.
const FALLBACKS = [
  "from-[#ff4900] to-[#751927]",
  "from-[#ffb530] to-[#ff4900]",
  "from-[#f7b2b7] to-[#a3726d]",
  "from-[#ff6237] to-[#2f2d2b]",
];

// `hero` names the photo for the shared-element route transition (see
// lib/motion.ts); data-hero marks every photo that can take the name.
// `large` is the venue page header: with no usable photo it shows an
// oversized initial as a quiet brand mark instead of a centred letter.
// `onReady` fires once there's something to show: the photo has loaded
// (or was already cached), or the warm fallback is in place.
export function VenuePhoto({
  venue,
  className,
  eager = false,
  hero,
  large = false,
  onReady,
}: {
  venue: Venue;
  className?: string;
  eager?: boolean;
  hero?: string;
  large?: boolean;
  onReady?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const hash = [...venue.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const src = venue.photo && !failed ? asset(venue.photo) : null;
  useEffect(() => {
    if (!src) onReady?.();
  }, [src, onReady]);
  return (
    <div data-hero style={{ viewTransitionName: hero }} className={cn("relative overflow-hidden bg-ink-3", className)}>
      {src ? (
        <img
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          ref={(img) => {
            if (img?.complete && img.naturalWidth) onReady?.();
          }}
          onLoad={onReady}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br", FALLBACKS[hash % FALLBACKS.length])}>
          {large ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgb(255_255_255/0.22),transparent_55%)]" />
              <span aria-hidden className="absolute -right-4 -bottom-16 font-display text-[300px] leading-none font-extrabold tracking-tighter text-white/15 select-none">
                {venue.name.charAt(0)}
              </span>
            </>
          ) : (
            <span className="font-display text-3xl font-extrabold text-white/90">{venue.name.charAt(0)}</span>
          )}
        </div>
      )}
    </div>
  );
}
