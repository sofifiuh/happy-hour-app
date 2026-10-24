import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { asset } from "@/lib/routes";
import { reducedMotion } from "@/lib/motion";
import type { Photo } from "@/lib/types";

// Full-screen photo gallery for the venue page. Photos crossfade in place
// rather than sliding, which felt queasy on a big screen. Arrows, arrow keys,
// a sideways swipe or trackpad swipe step between them; swipe down, tap
// outside the photo, tap ×, or Esc closes. The viewer never touches browser
// history, and it swallows sideways trackpad swipes so Chrome's swipe-to-go-
// back gesture can't fire behind it. Each photo credits its source and links
// back to the page it came from.
export function PhotoViewer({ photos, name, open, onClose }: { photos: Photo[]; name: string; open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]));
  const count = photos.length;
  const step = useCallback(
    (by: number) =>
      setIndex((i) => {
        const next = Math.min(count - 1, Math.max(0, i + by));
        // Keep the photo after next warm so the fade never waits on a load.
        setSeen((s) => (s.has(next + 1) ? s : new Set(s).add(next).add(next + 1)));
        return next;
      }),
    [count],
  );
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
        // Focus stays in the viewer: close button, photos, arrows, credit link.
        e.preventDefault();
        const stops = [closeBtn.current, strip.current, ...(sheet.current?.querySelectorAll<HTMLElement>("[aria-label$='photo']:not(:disabled), a[href]") ?? [])].filter(
          (el): el is HTMLElement => !!el && el.offsetParent !== null,
        );
        const at = stops.indexOf(document.activeElement as HTMLElement);
        stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus();
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    // Trackpad: one sideways swipe moves one photo. Every wheel event is
    // cancelled, which also keeps Chrome's two-finger back/forward gesture
    // from navigating the page underneath.
    // Momentum keeps the events coming for a second after the fingers lift,
    // so after a step the rest of that stream is ignored: the next swipe
    // counts only once the wheel has been quiet for a moment.
    let acc = 0,
      last = 0,
      locked = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const quiet = e.timeStamp - last > 180;
      last = e.timeStamp;
      if (quiet) {
        acc = 0;
        locked = false;
      }
      if (locked || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 40) {
        step(acc > 0 ? 1 : -1);
        locked = true;
      }
    };
    const overscroll = document.documentElement.style.overscrollBehaviorX;
    document.documentElement.style.overscrollBehaviorX = "none";
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.documentElement.style.overflow = overflow;
      document.documentElement.style.overscrollBehaviorX = overscroll;
      app?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      prev?.focus();
    };
  }, [open, onClose, step]);

  // Swipe down to dismiss: the photos follow the finger and the backdrop fades.
  useEffect(() => {
    const el = sheet.current;
    if (!open || !el) return;
    let x0 = 0,
      y0 = 0,
      t0 = 0,
      dy = 0,
      mx = 0,
      mode: "idle" | "pending" | "drag" | "side" | "off" = "idle";
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
      if (mode !== "pending" && mode !== "drag" && mode !== "side") return;
      mx = e.touches[0].clientX - x0;
      const my = e.touches[0].clientY - y0;
      if (mode === "pending") {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
        if (my > 0 && my > Math.abs(mx) * 1.4) mode = "drag";
        else if (Math.abs(mx) > Math.abs(my)) mode = "side";
        else return void (mode = "off");
      }
      e.preventDefault();
      // Sideways: the photo stays put and changes on release.
      if (mode === "side") return;
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
      if (mode === "side" && Math.abs(mx) > 50) step(mx < 0 ? 1 : -1);
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
  }, [open, onClose, step]);

  // Stepping to either end disables the arrow that was just pressed; keep
  // focus in the viewer instead of letting it fall to the page.
  useEffect(() => {
    const a = document.activeElement as HTMLButtonElement | null;
    if (open && (!a || a === document.body || a.disabled)) strip.current?.focus();
  }, [index, open]);

  if (!open) return null;
  const credit = photos[index];
  const fade = reducedMotion() ? "" : "transition-opacity duration-200 ease-out";
  const arrow =
    "pointer-events-auto absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition-opacity hover:bg-ink/90 disabled:opacity-0 sm:grid";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Photos of ${name}`} className="theme-dark fixed inset-0 z-50">
      <div ref={sheet} data-no-swipe className="animate-fade absolute inset-0 bg-black/[0.96]">
        <div
          ref={strip}
          // Tapping the dark space around the photo closes the viewer.
          onClick={(e) => e.target === e.currentTarget && onClose()}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={count > 1 ? "Photos, use the arrow keys to move between them" : "Photo"}
          className="relative size-full outline-none focus-visible:ring-2 focus-visible:ring-cream/60 focus-visible:ring-inset"
        >
          {photos.map(({ src }, i) => (
            <div
              key={src}
              aria-hidden={i !== index}
              onClick={(e) => e.target === e.currentTarget && onClose()}
              className={`absolute inset-0 grid place-items-center ${fade} ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {!seen.has(i) && i !== index ? null : broken.has(i) ? (
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
                  alt={`${name}, photo ${i + 1} of ${count}`}
                  decoding="async"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain select-none"
                />
              )}
            </div>
          ))}
          {count > 1 && (
            <>
              <button onClick={() => step(-1)} disabled={index === 0} aria-label="Previous photo" className={`${arrow} left-4`}>
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={() => step(1)} disabled={index === count - 1} aria-label="Next photo" className={`${arrow} right-4`}>
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <span className="rounded-full bg-ink/70 px-3 py-1.5 text-[13px] font-semibold text-cream tabular backdrop-blur" aria-live="polite">
            {count > 1 ? `${index + 1} / ${count}` : name}
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
        {credit?.credit && (
          <p className={`absolute inset-x-0 ${photos.length > 1 ? "bottom-[calc(max(env(safe-area-inset-bottom),20px)+18px)]" : "bottom-[max(env(safe-area-inset-bottom),20px)]"} text-center text-[12px] text-cream/70`}>
            Photo:{" "}
            {credit.link ? (
              <a href={credit.link} target="_blank" rel="noopener" className="inline-block py-2 underline decoration-cream/40 underline-offset-2 hover:text-cream">
                {credit.credit}
              </a>
            ) : (
              credit.credit
            )}
          </p>
        )}
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),20px)] flex justify-center gap-1.5">
            {photos.map(({ src }, i) => (
              <span key={src} className={i === index ? "h-1.5 w-4 rounded-full bg-cream transition-all" : "size-1.5 rounded-full bg-cream/40 transition-all"} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
