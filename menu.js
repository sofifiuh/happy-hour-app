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
  venueName: document.getElementById("venueName"),
  venueAddress: document.getElementById("venueAddress"),
  venuePhone: document.getElementById("venuePhone"),
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
    "#stickyBar",
    ".menu-map-section",
  ].forEach((sel) => document.querySelector(sel)?.classList.add("hidden"));
} else {
  init(venue);
}

function init(venue) {
  document.title = `${venue.name} – Happy Hour Menu`;

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
  renderDeals(deals, activeCat);

  els.menuTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".menu-tab");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    els.menuTabs.querySelectorAll(".menu-tab").forEach((b) => b.classList.toggle("active", b === btn));
    renderDeals(deals, activeCat);
  });

  els.shareBtn.addEventListener("click", () => shareVenue(venue));
}

function renderDeals(deals, category) {
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
