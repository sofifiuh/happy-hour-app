// Playwright render fallback for JS-rendered sites (Squarespace/Wix/React
// menus). Uses the environment's pre-installed Chromium and routes through
// the agent proxy explicitly — Playwright does not forward env proxies to
// the browser on its own.
import fs from "node:fs";
// Same UA as the static crawl — the render fallback must look like the same
// client to a venue's site.
import { UA } from "./curl.js";

const EXEC = "/opt/pw-browsers/chromium";

let browserPromise = null;
let contextPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("playwright-core");
      const opts = { headless: true, args: ["--no-sandbox", "--disable-features=PostQuantumKyber,UseMLKEM,EncryptedClientHello", "--ssl-version-max=tls1.2"] };
      if (fs.existsSync(EXEC)) opts.executablePath = EXEC;
      const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
      if (proxy) opts.proxy = { server: proxy, bypass: "localhost,127.0.0.1" };
      return chromium.launch(opts);
    })();
  }
  return browserPromise;
}

// One shared context (UA, viewport, resource blocking) for all renders —
// contexts are not cheap and nothing here needs per-page isolation.
async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const browser = await getBrowser();
      const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 2000 } });
      await context.route("**/*", (route) =>
        ["image", "media", "font"].includes(route.request().resourceType()) ? route.abort() : route.continue()
      );
      return context;
    })();
  }
  return contextPromise;
}

/**
 * Render a URL in headless Chromium and return the post-JS DOM.
 * Resolves { html, finalUrl, error } — never rejects. Images/media/fonts
 * are blocked for speed; we only need the DOM text.
 */
export async function renderPage(url, opts = {}) {
  const first = await renderOnce(url, opts);
  // The egress gateway is flaky per-host; one retry rescues transient tunnels.
  if (first.error && /ERR_TUNNEL|ERR_CONNECTION|ERR_EMPTY/.test(first.error)) {
    await new Promise((r) => setTimeout(r, 3000));
    return renderOnce(url, opts);
  }
  return first;
}

async function renderOnce(url, { timeoutMs = 45000, settleMs = 2500 } = {}) {
  let page = null;
  try {
    const context = await getContext();
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    // Give client-side rendering a moment. When networkidle is reached the
    // page has settled and a short grace is enough; the full settle wait is
    // only for sites whose analytics beacons never go idle.
    const idle = await page.waitForLoadState("networkidle", { timeout: settleMs * 2 }).then(() => true).catch(() => false);
    await page.waitForTimeout(idle ? 300 : settleMs);
    const html = await page.content();
    const finalUrl = page.url();
    await page.close();
    return { html, finalUrl, error: null };
  } catch (e) {
    if (page) await page.close().catch(() => {});
    return { html: null, finalUrl: url, error: String(e.message || e).slice(0, 300) };
  }
}

export async function closeBrowser() {
  contextPromise = null;
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b) await b.close().catch(() => {});
    browserPromise = null;
  }
}
