import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startAnalytics } from "./lib/analytics";

const root = document.getElementById("root")!;
const mount = () =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// Prerendered venue pages (scripts/prerender.mjs) already show the photo and
// times. Let that photo load and paint before the app replaces it, so the
// first view isn't held back by the script and data downloads.
const staticHero = root.querySelector<HTMLImageElement>("img[fetchpriority=high]");
if (staticHero && !staticHero.complete) {
  const go = () => requestAnimationFrame(() => setTimeout(mount));
  staticHero.addEventListener("load", go, { once: true });
  staticHero.addEventListener("error", go, { once: true });
} else if (staticHero) {
  requestAnimationFrame(() => setTimeout(mount));
} else {
  mount();
}

startAnalytics();

// Offline shell and cached venues (public/sw.js). Production builds only;
// hosts that don't allow service workers just skip it.
if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + "sw.js").catch(() => {});
  });
}
