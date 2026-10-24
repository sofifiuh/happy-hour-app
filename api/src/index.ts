import { cleanEmail, finishLogin, logout, requireOwner, requireUser, sign, startLogin } from "./auth";
import type { Env } from "./env";
import { body, cors, HttpError, json, newId, now, sha256, str, today } from "./http";
import { admins, send } from "./mail";
import { cleanEdit, emailMatchesWebsite, venue, venueDirectory } from "./venues";

type Handler = (req: Request, env: Env, p: Record<string, string>, ctx: ExecutionContext) => Promise<Response>;
const routes: [string, RegExp, Handler][] = [];
const on = (method: string, path: string, h: Handler) =>
  routes.push([method, new RegExp(`^${path.replace(/:(\w+)/g, "(?<$1>[^/]+)").replace("*", "(?<rest>.+)")}$`), h]);

const EVENT_TYPES = new Set(["view", "save", "directions", "call", "website", "share"]);
const MAX_UPLOAD = 8 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PUBLIC_EDITS = "https://cache.internal/public/edits";

const apiBase = (req: Request) => new URL(req.url).origin;

// ---------- Sign in ----------

on("GET", "/health", async () => json({ ok: true }));

on("POST", "/auth/start", async (req, env) => {
  const b = await body<{ email?: string; next?: string }>(req);
  const devLink = await startLogin(env, cleanEmail(b.email), typeof b.next === "string" ? b.next : "/venue");
  return json({ sent: true, ...(devLink && { devLink }) });
});

on("POST", "/auth/verify", async (req, env) => {
  const b = await body<{ token?: string }>(req);
  return json(await finishLogin(env, str(b.token, "token", 100)!));
});

on("POST", "/auth/logout", async (req, env) => {
  await logout(req, env);
  return json({ ok: true });
});

on("GET", "/me", async (req, env) => {
  const user = await requireUser(req, env);
  const dir = await venueDirectory(env);
  const owned = user.admin
    ? []
    : (await env.DB.prepare("SELECT venue_id FROM owners WHERE user_id = ?").bind(user.id).all<{ venue_id: string }>()).results;
  const claims = (
    await env.DB.prepare("SELECT id, venue_id, status, method, created_at FROM claims WHERE user_id = ? ORDER BY created_at DESC")
      .bind(user.id)
      .all<{ id: string; venue_id: string; status: string; method: string; created_at: string }>()
  ).results;
  return json({
    email: user.email,
    admin: user.admin,
    venues: owned.map((o) => ({ id: o.venue_id, name: dir.get(o.venue_id)?.name ?? o.venue_id })),
    claims: claims.map((c) => ({ ...c, venue_name: dir.get(c.venue_id)?.name ?? c.venue_id })),
  });
});

// ---------- Claims ----------

