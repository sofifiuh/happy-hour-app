import type { NavigateFunction } from "react-router";
import { clearHero, goBack } from "./motion";

// A venue's back button returns to the list, map or page the visitor
// started browsing venues from, however many venue-to-venue hops ago that
// was. Page-by-page history stays with the browser's own back button and
// gestures.

type Base = { path: string; idx: number };
let base: Base | null = null;

export function isSpotPath(path: string) {
  return /^\/spot\/[^/]+$/.test(path) || (/^\/spots\/[^/]+$/.test(path) && path !== "/spots/index.html");
}

const historyIdx = (): number | null => {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" ? idx : null;
};

// Called on every route change; any page that isn't a venue becomes the
// place venue pages go back to.
export function noteLocation(pathname: string, search: string) {
  if (isSpotPath(pathname)) return;
  base = { path: pathname + search, idx: historyIdx() ?? -1 };
}

export function backLabel(desktop: boolean) {
  const path = base?.path.split("?")[0] ?? "";
  if (path === "/" || path === "/index.html") return desktop ? "Map" : "List";
  if (path === "/best") return "Best of";
  if (path === "/saved") return "Saved";
  if (path === "/spots" || path === "/spots/index.html") return "All spots";
  if (!base || path === "/map") return "Map";
  return "Back";
}

export function goBackToBase(navigate: NavigateFunction, desktop: boolean, instant = false) {
  const idx = historyIdx();
  // Pop straight back to it when it's still behind us in history, so the
  // list keeps its scroll position and filters.
  if (base && base.idx >= 0 && idx !== null && idx > base.idx) {
    if (idx - base.idx > 1) clearHero();
    return goBack(navigate, instant, base.idx - idx);
  }
  // Landed on a venue directly (search, shared link): open the map.
  navigate(base?.path ?? (desktop ? "/" : "/map"), { viewTransition: !instant });
}
