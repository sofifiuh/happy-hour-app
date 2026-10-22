import { useSyncExternalStore } from "react";

const DESKTOP = "(min-width: 1024px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// List beside the map from 1024px up; phones and portrait tablets keep
// the List / Map toggle.
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP).matches, () => false);
}

const LIGHT = "(prefers-color-scheme: light)";

export type Scheme = "light" | "dark";

export function colorScheme(): Scheme {
  return typeof window !== "undefined" && window.matchMedia(LIGHT).matches ? "light" : "dark";
}

function subscribeScheme(cb: () => void) {
  const mq = window.matchMedia(LIGHT);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

// Follows the system light/dark setting live, for the parts CSS can't
// reach (the map basemap and pin paint).
export function useColorScheme(): Scheme {
  return useSyncExternalStore(subscribeScheme, colorScheme, () => "dark");
}
