// Offline support for A Little Hang. Hand-written to stay tiny:
//   pages      network first, falling back to the cached app shell
//   assets/*   cache first (file names are content-hashed)
//   venues     stale-while-revalidate, so the list opens instantly offline
//              (?fresh=… skips it: the app's retry when the cached copy is an older shape)
//   photos     cache first
const CACHE = "alh-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const html = await (await fetch("./", { cache: "no-cache" })).text();
      const assets = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll(["./", "venues.json", "manifest.webmanifest", "icon.svg", "icon-192.png", ...assets]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, "./"));
  } else if (url.pathname.includes("/assets/") || url.pathname.includes("/photos/")) {
    event.respondWith(cacheFirst(req));
  } else if (url.pathname.endsWith("/venues.json") && !url.searchParams.has("fresh")) {
    event.respondWith(staleWhileRevalidate(req, event));
  }
});

async function networkFirst(req, fallback) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(fallback, res.clone());
    return res;
  } catch {
    return (await cache.match(fallback)) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CACHE);
  // One entry per path: a query string must not leave a copy that never refreshes.
  const key = new URL(req.url);
  key.search = "";
  const hit = await cache.match(key.href);
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(key.href, res.clone());
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return fresh;
}
