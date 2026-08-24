const STORAGE_KEY = "happyHourVenues";
const SEED_VERSION_KEY = "happyHourSeedVersion";
const SEED_VERSION = "2026-vancouver-10-places-schema-photos-amenities";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SOON_THRESHOLD_MS = 60 * 60 * 1000; // "Soon" = starting within the next hour

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
    default:
      return false;
  }
}

let venues = loadVenues();
let currentFilter = "all";
let currentView = "list";
let searchQuery = "";
let activeAmenityFilters = new Set();
let selectedDays = new Set();
let editingId = null;
let map = null;
let mapMarkers = [];

const els = {
  venueList: document.getElementById("venueList"),
  listView: document.getElementById("listView"),
  mapView: document.getElementById("mapView"),
  mapEmpty: document.getElementById("mapEmpty"),
  mapBackToListBtn: document.getElementById("mapBackToListBtn"),
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
  filterBtn: document.getElementById("filterBtn"),
  filterCount: document.getElementById("filterCount"),
  filterModal: document.getElementById("filterModal"),
  mapDetailCard: document.getElementById("mapDetailCard"),
  mapDetailClose: document.getElementById("mapDetailClose"),
  mapDetailName: document.getElementById("mapDetailName"),
  mapDetailDot: document.getElementById("mapDetailDot"),
  mapDetailHours: document.getElementById("mapDetailHours"),
  mapDetailAddress: document.getElementById("mapDetailAddress"),
  mapDetailDirections: document.getElementById("mapDetailDirections"),
  mapDetailMenu: document.getElementById("mapDetailMenu"),
  mapDetailArrow: document.getElementById("mapDetailArrow"),
};

function loadVenues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const seenVersion = localStorage.getItem(SEED_VERSION_KEY);
    if (raw && seenVersion === SEED_VERSION) return JSON.parse(raw);
  } catch {
    // fall through to sample data
  }
  const sample = sampleVenues();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  return sample;
}

