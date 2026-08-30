const STORAGE_KEY = "happyHourVenues";

function loadVenues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatShortTime(hhmm, showPeriod = true) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const time = m === 0 ? `${hour12}` : `${hour12}:${String(m).padStart(2, "0")}`;
  return showPeriod ? `${time}${period}` : time;
}

// Venue records mirror the Google Places API shape (see venues-data.js).
function getAddress(venue) {
  return venue.formatted_address || "";
}
function getPhone(venue) {
  return venue.formatted_phone_number || "";
}
function getDeals(venue) {
  return venue.happy_hour?.deals || [];
}

// Only ever asserts amenities we've verified true — a missing/null field
// stays silent rather than being shown as "not available".
const AMENITY_BADGES = [
  { key: "outdoor_seating", icon: "🌳", label: "Patio" },
  { key: "gluten_free_options", icon: "🌾", label: "Gluten-free options" },
  { key: "wheelchair_accessible_entrance", icon: "♿", label: "Wheelchair accessible" },
  { key: "parking", icon: "🅿️", label: "Parking available" },
  { key: "transit", icon: "🚇", label: "Near transit" },
];

function getAmenityBadges(venue) {
  const a = venue.amenities || {};
  return AMENITY_BADGES.filter(({ key }) => {
    if (key === "parking") return !!a.parking && Object.values(a.parking).some(Boolean);
    if (key === "transit") return a.transit?.walkable === true;
    return a[key] === true;
  });
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function renderSchedule(venue) {
  const days = venue.happy_hour?.days || [];
  const today = new Date().getDay();

  els.scheduleList.innerHTML = "";
  for (let d = 0; d < 7; d++) {
    const row = document.createElement("div");
    row.className = "menu-schedule-row";
    if (d === today) row.classList.add("today");

    const dayEl = document.createElement("span");
    dayEl.className = "menu-schedule-day";
    dayEl.innerHTML = escapeHtml(DAY_NAMES[d]) + (d === today ? ` <span class="menu-schedule-today-badge">Today</span>` : "");

    const hoursEl = document.createElement("span");
    hoursEl.className = "menu-schedule-hours";
    hoursEl.textContent = days.includes(d) ? hoursLabel(venue) : "Closed";

    row.appendChild(dayEl);
    row.appendChild(hoursEl);
    els.scheduleList.appendChild(row);
  }
}

function hoursLabel(venue) {
  const { start, end } = venue.happy_hour;
  const startPeriod = start.split(":")[0] >= 12 ? "pm" : "am";
  const endPeriod = end.split(":")[0] >= 12 ? "pm" : "am";
  const samePeriod = startPeriod === endPeriod;
  return `${formatShortTime(start, !samePeriod)}–${formatShortTime(end, true)}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const params = new URLSearchParams(window.location.search);
const venueId = params.get("id");
const venues = loadVenues();
const venue = venues.find((v) => v.id === venueId);

const els = {
  app: document.querySelector(".menu-app"),
  notFound: document.getElementById("notFound"),
  menuPhoto: document.getElementById("menuPhoto"),
  menuPhotoIcon: document.getElementById("menuPhotoIcon"),
  menuPhotoCredit: document.getElementById("menuPhotoCredit"),
  venueName: document.getElementById("venueName"),
  venueAddress: document.getElementById("venueAddress"),
  venuePhone: document.getElementById("venuePhone"),
  verifiedBadge: document.getElementById("verifiedBadge"),
  verifiedLink: document.getElementById("verifiedLink"),
  amenitiesList: document.getElementById("amenitiesList"),
  menuPhotoCounter: document.getElementById("menuPhotoCounter"),
  galleryOverlay: document.getElementById("galleryOverlay"),
  galleryClose: document.getElementById("galleryClose"),
  galleryTrack: document.getElementById("galleryTrack"),
  galleryCounter: document.getElementById("galleryCounter"),
  galleryPrev: document.getElementById("galleryPrev"),
  galleryNext: document.getElementById("galleryNext"),
  scheduleList: document.getElementById("scheduleList"),
  suggestUpdateLink: document.getElementById("suggestUpdateLink"),
  menuTabs: document.getElementById("menuTabs"),
  dealsList: document.getElementById("dealsList"),
  hoursLabel: document.getElementById("hoursLabel"),
  stickyBar: document.getElementById("stickyBar"),
  shareBtn: document.getElementById("shareBtn"),
  mapFrame: document.getElementById("mapFrame"),
  mapLink: document.getElementById("mapLink"),
  toast: document.getElementById("toast"),
};

if (!venue) {
  els.notFound.classList.remove("hidden");
  [
    ".menu-photo",
    ".menu-info",
    ".menu-schedule-section",
    "#stickyBar",
    ".menu-map-section",
  ].forEach((sel) => document.querySelector(sel)?.classList.add("hidden"));
} else {
  init(venue);
}

function initGallery(venue) {
  const rest = (venue.photos || []).filter((p) => p?.url && p.url !== venue.cover_image?.url);
  const photos = [venue.cover_image, ...rest].filter((p) => p?.url);
  if (!photos.length) {
    els.menuPhotoCounter.classList.add("hidden");
    return;
  }

  let index = 0;

  els.galleryTrack.innerHTML = "";
  for (const photo of photos) {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    slide.style.backgroundImage = `url("${photo.url}")`;
    els.galleryTrack.appendChild(slide);
  }

  function update() {
    els.galleryCounter.textContent = `${index + 1}/${photos.length}`;
    els.menuPhotoCounter.textContent = `${index + 1}/${photos.length}`;
    els.galleryTrack.style.transform = `translateX(-${index * 100}%)`;
  }

  els.galleryPrev.classList.toggle("hidden", photos.length < 2);
  els.galleryNext.classList.toggle("hidden", photos.length < 2);
  update();

  els.menuPhoto.addEventListener("click", (e) => {
    if (e.target.closest(".menu-back")) return;
    els.galleryOverlay.classList.remove("hidden");
  });
  els.galleryClose.addEventListener("click", () => els.galleryOverlay.classList.add("hidden"));
  els.galleryOverlay.addEventListener("click", (e) => {
    if (e.target === els.galleryOverlay) els.galleryOverlay.classList.add("hidden");
  });
  els.galleryPrev.addEventListener("click", () => {
    index = (index - 1 + photos.length) % photos.length;
    update();
  });
  els.galleryNext.addEventListener("click", () => {
    index = (index + 1) % photos.length;
    update();
  });
}

function init(venue) {
  document.title = `${venue.name} – Happy Hour Menu`;

  if (venue.cover_image?.url) {
    els.menuPhoto.style.backgroundImage =
      `linear-gradient(180deg, rgba(20,12,6,0.15) 0%, rgba(15,10,7,0.35) 60%, rgba(10,7,5,0.75) 100%), ` +
      `url("${venue.cover_image.url}")`;
    els.menuPhotoIcon.classList.add("hidden");
    els.menuPhotoCredit.textContent = `Photo: ${venue.cover_image.credit_name}`;
    els.menuPhotoCredit.href = venue.cover_image.credit_url;
    els.menuPhotoCredit.classList.remove("hidden");
  }

  els.venueName.textContent = venue.name;

  const address = getAddress(venue);
  if (address) {
    els.venueAddress.textContent = address;
    els.venueAddress.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  } else {
    els.venueAddress.remove();
  }

  const phone = getPhone(venue);
  if (phone) {
    els.venuePhone.textContent = phone;
    els.venuePhone.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  } else {
    els.venuePhone.remove();
  }

  if (venue.happy_hour?.verified && venue.happy_hour.verified_source) {
    els.verifiedLink.href = venue.happy_hour.verified_source;
    els.verifiedBadge.classList.remove("hidden");
  }

  const badges = getAmenityBadges(venue);
  if (badges.length) {
    els.amenitiesList.innerHTML = "";
    for (const { icon, label } of badges) {
      const pill = document.createElement("span");
      pill.className = "menu-amenity-pill";
      pill.innerHTML = `<span>${icon}</span><span>${escapeHtml(label)}</span>`;
      els.amenitiesList.appendChild(pill);
    }
    els.amenitiesList.classList.remove("hidden");
  }

  initGallery(venue);
  renderSchedule(venue);

  els.suggestUpdateLink.href =
    `mailto:sofiaalvarenga.m@gmail.com?subject=${encodeURIComponent(`Happy hour update: ${venue.name}`)}` +
    `&body=${encodeURIComponent(`Hi! I'd like to suggest an update for ${venue.name}'s happy hour info:\n\n`)}`;

  els.hoursLabel.textContent = hoursLabel(venue);

  if (address) {
    els.mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    els.mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  } else {
    document.querySelector(".menu-map-section")?.classList.add("hidden");
  }

  const deals = getDeals(venue);
  const hasFood = deals.some((d) => (d.category || "food") === "food");
  const hasDrink = deals.some((d) => (d.category || "food") === "drink");

  if (!hasFood && !hasDrink) {
    els.menuTabs.classList.add("hidden");
  } else if (!hasFood || !hasDrink) {
    els.menuTabs.querySelectorAll(".menu-tab").forEach((btn) => {
      if (btn.dataset.cat === "food" && !hasFood) btn.classList.add("hidden");
      if (btn.dataset.cat === "drink" && !hasDrink) btn.classList.add("hidden");
    });
  }

  let activeCat = hasFood ? "food" : "drink";
  renderDeals(deals, activeCat, venue.happy_hour?.deals_source);

  els.menuTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".menu-tab");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    els.menuTabs.querySelectorAll(".menu-tab").forEach((b) => b.classList.toggle("active", b === btn));
    renderDeals(deals, activeCat, venue.happy_hour?.deals_source);
  });

  els.shareBtn.addEventListener("click", () => shareVenue(venue));
}

function renderDeals(deals, category, dealsSource) {
  const filtered = deals.filter((d) => (d.category || "food") === category);
  els.dealsList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "menu-deal-description";
    empty.textContent = "Nothing listed yet.";
    els.dealsList.appendChild(empty);
    return;
  }

  for (const deal of filtered) {
    const row = document.createElement("div");
    row.className = "menu-deal-row";

    const top = document.createElement("div");
    top.className = "menu-deal-top";

    const name = document.createElement("span");
    name.textContent = deal.name;
    top.appendChild(name);

    if (deal.price) {
      const price = document.createElement("span");
      price.className = "menu-deal-price";
      price.textContent = deal.price;
      top.appendChild(price);
    }

    row.appendChild(top);

    if (deal.description) {
      const desc = document.createElement("p");
      desc.className = "menu-deal-description";
      desc.textContent = deal.description;
      row.appendChild(desc);
    }

    els.dealsList.appendChild(row);
  }

  // Credit automatically-read deal lists to the venue's own menu page.
  if (dealsSource?.url) {
    const credit = document.createElement("p");
    credit.className = "menu-deal-description";
    const link = document.createElement("a");
    link.href = dealsSource.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "venue's menu";
    credit.append("Deals read from the ", link, dealsSource.extracted_at ? ` (${dealsSource.extracted_at})` : "");
    els.dealsList.appendChild(credit);
  }
}

async function shareVenue(venue) {
  const shareData = {
    title: `${venue.name} – Happy Hour`,
    text: `Check out the happy hour menu at ${venue.name}, ${hoursLabel(venue)}.`,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // user cancelled the share sheet — nothing to do
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("Link copied");
  } catch {
    showToast("Couldn't copy link");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 2000);
}
