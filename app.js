const STORAGE_KEY = "happyHourVenues";
const SEED_VERSION_KEY = "happyHourSeedVersion";
// Hand-bumped base; venues.json carries a content-derived data_version that
// is appended at load time, so every pipeline re-sync reseeds cached clients.
const SEED_VERSION_BASE = "2026-vancouver-json-v1";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------- Venue accessors ----------
// Venue records mirror the Google Places API response shape (see
// venues-data.js). These accessors are the one place that knows how to
// read that shape, so a future real Places API sync only has to keep
// this file's contract, not every call site.

function getAddress(venue) {
  return venue.formatted_address || "";
}
function getPhone(venue) {
  return venue.formatted_phone_number || "";
}
function getLat(venue) {
  return venue.geometry?.location?.lat;
}
function getLng(venue) {
  return venue.geometry?.location?.lng;
}
function getDays(venue) {
  return venue.happy_hour.days;
}
function getStart(venue) {
  return venue.happy_hour.start;
}
function getEnd(venue) {
  return venue.happy_hour.end;
}
function getDeals(venue) {
  return venue.happy_hour.deals || [];
}

// Amenity checks used by the filter panel. outdoor_seating/gluten_free_options
// read straight off amenities; has_food/has_drink/near_transit/parking are
// computed (from deals categories, transit.walkable, and "any parking key
// is true") rather than being amenity fields themselves.
function hasAmenity(venue, key) {
  const amenities = venue.amenities || {};
  switch (key) {
    case "outdoor_seating":
      return amenities.outdoor_seating === true;
    case "gluten_free_options":
      return amenities.gluten_free_options === true;
    case "has_food":
      return getDeals(venue).some((d) => (d.category || "food") === "food");
    case "has_drink":
      return getDeals(venue).some((d) => (d.category || "food") === "drink");
    case "near_transit":
      return amenities.transit?.walkable === true;
    case "parking":
      return !!amenities.parking && Object.values(amenities.parking).some(Boolean);
    case "late_night":
      // Any advertised window starting 8pm or later (primary or extra).
      return venueWindows(venue).some((w) => w.start >= "20:00");
    default:
      return false;
  }
}

let venues = loadCachedVenues();
loadVenueData();
initUserLocation();
let currentFilter = "all";
let currentView = "list";
let searchQuery = "";
let activeAmenityFilters = new Set();
let selectedDays = new Set();
let editingId = null;
let map = null;
let mapMarkers = new Map(); // venue id -> Leaflet marker
// Carousel<->map sync state. Only HUMAN input may pan the map: a real
// touch/wheel on the carousel arms the observer's settle-pan, and any
// programmatic scroll (pin taps) disarms it. Timer-based suppression broke
// on iOS, where momentum and snap corrections deliver observer events well
// after a programmatic scroll "finished".
let carouselUserActive = false;
let carouselSettleTimer = null;
let carouselPendingId = null;
let mapCardObserver = null;
// "You are here" layers live outside mapMarkers so renderMap's venue-pin
// teardown never removes them.
let userLocDot = null;
let userLocHalo = null;
// The visitor's position, once known — drives "closest to me" list ordering
// and the distance shown on each card. Null until geolocation resolves.
let userPos = null;
let mapToastTimer = null;
// Whether the map has had its one automatic fit-to-all-pins.
let mapFitted = false;

const els = {
  venueList: document.getElementById("venueList"),
  listView: document.getElementById("listView"),
  mapView: document.getElementById("mapView"),
  mapEmpty: document.getElementById("mapEmpty"),
  mapLocateBtn: document.getElementById("mapLocateBtn"),
  mapToast: document.getElementById("mapToast"),
  modal: document.getElementById("venueModal"),
  modalTitle: document.getElementById("modalTitle"),
  form: document.getElementById("venueForm"),
  venueId: document.getElementById("venueId"),
  venueName: document.getElementById("venueName"),
  venueAddress: document.getElementById("venueAddress"),
  venuePhone: document.getElementById("venuePhone"),
  dayPicker: document.getElementById("dayPicker"),
  startTime: document.getElementById("startTime"),
  endTime: document.getElementById("endTime"),
  dealsList: document.getElementById("dealsList"),
  deleteBtn: document.getElementById("deleteVenueBtn"),
  searchInput: document.getElementById("searchInput"),
  mapSearchInput: document.getElementById("mapSearchInput"),
  filterBtn: document.getElementById("filterBtn"),
  filterCount: document.getElementById("filterCount"),
  mapFilterBtn: document.getElementById("mapFilterBtn"),
  mapFilterCount: document.getElementById("mapFilterCount"),
  filterModal: document.getElementById("filterModal"),
  mapCardCarousel: document.getElementById("mapCardCarousel"),
};

// Instant paint from the localStorage cache (whatever version), then
// loadVenueData() fetches venues.json and reseeds when the data changed.
function loadCachedVenues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore — fetch will populate
  }
  return [];
}

