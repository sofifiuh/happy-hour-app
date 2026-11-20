// The /embed/ page: pick what the widget shows, see it live, copy the code.
// Copied to embed/builder.js by scripts/prerender.mjs. Plain browser JS.
(function () {
  "use strict";
  var BASE = "https://alittlehang.com";
  var $ = function (id) { return document.getElementById(id); };
  var form = $("wb");
  if (!form) return;
  var preview = $("wb-preview");
  var code = $("wb-code");
  var data = null;
  var state = { mode: "place", place: "", venue: "", near: null, label: "", theme: "dark", limit: 5 };

  var q = new URLSearchParams(location.search);
  if (q.get("venue")) { state.mode = "venue"; state.venue = q.get("venue"); }
  else if (q.get("place")) state.place = q.get("place");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function km(a, b) {
    var r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 12742 * Math.asin(Math.sqrt(x));
  }
  function nearestPlace(pt) {
    var best = null, bd = Infinity;
    data.p.forEach(function (p) {
      if (p.a == null) return;
      var d = km(pt, [p.a, p.o]) * (p.k === "area" ? 0.6 : 1);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  // The embed: a div with credit links (real links in your page's HTML) and our script.
  function snippet() {
    var attrs = [], credit;
    if (state.mode === "venue") {
      var v = data.v.filter(function (x) { return x.i === state.venue; })[0];
      if (!v) return null;
      attrs.push('data-venue="' + esc(v.i) + '"');
      credit = '<a href="' + BASE + "/spots/" + v.i + '">' + esc(v.n) + ' happy hour</a> on <a href="' + BASE + '/">A Little Hang</a>';
    } else if (state.mode === "near") {
      if (!state.near) return null;
      var hub = nearestPlace(state.near);
      attrs.push('data-near="' + state.near[0].toFixed(5) + "," + state.near[1].toFixed(5) + '"');
      if (state.label) attrs.push('data-label="' + esc(state.label) + '"');
      attrs.push('data-limit="' + state.limit + '"');
      credit = '<a href="' + BASE + "/happy-hour/" + hub.s + '/">Happy hours in ' + esc(hub.n) + '</a> by <a href="' + BASE + '/">A Little Hang</a>';
    } else {
      var p = data.p.filter(function (x) { return x.s === state.place; })[0];
      if (!p) return null;
      attrs.push('data-place="' + p.s + '"', 'data-limit="' + state.limit + '"');
      credit = '<a href="' + BASE + "/happy-hour/" + p.s + '/">Happy hours in ' + esc(p.n) + '</a> by <a href="' + BASE + '/">A Little Hang</a>';
    }
    if (state.theme !== "dark") attrs.push('data-theme="' + state.theme + '"');
    return { attrs: attrs, credit: credit };
  }

  function update() {
    form.setAttribute("data-mode", state.mode);
    var s = snippet();
    if (!s) {
      code.textContent = state.mode === "near" ? "Find an address first." : "Pick one first.";
      $("wb-copy").disabled = true;
      return;
    }
    $("wb-copy").disabled = false;
    var div = "<div data-alh-widget " + s.attrs.join(" ") + ">" + s.credit + "</div>";
    code.textContent = div + '\n<script async src="' + BASE + '/embed/widget.js"></' + "script>";
    // Rebuild the preview's host element so it picks up the new settings.
    var host = document.createElement("div");
    host.setAttribute("data-alh-widget", "");
    s.attrs.forEach(function (a) {
      var m = a.match(/^([\w-]+)="(.*)"$/);
      host.setAttribute(m[1], m[2].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    });
    host.innerHTML = s.credit;
    preview.innerHTML = "";
    preview.appendChild(host);
    preview.setAttribute("data-surface", state.theme === "light" ? "light" : state.theme === "auto" ? "auto" : "dark");
    if (window.ALHWidget) window.ALHWidget.mount(host);
  }

  function fill() {
    var placeSel = $("wb-place");
    var groups = { city: "Cities", area: "Vancouver neighbourhoods" };
    placeSel.innerHTML = ["city", "area"].map(function (k) {
      return '<optgroup label="' + groups[k] + '">' + data.p.filter(function (p) { return p.k === k; }).sort(function (a, b) { return k === "city" ? b.c - a.c : a.n.localeCompare(b.n); }).map(function (p) {
        return '<option value="' + p.s + '">' + esc(p.n) + " (" + p.c + ")</option>";
      }).join("") + "</optgroup>";
    }).join("");
    if (!state.place || !data.p.some(function (p) { return p.s === state.place; })) state.place = "gastown";
    if (!data.p.some(function (p) { return p.s === state.place; })) state.place = data.p[0].s;
    placeSel.value = state.place;
    var list = $("wb-venues");
    list.innerHTML = data.v.slice().sort(function (a, b) { return a.n.localeCompare(b.n); }).map(function (v) {
      return '<option value="' + esc(v.n + " · " + v.r) + '"></option>';
    }).join("");
    if (state.venue) {
      var v = data.v.filter(function (x) { return x.i === state.venue; })[0];
      if (v) $("wb-venue").value = v.n + " · " + v.r;
      else state.venue = "";
    }
    var radio = form.querySelector('input[name=mode][value="' + state.mode + '"]');
    if (radio) radio.checked = true;
    update();
  }

  form.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "mode") state.mode = t.value;
    if (t.name === "theme") state.theme = t.value;
    if (t.id === "wb-place") state.place = t.value;
    if (t.id === "wb-limit") state.limit = Number(t.value);
    if (t.id === "wb-label") state.label = t.value.trim();
    update();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  $("wb-label").addEventListener("input", function (e) { state.label = e.target.value.trim(); update(); });
  $("wb-venue").addEventListener("input", function (e) {
    var val = e.target.value;
    var v = data && data.v.filter(function (x) { return x.n + " · " + x.r === val; })[0];
    if (v) { state.venue = v.i; update(); }
  });

  // Address search: Photon (OpenStreetMap), biased to the area we cover.
  var found = $("wb-found");
  function setNear(pt, label) {
    state.near = pt;
    if (label && !$("wb-label").value) { $("wb-label").value = label; state.label = label; }
    update();
  }
  $("wb-find").addEventListener("click", function () {
    var text = $("wb-address").value.trim();
    if (!text) return;
    found.innerHTML = "<li class='wb-note'>Looking…</li>";
    fetch("https://photon.komoot.io/api/?limit=5&lat=49.26&lon=-123.1&q=" + encodeURIComponent(text))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var hits = (j.features || []).filter(function (f) { return f.properties && /Canada/.test(f.properties.country || ""); });
        if (!hits.length) { found.innerHTML = "<li class='wb-note'>No match in Canada. Try adding the city.</li>"; return; }
        found.innerHTML = hits.map(function (f, i) {
          var p = f.properties;
          var line = [p.name, p.housenumber && p.street ? p.housenumber + " " + p.street : p.street, p.city].filter(Boolean).join(", ");
          return '<li><button type="button" data-i="' + i + '">' + esc(line) + "</button></li>";
        }).join("");
        found.onclick = function (e) {
          var b = e.target.closest("button");
          if (!b) return;
          var f = hits[Number(b.getAttribute("data-i"))];
          found.innerHTML = "<li class='wb-note'>✓ " + esc(b.textContent) + "</li>";
          var p = f.properties;
          setNear([f.geometry.coordinates[1], f.geometry.coordinates[0]], p.name && p.name !== p.street ? "Near " + p.name : "");
        };
      })
      .catch(function () { found.innerHTML = "<li class='wb-note'>Search isn't available right now. Use your location instead.</li>"; });
  });
  $("wb-address").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("wb-find").click(); } });
  $("wb-here").addEventListener("click", function () {
    if (!navigator.geolocation) return;
    found.innerHTML = "<li class='wb-note'>Finding you…</li>";
    navigator.geolocation.getCurrentPosition(
      function (pos) { found.innerHTML = "<li class='wb-note'>✓ Using your location</li>"; setNear([pos.coords.latitude, pos.coords.longitude], ""); },
      function () { found.innerHTML = "<li class='wb-note'>Location is off. Search an address instead.</li>"; },
    );
  });

  $("wb-copy").addEventListener("click", function () {
    var btn = this;
    var done = function () { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy code"; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(done, function () { selectCode(); });
    else selectCode();
  });
  function selectCode() {
    var r = document.createRange();
    r.selectNodeContents(code);
    var s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  fetch(BASE.replace("https://alittlehang.com", "") + "/embed/data.json?v=" + (form.getAttribute("data-v") || ""))
    .then(function (r) { return r.json(); })
    .then(function (j) { data = j; fill(); })
    .catch(function () { code.textContent = "Couldn't load the spots. Refresh to try again."; });
})();
