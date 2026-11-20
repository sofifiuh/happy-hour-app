/* A Little Hang live happy hour widget. https://alittlehang.com/embed/
 *
 *   <div data-alh-widget data-place="gastown"> credit links </div>
 *   <script async src="https://alittlehang.com/embed/widget.js"></script>
 *
 * Modes: data-place="<hub slug>", data-near="lat,lng" (+ data-radius km,
 * data-label), or data-venue="<venue id>". data-theme="dark|light|auto",
 * data-limit="3..8". The credit links inside the div stay in the page (they
 * show in the widget's footer), so the widget works as plain links without
 * JavaScript. No cookies, no tracking, no other requests than our own files.
 *
 * Written by scripts/prerender.mjs from scripts/widget.js; __TOKENS__ are
 * filled in at build time. Plain ES2019 so any site can load it as a
 * classic script.
 */
(function () {
  "use strict";
  if (window.ALHWidget) return window.ALHWidget.scan();

  var BASE = "__BASE__";
  var DATA = BASE + "/embed/data.json?v=__VERSION__";
  var FONTS = __FONTS__;
  var LOGO = "__LOGO__";
  var TZ = ["America/Vancouver", "America/Edmonton"];
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEEK = 10080;
  var data = null;
  var loading = null;
  var mounted = [];

  function load() {
    if (!loading) loading = fetch(DATA).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { data = j; return j; });
    return loading;
  }

  // Our fonts, declared once on the host page under names no site uses.
  function fonts() {
    if (document.getElementById("alh-widget-fonts")) return;
    var s = document.createElement("style");
    s.id = "alh-widget-fonts";
    s.textContent = FONTS.map(function (f) {
      return '@font-face{font-family:"' + f[0] + '";font-weight:' + f[1] + ';font-display:swap;src:url(' + BASE + "/assets/" + f[2] + ') format("woff2")}';
    }).join("");
    (document.head || document.documentElement).appendChild(s);
  }

  // ---------- time, in the venue's own time zone ----------
  var fmts = {};
  function nowIn(z) {
    var tz = TZ[z] || TZ[0];
    var f = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }));
    var p = {};
    f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return DAYS.indexOf(p.weekday) * 1440 + (Number(p.hour) % 24) * 60 + Number(p.minute);
  }
  function t(m, period) {
    m = ((m % 1440) + 1440) % 1440;
    if (m >= 1439) return "close";
    var h = Math.floor(m / 60), mm = m % 60;
    return (h % 12 || 12) + (mm ? ":" + (mm < 10 ? "0" : "") + mm : "") + (period === false ? "" : h >= 12 ? "pm" : "am");
  }
  function range(s, e) {
    var end = e >= 1439 && e <= 1440 ? "close" : t(e);
    var same = s % 1440 >= 720 === e % 1440 >= 720 && end !== "close";
    return t(s, !same) + "–" + end;
  }
  function dur(m) {
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + "h " + r + "m" : h + "h";
  }
  // Live or next occurrence across every window: {live, a, b, s, e} in week minutes.
  function occ(v, now) {
    var live = null, next = null;
    v.w.forEach(function (w) {
      var mask = w[0], s = w[1], e = w[2];
      var len = (e <= s ? e + 1440 : e) - s;
      for (var d = 0; d < 7; d++) {
        if (!((mask >> d) & 1)) continue;
        var st = d * 1440 + s;
        [-WEEK, 0].forEach(function (off) {
          var a = st + off, b = a + len;
          if (now >= a && now < b && (!live || b > live.b)) live = { live: true, a: a, b: b, s: s, e: e };
        });
        var a2 = st > now ? st : st + WEEK;
        if (!next || a2 < next.a) next = { live: false, a: a2, b: a2 + len, s: s, e: e };
      }
    });
    return live || next;
  }
  function statusText(o, now) {
    if (o.live) {
      var left = o.b - now;
      return { text: o.e >= 1439 ? "On until close" : left <= 180 ? "Ends in " + dur(left) : "Until " + t(o.e), soon: left <= 30 };
    }
    var until = o.a - now;
    if (until <= 180) return { text: "Starts in " + dur(until) };
    var day = Math.floor(o.a / 1440) % 7, today = Math.floor(now / 1440);
    if (day === today && until < 1440) return { text: "Later today, " + t(o.s) };
    if (day === (today + 1) % 7) return { text: "Tomorrow, " + t(o.s) };
    return { text: DAYS[day] + ", " + t(o.s) };
  }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function walk(k) {
    var m = Math.max(1, Math.round((k * 1000) / 80));
    return m <= 25 ? m + " min walk" : k.toFixed(1) + " km";
  }

  // ---------- markup ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function utm(url) {
    var host = (location.hostname || "embed").replace(/^www\./, "");
    return url + (url.indexOf("?") < 0 ? "?" : "&") + "utm_source=" + encodeURIComponent(host) + "&utm_medium=widget";
  }
  var CSS = __CSS__;
  var tile = '<span class="tile" aria-hidden="true"><svg viewBox="0 0 130 124"><path d="' + LOGO + '"/></svg></span>';

  function clock(z) {
    var n = nowIn(z);
    return DAYS[Math.floor(n / 1440)] + " " + t(n % 1440);
  }

  function listView(el, opts) {
    var now0 = {};
    var nowFor = function (z) { return now0[z] != null ? now0[z] : (now0[z] = nowIn(z)); };
    var pool = data.v;
    var here = null, title = "", seeAll = null, kicker = "Happy hours";
    if (opts.near) {
      here = opts.near;
      var radius = opts.radius;
      pool = pool.filter(function (v) { v._k = km(here, [v.a, v.o]); return v._k <= radius; });
      title = opts.label || "Near here";
      var hub = nearestPlace(here);
      if (hub) seeAll = { url: BASE + "/happy-hour/" + hub.s + "/", label: "More in " + hub.n };
    } else {
      var p = data.p.filter(function (x) { return x.s === opts.place; })[0];
      if (!p) return problem(el, "We couldn't find that place on A Little Hang.");
      pool = pool.filter(function (v) { return v.p.indexOf(p.x) >= 0; });
      title = p.n;
      seeAll = { url: BASE + "/happy-hour/" + p.s + "/", label: "See all " + pool.length };
    }
    var rows = pool.map(function (v) {
      var now = nowFor(v.z);
      var o = occ(v, now);
      return { v: v, o: o, now: now };
    }).filter(function (r) { return r.o; });
    var live = rows.filter(function (r) { return r.o.live; });
    var later = rows.filter(function (r) { return !r.o.live; });
    live.sort(function (x, y) { return here ? x.v._k - y.v._k : y.v.s - x.v.s || x.o.b - y.o.b; });
    later.sort(function (x, y) { return x.o.a - x.now - (y.o.a - y.now) || (here ? x.v._k - y.v._k : y.v.s - x.v.s); });
    var today = later.filter(function (r) { return r.o.a - r.now < 1440 - (r.now % 1440); }).length;
    var shown = live.concat(later).slice(0, opts.limit);
    var z = shown.length ? shown[0].v.z : 0;
    var chips = (live.length ? '<span class="chip on"><i class="dot live"></i>' + live.length + " on now</span>" : '<span class="chip">Nothing on right now</span>') + (today ? '<span class="chip later">' + today + " later today</span>" : "");
    var body = shown.length
      ? '<ol class="rows">' + shown.map(function (r, i) { return row(r, i, !!here); }).join("") + "</ol>"
      : '<p class="empty">No happy hours within ' + opts.radius + " km yet. We're adding spots every week.</p>";
    return (
      '<div class="w" part="widget">' +
      '<header class="head">' + tile + '<div class="ttl"><p class="k">' + kicker + '</p><h2>' + esc(title) + "</h2></div>" + '<span class="clock" title="Local time">' + clock(z) + "</span></header>" +
      '<div class="chips">' + chips + "</div>" + body +
      '<footer class="foot"><span class="credit"><slot></slot></span>' + (seeAll ? '<a class="all" href="' + esc(utm(seeAll.url)) + '" target="_blank" rel="noopener">' + esc(seeAll.label) + ' <span aria-hidden="true">→</span></a>' : "") + "</footer></div>"
    );
  }

  function row(r, i, near) {
    var v = r.v, o = r.o, st = statusText(o, r.now);
    var cls = o.live ? (st.soon ? "soon" : "live") : "next";
    var sub = (near ? '<span class="walk">' + walk(v._k) + "</span>" + (v.d.length ? " · " : "") : "") + esc(v.d.slice(0, 2).join(" · "));
    return (
      '<li style="--i:' + i + '"><a href="' + esc(utm(BASE + "/spots/" + v.i)) + '" target="_blank" rel="noopener">' +
      '<span class="l1"><b class="nm">' + esc(v.n) + '</b><b class="tm"><i class="dot ' + (o.live ? "live" : "up") + '"></i>' + range(o.s, o.e) + "</b></span>" +
      '<span class="l2"><span class="dl">' + (sub || esc(v.r)) + '</span><span class="st ' + cls + '">' + st.text + "</span></span>" +
      "</a></li>"
    );
  }

  function venueView(el, opts) {
    var v = data.v.filter(function (x) { return x.i === opts.venue; })[0];
    if (!v) return problem(el, "We couldn't find that spot on A Little Hang.");
    var now = nowIn(v.z), o = occ(v, now);
    var hero;
    if (!o) hero = '<div class="hero"><p class="hk">No happy hour listed right now</p></div>';
    else {
      var st = statusText(o, now);
      hero = o.live
        ? '<div class="hero on"><span class="badge"><i class="dot live"></i>Happy hour is on</span><p class="big">' + range(o.s, o.e) + '</p><p class="hs ' + (st.soon ? "soon" : "live") + '">' + st.text + "</p></div>"
        : '<div class="hero"><span class="badge up">Next happy hour</span><p class="big">' + range(o.s, o.e) + '</p><p class="hs next">' + st.text + "</p></div>";
    }
    var sched = v.h.length ? '<ul class="sched">' + v.h.map(function (h) { return "<li><span>" + esc(h[0]) + "</span><b>" + esc(h[1]) + "</b></li>"; }).join("") + "</ul>" : "";
    var deals = v.f.length ? '<ul class="deals">' + v.f.map(function (d) { return "<li><b>" + esc(d[0]) + "</b><span>" + esc(d[1]) + "</span></li>"; }).join("") + "</ul>" : "";
    var score = v.s >= data.top ? '<a class="score" href="' + esc(utm(BASE + "/spots/" + v.i)) + '" target="_blank" rel="noopener" title="Hangout Score, out of 10">★ ' + v.s.toFixed(1) + "</a>" : "";
    return (
      '<div class="w one" part="widget">' +
      '<header class="head">' + tile + '<div class="ttl"><p class="k">Happy hour</p><h2>' + esc(v.n) + "</h2></div>" + score + "</header>" +
      hero + sched + deals +
      '<footer class="foot"><span class="credit"><slot></slot></span><a class="all" href="' + esc(utm(BASE + "/spots/" + v.i)) + '" target="_blank" rel="noopener">Full menu <span aria-hidden="true">→</span></a></footer></div>'
    );
  }

  function nearestPlace(pt) {
    var best = null, bd = Infinity;
    data.p.forEach(function (p) {
      if (p.a == null) return;
      // Neighbourhoods beat their city when they're close.
      var d = km(pt, [p.a, p.o]) * (p.k === "area" ? 0.6 : 1);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  function problem(el, msg) {
    return '<div class="w" part="widget"><header class="head">' + tile + '<div class="ttl"><p class="k">A Little Hang</p><h2>Happy hours</h2></div></header><p class="empty">' + esc(msg) + '</p><footer class="foot"><span class="credit"><slot></slot></span></footer></div>';
  }

  function options(el) {
    var d = el.dataset;
    var near = null;
    if (d.near) {
      var parts = d.near.split(",").map(Number);
      if (parts.length === 2 && isFinite(parts[0]) && isFinite(parts[1])) near = parts;
    }
    return {
      place: d.place || null,
      venue: d.venue || null,
      near: near,
      label: d.label || "",
      radius: Math.min(5, Math.max(0.3, Number(d.radius) || 1.5)),
      limit: Math.min(8, Math.max(1, Number(d.limit) || 5)),
      theme: d.theme === "light" || d.theme === "dark" ? d.theme : "auto",
    };
  }

  function render(el) {
    var root = el.shadowRoot || el.attachShadow({ mode: "open" });
    var opts = options(el);
    var html = opts.venue ? venueView(el, opts) : opts.near || opts.place ? listView(el, opts) : problem(el, "Pick a place, an address or a spot for this widget.");
    var first = !root.firstChild;
    root.innerHTML = "<style>" + CSS + "</style>" + html;
    var w = root.querySelector(".w");
    w.setAttribute("data-theme", opts.theme);
    if (first && !el.hasAttribute("data-static")) w.classList.add("enter");
  }

  function mount(el) {
    if (!el || !el.attachShadow) return;
    fonts();
    return load()
      .then(function () {
        render(el);
        if (mounted.indexOf(el) < 0) mounted.push(el);
      })
      .catch(function () { /* leave the credit links as they are */ });
  }

  function scan() {
    var els = document.querySelectorAll("[data-alh-widget]");
    for (var i = 0; i < els.length; i++) if (mounted.indexOf(els[i]) < 0) mount(els[i]);
  }

  // Times tick over each minute while the page is open.
  setInterval(function () {
    if (document.hidden || !data) return;
    mounted.forEach(function (el) { if (el.isConnected) render(el); });
  }, 60000);

  window.ALHWidget = { mount: mount, scan: scan, version: "__VERSION__" };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
})();
