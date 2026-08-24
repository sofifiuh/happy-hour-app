const STORAGE_KEY = "happyHourVenues";
const SEED_VERSION_KEY = "happyHourSeedVersion";
const SEED_VERSION = "2026-vancouver-10-places-schema";
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

let venues = loadVenues();
let currentFilter = "all";
let currentView = "list";
let selectedDays = new Set();
let editingId = null;
let map = null;
let mapMarkers = [];

const els = {
  countdownLabel: document.getElementById("countdownLabel"),
  countdownTimer: document.getElementById("countdownTimer"),
  countdownSub: document.getElementById("countdownSub"),
  venueList: document.getElementById("venueList"),
  listView: document.getElementById("listView"),
  mapView: document.getElementById("mapView"),
  mapEmpty: document.getElementById("mapEmpty"),
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
  if (bestUpcoming) return { status: "upcoming", ...bestUpcoming };
  return { status: "none" };
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
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

// Runs every second: cheap DOM updates only (countdown + list).
function render() {
  const occurrences = getOccurrences();
  renderCountdown(occurrences, new Date());
  renderList(occurrences, new Date());
}

// Runs only when venues/filter/view actually change — rebuilding Leaflet
// markers every second would close open popups and reset the viewport.
function renderMapView() {
  if (currentView === "map") renderMap(getOccurrences());
}

function renderCountdown(occurrences, now) {
  const live = occurrences
    .filter((o) => o.occ.status === "live")
    .sort((a, b) => a.occ.end - b.occ.end);
  const upcoming = occurrences
    .filter((o) => o.occ.status === "upcoming")
    .sort((a, b) => a.occ.start - b.occ.start);

  els.countdownTimer.classList.remove("live");

  if (live.length > 0) {
    const target = live[0];
    els.countdownLabel.textContent = `🟢 Happening now at ${target.venue.name}`;
    els.countdownTimer.textContent = formatDuration(target.occ.end - now);
    els.countdownTimer.classList.add("live");
    els.countdownSub.textContent = `Ends ${formatDayTime(target.occ.end, now)}`;
  } else if (upcoming.length > 0) {
    const target = upcoming[0];
    els.countdownLabel.textContent = `Next happy hour: ${target.venue.name}`;
    els.countdownTimer.textContent = formatDuration(target.occ.start - now);
    els.countdownSub.textContent = formatDayTime(target.occ.start, now);
  } else {
    els.countdownLabel.textContent = venues.length ? "No upcoming happy hours" : "No happy hours yet";
    els.countdownTimer.textContent = "--:--:--";
    els.countdownSub.textContent = venues.length ? "Add days and times to a spot" : "Add a spot to get started";
  }
}

function filterByStatus(occurrences) {
  if (currentFilter === "active") return occurrences.filter((o) => o.occ.status === "live");
  if (currentFilter === "upcoming") return occurrences.filter((o) => o.occ.status === "upcoming");
  return occurrences;
}

function renderList(occurrences, now) {
  let filtered = filterByStatus(occurrences);

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

  for (const { venue, occ } of filtered) {
    els.venueList.appendChild(renderVenueCard(venue, occ, now));
  }
}

function renderVenueCard(venue, occ, now) {
  const row = document.createElement("div");
  row.className = "venue-row";
  row.addEventListener("click", () => {
    window.location.href = `menu.html?id=${encodeURIComponent(venue.id)}`;
  });

  const icon = document.createElement("div");
  icon.className = "venue-row-icon";
  icon.textContent = "🍸";
  row.appendChild(icon);

  const main = document.createElement("div");
  main.className = "venue-row-main";

  const name = document.createElement("p");
  name.className = "venue-row-name";
  name.textContent = venue.name;
  main.appendChild(name);

  const sub = document.createElement("p");
  sub.className = "venue-row-sub";
  const address = getAddress(venue);
  sub.textContent = address ? `${address} · ${scheduleText(venue)}` : scheduleText(venue);
  main.appendChild(sub);

  const deals = getDeals(venue);
  if (deals.length) {
    const dealsEl = document.createElement("p");
    dealsEl.className = "venue-row-deals";
    const first = deals[0];
    const preview = `${first.name}${first.price ? " · " + first.price : ""}`;
    const extra = deals.length > 1 ? ` +${deals.length - 1} more` : "";
    dealsEl.innerHTML = `${escapeHtml(preview)}<b>${extra}</b>`;
    main.appendChild(dealsEl);
  }

  row.appendChild(main);

  const end = document.createElement("div");
  end.className = "venue-row-end";

  const status = document.createElement("span");
  status.className = `venue-row-status ${occ.status === "live" ? "live" : occ.status === "upcoming" ? "upcoming" : "done"}`;
  if (occ.status === "live") {
    status.textContent = `Live\n${formatDuration(occ.end - now)}`;
  } else if (occ.status === "upcoming") {
    status.textContent = formatDayTime(occ.start, now);
  } else {
    status.textContent = "No date";
  }
  status.style.whiteSpace = "pre-line";
  end.appendChild(status);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "venue-row-edit";
  editBtn.setAttribute("aria-label", "Edit spot");
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openModal(venue);
  });
  end.appendChild(editBtn);

  const chevron = document.createElement("span");
  chevron.className = "venue-row-chevron";
  chevron.textContent = "›";
  end.appendChild(chevron);

  row.appendChild(end);

  return row;
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

  mapMarkers.forEach((marker) => marker.remove());
  mapMarkers = [];

  const located = filterByStatus(occurrences).filter(
    (o) => typeof getLat(o.venue) === "number" && typeof getLng(o.venue) === "number"
  );

  for (const { venue, occ } of located) {
    const color = markerColor(occ.status);
    const icon = L.divIcon({
      className: "map-pin",
      html: `<span style="background:${color}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([getLat(venue), getLng(venue)], { icon }).addTo(m);
    const statusText =
      occ.status === "live" ? "Live now" : occ.status === "upcoming" ? "Upcoming" : "No upcoming date";
    marker.bindPopup(
      `<strong>${escapeHtml(venue.name)}</strong><br>${escapeHtml(scheduleText(venue))}<br>${statusText}<br><a href="menu.html?id=${encodeURIComponent(venue.id)}">View menu</a>`
    );
    mapMarkers.push(marker);
  }

  els.mapEmpty.classList.toggle("hidden", located.length > 0);

  if (located.length > 0) {
    const bounds = L.latLngBounds(located.map((o) => [getLat(o.venue), getLng(o.venue)]));
    m.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }

  setTimeout(() => m.invalidateSize(), 0);
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

document.getElementById("addVenueBtn").addEventListener("click", () => openModal(null));
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

document.querySelectorAll(".view-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".view-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    els.listView.classList.toggle("hidden", currentView !== "list");
    els.mapView.classList.toggle("hidden", currentView !== "map");
    render();
    renderMapView();
  });
});

render();
renderMapView();
setInterval(render, 1000);
