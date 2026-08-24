const STORAGE_KEY = "happyHourVenues";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let venues = loadVenues();
let currentFilter = "all";
let selectedDays = new Set();
let editingId = null;

const els = {
  countdownLabel: document.getElementById("countdownLabel"),
  countdownTimer: document.getElementById("countdownTimer"),
  countdownSub: document.getElementById("countdownSub"),
  venueList: document.getElementById("venueList"),
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
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to sample data
  }
  const sample = sampleVenues();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
}

function sampleVenues() {
  return [
    {
      id: crypto.randomUUID(),
      name: "The Tipsy Fox",
      address: "123 Main St, Vancouver, BC",
      phone: "604 239 9304",
      days: [1, 2, 3, 4, 5],
      start: "16:00",
      end: "18:00",
      deals: [
        { name: "Draft beers", price: "$4", category: "drink", description: "" },
        { name: "House wine", price: "$6", category: "drink", description: "" },
        { name: "Loaded fries", price: "$7", category: "food", description: "Crispy fries, cheese curds, gravy." },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "Harbor Social",
      address: "88 Dockside Ave, Vancouver, BC",
      phone: "604 555 0134",
      days: [4, 5, 6],
      start: "17:00",
      end: "19:30",
      deals: [
        { name: "Oysters", price: "$1 ea", category: "food", description: "Fresh-shucked, mignonette on the side." },
        { name: "Well cocktails", price: "$8", category: "drink", description: "" },
      ],
    },
  ];
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
    if (!venue.days.includes(dow)) continue;

    let start = setTimeOnDate(day, venue.start);
    let end = setTimeOnDate(day, venue.end);
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
  const dayLabels = compressDays(venue.days);
  const startLabel = new Date(`1970-01-01T${venue.start}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = new Date(`1970-01-01T${venue.end}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dayLabels} · ${startLabel}–${endLabel}`;
}

function render() {
  const now = new Date();
  const occurrences = venues.map((v) => ({ venue: v, occ: getVenueOccurrence(v, now) }));

  renderCountdown(occurrences, now);
  renderList(occurrences, now);
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

function renderList(occurrences, now) {
  let filtered = occurrences;
  if (currentFilter === "active") {
    filtered = occurrences.filter((o) => o.occ.status === "live");
  } else if (currentFilter === "upcoming") {
    filtered = occurrences.filter((o) => o.occ.status === "upcoming");
  }

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
  sub.textContent = venue.address ? `${venue.address} · ${scheduleText(venue)}` : scheduleText(venue);
  main.appendChild(sub);

  if (venue.deals && venue.deals.length) {
    const deals = document.createElement("p");
    deals.className = "venue-row-deals";
    const first = venue.deals[0];
    const preview = `${first.name}${first.price ? " · " + first.price : ""}`;
    const extra = venue.deals.length > 1 ? ` +${venue.deals.length - 1} more` : "";
    deals.innerHTML = `${escapeHtml(preview)}<b>${extra}</b>`;
    main.appendChild(deals);
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

// ---------- Modal handling ----------

function openModal(venue) {
  editingId = venue ? venue.id : null;
  els.modalTitle.textContent = venue ? "Edit Spot" : "Add a Spot";
  els.deleteBtn.classList.toggle("hidden", !venue);

  els.venueId.value = venue ? venue.id : "";
  els.venueName.value = venue ? venue.name : "";
  els.venueAddress.value = venue ? venue.address || "" : "";
  els.venuePhone.value = venue ? venue.phone || "" : "";
  els.startTime.value = venue ? venue.start : "16:00";
  els.endTime.value = venue ? venue.end : "18:00";

  selectedDays = new Set(venue ? venue.days : [1, 2, 3, 4, 5]);
  renderDayPicker();

  els.dealsList.innerHTML = "";
  const deals =
    venue && venue.deals && venue.deals.length ? venue.deals : [{ name: "", price: "", category: "food", description: "" }];
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

  const venueData = {
    id: editingId || crypto.randomUUID(),
    name,
    address: els.venueAddress.value.trim(),
    phone: els.venuePhone.value.trim(),
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
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();
setInterval(render, 1000);
