// Cookieless product analytics (PostHog). No cookies, no stored ids, no
// session recordings, no autocapture: only page views and the few events
// below. Loaded after the first paint so it never slows the page down, and
// only on the live site, never for visitors who send Do Not Track.
import type { PostHog } from "posthog-js";

const TOKEN = "phc_vpCAZkvuCo5JL7mGDDgyDHqzA58X6LLLY4rCke8igp4C";
const HOST = "https://us.i.posthog.com";
const LIVE_HOSTS = ["alittlehang.com", "www.alittlehang.com"];

export type AnalyticsEvent =
  | { name: "search" }
  | { name: "filter_applied"; filter: string }
  | { name: "venue_viewed"; venue_id: string }
  | { name: "share_clicked"; venue_id: string }
  | { name: "directions_clicked"; venue_id: string }
  | { name: "saved"; venue_id: string }
  | { name: "install_prompt"; outcome: "shown" | "installed" };

let ph: PostHog | null = null;
const queue: AnalyticsEvent[] = [];

function enabled() {
  if (!import.meta.env.PROD || !LIVE_HOSTS.includes(location.hostname)) return false;
  const dnt = navigator.doNotTrack ?? (window as { doNotTrack?: string }).doNotTrack;
  return dnt !== "1" && dnt !== "yes";
}

export function track(event: AnalyticsEvent) {
  if (!enabled()) return;
  const { name, ...props } = event;
  if (ph) ph.capture(name, props);
  else if (queue.length < 50) queue.push(event);
}

export function startAnalytics() {
  if (!enabled()) return;
  const load = () =>
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(TOKEN, {
        api_host: HOST,
        cookieless_mode: "always",
        respect_dnt: true,
        autocapture: false,
        capture_pageview: "history_change",
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_product_tours: true,
        disable_web_experiments: true,
        advanced_disable_flags: true,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        disable_external_dependency_loading: true,
      });
      // Shares a PostHog project with setsail.ca; this keeps the two apart.
      posthog.register({ app: "alittlehang" });
      ph = posthog;
      for (const e of queue.splice(0)) track(e);
    });
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(() => load(), { timeout: 4000 }) : setTimeout(load, 2000));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });

  // Browser install prompt: count when it's offered and when it's accepted.
  window.addEventListener("beforeinstallprompt", () => track({ name: "install_prompt", outcome: "shown" }));
  window.addEventListener("appinstalled", () => track({ name: "install_prompt", outcome: "installed" }));
}
