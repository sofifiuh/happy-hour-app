import { type RefObject, useEffect, useRef } from "react";
import { reducedMotion } from "./motion";

// iOS-style swipe back: drag the page right and let go past a third of the
// screen (or flick) to go back. The first 20px are left to Safari's own
// edge swipe so the two never both fire. Touches that start in a sideways
// scroller (chip rows) or with a drawer open are ignored.
const EDGE = 20;
const LOCK = 10;

export function useSwipeBack(targets: RefObject<HTMLElement | null>[], onBack: () => void, enabled = true) {
  const back = useRef(onBack);
  back.current = onBack;
  useEffect(() => {
    if (!enabled) return;
    const root = targets[0]?.current;
    if (!root) return;
    let x0 = 0,
      y0 = 0,
      t0 = 0,
      dx = 0,
      mode: "idle" | "pending" | "drag" | "off" = "idle";
    const els = () => targets.map((t) => t.current).filter(Boolean) as HTMLElement[];
    const paint = (x: number, animate: boolean) =>
      els().forEach((el) => {
        el.style.transition = animate ? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
        el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
        // A soft left-edge shadow so the page reads as a sheet sliding away.
        el.style.boxShadow = x ? "-16px 0 40px rgb(0 0 0 / 0.55)" : "";
      });

    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      const target = e.target as Element;
      if (e.touches.length > 1 || t.clientX < EDGE || target.closest(".overflow-x-auto, [data-no-swipe]")) {
        mode = "off";
        return;
      }
      x0 = t.clientX;
      y0 = t.clientY;
      t0 = e.timeStamp;
      dx = 0;
      mode = "pending";
    };
    const move = (e: TouchEvent) => {
      if (mode === "off" || mode === "idle") return;
      const t = e.touches[0];
      const mx = t.clientX - x0;
      const my = t.clientY - y0;
      if (mode === "pending") {
        if (Math.abs(mx) < LOCK && Math.abs(my) < LOCK) return;
        // Only a clearly sideways, rightward drag becomes a swipe.
        if (mx > 0 && Math.abs(mx) > Math.abs(my) * 1.4) mode = "drag";
        else return void (mode = "off");
      }
      e.preventDefault();
      dx = Math.max(0, mx);
      paint(dx, false);
    };
    const end = (e: TouchEvent) => {
      if (mode === "drag") {
        const v = dx / Math.max(1, e.timeStamp - t0);
        if (dx > window.innerWidth / 3 || (v > 0.5 && dx > 40)) {
          if (reducedMotion()) back.current();
          else {
            paint(window.innerWidth, true);
            setTimeout(() => back.current(), 200);
          }
        } else paint(0, true);
      }
      mode = "idle";
    };

    root.addEventListener("touchstart", start, { passive: true });
    root.addEventListener("touchmove", move, { passive: false });
    root.addEventListener("touchend", end);
    root.addEventListener("touchcancel", end);
    return () => {
      root.removeEventListener("touchstart", start);
      root.removeEventListener("touchmove", move);
      root.removeEventListener("touchend", end);
      root.removeEventListener("touchcancel", end);
    };
    // Targets are stable refs; the page mounts once `enabled` turns true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