on("POST", "/claims", async (req, env) => {
  const user = await requireUser(req, env);
  const b = await body<Record<string, unknown>>(req);
  const v = await venue(env, str(b.venue_id, "venue_id", 120)!);
  const name = str(b.name, "Your name", 80)!;
  const role = str(b.role, "Your role", 60)!;
  const phone = str(b.phone, "Phone", 30, false);

  if (await env.DB.prepare("SELECT 1 FROM owners WHERE venue_id = ? AND user_id = ?").bind(v.id, user.id).first())
    throw new HttpError(409, "You already manage this venue");
  const open = await env.DB.prepare("SELECT id, status, method FROM claims WHERE venue_id = ? AND user_id = ? AND status = 'pending'")
    .bind(v.id, user.id)
    .first<{ id: string; status: string; method: string }>();
  if (open) return json({ claim: open });

  // An email at the venue's own domain is proof enough, unless someone
  // already manages the venue: then a person decides.
  const taken = await env.DB.prepare("SELECT 1 FROM owners WHERE venue_id = ?").bind(v.id).first();
  const auto = !taken && emailMatchesWebsite(user.email, v.website);
  const claim = { id: newId(), status: auto ? "approved" : "pending", method: auto ? "domain" : "manual" };
  const stamp = now();
  const writes = [
    env.DB.prepare(
      "INSERT INTO claims (id, venue_id, user_id, name, role, phone, method, status, note, created_at, decided_at, decided_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(claim.id, v.id, user.id, name, role, phone, claim.method, claim.status, taken ? "Venue already has a manager" : null, stamp, auto ? stamp : null, auto ? "auto" : null),
  ];
  if (auto) writes.push(env.DB.prepare("INSERT OR IGNORE INTO owners (venue_id, user_id, created_at) VALUES (?, ?, ?)").bind(v.id, user.id, stamp));
  await env.DB.batch(writes);

  await notifyAdmins(env, {
    subject: `${auto ? "Claimed" : "Claim to review"}: ${v.name}`,
    lines: [
      `${name} (${role}, ${user.email}${phone ? `, ${phone}` : ""}) ${auto ? "claimed" : "asked to claim"} ${v.name}, ${v.address}.`,
      auto ? "Approved automatically: their email matches the venue's website." : `Listed phone: ${v.phone ?? "none"}. Website: ${v.website ?? "none"}.`,
      { label: "Open the review queue", href: `${env.SITE_URL}/venue/admin` },
    ],
  });
  return json({ claim }, 201);
});

on("PUT", "/claims/:id/licence", async (req, env, p) => {
  const user = await requireUser(req, env);
  const c = await env.DB.prepare("SELECT id FROM claims WHERE id = ? AND user_id = ? AND status = 'pending'").bind(p.id, user.id).first();
  if (!c) throw new HttpError(404, "No open claim with that id");
  const type = req.headers.get("content-type") ?? "";
  if (!IMAGE_TYPES[type] && type !== "application/pdf") throw new HttpError(415, "Upload a photo or PDF");
  const file = await readUpload(req);
  const key = `licences/${p.id}`;
  await env.FILES.put(key, file, { httpMetadata: { contentType: type } });
  await env.DB.prepare("UPDATE claims SET licence_key = ? WHERE id = ?").bind(key, p.id).run();
  return json({ ok: true });
});

// ---------- The venue's listing ----------

on("GET", "/venues/:id/edit", async (req, env, p) => {
  const user = await requireUser(req, env);
  await requireOwner(env, user, p.id);
  const row = await env.DB.prepare("SELECT data, updated_at, confirmed_at FROM venue_edits WHERE venue_id = ?")
    .bind(p.id)
    .first<{ data: string; updated_at: string; confirmed_at: string }>();
  return json(row ? { data: JSON.parse(row.data), updated_at: row.updated_at, confirmed_at: row.confirmed_at } : { data: null });
});

on("PUT", "/venues/:id/edit", async (req, env, p) => {
  const user = await requireUser(req, env);
  await requireOwner(env, user, p.id);
  await venue(env, p.id);
  const { data, flags } = cleanEdit(await body(req), `${apiBase(req)}/photos/venues/${p.id}/`);
  const stamp = now();
  const json_ = JSON.stringify(data);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO venue_edits (venue_id, data, updated_at, updated_by, confirmed_at, flagged) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(venue_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at,
       updated_by = excluded.updated_by, confirmed_at = excluded.confirmed_at, flagged = excluded.flagged`,
    ).bind(p.id, json_, stamp, user.id, stamp, flags.length ? flags.join("; ") : null),
    env.DB.prepare("INSERT INTO edit_log (venue_id, user_id, data, created_at) VALUES (?, ?, ?, ?)").bind(p.id, user.id, json_, stamp),
  ]);
  await caches.default.delete(PUBLIC_EDITS);
  if (flags.length) {
    const v = await venue(env, p.id);
    await notifyAdmins(env, { subject: `Edit to check: ${v.name}`, lines: [...flags, { label: "Open the review queue", href: `${env.SITE_URL}/venue/admin` }] });
  }
  return json({ ok: true, updated_at: stamp, flags });
});

on("POST", "/venues/:id/confirm", async (req, env, p) => {
  const user = await requireUser(req, env);
  await requireOwner(env, user, p.id);
  const r = await env.DB.prepare("UPDATE venue_edits SET confirmed_at = ? WHERE venue_id = ?").bind(now(), p.id).run();
  if (!r.meta.changes) throw new HttpError(409, "Save the listing once first");
  await caches.default.delete(PUBLIC_EDITS);
  return json({ ok: true });
});

on("POST", "/venues/:id/photos", async (req, env, p) => {
  const user = await requireUser(req, env);
  await requireOwner(env, user, p.id);
  const ext = IMAGE_TYPES[req.headers.get("content-type") ?? ""];
  if (!ext) throw new HttpError(415, "Upload a JPEG, PNG or WebP photo");
  const file = await readUpload(req);
  const key = `venues/${p.id}/${newId()}.${ext}`;
  await env.FILES.put(key, file, { httpMetadata: { contentType: req.headers.get("content-type")! } });
  return json({ url: `${apiBase(req)}/photos/${key}` }, 201);
});

on("GET", "/photos/*", async (_req, env, p) => {
  if (!p.rest.startsWith("venues/")) throw new HttpError(404, "Not found");
  const obj = await env.FILES.get(p.rest);
  if (!obj) throw new HttpError(404, "Not found");
  return new Response(obj.body, {
    headers: { "content-type": obj.httpMetadata?.contentType ?? "image/jpeg", "cache-control": "public, max-age=31536000, immutable" },
  });
});

on("GET", "/venues/:id/stats", async (req, env, p) => {
  const user = await requireUser(req, env);
  await requireOwner(env, user, p.id);
  const since = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
  const rows = (
    await env.DB.prepare("SELECT day, type, count FROM events_daily WHERE venue_id = ? AND day >= ?")
      .bind(p.id, since)
      .all<{ day: string; type: string; count: number }>()
  ).results;
  const cut = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const week: Record<string, number> = {};
  const prev: Record<string, number> = {};
  for (const t of EVENT_TYPES) week[t] = prev[t] = 0;
  for (const r of rows) (r.day >= cut ? week : prev)[r.type] += r.count;
  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day, views: rows.find((r) => r.day === day && r.type === "view")?.count ?? 0 };
  });
  return json({ week, prev, daily });
});

// Every venue's own edits, for the site to lay over the nightly data.
on("GET", "/public/edits", async (_req, env, _p, ctx) => {
  const hit = await caches.default.match(PUBLIC_EDITS);
  if (hit) return hit;
  const rows = (
    await env.DB.prepare("SELECT venue_id, data, updated_at, confirmed_at FROM venue_edits").all<{
      venue_id: string;
      data: string;
      updated_at: string;
      confirmed_at: string;
    }>()
  ).results;
  const claimed = (await env.DB.prepare("SELECT DISTINCT venue_id FROM owners").all<{ venue_id: string }>()).results.map((r) => r.venue_id);
  const edits = Object.fromEntries(
    rows.map((r) => [r.venue_id, { ...JSON.parse(r.data), updated: r.updated_at.slice(0, 10), confirmed: r.confirmed_at.slice(0, 10) }]),
  );
  const res = json({ edits, claimed }, 200, { "cache-control": "public, max-age=60" });
  ctx.waitUntil(caches.default.put(PUBLIC_EDITS, res.clone()));
  return res;
});

// ---------- Counting and reports (no sign in) ----------

// One count per person, venue, type and day. The hash mixes in a secret
// and the date, and event_seen is purged daily, so nobody can be followed.
on("POST", "/e", async (req, env) => {
  const b = await body<{ v?: string; t?: string }>(req);
  if (typeof b.v !== "string" || !EVENT_TYPES.has(b.t ?? "")) return new Response(null, { status: 204 });
  if (!(await venueDirectory(env)).has(b.v)) return new Response(null, { status: 204 });
  const day = today();
  const who = `${req.headers.get("cf-connecting-ip") ?? ""}|${req.headers.get("user-agent") ?? ""}`;
  const hash = await sha256(`${env.SIGNING_KEY ?? "alh"}|${day}|${who}|${b.v}|${b.t}`);
  const fresh = await env.DB.prepare("INSERT OR IGNORE INTO event_seen (hash, day) VALUES (?, ?)").bind(hash, day).run();
  if (fresh.meta.changes)
    await env.DB.prepare(
      "INSERT INTO events_daily (venue_id, day, type, count) VALUES (?, ?, ?, 1) ON CONFLICT DO UPDATE SET count = count + 1",
    )
      .bind(b.v, day, b.t)
      .run();
  return new Response(null, { status: 204 });
});

on("POST", "/reports", async (req, env) => {
  const b = await body<Record<string, unknown>>(req);
  const v = await venue(env, str(b.venue_id, "venue_id", 120)!);
  const message = str(b.message, "What's wrong", 1000)!;
  const email = b.email ? cleanEmail(b.email) : null;
  // At most 3 reports a venue an hour from one connection.
  const hour = now().slice(0, 13);
  const who = await sha256(`${env.SIGNING_KEY ?? "alh"}|${hour}|${req.headers.get("cf-connecting-ip") ?? ""}|${v.id}`);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM event_seen WHERE hash > ? AND hash < ?")
    .bind(`r:${who}:`, `r:${who};`)
    .first<{ n: number }>();
  if ((n?.n ?? 0) >= 3) throw new HttpError(429, "Thanks, we've got your reports for this spot");
  const id = newId();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO reports (id, venue_id, message, email, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, v.id, message, email, now()),
    env.DB.prepare("INSERT INTO event_seen (hash, day) VALUES (?, ?)").bind(`r:${who}:${id}`, today()),
  ]);
  const owners = (
    await env.DB.prepare("SELECT u.email FROM owners o JOIN users u ON u.id = o.user_id WHERE o.venue_id = ?").bind(v.id).all<{ email: string }>()
  ).results.map((r) => r.email);
  const lines = [`Someone reported a problem with ${v.name}:`, message, ...(email ? [`They left an email: ${email}`] : [])];
  await notifyAdmins(env, { subject: `Report: ${v.name}`, lines: [...lines, { label: "Open the review queue", href: `${env.SITE_URL}/venue/admin` }] });
  for (const to of owners)
    await send(env, { to, subject: `A guest flagged your listing: ${v.name}`, lines: [...lines.slice(0, 2), { label: "Update your listing", href: `${env.SITE_URL}/venue/${v.id}` }] }).catch(() => {});
  return json({ ok: true }, 201);
});

// ---------- Admin ----------

async function requireAdmin(req: Request, env: Env) {
  const u = await requireUser(req, env);
  if (!u.admin) throw new HttpError(403, "Admins only");
  return u;
}

on("GET", "/admin/queue", async (req, env) => {
  await requireAdmin(req, env);
  const dir = await venueDirectory(env);
  const name = (id: string) => dir.get(id)?.name ?? id;
  const claims = (
    await env.DB.prepare(
      `SELECT c.id, c.venue_id, c.name, c.role, c.phone, c.method, c.status, c.note, c.licence_key, c.created_at, u.email
       FROM claims c JOIN users u ON u.id = c.user_id WHERE c.status = 'pending' ORDER BY c.created_at`,
    ).all<Record<string, string>>()
  ).results.map((c) => ({
    ...c,
    licence: !!c.licence_key,
    licence_key: undefined,
    venue_name: name(c.venue_id),
    venue_phone: dir.get(c.venue_id)?.phone ?? null,
    venue_website: dir.get(c.venue_id)?.website ?? null,
  }));
  const reports = (
    await env.DB.prepare("SELECT id, venue_id, message, email, created_at FROM reports WHERE status = 'open' ORDER BY created_at DESC LIMIT 200").all<
      Record<string, string>
    >()
  ).results.map((r) => ({ ...r, venue_name: name(r.venue_id) }));
  const flagged = (
    await env.DB.prepare("SELECT venue_id, flagged, updated_at FROM venue_edits WHERE flagged IS NOT NULL ORDER BY updated_at DESC").all<Record<string, string>>()
  ).results.map((f) => ({ ...f, venue_name: name(f.venue_id) }));
  const recent = (
    await env.DB.prepare("SELECT venue_id, updated_at FROM venue_edits ORDER BY updated_at DESC LIMIT 20").all<Record<string, string>>()
  ).results.map((f) => ({ ...f, venue_name: name(f.venue_id) }));
  return json({ claims, reports, flagged, recent });
});

on("POST", "/admin/claims/:id", async (req, env, p) => {
  const admin = await requireAdmin(req, env);
  const b = await body<{ decision?: string; note?: string }>(req);
  if (b.decision !== "approve" && b.decision !== "reject") throw new HttpError(400, "decision is approve or reject");
  const c = await env.DB.prepare(
    "SELECT c.venue_id, c.user_id, c.name, u.email FROM claims c JOIN users u ON u.id = c.user_id WHERE c.id = ? AND c.status = 'pending'",
  )
    .bind(p.id)
    .first<{ venue_id: string; user_id: string; name: string; email: string }>();
  if (!c) throw new HttpError(404, "No open claim with that id");
  const v = await venue(env, c.venue_id);
  const stamp = now();
  const note = str(b.note, "note", 500, false);
  const writes = [
    env.DB.prepare("UPDATE claims SET status = ?, note = COALESCE(?, note), decided_at = ?, decided_by = ? WHERE id = ?").bind(
      b.decision === "approve" ? "approved" : "rejected",
      note,
      stamp,
      admin.email,
      p.id,
    ),
  ];
  if (b.decision === "approve") writes.push(env.DB.prepare("INSERT OR IGNORE INTO owners (venue_id, user_id, created_at) VALUES (?, ?, ?)").bind(c.venue_id, c.user_id, stamp));
  await env.DB.batch(writes);
  await caches.default.delete(PUBLIC_EDITS);
  await send(
    env,
    b.decision === "approve"
      ? {
          to: c.email,
          subject: `You now manage ${v.name} on A Little Hang`,
          lines: [`Hi ${c.name}, you're all set.`, "Update your happy hour times, deals and photos any time. Changes show on the site within a few minutes.", { label: "Edit your listing", href: `${env.SITE_URL}/venue/${v.id}` }],
        }
      : {
          to: c.email,
          subject: `About your claim for ${v.name}`,
          lines: [`Hi ${c.name}, we couldn't confirm you manage ${v.name}.`, ...(note ? [note] : []), "Reply to this email with something that shows it (a work email, or a photo of the liquor licence) and we'll take another look."],
        },
  ).catch(() => {});
  return json({ ok: true });
});