// Fetch the merged dataset (generated by pipeline/writeback.js). no-cache
// makes the browser revalidate with the CDN (ETag), so updates land without
// hand-bumped query strings while repeat loads stay a cheap 304.
async function loadVenueData() {
  try {
    const res = await fetch("venues.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data_version, venues: fresh } = await res.json();
    const version = `${SEED_VERSION_BASE}:${data_version}`;
    if (localStorage.getItem(SEED_VERSION_KEY) !== version || venues.length === 0) {
      venues = fresh;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));
        localStorage.setItem(SEED_VERSION_KEY, version);
      } catch {
        // storage full/blocked — the in-memory copy still works this session
      }
      render();
    }
  } catch {
    // offline or fetch failed — keep whatever the cache gave us
  }
}

function newManualVenue() {
  return {
    id: crypto.randomUUID(),
    place_id: null,
    name: "",
    formatted_address: "",
    address_components: null,
    geometry: null,
    formatted_phone_number: "",
    international_phone_number: null,
    website: null,
    types: [],
    business_status: "OPERATIONAL",
    price_level: null,
    rating: null,
    user_ratings_total: null,
    opening_hours: { weekday_text: [] },
    photos: [],
    happy_hour: { days: [1, 2, 3, 4, 5], start: "16:00", end: "18:00", deals: [] },
    data_source: "manual",
    last_synced_at: null,
  };
}

function saveVenues() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function setTimeOnDate(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// All of a venue's recurring windows: the primary plus any extra_windows
// (late-night etc.). A null end means "until close" — treated as 23:59.
function venueWindows(venue) {
  const hh = venue.happy_hour;
  const windows = [{ days: hh.days, start: hh.start, end: hh.end }];
  for (const w of hh.extra_windows || []) {
    if (w?.days?.length && w.start) windows.push({ days: w.days, start: w.start, end: w.end || "23:59" });
  }
  return windows;
}

// Returns { status: 'live'|'upcoming'|'none', start, end } for a venue relative
// to now, considering every window it advertises.
function getVenueOccurrence(venue, now) {
  let bestUpcoming = null;
  let activeOccurrence = null;
  const windows = venueWindows(venue);

  for (let offset = -1; offset <= 7; offset++) {
    const day = addDays(now, offset);
    const dow = day.getDay();
    for (const win of windows) {
      if (!win.days.includes(dow)) continue;

      let start = setTimeOnDate(day, win.start);
      let end = setTimeOnDate(day, win.end);
      if (end <= start) end = addDays(end, 1); // overnight happy hour

      if (now >= start && now < end) {
        if (!activeOccurrence || end > activeOccurrence.end) activeOccurrence = { start, end };
      } else if (start > now) {
        if (!bestUpcoming || start < bestUpcoming.start) {
          bestUpcoming = { start, end };
        }
      }
    }
  }

  if (activeOccurrence) return { status: "live", ...activeOccurrence };
  if (bestUpcoming) return { status: "upcoming", ...bestUpcoming };
  return { status: "none" };
}

function compressDays(days) {
  if (days.length === 7) return "Daily";
  const sorted = [...days].sort((a, b) => a - b);
  const runs = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === run[run.length - 1] + 1) {
      run.push(sorted[i]);
    } else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);

  return runs
    .map((r) =>
      r.length >= 3 ? `${DAY_NAMES[r[0]]}–${DAY_NAMES[r[r.length - 1]]}` : r.map((d) => DAY_NAMES[d]).join(", ")
    )
    .join(", ");
}