// Real Vancouver happy hour spots — see venues-data.js for the schema
// and sourcing notes. Deep-cloned so in-session edits never mutate the
// shared seed constant.
function sampleVenues() {
  return JSON.parse(JSON.stringify(VENUES_SEED));
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

// Returns { status: 'live'|'upcoming'|'none', start, end } for a venue relative to now
function getVenueOccurrence(venue, now) {
  let bestUpcoming = null;
  let activeOccurrence = null;

  for (let offset = -1; offset <= 7; offset++) {
    const day = addDays(now, offset);
    const dow = day.getDay();
    if (!getDays(venue).includes(dow)) continue;

    let start = setTimeOnDate(day, getStart(venue));
    let end = setTimeOnDate(day, getEnd(venue));
    if (end <= start) end = addDays(end, 1); // overnight happy hour

    if (now >= start && now < end) {
      activeOccurrence = { start, end };
    } else if (start > now) {
      if (!bestUpcoming || start < bestUpcoming.start) {
        bestUpcoming = { start, end };
      }
    }
  }

  if (activeOccurrence) return { status: "live", ...activeOccurrence };
  if (bestUpcoming) {
    const soon = bestUpcoming.start - now <= SOON_THRESHOLD_MS;
    return { status: "upcoming", soon, ...bestUpcoming };
  }
  return { status: "none" };
}

function formatDayTime(date, now) {
  const sameDay = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${timeStr}`;
  const tomorrow = addDays(now, 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeStr}`;
  return `${DAY_NAMES[date.getDay()]}, ${timeStr}`;
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
  } else if (currentFilter === "soon") {
    filtered = filtered.filter((o) => o.occ.status === "upcoming" && o.occ.soon);
  } else if (currentFilter === "upcoming") {
    filtered = filtered.filter((o) => o.occ.status === "upcoming" && !o.occ.soon);
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

// Groups cards by the hour their happy hour starts (per the "Weekly View"
// reference: https://figma.com/design/.../?node-id=1708-35683) — e.g. a
// 2:00pm and a 2:30pm start both land in the "Starts at 2pm" bucket, while
// the exact range still shows on each card's own pill.
function startHourBucket(venue) {
  const [h] = getStart(venue).split(":").map(Number);
  const label = new Date(`1970-01-01T${pad(h)}:00`).toLocaleTimeString([], { hour: "numeric" });
  return { key: h, label: `Starts at ${label.replace(" ", "").toLowerCase()}` };
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

  const groups = new Map();
  for (const item of filtered) {
    const bucket = startHourBucket(item.venue);
    if (!groups.has(bucket.key)) groups.set(bucket.key, { label: bucket.label, items: [] });
    groups.get(bucket.key).items.push(item);
  }

  for (const key of [...groups.keys()].sort((a, b) => a - b)) {
    const { label, items } = groups.get(key);

    const group = document.createElement("div");
    group.className = "time-group";

    const heading = document.createElement("p");
    heading.className = "time-group-label";
    heading.textContent = label;
    group.appendChild(heading);

    const row = document.createElement("div");
    row.className = "time-group-row";
    for (const { venue, occ } of items) {
      row.appendChild(renderWeeklyCard(venue, occ, now));
    }
    group.appendChild(row);

    els.venueList.appendChild(group);
  }
}

function renderWeeklyCard(venue, occ, now) {
  const card = document.createElement("div");
  card.className = "weekly-card";
  card.addEventListener("click", () => {
    window.location.href = `menu.html?id=${encodeURIComponent(venue.id)}`;
  });

  const photo = document.createElement("div");
  photo.className = "weekly-card-photo";
  if (venue.cover_image?.url) {
    photo.style.backgroundImage = `url("${venue.cover_image.url}")`;
  } else {
    photo.classList.add("placeholder");
    photo.textContent = "🍸";
  }

  const pill = document.createElement("span");
  pill.className = `weekly-card-pill ${occ.status === "live" ? "live" : ""}`;
  pill.textContent = `${formatShortTime(getStart(venue))}–${formatShortTime(getEnd(venue))}`;
  photo.appendChild(pill);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "weekly-card-edit";
  editBtn.setAttribute("aria-label", "Edit spot");
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal(venue);
  });
  photo.appendChild(editBtn);

  card.appendChild(photo);

  const name = document.createElement("p");
  name.className = "weekly-card-name";
  name.textContent = venue.name;
  card.appendChild(name);

  const meta = document.createElement("p");
  meta.className = "weekly-card-meta";
  meta.textContent = shortAddress(venue);
  card.appendChild(meta);

  return card;
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
const MAPBOX_STYLE = "dark-v11";

function ensureMap() {
  if (map) return map;
  map = L.map("map", { attributionControl: true }).setView([49.2698, -123.1207], 13);
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
  return map;
}

function markerColor(status) {
  if (status === "live") return "#34d399";
  if (status === "upcoming") return "#ff9f43";
  return "#9a9aa5";
}

function renderMap(occurrences) {
  if (currentView !== "map") return;
  const m = ensureMap();

  els.mapDetailCard.classList.add("hidden");
  mapMarkers.forEach((marker) => marker.remove());
  mapMarkers = [];

  const located = applyFilters(occurrences).filter(
    (o) => typeof getLat(o.venue) === "number" && typeof getLng(o.venue) === "number"
  );

  const now = new Date();

  for (const { venue, occ } of located) {
    const color = markerColor(occ.status);
    const icon = L.divIcon({
      className: "map-pin",
      html: `<span style="background:${color}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([getLat(venue), getLng(venue)], { icon }).addTo(m);
    marker.on("click", () => showMapDetailCard(venue, occ, now));
    mapMarkers.push(marker);
  }

  els.mapEmpty.classList.toggle("hidden", located.length > 0);

  // invalidateSize() must run before fitBounds() — the map view is now
  // position:fixed/full-viewport, so the container's true size (and thus
  // which tiles Leaflet loads) is only correct after that recalculation.
  // Fitting bounds first left it centered on stale, mostly-blank tiles.
  setTimeout(() => {
    m.invalidateSize();
    if (located.length > 0) {
      const bounds = L.latLngBounds(located.map((o) => [getLat(o.venue), getLng(o.venue)]));
      m.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, 0);
}

function showMapDetailCard(venue, occ, now) {
  els.mapDetailName.textContent = venue.name;

  els.mapDetailDot.className = "map-detail-dot";
  if (occ.status === "upcoming") els.mapDetailDot.classList.add("upcoming");
  if (occ.status === "none") els.mapDetailDot.classList.add("none");

  if (occ.status === "live") {
    els.mapDetailHours.textContent = `Ends ${formatDayTime(occ.end, now)}`;
  } else if (occ.status === "upcoming") {
    els.mapDetailHours.textContent = `Starts ${formatDayTime(occ.start, now)}`;
  } else {
    els.mapDetailHours.textContent = "No upcoming date";
  }

  const address = getAddress(venue);
  els.mapDetailAddress.textContent = address;
  els.mapDetailAddress.classList.toggle("hidden", !address);

  if (address) {
    els.mapDetailDirections.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    els.mapDetailDirections.classList.remove("hidden");
  } else {
    els.mapDetailDirections.classList.add("hidden");
  }

  const menuUrl = `menu.html?id=${encodeURIComponent(venue.id)}`;
  els.mapDetailMenu.href = menuUrl;
  els.mapDetailArrow.href = menuUrl;

  els.mapDetailCard.classList.remove("hidden");
}

els.mapDetailClose.addEventListener("click", () => {
  els.mapDetailCard.classList.add("hidden");
});

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

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
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

els.mapBackToListBtn.addEventListener("click", () => setView("list"));

// ---------- Search + filters ----------

els.searchInput.addEventListener("input", () => {
  searchQuery = els.searchInput.value;
  render();
  renderMapView();
});

function updateFilterButton() {
  const count = activeAmenityFilters.size;
  els.filterBtn.classList.toggle("has-active", count > 0);
  els.filterCount.classList.toggle("hidden", count === 0);
  els.filterCount.textContent = String(count);
}

function renderFilterToggles() {
  document.querySelectorAll(".filter-toggle-row").forEach((row) => {
    row.classList.toggle("active", activeAmenityFilters.has(row.dataset.amenity));
  });
}

els.filterBtn.addEventListener("click", () => {
  renderFilterToggles();
  els.filterModal.classList.remove("hidden");
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
