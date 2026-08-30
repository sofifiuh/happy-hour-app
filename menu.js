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
  { key: "live_music", icon: "🎵", label: "Live music" },
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

    const labels = [];
    if (days.includes(d)) labels.push(hoursLabel(venue));
    for (const w of venue.happy_hour?.extra_windows || []) {
      if (w?.days?.includes(d) && w.start) labels.push(windowLabel(w.start, w.end));
    }
    const hoursEl = document.createElement("span");
    hoursEl.className = "menu-schedule-hours";
    hoursEl.textContent = labels.length ? labels.join(" & ") : "Closed";

    row.appendChild(dayEl);
    row.appendChild(hoursEl);
    els.scheduleList.appendChild(row);
  }
}

function windowLabel(start, end) {
  if (!end) return `${formatShortTime(start, true)}–close`;
  const startPeriod = start.split(":")[0] >= 12 ? "pm" : "am";
  const endPeriod = end.split(":")[0] >= 12 ? "pm" : "am";
  const samePeriod = startPeriod === endPeriod;
  return `${formatShortTime(start, !samePeriod)}–${formatShortTime(end, true)}`;
}

function hoursLabel(venue) {
  return windowLabel(venue.happy_hour.start, venue.happy_hour.end);
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

function showNotFound() {
  els.notFound.classList.remove("hidden");
  [
    ".menu-photo",
    ".menu-info",
    ".menu-schedule-section",
    "#stickyBar",
    ".menu-map-section",
  ].forEach((sel) => document.querySelector(sel)?.classList.add("hidden"));
}

const els = {
  app: document.querySelector(".menu-app"),
  notFound: document.getElementById("notFound"),
  menuPhoto: document.getElementById("menuPhoto"),
  menuPhotoIcon: document.getElementById("menuPhotoIcon"),
  menuPhotoCredit: document.getElementById("menuPhotoCredit"),
  venueName: document.getElementById("venueName"),
  venueAddress: document.getElementById("venueAddress"),
  venueRating: document.getElementById("venueRating"),
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

// Straight-line distance scaled by a street-grid detour factor, turned into
// rough door-to-door minutes. Estimates, not routing — hence the "~".
function initTravelTimes(v) {
  const lat = v.geometry?.location?.lat;
  const lng = v.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number" || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(lat - pos.coords.latitude);
      const dLng = toRad(lng - pos.coords.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos.coords.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
      const km = 2 * 6371 * Math.asin(Math.sqrt(a)) * 1.3;
      const fmt = (mins) => {
        mins = Math.max(1, Math.round(mins));
        if (mins < 60) return `~${mins} min`;
        const rem = mins % 60;
        return `~${Math.floor(mins / 60)}h${rem ? ` ${rem}m` : ""}`;
      };
      document.getElementById("travelWalk").textContent = fmt((km / 4.8) * 60);
      document.getElementById("travelCycle").textContent = fmt((km / 14) * 60);
      document.getElementById("travelDrive").textContent = fmt((km / 22) * 60 + 1);
      document.getElementById("travelTimes").classList.remove("hidden");
    },
    () => {}, // denied or unavailable: the bar just stays hidden
    { maximumAge: 120000, timeout: 8000 }
  );
}

if (venue) {
  init(venue);
} else {
  // Direct deep link before the app page has seeded localStorage: fetch the
  // dataset (generated by pipeline/writeback.js) and render from it.
  fetch("venues.json", { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
    .then(({ venues: fresh }) => {
      const v = fresh.find((x) => x.id === venueId);
      if (v) init(v);
      else showNotFound();
    })
    .catch(showNotFound);
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

  const show = (i) => { index = (i + photos.length) % photos.length; update(); };
  const prev = () => show(index - 1);
  const next = () => show(index + 1);
  const isOpen = () => !els.galleryOverlay.classList.contains("hidden");
  function closeGallery() {
    els.galleryOverlay.classList.add("hidden");
    els.galleryOverlay.style.opacity = "";
    update(); // clear any in-progress drag transform
  }

  els.menuPhoto.addEventListener("click", (e) => {
    if (e.target.closest(".menu-back")) return;
    els.galleryOverlay.classList.remove("hidden");
  });
  els.galleryClose.addEventListener("click", closeGallery);
  els.galleryOverlay.addEventListener("click", (e) => {
    if (e.target === els.galleryOverlay) closeGallery();
  });
  els.galleryPrev.addEventListener("click", prev);
  els.galleryNext.addEventListener("click", next);

  // Desktop: arrow keys navigate, Escape closes.
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "Escape") closeGallery();
  });

  // Mobile: horizontal swipe navigates (track follows the finger),
  // swipe down closes (image follows, backdrop fades).
  let touch = null; // { x, y, axis }
  els.galleryOverlay.addEventListener("touchstart", (e) => {
    if (!isOpen() || e.touches.length !== 1) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null };
    els.galleryTrack.style.transition = "none";
  }, { passive: true });

  els.galleryOverlay.addEventListener("touchmove", (e) => {
    if (!touch) return;
    const dx = e.touches[0].clientX - touch.x;
    const dy = e.touches[0].clientY - touch.y;
    if (!touch.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // not yet a gesture
      touch.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (touch.axis === "x" && photos.length > 1) {
      els.galleryTrack.style.transform = `translateX(calc(-${index * 100}% + ${dx}px))`;
    } else if (touch.axis === "y" && dy > 0) {
      els.galleryTrack.style.transform = `translateX(-${index * 100}%) translateY(${dy}px)`;
      els.galleryOverlay.style.opacity = String(Math.max(0.35, 1 - dy / 400));
    }
  }, { passive: true });

  els.galleryOverlay.addEventListener("touchend", (e) => {
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    const axis = touch.axis;
    touch = null;
    els.galleryTrack.style.transition = "";
    els.galleryOverlay.style.opacity = "";
    if (axis === "x" && Math.abs(dx) > 48 && photos.length > 1) (dx < 0 ? next : prev)();
    else if (axis === "y" && dy > 90) closeGallery();
    else update(); // below threshold — snap back
  });
  els.galleryOverlay.addEventListener("touchcancel", () => {
    touch = null;
    els.galleryTrack.style.transition = "";
    els.galleryOverlay.style.opacity = "";
    update();
  });
}