function scheduleText(venue) {
  const dayLabels = compressDays(getDays(venue));
  const startLabel = new Date(`1970-01-01T${getStart(venue)}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = new Date(`1970-01-01T${getEnd(venue)}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dayLabels} · ${startLabel}–${endLabel}`;
}

function getOccurrences() {
  const now = new Date();
  return venues.map((v) => ({ venue: v, occ: getVenueOccurrence(v, now) }));
}

// Re-render on real state changes only (filter/search/venue edits). A live
// happy-hour's status can still flip between renders, so a coarse interval
// below catches that — but nothing redraws every second anymore, since that
// was tearing down and rebuilding the horizontal card rows mid-scroll.
function render() {
  const occurrences = getOccurrences();
  renderList(occurrences, new Date());
}

// Runs only when venues/filter/view actually change — rebuilding Leaflet
// markers every second would close open popups and reset the viewport.
function renderMapView() {
  if (currentView === "map") renderMap(getOccurrences());
}

function applyFilters(occurrences) {
  let filtered = occurrences;

  if (currentFilter === "active") {
    filtered = filtered.filter((o) => o.occ.status === "live");
  } else if (currentFilter === "upcoming") {
    filtered = filtered.filter((o) => o.occ.status === "upcoming");
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(
      (o) =>
        o.venue.name.toLowerCase().includes(query) ||
        getAddress(o.venue).toLowerCase().includes(query) ||
        getDeals(o.venue).some((d) => d.name.toLowerCase().includes(query))
    );
  }

  for (const key of activeAmenityFilters) {
    filtered = filtered.filter((o) => hasAmenity(o.venue, key));
  }

  return filtered;
}

// Straight-line km from the visitor to a venue. Null when either side's
// coordinates are unknown; callers sort those last.
function distanceKm(venue) {
  if (!userPos) return null;
  const lat = getLat(venue), lng = getLng(venue);
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat - userPos.lat), dLng = toRad(lng - userPos.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userPos.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function formatDistance(km) {
  if (km === null) return "";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

// Ask once on load. Already-granted visitors resolve silently; a denial just
// leaves each group in its default order.
function initUserLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      render();
    },
    () => {},
    { maximumAge: 300000, timeout: 10000 }
  );
}

function shortAddress(venue) {
  const c = venue.address_components;
  if (c?.route) return c.street_number ? `${c.street_number} ${c.route}` : c.route;
  return getAddress(venue).split(",")[0] || "";
}

function renderList(occurrences, now) {
  let filtered = applyFilters(occurrences);

  filtered = [...filtered].sort((a, b) => {
    const rank = { live: 0, upcoming: 1, none: 2 };
    const r = rank[a.occ.status] - rank[b.occ.status];
    if (r !== 0) return r;
    const at = a.occ.start ? a.occ.start.getTime() : Infinity;
    const bt = b.occ.start ? b.occ.start.getTime() : Infinity;
    return at - bt;
  });

  els.venueList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      venues.length === 0
        ? "No spots yet. Tap “+ Add Spot” to add your first happy hour."
        : "Nothing matches this filter.";
    els.venueList.appendChild(empty);
    return;
  }

  // What is on RIGHT NOW leads; within each group, closest first when we know
  // where the visitor is, otherwise soonest first. Groups mirror the mockup's
  // "Happening now" / "Upcoming" headings rather than start-hour buckets.
  const statusGroups = [
    { key: "live", label: userPos ? "Happening now · closest first" : "Happening now" },
    { key: "upcoming", label: "Upcoming" },
    { key: "none", label: "No upcoming date" },
  ];
  const buckets = { live: [], upcoming: [], none: [] };
  for (const item of filtered) buckets[item.occ.status].push(item);
  if (userPos) {
    // Decorate-sort-undecorate: distanceKm is constant per render, and the
    // comparator would otherwise recompute it on every comparison.
    for (const key of ["live", "upcoming"]) {
      const keyed = buckets[key].map((item) => ({ item, km: distanceKm(item.venue) }));
      keyed.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
      buckets[key] = keyed.map((k) => k.item);
    }
  }

  for (const { key, label } of statusGroups) {
    const items = buckets[key];
    if (items.length === 0) continue;

    const group = document.createElement("div");
    group.className = "status-group";

    const heading = document.createElement("p");
    heading.className = "status-group-label";
    heading.textContent = label;
    group.appendChild(heading);

    const rows = document.createElement("div");
    rows.className = "status-group-rows";
    for (const { venue, occ } of items) {
      rows.appendChild(renderListRow(venue, occ, now));
    }
    group.appendChild(rows);

    els.venueList.appendChild(group);
  }
}

function renderListRow(venue, occ, now) {
  const row = document.createElement("div");
  row.className = "list-row";
  row.addEventListener("click", () => {
    window.location.href = `menu.html?id=${encodeURIComponent(venue.id)}`;
  });

  const photo = document.createElement("div");
  photo.className = "list-row-photo";
  if (venue.cover_image?.url) {
    photo.style.backgroundImage = `url("${venue.cover_image.url}")`;
  } else {
    photo.textContent = "🍸";
  }
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "list-row-edit";
  editBtn.setAttribute("aria-label", "Edit spot");
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal(venue);
  });
  photo.appendChild(editBtn);
  row.appendChild(photo);

  const main = document.createElement("div");
  main.className = "list-row-main";
  row.appendChild(main);

  const top = document.createElement("div");
  top.className = "list-row-top";
  main.appendChild(top);

  const name = document.createElement("p");
  name.className = "list-row-name";
  name.textContent = venue.name;
  top.appendChild(name);

  const time = document.createElement("span");
  time.className = "list-row-time";
  const dot = document.createElement("span");
  dot.className = `list-row-dot ${occ.status === "upcoming" ? "upcoming" : ""}`;
  time.appendChild(dot);
  time.appendChild(document.createTextNode(`${formatShortTime(getStart(venue))}–${formatShortTime(getEnd(venue))}`));
  top.appendChild(time);

  const address = document.createElement("p");
  address.className = "list-row-address";
  const km = distanceKm(venue);
  address.textContent = km === null ? shortAddress(venue) : `${formatDistance(km)} · ${shortAddress(venue)}`;
  main.appendChild(address);

  return row;
}

function formatShortTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const time = m === 0 ? `${hour12}` : `${hour12}:${pad(m)}`;
  return `${time}${period}`;
}

// ---------- Map view ----------

// MAPBOX_TOKEN comes from config.js, which is generated at deploy time
// from a GitHub Actions secret and is NOT committed to the repo — see
// config.example.js and .github/workflows/deploy.yml.
// Light style: the dark tiles buried the pins and read poorly against the
// app's white/amber design.
const MAPBOX_STYLE = "light-v11";

function ensureMap() {
  if (map) return map;
  // No +/- control on touch devices (pinch and double-tap cover it, and the
  // default topleft placement hides under the List pill); desktop gets it
  // top-right, clear of the pill.
  // zoomSnap: 0 lets the map sit at fractional zoom levels. The default of 1
  // rounds every setZoom to a whole level, which is what made the drag-zoom
  // (and pinch) jump in steps instead of tracking the finger.
  map = L.map("map", { attributionControl: true, zoomControl: false, zoomSnap: 0, zoomDelta: 1 })
    .setView([49.2698, -123.1207], 13);
  map.attributionControl.setPrefix("");
  if (!window.matchMedia("(pointer: coarse)").matches) {
    L.control.zoom({ position: "topright" }).addTo(map);
  }
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}{r}?access_token=${MAPBOX_TOKEN}`,
    {
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  ).addTo(map);

  // Double-tap zoom, one finger. Leaflet 1.8+ relies on native dblclick, which
  // mobile Safari withholds (it reserves double-tap for page smart-zoom), so
  // the whole gesture is ours:
  //   double tap, lift          -> step in one zoom level
  //   double tap, hold and drag -> smooth zoom, down to zoom in, up to out
  // Both anchor on the tapped point, so the spot under the finger stays put.
  // Marker taps are excluded; preventDefault stops the browser's smart-zoom.
  const container = map.getContainer();
  const DOUBLE_TAP_MS = 300;      // gap allowed between the two taps
  const DOUBLE_TAP_SLOP = 40;     // px the second tap may land from the first
  const DRAG_SLOP = 6;            // px before a hold counts as a drag
  const PX_PER_ZOOM = 110;        // finger travel for one zoom level
  let lastTap = null;             // previous touchend, for pairing
  let tapZoom = null;             // live double-tap-drag state

  const endTapZoom = () => {
    if (!tapZoom) return;
    map.dragging.enable();
    tapZoom = null;
  };

  container.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || e.target.closest(".map-pin")) { lastTap = null; endTapZoom(); return; }
    const t = e.touches[0];
    if (!lastTap || Date.now() - lastTap.time >= DOUBLE_TAP_MS ||
        Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) >= DOUBLE_TAP_SLOP) return;
    // Second tap of a pair: arm the drag-zoom and take panning out of
    // Leaflet's hands until the finger lifts.
    const rect = container.getBoundingClientRect();
    tapZoom = {
      startY: t.clientY,
      startZoom: map.getZoom(),
      anchor: L.point(t.clientX - rect.left, t.clientY - rect.top),
      dragged: false,
    };
    map.dragging.disable();
  }, { passive: false });

  container.addEventListener("touchmove", (e) => {
    if (!tapZoom || e.touches.length !== 1) return;
    e.preventDefault();
    const dy = e.touches[0].clientY - tapZoom.startY; // down positive -> zoom in
    if (Math.abs(dy) > DRAG_SLOP) tapZoom.dragged = true;
    if (!tapZoom.dragged) return;
    const z = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), tapZoom.startZoom + dy / PX_PER_ZOOM));
    map.setZoomAround(tapZoom.anchor, z, { animate: false });
  }, { passive: false });

  container.addEventListener("touchend", (e) => {
    if (tapZoom) {
      const { anchor, dragged } = tapZoom;
      endTapZoom();
      lastTap = null;
      // A tap-and-lift with no drag is the plain double tap: step in.
      if (!dragged) {
        e.preventDefault();
        map.setZoomAround(anchor, Math.round(map.getZoom()) + 1);
      }
      return;
    }
    if (e.touches.length || e.changedTouches.length !== 1) { lastTap = null; return; }
    if (e.target.closest(".map-pin")) { lastTap = null; return; }
    const t = e.changedTouches[0];
    lastTap = { time: Date.now(), x: t.clientX, y: t.clientY };
  }, { passive: false });

  container.addEventListener("touchcancel", () => { endTapZoom(); lastTap = null; });

  return map;
}

