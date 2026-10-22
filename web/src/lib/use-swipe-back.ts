import { type RefObject, useEffect, useRef } from "react";
import { reducedMotion } from "./motion";

// iOS-style dismiss gestures for a pushed page:
// - drag right and let go past a third of the screen (or flick) to go back.
//   The first 20px are left to Safari's own edge swipe so the two never
//   both fire.
// - at the top of the page, pull down past 120px (or flick) to go back,
//   like closing a sheet.
// Touches that start in a sideways scroller (chip rows) or anything marked
// data-no-swipe are ignored.
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
      d = 0,
      startX = 0,
      mode: "idle" | "pending" | "x" | "y" | "off" = "idle";
    const els = () => targets.map((t) => t.current).filter(Boolean) as HTMLElement[];
    const paint = (x: number, y: number, animate: boolean) =>
      els().forEach((el) => {
        el.style.transition = animate ? "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
        el.style.transform = x || y ? `translate3d(${x}px,${y}px,0)` : "";
        // A soft shadow so the page reads as a sheet sliding away.
        el.style.boxShadow = x ? "-16px 0 40px rgb(0 0 0 / 0.55)" : y ? "0 -16px 40px rgb(0 0 0 / 0.55)" : "";
      });

    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      const target = e.target as Element;
      if (e.touches.length > 1 || target.closest(".overflow-x-auto, [data-no-swipe]")) {
        mode = "off";
        return;
      }
      x0 = t.clientX;
      y0 = t.clientY;
      t0 = e.timeStamp;
      startX = t.clientX;
      d = 0;
      mode = "pending";
    };
    const move = (e: TouchEvent) => {
      if (mode === "off" || mode === "idle") return;
      const t = e.touches[0];
      const mx = t.clientX - x0;
      const my = t.clientY - y0;
      if (mode === "pending") {
        if (Math.abs(mx) < LOCK && Math.abs(my) < LOCK) return;
        // Only a clearly sideways rightward drag, or a clearly downward pull
        // from the very top of the page, becomes a gesture.
        if (startX >= EDGE && mx > 0 && Math.abs(mx) > Math.abs(my) * 1.4) mode = "x";
        else if (window.scrollY <= 0 && my > 0 && my > Math.abs(mx) * 1.4) mode = "y";
        else return void (mode = "off");
      }
      e.preventDefault();
      if (mode === "x") {
        d = Math.max(0, mx);
        paint(d, 0, false);
      } else {
        // Resist a little, so a pull reads as deliberate.
        d = Math.max(0, my);
        paint(0, d * 0.85, false);
      }
    };
    const end = (e: TouchEvent) => {
      if (mode === "x" || mode === "y") {
        const v = d / Math.max(1, e.timeStamp - t0);
        const far = mode === "x" ? d > window.innerWidth / 3 : d > 120;
        if (far || (v > 0.5 && d > 40)) {
          if (reducedMotion()) back.current();
          else {
            if (mode === "x") paint(window.innerWidth, 0, true);
            else paint(0, window.innerHeight, true);
            setTimeout(() => back.current(), 200);
          }
        } else paint(0, 0, true);
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
