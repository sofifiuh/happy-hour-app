import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { asset } from "@/lib/routes";
import { reducedMotion } from "@/lib/motion";

// Full-screen photo gallery for the venue page. Swipe sideways between
// photos, swipe down (or tap ×, or Esc) to close.
export function PhotoViewer({ photos, name, open, onClose }: { photos: string[]; name: string; open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const strip = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    // The page behind can't be reached while the gallery is open.
    const app = document.getElementById("root");
    app?.setAttribute("inert", "");
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // Two stops: the close button and the photo track.
        e.preventDefault();
        (document.activeElement === closeBtn.current ? strip.current : closeBtn.current)?.focus();
      }
      const s = strip.current;
      if (s && (e.key === "ArrowRight" || e.key === "ArrowLeft"))
        s.scrollBy({
          left: (e.key === "ArrowRight" ? 1 : -1) * s.clientWidth,
          behavior: "smooth",
        });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      app?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  // Swipe down to dismiss: the photos follow the finger and the backdrop fades.
  useEffect(() => {
    const el = sheet.current;
    if (!open || !el) return;
    let x0 = 0,
      y0 = 0,
      t0 = 0,
      dy = 0,
      mode: "idle" | "pending" | "drag" | "off" = "idle";
    const paint = (y: number, animate: boolean) => {
      el.style.transition = animate ? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 220ms" : "none";
      el.style.transform = y ? `translate3d(0,${y}px,0)` : "";
      el.style.backgroundColor = `rgb(0 0 0 / ${Math.max(0, 0.96 - y / 500)})`;
    };
    const start = (e: TouchEvent) => {
      if (e.touches.length > 1) return void (mode = "off");
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      t0 = e.timeStamp;
      mode = "pending";
    };
    const move = (e: TouchEvent) => {
      if (mode !== "pending" && mode !== "drag") return;
      const mx = e.touches[0].clientX - x0;
      const my = e.touches[0].clientY - y0;
      if (mode === "pending") {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
        if (my > 0 && my > Math.abs(mx) * 1.4) mode = "drag";
        else return void (mode = "off");
      }
      e.preventDefault();
      dy = Math.max(0, my);
      paint(dy, false);
    };
    const end = (e: TouchEvent) => {
      if (mode === "drag") {
        const v = dy / Math.max(1, e.timeStamp - t0);
        if (dy > 120 || (v > 0.5 && dy > 40)) {
          if (reducedMotion()) onClose();
          else {
            paint(window.innerHeight, true);
            setTimeout(onClose, 200);
          }
        } else paint(0, true);
      }
      mode = "idle";
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [open, onClose]);

  if (!open) return null;
  const onScroll = () => {
    const s = strip.current;
    if (s) setIndex(Math.round(s.scrollLeft / s.clientWidth));
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Photos of ${name}`} className="fixed inset-0 z-50">
      <div ref={sheet} data-no-swipe className="animate-fade absolute inset-0 bg-black/[0.96]">
        <div
          ref={strip}
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={photos.length > 1 ? "Photos, use the arrow keys to move between them" : "Photo"}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-cream/60 focus-visible:ring-inset"
        >
          {photos.map((src, i) => (
            <div key={src} className="grid size-full shrink-0 snap-center place-items-center">
              {broken.has(i) ? (
                <div className="grid aspect-[4/3] w-[min(90vw,520px)] place-items-center rounded-[24px] bg-gradient-to-br from-[#ff4900] to-[#751927]">
                  <span className="text-center">
                    <span className="block font-display text-[64px] leading-none font-extrabold text-white/30">{name.charAt(0)}</span>
                    <span className="mt-3 block text-[14px] font-semibold text-white/90">Photo unavailable</span>
                  </span>
                </div>
              ) : (
                <img
                  onError={() => setBroken((b) => new Set(b).add(i))}
                  src={asset(src)}
                  alt={`${name}, photo ${i + 1} of ${photos.length}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <span className="rounded-full bg-ink/70 px-3 py-1.5 text-[13px] font-semibold text-cream tabular backdrop-blur" aria-live="polite">
            {photos.length > 1 ? `${index + 1} / ${photos.length}` : name}
          </span>
          <button
            ref={closeBtn}
            onClick={onClose}
            aria-label="Close photos"
            className="pointer-events-auto grid size-11 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition-transform active:scale-90"
          >
            <X className="size-5" />
          </button>
        </div>
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),20px)] flex justify-center gap-1.5">
            {photos.map((src, i) => (
              <span key={src} className={i === index ? "h-1.5 w-4 rounded-full bg-cream transition-all" : "size-1.5 rounded-full bg-cream/40 transition-all"} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