function showMapToast(msg) {
  els.mapToast.textContent = msg;
  els.mapToast.classList.remove("hidden");
  clearTimeout(mapToastTimer);
  mapToastTimer = setTimeout(() => els.mapToast.classList.add("hidden"), 2600);
}

function locateMe() {
  if (!navigator.geolocation) {
    showMapToast("Location isn't supported on this device");
    return;
  }
  const btn = els.mapLocateBtn;
  btn.classList.add("locating");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.classList.remove("locating");
      btn.classList.add("located");
      const m = ensureMap();
      const ll = [pos.coords.latitude, pos.coords.longitude];
      // Same fix drives the list's "closest first" ordering and distance
      // labels — otherwise the map knows where you are and the list doesn't.
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!userLocDot) {
        userLocDot = L.marker(ll, {
          icon: L.divIcon({ className: "user-loc-dot", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] }),
          zIndexOffset: 9500,
          interactive: false,
        }).addTo(m);
        userLocHalo = L.circle(ll, {
          radius: pos.coords.accuracy || 50,
          color: "#2f7cf6",
          weight: 1,
          opacity: 0.35,
          fillColor: "#2f7cf6",
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(m);
      } else {
        userLocDot.setLatLng(ll);
        userLocHalo.setLatLng(ll).setRadius(pos.coords.accuracy || 50);
      }
      m.flyTo(ll, Math.max(m.getZoom(), 15), { duration: 0.6 });
      render();
    },
    () => {
      btn.classList.remove("locating");
      showMapToast("Couldn't get your location — check location permissions");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

els.mapLocateBtn.addEventListener("click", locateMe);

function markerColor(status) {
  if (status === "live") return "#34d399";
  if (status === "upcoming") return "#ff9f43";
  return "#9a9aa5";
}

function renderMap(occurrences) {
  if (currentView !== "map") return;
  const m = ensureMap();

  if (mapCardObserver) mapCardObserver.disconnect();
  mapMarkers.forEach((marker) => marker.remove());
  mapMarkers = new Map();
  els.mapCardCarousel.innerHTML = "";

  const located = applyFilters(occurrences).filter(
    (o) => typeof getLat(o.venue) === "number" && typeof getLng(o.venue) === "number"
  );

  for (const { venue, occ } of located) {
    const color = markerColor(occ.status);
    // Popularity (Google review volume) sets pin size and stacking, so the
    // busiest spots read at a glance: big starred pins on top, quiet spots
    // small and underneath. Status keeps the color channel.
    const reviews = venue.user_ratings_total || 0;
    const tier = reviews >= 2000 ? "hot" : reviews >= 500 ? "mid" : "base";
    const px = tier === "hot" ? 26 : tier === "mid" ? 20 : 15;
    const icon = L.divIcon({
      className: `map-pin map-pin-${tier}`,
      html: `<span style="background:${color}">${tier === "hot" ? "★" : ""}</span>`,
      iconSize: [px, px],
      iconAnchor: [px / 2, px / 2],
    });
    const marker = L.marker([getLat(venue), getLng(venue)], { icon, zIndexOffset: Math.min(reviews, 9000) }).addTo(m);
    marker.on("click", () => selectVenue(venue.id, { pan: true, scrollCarousel: true }));
    mapMarkers.set(venue.id, marker);

    els.mapCardCarousel.appendChild(buildMapCard(venue, occ));
  }

  els.mapEmpty.classList.toggle("hidden", located.length > 0);
  els.mapCardCarousel.classList.toggle("hidden", located.length === 0);

  // Keep the locate button just above the carousel, whose height depends on
  // card content.
  const carouselHeight = located.length === 0 ? 0 : els.mapCardCarousel.getBoundingClientRect().height;
  els.mapLocateBtn.style.bottom = `${carouselHeight + 14}px`;

  // Swiping a card into view highlights its pin instantly (cheap), but the
  // map pans only once, ~160ms after the LAST card change — and only when
  // the swipe came from the user (carouselUserActive). Programmatic scrolls
  // can highlight but never move the map.
  mapCardObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((e) => e.isIntersecting && e.intersectionRatio >= 0.6);
      if (!visible) return;
      highlightPin(visible.target.dataset.venueId);
      if (!carouselUserActive) return;
      carouselPendingId = visible.target.dataset.venueId;
      clearTimeout(carouselSettleTimer);
      carouselSettleTimer = setTimeout(() => panToVenue(carouselPendingId), 160);
    },
    { root: els.mapCardCarousel, threshold: 0.6 }
  );
  els.mapCardCarousel.querySelectorAll(".map-detail-card").forEach((card) => mapCardObserver.observe(card));

  // invalidateSize() must run before fitBounds() — the map view is now
  // position:fixed/full-viewport, so the container's true size (and thus
  // which tiles Leaflet loads) is only correct after that recalculation.
  // Fitting bounds first left it centered on stale, mostly-blank tiles.
  setTimeout(() => {
    m.invalidateSize();
    // Fit only the first time the map is opened. Every later render — a
    // filter switch, a search, a data refresh — must leave the camera where
    // the user put it; re-fitting was yanking them back out to the whole city
    // when they only meant to change which pins show.
    if (!mapFitted && located.length > 0) {
      mapFitted = true;
      const bounds = L.latLngBounds(located.map((o) => [getLat(o.venue), getLng(o.venue)]));
      // The map is full-viewport but the top filter chrome and the bottom
      // card carousel float over it — pad the fit so no pin lands hidden
      // underneath either.
      const filters = document.querySelector(".map-filters");
      const topPad = filters ? filters.getBoundingClientRect().bottom + 16 : 130;
      m.fitBounds(bounds, {
        paddingTopLeft: [30, topPad],
        paddingBottomRight: [30, carouselHeight + 24],
        maxZoom: 15,
      });
    }
  }, 0);
}