on("GET", "/admin/claims/:id/licence", async (req, env, p) => {
  await requireAdmin(req, env);
  const obj = await env.FILES.get(`licences/${p.id}`);
  if (!obj) throw new HttpError(404, "No licence uploaded");
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, no-store" } });
});

on("POST", "/admin/reports/:id", async (req, env, p) => {
  await requireAdmin(req, env);
  await env.DB.prepare("UPDATE reports SET status = 'resolved', resolved_at = ? WHERE id = ?").bind(now(), p.id).run();
  return json({ ok: true });
});

on("POST", "/admin/edits/:id/clear", async (req, env, p) => {
  await requireAdmin(req, env);
  await env.DB.prepare("UPDATE venue_edits SET flagged = NULL WHERE venue_id = ?").bind(p.id).run();
  return json({ ok: true });
});

// ---------- Monthly "still right?" ----------

// One-tap link from the monthly email: no sign in, signed per venue + month.
on("GET", "/confirm", async (req, env) => {
  const u = new URL(req.url);
  const v = u.searchParams.get("v") ?? "";
  const m = u.searchParams.get("m") ?? "";
  // Good until the next email goes out, so a late tap still counts.
  const last = new Date(Date.now() - 62 * 86_400_000).toISOString().slice(0, 7);
  if (u.searchParams.get("s") !== (await sign(env, `confirm|${v}|${m}`)) || m < last)
    return Response.redirect(`${env.SITE_URL}/venue/${encodeURIComponent(v)}?confirm=expired`, 302);
  await env.DB.prepare("UPDATE venue_edits SET confirmed_at = ? WHERE venue_id = ?").bind(now(), v).run();
  await caches.default.delete(PUBLIC_EDITS);
  return Response.redirect(`${env.SITE_URL}/venue/${encodeURIComponent(v)}?confirmed=1`, 302);
});

