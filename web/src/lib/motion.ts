import type { NavigateFunction } from "react-router";

// Route transitions use the View Transitions API. Forward navigations go
// through react-router's `viewTransition` option; back is a browser history
// pop, which react-router doesn't wrap, so goBack() starts it by hand.

export const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const canTransition = () => typeof document.startViewTransition === "function" && !reducedMotion();

let heroId: string | null = null;

// Give the tapped photo the shared "hero" name so it flies into the venue
// page's header. Only one element may hold a name at a time.
export function markHero(el: Element | null, id: string) {
  document.querySelectorAll<HTMLElement>("[data-hero]").forEach((n) => (n.style.viewTransitionName = ""));
  const photo = el?.querySelector<HTMLElement>("[data-hero]");
  if (photo) photo.style.viewTransitionName = "hero";
  heroId = id;
  setNav("forward");
}

// While popping back to a list, the row for the venue we came from claims
// the name so the photo flies home.
export function heroName(id: string) {
  return heroId === id && document.documentElement.dataset.nav === "back" ? "hero" : undefined;
}

// After hopping between venues the photo on screen isn't the one that left
// the list, so it shouldn't fly into that row.
export function clearHero() {
  heroId = null;
}

export function setNav(kind: "forward" | "back" | "swap") {
  document.documentElement.dataset.nav = kind;
}

// `instant` skips the transition, for a swipe that already slid the page out.
// `delta` pops more than one entry, back past several venues to the map.
// Pops only within the app (react-router's history index), so a page
// opened cold never sends the back arrow off the site; it goes to
// `fallback`, the page's parent, instead.
export function goBack(navigate: NavigateFunction, instant = false, delta = -1, fallback = "/") {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  const go = () => (typeof idx === "number" && idx + delta >= 0 ? navigate(delta) : navigate(fallback, { replace: true }));
  if (instant || !canTransition()) return void go();
  setNav("back");
  const t = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const settle = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        window.addEventListener("popstate", settle, { once: true });
        setTimeout(resolve, 250);
        go();
      }),
  );
  t.finished.finally(() => setNav("forward"));
}
