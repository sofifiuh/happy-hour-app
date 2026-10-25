import { useSyncExternalStore } from "react";

const DESKTOP = "(min-width: 1024px)";
const WIDE = "(min-width: 1280px)";

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const isDesktop = () => typeof window !== "undefined" && window.matchMedia(DESKTOP).matches;

// List beside the map from 1024px up; phones and portrait tablets keep
// the List / Map toggle.
export function useIsDesktop() {
  return useMedia(DESKTOP);
}

// Room for list, venue panel and map side by side (lib/browse.tsx).
// Narrower desktops lay the panel over the list instead.
export function useIsWide() {
  return useMedia(WIDE);
}

const LIGHT = "(prefers-color-scheme: light)";
const THEME_KEY = "theme";
const THEME_COLOR = { light: "#f5f1e7", dark: "#1b1b1b" } as const;

export type Scheme = "light" | "dark";
// What the person picked in Filters; "system" follows the device.
export type ThemePref = Scheme | "system";

function readPref(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

let pref: ThemePref = typeof window !== "undefined" ? readPref() : "system";
const listeners = new Set<() => void>();

export function colorScheme(): Scheme {
  if (pref !== "system") return pref;
  return typeof window !== "undefined" && window.matchMedia(LIGHT).matches ? "light" : "dark";
}

// The inline script in index.html sets data-theme before first paint; this
// keeps it (and the browser bar colour) in step after that.
function apply() {
  const scheme = colorScheme();
  document.documentElement.dataset.theme = scheme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = THEME_COLOR[scheme]));
  listeners.forEach((cb) => cb());
}

if (typeof window !== "undefined") {
  window.matchMedia(LIGHT).addEventListener("change", () => pref === "system" && apply());
  // Another tab changed it.
  window.addEventListener("storage", (e) => {
    if (e.key !== THEME_KEY) return;
    pref = readPref();
    apply();
  });
}

export function setThemePref(next: ThemePref) {
  pref = next;
  try {
    if (next === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // private mode: still applies for this visit
  }
  apply();
}

function subscribeScheme(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribeScheme, () => pref, () => "system");
}

// The theme in effect (the person's pick, else the system setting), live,
// for the parts CSS can't reach (the map basemap and pin paint).
export function useColorScheme(): Scheme {
  return useSyncExternalStore(subscribeScheme, colorScheme, () => "dark");
}