async function monthlyCheck(env: Env) {
  const month = now().slice(0, 7);
  const dir = await venueDirectory(env);
  const rows = (
    await env.DB.prepare(
      `SELECT o.venue_id, u.email FROM owners o JOIN users u ON u.id = o.user_id
       LEFT JOIN venue_edits e ON e.venue_id = o.venue_id
       WHERE e.confirmed_at IS NULL OR e.confirmed_at < ?`,
    )
      .bind(new Date(Date.now() - 50 * 86_400_000).toISOString())
      .all<{ venue_id: string; email: string }>()
  ).results;
  for (const r of rows) {
    const v = dir.get(r.venue_id);
    if (!v) continue;
    const s = await sign(env, `confirm|${r.venue_id}|${month}`);
    const edited = await env.DB.prepare("SELECT 1 FROM venue_edits WHERE venue_id = ?").bind(r.venue_id).first();
    await send(env, {
      to: r.email,
      subject: `Is ${v.name}'s happy hour still right?`,
      lines: [
        "Guests trust A Little Hang because the times are right. Take ten seconds to check yours.",
        ...(edited ? [{ label: "Yes, it's still right", href: `${env.API_URL}/confirm?v=${encodeURIComponent(r.venue_id)}&m=${month}&s=${s}` }] : []),
        { label: edited ? "Something changed" : "Check your listing", href: `${env.SITE_URL}/venue/${r.venue_id}` },
      ],
    }).catch((e) => console.error("monthly mail", r.venue_id, e));
  }
}