function init(venue) {
  document.title = `${venue.name} – Happy Hour Menu`;
  initTravelTimes(venue);

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
  if (venue.rating) {
    const count = venue.user_ratings_total ? ` (${Number(venue.user_ratings_total).toLocaleString()})` : "";
    const price = venue.price_level ? ` · ${"$".repeat(venue.price_level)}` : "";
    els.venueRating.textContent = `★ ${venue.rating}${count}${price}`;
    els.venueRating.classList.remove("hidden");
  }

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
    // The venue advertises a happy hour but publishes no item list we could
    // extract. Say so plainly and point at their own page, rather than
    // leaving a blank panel that reads like the app is broken.
    els.menuTabs.classList.add("hidden");
    els.dealsList.innerHTML = "";
    const box = document.createElement("div");
    box.className = "menu-no-deals";
    const line = document.createElement("p");
    line.textContent = "This spot runs a happy hour but doesn't publish its deal list online.";
    box.appendChild(line);
    const src = venue.happy_hour?.source_url || venue.website;
    if (src) {
      const a = document.createElement("a");
      a.href = src;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Check their menu →";
      box.appendChild(a);
    }
    els.dealsList.appendChild(box);
  } else if (!hasFood || !hasDrink) {
    els.menuTabs.querySelectorAll(".menu-tab").forEach((btn) => {
      if (btn.dataset.cat === "food" && !hasFood) btn.classList.add("hidden");
      if (btn.dataset.cat === "drink" && !hasDrink) btn.classList.add("hidden");
    });
  }

  const hasAnyDeals = hasFood || hasDrink;
  let activeCat = hasFood ? "food" : "drink";
  function setCategory(cat, slideDir) {
    if (cat === activeCat) return;
    if ((cat === "food" && !hasFood) || (cat === "drink" && !hasDrink)) return;
    activeCat = cat;
    els.menuTabs.querySelectorAll(".menu-tab").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
    renderDeals(deals, activeCat, venue.happy_hour?.deals_source);
    if (slideDir) {
      els.dealsList.classList.remove("slide-in-left", "slide-in-right");
      void els.dealsList.offsetWidth; // restart the animation
      els.dealsList.classList.add(slideDir === "left" ? "slide-in-left" : "slide-in-right");
    }
  }
  if (hasAnyDeals) renderDeals(deals, activeCat, venue.happy_hour?.deals_source);

  els.menuTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".menu-tab");
    if (btn) setCategory(btn.dataset.cat);
  });

  // Swipe horizontally across the deals list to flip Food <-> Drinks.
  if (hasFood && hasDrink) {
    let t = null;
    els.dealsList.addEventListener("touchstart", (e) => {
      t = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    els.dealsList.addEventListener("touchend", (e) => {
      if (!t) return;
      const dx = e.changedTouches[0].clientX - t.x;
      const dy = e.changedTouches[0].clientY - t.y;
      t = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setCategory(dx < 0 ? "drink" : "food", dx < 0 ? "left" : "right");
      }
    });
  }

  // Long swipe down — page at its top, gallery closed — goes back to the
  // map/list. history.back() restores the map view via bfcache when you
  // arrived from a map card; direct visitors fall back to the app home.
  const backFromPull = () => {
    if (history.length > 1 && document.referrer.startsWith(location.origin)) history.back();
    else window.location.href = "index.html";
  };
  let pull = null;
  document.addEventListener("touchstart", (e) => {
    const blocked = e.touches.length !== 1 ||
      !els.galleryOverlay.classList.contains("hidden") ||
      window.scrollY > 0;
    pull = blocked ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY, engaged: false };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!pull) return;
    const dx = e.touches[0].clientX - pull.x;
    const dy = e.touches[0].clientY - pull.y;
    if (!pull.engaged) {
      // Engage only on a clearly-downward drag; bail on upward scrolls and
      // horizontal gestures (the deals swipe owns those).
      if (dy < -12 || Math.abs(dx) > 24) { pull = null; return; }
      if (dy < 12 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      pull.engaged = true;
      els.app.classList.add("pulling");
    }
    e.preventDefault(); // own the gesture — no native scroll/refresh underneath
    els.app.style.transform = `translateY(${Math.max(0, dy) * 0.5}px)`;
  }, { passive: false });
  const endPull = (e) => {
    if (!pull) return;
    const dy = e.changedTouches ? e.changedTouches[0].clientY - pull.y : 0;
    const engaged = pull.engaged;
    pull = null;
    els.app.classList.remove("pulling");
    if (engaged && dy > 160) backFromPull();
    else els.app.style.transform = "";
  };
  document.addEventListener("touchend", endPull);
  document.addEventListener("touchcancel", endPull);

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
