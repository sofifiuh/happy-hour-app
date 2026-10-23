// Interactive map on the static best-of pages (/happy-hour/<place>/best/,
// written by scripts/prerender.mjs): numbered pins for the ranked spots.
// MapLibre is most of a megabyte, so it loads only when the map is near
// the screen.
const el = document.getElementById("best-map");
if (el) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      import("./best-map-view").then((m) => m.mount(el));
    },
    { rootMargin: "300px" },
  );
  io.observe(el);
}