// Leading dollar amount of a deal price ("$5–8" -> 5, "$3.50 ea" -> 3.5).
// Discounts ("$3 off", "50% off") rank last: they aren't a price you pay,
// so they only surface when a category has nothing absolute.
function dealRank(price) {
  if (/off/i.test(price || "")) return Infinity;
  const m = /\$\s*(\d+(?:\.\d+)?)/.exec(price || "");
  return m ? parseFloat(m[1]) : Infinity;
}

function bestDeal(deals, category) {
  // Category defaults to "food" like everywhere else, and a priceless deal
  // still counts — some venues publish the items without the prices, and
  // dropping them made the card claim nothing was published at all.
  const pool = deals.filter((d) => (d.category || "food") === category && d.name);
  if (!pool.length) return null;
  return pool.reduce((a, b) => (dealRank(b.price) < dealRank(a.price) ? b : a));
}

function buildMapCard(venue, occ) {
  const card = document.createElement("div");
  card.className = "map-detail-card";
  card.dataset.venueId = venue.id;
  card.addEventListener("click", () => {
    window.location.href = `menu.html?id=${encodeURIComponent(venue.id)}`;
  });

  const body = document.createElement("div");
  body.className = "map-detail-body";
  card.appendChild(body);

  const name = document.createElement("h3");
  name.className = "map-detail-name";
  name.textContent = venue.name;
  body.appendChild(name);

  const meta = document.createElement("div");
  meta.className = "map-detail-meta";
  const status = document.createElement("span");
  status.className = "map-detail-status";
  if (occ.status === "live") {
    status.classList.add("live");
    status.textContent = "Live now";
  } else if (occ.status === "upcoming") {
    status.classList.add("upcoming");
    status.textContent = "Upcoming";
  } else {
    status.textContent = "No date";
  }
  meta.appendChild(status);
  const time = document.createElement("span");
  time.className = "map-detail-time";
  time.textContent =
    occ.status === "none" ? "" : `${formatShortTime(getStart(venue))}–${formatShortTime(getEnd(venue))}`;
  meta.appendChild(time);
  if (venue.rating) {
    const rating = document.createElement("span");
    rating.className = "map-detail-rating";
    rating.textContent = `★ ${venue.rating}`;
    meta.appendChild(rating);
  }
  body.appendChild(meta);

  const address = getAddress(venue);
  if (address) {
    const addressEl = document.createElement("div");
    addressEl.className = "map-detail-address";
    addressEl.textContent = address;
    body.appendChild(addressEl);
  }

  const actions = document.createElement("div");
  actions.className = "map-detail-actions";
  body.appendChild(actions);

  // Showcase the menu instead of navigation links: the cheapest drink and
  // food deal. Venues without extracted deals keep the directions row so the
  // card isn't empty.
  const deals = getDeals(venue);
  const highlights = [
    ["🍸", bestDeal(deals, "drink")],
    ["🍴", bestDeal(deals, "food")],
  ].filter(([, d]) => d);
  if (highlights.length) {
    for (const [icon, deal] of highlights) {
      const row = document.createElement("div");
      row.className = "map-detail-action map-detail-deal";
      row.innerHTML = `<span class="map-detail-action-icon">${icon}</span><span class="map-detail-deal-name"></span><span class="map-detail-deal-price"></span>`;
      row.querySelector(".map-detail-deal-name").textContent = deal.name;
      row.querySelector(".map-detail-deal-price").textContent = deal.price || "";
      actions.appendChild(row);
    }
  } else {
    // This venue advertises a happy hour but publishes no item list. Say that
    // rather than leaving the card looking like the data failed to load.
    const note = document.createElement("div");
    note.className = "map-detail-nodeals";
    note.textContent = "Deal list not published online";
    actions.appendChild(note);
    if (address) {
      const directions = document.createElement("a");
      directions.className = "map-detail-action";
      directions.target = "_blank";
      directions.rel = "noopener";
      directions.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      directions.addEventListener("click", (e) => e.stopPropagation());
      directions.innerHTML = `<span class="map-detail-action-icon">🧭</span><span>Get directions</span>`;
      actions.appendChild(directions);
    }
  }

  const menuUrl = `menu.html?id=${encodeURIComponent(venue.id)}`;

  const arrow = document.createElement("a");
  arrow.className = "map-detail-arrow-btn";
  arrow.href = menuUrl;
  arrow.setAttribute("aria-label", "View menu");
  arrow.textContent = "→";
  arrow.addEventListener("click", (e) => e.stopPropagation());
  card.appendChild(arrow);

  // Swipe up to open the venue. The card follows the finger and commits past
  // 80px; anything more sideways than up stays native carousel scrolling
  // (touch-action: pan-x hands only vertical movement to these handlers).
  let lift = null;
  card.addEventListener("touchstart", (e) => {
    lift = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null } : null;
  }, { passive: true });
  card.addEventListener("touchmove", (e) => {
    if (!lift || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lift.x;
    const dy = e.touches[0].clientY - lift.y;
    if (!lift.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      lift.axis = -dy > Math.abs(dx) * 1.2 ? "v" : "h";
      if (lift.axis === "v") card.classList.add("lifting");
    }
    if (lift.axis !== "v") return;
    e.preventDefault();
    card.style.transform = `translateY(${Math.min(0, dy)}px)`;
  }, { passive: false });
  card.addEventListener("touchend", (e) => {
    if (!lift) return;
    const wasVertical = lift.axis === "v";
    const dy = wasVertical && e.changedTouches.length ? e.changedTouches[0].clientY - lift.y : 0;
    lift = null;
    if (!wasVertical) return;
    card.classList.remove("lifting");
    if (dy < -80) {
      card.style.transform = "translateY(-130%)";
      card.style.opacity = "0";
      setTimeout(() => { window.location.href = menuUrl; }, 150);
    } else {
      card.style.transform = "";
    }
  });
  card.addEventListener("touchcancel", () => {
    if (lift?.axis === "v") {
      card.classList.remove("lifting");
      card.style.transform = "";
    }
    lift = null;
  });

  return card;
}

