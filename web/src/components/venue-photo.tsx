import { asset } from "@/lib/routes";
import { useState } from "react";
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
export function VenuePhoto({ venue, className, eager = false, hero }: { venue: Venue; className?: string; eager?: boolean; hero?: string }) {
  const [failed, setFailed] = useState(false);
  const hash = [...venue.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const src = venue.photo && !failed ? asset(venue.photo) : null;
  return (
    <div data-hero style={{ viewTransitionName: hero }} className={cn("relative overflow-hidden bg-ink-3", className)}>
      {src ? (
        <img
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br", FALLBACKS[hash % FALLBACKS.length])}>
          <span className="font-display text-3xl font-extrabold text-white/90">{venue.name.charAt(0)}</span>
        </div>
      )}
    </div>
  );
}