async function notifyAdmins(env: Env, mail: { subject: string; lines: (string | { label: string; href: string })[] }) {
  for (const to of admins(env)) await send(env, { to, ...mail }).catch((e) => console.error("admin mail", e));
}

async function readUpload(req: Request) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD) throw new HttpError(413, "Files up to 8 MB");
  const buf = await req.arrayBuffer();
  if (!buf.byteLength) throw new HttpError(400, "The file was empty");
  if (buf.byteLength > MAX_UPLOAD) throw new HttpError(413, "Files up to 8 MB");
  return buf;
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return cors(req, env, new Response(null, { status: 204 }));
    const path = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
    let res: Response;
    try {
      const hit = routes.find(([m, re]) => m === req.method && re.test(path));
      if (!hit) throw new HttpError(404, "Not found");
      res = await hit[2](req, env, hit[1].exec(path)!.groups ?? {}, ctx);
    } catch (e) {
      if (e instanceof HttpError) res = json({ error: e.message }, e.status);
      else {
        console.error(e);
        res = json({ error: "Something went wrong" }, 500);
      }
    }
    return cors(req, env, res);
  },

  async scheduled(_ev, env) {
    await env.DB.prepare("DELETE FROM event_seen WHERE day < ?").bind(today()).run();
    const d = new Date();
    // 1st of Jan, Mar, May, Jul, Sep and Nov: once every 2 months.
    if (d.getUTCDate() === 1 && d.getUTCMonth() % 2 === 0) await monthlyCheck(env);
  },
} satisfies ExportedHandler<Env>;