function highlightPin(venueId) {
  mapMarkers.forEach((mk, id) => {
    mk.getElement()?.classList.toggle("map-pin-active", id === venueId);
  });
}

function panToVenue(venueId) {
  const marker = mapMarkers.get(venueId);
  if (!marker || !map) return;
  // Already near center? Skip the pan — micro-adjustments read as jitter.
  const point = map.latLngToContainerPoint(marker.getLatLng());
  const size = map.getSize();
  if (Math.abs(point.x - size.x / 2) < size.x / 5 && Math.abs(point.y - size.y / 2) < size.y / 5) return;
  map.panTo(marker.getLatLng(), { animate: true, duration: 0.5, easeLinearity: 0.3 });
}

function selectVenue(venueId, { pan = false, scrollCarousel = false } = {}) {
  if (!mapMarkers.has(venueId)) return;
  highlightPin(venueId);
  clearTimeout(carouselSettleTimer); // a direct selection outranks a settling swipe
  if (pan) panToVenue(venueId);

  if (scrollCarousel) {
    const card = els.mapCardCarousel.querySelector(`[data-venue-id="${CSS.escape(venueId)}"]`);
    if (card) {
      // Programmatic scroll: disarm the observer's pan. Late observer events
      // (iOS momentum, snap corrections) can highlight but never move the map
      // until the user touches the carousel again.
      carouselUserActive = false;
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }
}

// Real user input on the carousel re-arms the observer's settle-pan.
for (const evt of ["touchstart", "wheel", "pointerdown"]) {
  els.mapCardCarousel.addEventListener(evt, () => { carouselUserActive = true; }, { passive: true });
}

// ---------- Modal handling ----------

function openModal(venue) {
  editingId = venue ? venue.id : null;
  els.modalTitle.textContent = venue ? "Edit Spot" : "Add a Spot";
  els.deleteBtn.classList.toggle("hidden", !venue);

  els.venueId.value = venue ? venue.id : "";
  els.venueName.value = venue ? venue.name : "";
  els.venueAddress.value = venue ? getAddress(venue) : "";
  els.venuePhone.value = venue ? getPhone(venue) : "";
  els.startTime.value = venue ? getStart(venue) : "16:00";
  els.endTime.value = venue ? getEnd(venue) : "18:00";

  selectedDays = new Set(venue ? getDays(venue) : [1, 2, 3, 4, 5]);
  renderDayPicker();

  els.dealsList.innerHTML = "";
  const deals = venue && getDeals(venue).length ? getDeals(venue) : [{ name: "", price: "", category: "food", description: "" }];
  for (const d of deals) addDealRow(d.name, d.price, d.category, d.description);

  els.modal.classList.remove("hidden");
}

function closeModal() {
  els.modal.classList.add("hidden");
  editingId = null;
}

function renderDayPicker() {
  els.dayPicker.querySelectorAll(".day-btn").forEach((btn) => {
    const day = Number(btn.dataset.day);
    btn.classList.toggle("selected", selectedDays.has(day));
  });
}

els.dayPicker.addEventListener("click", (e) => {
  const btn = e.target.closest(".day-btn");
  if (!btn) return;
  const day = Number(btn.dataset.day);
  if (selectedDays.has(day)) selectedDays.delete(day);
  else selectedDays.add(day);
  renderDayPicker();
});

function addDealRow(name = "", price = "", category = "food", description = "") {
  const row = document.createElement("div");
  row.className = "deal-edit-row";
  row.innerHTML = `
    <div class="deal-edit-row-main">
      <input type="text" class="deal-name" placeholder="Deal (e.g. Draft beers)" value="${escapeHtml(name)}" />
      <input type="text" class="deal-price" placeholder="Price" value="${escapeHtml(price)}" />
      <button type="button" title="Remove">&times;</button>
    </div>
    <div class="deal-edit-row-extra">
      <select class="deal-category">
        <option value="food"${category === "food" ? " selected" : ""}>Food</option>
        <option value="drink"${category === "drink" ? " selected" : ""}>Drink</option>
      </select>
      <input type="text" class="deal-description" placeholder="Description (optional)" value="${escapeHtml(description || "")}" />
    </div>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  els.dealsList.appendChild(row);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
document.getElementById("addDealBtn").addEventListener("click", () => addDealRow());

els.modal.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});

els.deleteBtn.addEventListener("click", () => {
  if (!editingId) return;
  venues = venues.filter((v) => v.id !== editingId);
  saveVenues();
  closeModal();
  render();
  renderMapView();
});

els.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = els.venueName.value.trim();
  if (!name) return;
  if (selectedDays.size === 0) {
    alert("Pick at least one day.");
    return;
  }

  const deals = [...els.dealsList.querySelectorAll(".deal-edit-row")]
    .map((row) => ({
      name: row.querySelector(".deal-name").value.trim(),
      price: row.querySelector(".deal-price").value.trim(),
      category: row.querySelector(".deal-category").value,
      description: row.querySelector(".deal-description").value.trim(),
    }))
    .filter((d) => d.name);

  // Start from the existing Places-schema record (preserving place_id,
  // geometry, rating, photos, etc. — none of which this simple form edits)
  // and only overlay the fields the form actually owns. Editing the
  // address here does NOT re-geocode it; that would need a real Places
  // API/geocoder call, which isn't wired up yet.
  const existing = editingId ? venues.find((v) => v.id === editingId) : null;
  const venueData = existing ? JSON.parse(JSON.stringify(existing)) : newManualVenue();

  venueData.id = editingId || venueData.id;
  venueData.name = name;
  venueData.formatted_address = els.venueAddress.value.trim();
  venueData.formatted_phone_number = els.venuePhone.value.trim();
  venueData.happy_hour = {
    days: [...selectedDays].sort(),
    start: els.startTime.value,
    end: els.endTime.value,
    deals,
  };

  if (editingId) {
    venues = venues.map((v) => (v.id === editingId ? venueData : v));
  } else {
    venues.push(venueData);
  }

  saveVenues();
  closeModal();
  render();
  renderMapView();
});

// Two filter-chip bars exist in the DOM (list view + the floating one over
// the map) and must stay in sync — toggle by matching data-filter rather
// than the single clicked node, so whichever bar the user last touched wins
// everywhere.
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b.dataset.filter === currentFilter));
    render();
    renderMapView();
  });
});

function setView(view) {
  currentView = view;
  document.querySelectorAll(".view-tab").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  els.listView.classList.toggle("hidden", view !== "list");
  els.mapView.classList.toggle("hidden", view !== "map");
  document.body.classList.toggle("map-fullscreen", view === "map");
  render();
  renderMapView();
}

document.querySelectorAll(".view-tab").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

// ---------- Search + filters ----------
// The map view has its own copy of the search field and filter button
// (its header is separate DOM from the list's, hidden in the other view) —
// both stay in sync since they share the same searchQuery/amenity state.

[els.searchInput, els.mapSearchInput].forEach((input) => {
  input.addEventListener("input", () => {
    searchQuery = input.value;
    const other = input === els.searchInput ? els.mapSearchInput : els.searchInput;
    other.value = searchQuery;
    render();
    renderMapView();
  });
});

function updateFilterButton() {
  const count = activeAmenityFilters.size;
  [els.filterBtn, els.mapFilterBtn].forEach((btn) => btn.classList.toggle("has-active", count > 0));
  [els.filterCount, els.mapFilterCount].forEach((el) => {
    el.classList.toggle("hidden", count === 0);
    el.textContent = String(count);
  });
}

function renderFilterToggles() {
  document.querySelectorAll(".filter-toggle-row").forEach((row) => {
    row.classList.toggle("active", activeAmenityFilters.has(row.dataset.amenity));
  });
}

[els.filterBtn, els.mapFilterBtn].forEach((btn) => {
  btn.addEventListener("click", () => {
    renderFilterToggles();
    els.filterModal.classList.remove("hidden");
  });
});

document.getElementById("closeFilterModalBtn").addEventListener("click", () => {
  els.filterModal.classList.add("hidden");
});
document.getElementById("doneFiltersBtn").addEventListener("click", () => {
  els.filterModal.classList.add("hidden");
});
els.filterModal.addEventListener("click", (e) => {
  if (e.target === els.filterModal) els.filterModal.classList.add("hidden");
});

document.querySelectorAll(".filter-toggle-row").forEach((row) => {
  row.addEventListener("click", () => {
    const key = row.dataset.amenity;
    if (activeAmenityFilters.has(key)) activeAmenityFilters.delete(key);
    else activeAmenityFilters.add(key);
    row.classList.toggle("active");
    updateFilterButton();
    render();
    renderMapView();
  });
});

document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  activeAmenityFilters.clear();
  renderFilterToggles();
  updateFilterButton();
  render();
  renderMapView();
});

render();
renderMapView();
// Coarse refresh so a card's live/upcoming status catches up to the clock —
// no need for per-second precision now that the countdown display is gone,
// and a rare interval far outruns the odds of landing mid-scroll.
setInterval(render, 60000);

// The hero is position:fixed (pinned behind the sheet so the sheet scrolls
// up to cover it) and so no longer reserves flow space on its own — measure
// its real height and feed it to the --hero-height var the sheet's
// margin-top depends on. Re-measure on resize since the title's clamp()
// sizing shifts the hero's height as viewport width changes.
const heroEl = document.querySelector(".hero");
function updateHeroHeight() {
  document.documentElement.style.setProperty("--hero-height", `${heroEl.offsetHeight}px`);
}
updateHeroHeight();
window.addEventListener("resize", updateHeroHeight);
