import { cleanEmail, finishLogin, logout, requireOwner, requireUser, sign, startLogin } from "./auth";
import type { Env } from "./env";
import { body, cors, HttpError, json, newId, now, sha256, str, today } from "./http";
import {
  adminClaimEmail,
  adminEditFlagEmail,
  adminReportEmail,
  adminSubmissionEmail,
  claimApprovedEmail,
  claimReceivedEmail,
  claimRejectedEmail,
  type Email,
  monthlyCheckEmail,
  fmtHours,
  ownerReportEmail,
  samples,
  type Spot,
  submissionClosedEmail,
  submissionLiveEmail,
  submissionReceivedEmail,
} from "./email";
import { admins, send } from "./mail";
import { cleanEdit, cleanHours, days, emailMatchesWebsite, slugFor, text, time, venue, venueDirectory, type EditData, type VenueInfo } from "./venues";

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

  await notifyAdmins(env, adminClaimEmail(env.SITE_URL, { auto, name, role, email: user.email, phone, venue: v }));
  // The claimant hears back either way: welcome aboard, or "we're on it".
  await send(env, { to: user.email, ...(auto ? claimApprovedEmail(env.SITE_URL, { name, venue: v }) : claimReceivedEmail(env.SITE_URL, { name, role, venue: v })) }).catch((e) =>
    console.error("claim mail", e),
  );
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
    await notifyAdmins(env, adminEditFlagEmail(env.SITE_URL, { venue: v, flags }));
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
  // Happy hours published from guests' photos this week, so they show at
  // once. By then the site's own data has them (pipeline/submissions.js),
  // and newer data from the venue's page can take over again.
  const community: Record<string, { hh: EditData["hh"]; published: string }> = {};
  for (const r of (
    await env.DB.prepare(
      "SELECT published, decided_at FROM submissions WHERE status = 'published' AND decided_at > ? ORDER BY decided_at",
    )
      .bind(new Date(Date.now() - 7 * 86_400_000).toISOString())
      .all<{ published: string; decided_at: string }>()
  ).results) {
    const p = JSON.parse(r.published) as Published;
    if (!p.new) community[p.venue_id] = { hh: p.hh, published: r.decided_at.slice(0, 10) };
  }
  const res = json({ edits, claimed, community }, 200, { "cache-control": "public, max-age=60" });
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
  await notifyAdmins(env, adminReportEmail(env.SITE_URL, { venue: v, message, email }));
  for (const to of owners) await send(env, { to, ...ownerReportEmail(env.SITE_URL, { venue: v, message }) }).catch(() => {});
  return json({ ok: true }, 201);
});

// ---------- "Submit a happy hour" (no sign in) ----------

const MAX_PHOTOS = 4;

// What an admin published from a submission: the venue it went to (a new
// spot gets the id the pipeline will give it) and the checked happy hour.
interface Published {
  venue_id: string;
  new?: boolean;
  name?: string;
  address?: string;
  website?: string | null;
  hh: NonNullable<EditData["hh"]>;
}

// A guest's photo of a menu or happy hour sign, for a venue we list or a
// spot we don't. Multipart: the fields below plus 1 to 4 `photos`.
on("POST", "/submissions", async (req, env) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Expected a form with photos");
  }
  const field = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  // A field people never see; bots fill it in. Pretend it worked.
  if (field("company")) return json({ id: newId() }, 201);

  const email = cleanEmail(field("email"));
  const name = str(field("name"), "Your name", 60, false);
  const note = str(field("note"), "Anything else", 600, false);
  const worksThere = field("works_there") === "1";
  let spot: Spot & { phone?: string | null; website?: string | null };
  let place: { name: string; address: string; website: string | null } | null = null;
  const venueId = str(field("venue_id"), "venue_id", 120, false);
  if (venueId) spot = await venue(env, venueId);
  else {
    place = {
      name: str(field("place_name"), "The spot's name", 100)!,
      address: str(field("place_address"), "Where it is", 160)!,
      website: str(field("place_website"), "Website or Instagram", 300, false),
    };
    spot = { id: null, ...place };
  }
  // The guest's own reading of the times is a head start for the admin,
  // not something we publish, so a bad one is just dropped.
  let hh: { days: number[]; start: string; end: string | null } | null = null;
  try {
    const h = JSON.parse(field("hh") ?? "null");
    if (h) hh = { days: days(h.days, "Days"), start: time(h.start, "Start")!, end: time(h.end, "End", true) };
  } catch {
    hh = null;
  }

  const photos = form.getAll("photos").filter((f): f is File => typeof f !== "string");
  if (!photos.length) throw new HttpError(400, "Add a photo of the menu or sign");
  if (photos.length > MAX_PHOTOS) throw new HttpError(400, `Up to ${MAX_PHOTOS} photos`);
  for (const f of photos) {
    if (!IMAGE_TYPES[f.type]) throw new HttpError(415, "Photos must be JPEG, PNG or WebP");
    if (f.size > MAX_UPLOAD) throw new HttpError(413, "Photos up to 8 MB each");
    if (!f.size) throw new HttpError(400, "One of the photos was empty");
  }

  // At most 5 an hour from one connection and 6 a day from one email.
  const hour = now().slice(0, 13);
  const who = await sha256(`${env.SIGNING_KEY ?? "alh"}|${hour}|${req.headers.get("cf-connecting-ip") ?? ""}`);
  const fromHere = await env.DB.prepare("SELECT COUNT(*) AS n FROM event_seen WHERE hash > ? AND hash < ?")
    .bind(`s:${who}:`, `s:${who};`)
    .first<{ n: number }>();
  const fromEmail = await env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE email = ? AND created_at > ?")
    .bind(email, new Date(Date.now() - 86_400_000).toISOString())
    .first<{ n: number }>();
  if ((fromHere?.n ?? 0) >= 5 || (fromEmail?.n ?? 0) >= 6) throw new HttpError(429, "Thanks for all of these! Give us a little while to catch up, then send more");

  const id = newId();
  for (const [n, f] of photos.entries()) await env.FILES.put(`submissions/${id}/${n}`, await f.arrayBuffer(), { httpMetadata: { contentType: f.type } });
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO submissions (id, venue_id, place_name, place_address, place_website, hh, note, name, email, works_there, photos, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, spot.id, place?.name ?? null, place?.address ?? null, place?.website ?? null, hh ? JSON.stringify(hh) : null, note, name, email, worksThere ? 1 : 0, photos.length, now()),
    env.DB.prepare("INSERT INTO event_seen (hash, day) VALUES (?, ?)").bind(`s:${who}:${id}`, today()),
  ]);

  const managed = !!spot.id && !!(await env.DB.prepare("SELECT 1 FROM owners WHERE venue_id = ?").bind(spot.id).first());
  await notifyAdmins(
    env,
    adminSubmissionEmail(env.SITE_URL, { spot, name, email, photos: photos.length, hours: hh ? fmtHours(hh) : null, note, worksThere, managed }),
  );
  await send(env, { to: email, ...submissionReceivedEmail(env.SITE_URL, { name, spot, worksThere }) }).catch((e) => console.error("submission mail", e));
  return json({ id }, 201);
});

// Published happy hours, for the nightly pipeline (pipeline/submissions.js)
// to write into the site's own data. Nothing about who sent them.
on("GET", "/public/submissions", async (_req, env) => {
  const rows = (
    await env.DB.prepare("SELECT id, published, decided_at FROM submissions WHERE status = 'published' ORDER BY decided_at").all<{
      id: string;
      published: string;
      decided_at: string;
    }>()
  ).results;
  return json(
    { submissions: rows.map((r) => ({ id: r.id, published_at: r.decided_at, ...(JSON.parse(r.published) as Published) })) },
    200,
    { "cache-control": "public, max-age=60" },
  );
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
  const managed = new Set((await env.DB.prepare("SELECT DISTINCT venue_id FROM owners").all<{ venue_id: string }>()).results.map((r) => r.venue_id));
  const submissions = (
    await env.DB.prepare(
      `SELECT id, venue_id, place_name, place_address, place_website, hh, note, name, email, works_there, photos, created_at
       FROM submissions WHERE status = 'pending' ORDER BY created_at`,
    ).all<Record<string, string | number | null>>()
  ).results.map((r) => ({
    ...r,
    hh: r.hh ? JSON.parse(r.hh as string) : null,
    works_there: r.works_there === 1,
    venue_name: r.venue_id ? name(r.venue_id as string) : null,
    managed: !!r.venue_id && managed.has(r.venue_id as string),
  }));
  return json({ claims, reports, flagged, recent, submissions });
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
  await send(env, {
    to: c.email,
    ...(b.decision === "approve" ? claimApprovedEmail(env.SITE_URL, { name: c.name, venue: v }) : claimRejectedEmail(env.SITE_URL, { name: c.name, venue: v, note })),
  }).catch(() => {});
  return json({ ok: true });
});

on("GET", "/admin/claims/:id/licence", async (req, env, p) => {
  await requireAdmin(req, env);
  const obj = await env.FILES.get(`licences/${p.id}`);
  if (!obj) throw new HttpError(404, "No licence uploaded");
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": "private, no-store" } });
});

on("GET", "/admin/submissions/:id/photos/:n", async (req, env, p) => {
  await requireAdmin(req, env);
  const obj = await env.FILES.get(`submissions/${p.id}/${Number(p.n)}`);
  if (!obj) throw new HttpError(404, "No such photo");
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "image/jpeg", "cache-control": "private, max-age=3600" } });
});

// publish: the admin's checked happy hour goes live (at once for a venue we
// list; a new spot joins the map with the next data publish, and the guest
// hears when it's there). decline: the guest gets the reason. forward: the
// venue manages its own listing, so its managers get the photo's reading.
on("POST", "/admin/submissions/:id", async (req, env, p) => {
  const admin = await requireAdmin(req, env);
  const b = await body<Record<string, unknown>>(req);
  const s = await env.DB.prepare("SELECT * FROM submissions WHERE id = ? AND status = 'pending'").bind(p.id).first<{
    venue_id: string | null;
    place_name: string | null;
    place_address: string | null;
    place_website: string | null;
    hh: string | null;
    note: string | null;
    name: string | null;
    email: string;
  }>();
  if (!s) throw new HttpError(404, "No open submission with that id");
  const dir = await venueDirectory(env);
  const listed = s.venue_id ? dir.get(s.venue_id) : undefined;
  const spot: Spot = listed ?? { id: null, name: s.place_name ?? "a new spot", address: s.place_address ?? "" };
  const stamp = now();
  const decide = (status: string, extra: { published?: Published; reason?: string | null; notified?: boolean }) =>
    env.DB.prepare("UPDATE submissions SET status = ?, published = ?, reason = ?, decided_at = ?, decided_by = ?, notified_at = ? WHERE id = ?")
      .bind(status, extra.published ? JSON.stringify(extra.published) : null, extra.reason ?? null, stamp, admin.email, extra.notified ? stamp : null, p.id)
      .run();

  if (b.decision === "decline") {
    const reason = str(b.reason, "Reason", 500, false);
    await decide("declined", { reason });
    await send(env, { to: s.email, ...submissionClosedEmail(env.SITE_URL, { name: s.name, spot, reason, forwarded: false }) }).catch(() => {});
    return json({ ok: true });
  }

  if (b.decision === "forward") {
    if (!listed) throw new HttpError(400, "Only a venue we list can be passed on");
    const owners = (
      await env.DB.prepare("SELECT u.email FROM owners o JOIN users u ON u.id = o.user_id WHERE o.venue_id = ?").bind(listed.id).all<{ email: string }>()
    ).results.map((r) => r.email);
    if (!owners.length) throw new HttpError(409, "Nobody manages this venue, so publish it instead");
    const reading = s.hh ? fmtHours(JSON.parse(s.hh)) : null;
    const message = [
      "A guest sent us a photo of your happy hour menu.",
      reading ? `They read it as: ${reading}.` : "",
      s.note ? `They added: ${s.note}` : "",
      "If your listing already matches, there's nothing to do.",
    ]
      .filter(Boolean)
      .join("\n");
    for (const to of owners) await send(env, { to, ...ownerReportEmail(env.SITE_URL, { venue: listed, message, photo: true }) }).catch(() => {});
    await decide("forwarded", {});
    await send(env, { to: s.email, ...submissionClosedEmail(env.SITE_URL, { name: s.name, spot, reason: null, forwarded: true }) }).catch(() => {});
    return json({ ok: true });
  }

  if (b.decision !== "publish") throw new HttpError(400, "decision is publish, decline or forward");
  const hh = cleanHours(b.hh);
  // The admin can point a "new spot" at a venue we already list.
  const targetId = typeof b.venue_id === "string" && b.venue_id ? b.venue_id : s.venue_id;
  let published: Published;
  let live: Spot & { id: string };
  if (targetId) {
    const v = await venue(env, targetId);
    if (await env.DB.prepare("SELECT 1 FROM owners WHERE venue_id = ?").bind(v.id).first())
      throw new HttpError(409, "The venue keeps its own listing. Pass it to them instead");
    published = { venue_id: v.id, hh };
    live = v;
  } else {
    const place = (b.place ?? {}) as Record<string, unknown>;
    const placeName = text(place.name ?? s.place_name, "Name", 100);
    const address = text(place.address ?? s.place_address, "Address", 160);
    const website = text(place.website ?? s.place_website, "Website", 300) || null;
    if (!placeName || !address) throw new HttpError(400, "A new spot needs a name and address");
    if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) throw new HttpError(400, "Website must start with https:// or http://");
    // The id the pipeline will give it, so the "it's live" link is right.
    const taken = new Set([
      ...dir.keys(),
      ...(
        await env.DB.prepare("SELECT published FROM submissions WHERE status = 'published' AND published LIKE '%\"new\":true%'").all<{ published: string }>()
      ).results.map((r) => (JSON.parse(r.published) as Published).venue_id),
    ]);
    published = { venue_id: slugFor(placeName, taken), new: true, name: placeName, address, website, hh };
    live = { id: published.venue_id, name: placeName, address };
  }
  // A venue we list changes at once, so the guest hears now; a new spot
  // waits for the site's next data publish (see newSpotsLive).
  await decide("published", { published, notified: !published.new });
  if (!published.new) {
    await caches.default.delete(PUBLIC_EDITS);
    await send(env, {
      to: s.email,
      ...submissionLiveEmail(env.SITE_URL, { name: s.name, spot: live, hours: fmtHours(hh), deals: hh.deals.length, isNew: false }),
    }).catch(() => {});
  }
  return json({ ok: true, venue_id: published.venue_id, new: !!published.new });
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

// Sends the signed-in admin one of every email, with sample data, to check
// how they look in a real inbox. At most once every 10 minutes.
on("POST", "/admin/email-samples", async (req, env) => {
  const admin = await requireAdmin(req, env);
  const key = `samples:${admin.email}:${now().slice(0, 15)}`;
  if ((await env.DB.prepare("INSERT OR IGNORE INTO event_seen (hash, day) VALUES (?, ?)").bind(key, today()).run()).meta.changes === 0)
    throw new HttpError(429, "Samples went out a few minutes ago, check your inbox");
  const withPhoto = [...(await venueDirectory(env)).values()].find((v) => v.photo?.startsWith("photos/"));
  const all = Object.entries(samples(env.SITE_URL, env.API_URL, withPhoto));
  let sent = 0;
  for (const [i, [, m]] of all.entries())
    await send(env, { to: admin.email, ...m, subject: `[Sample ${i + 1}/${all.length}] ${m.subject}` }).then(() => sent++, (e) => console.error("sample mail", e));
  if (!sent) {
    await env.DB.prepare("DELETE FROM event_seen WHERE hash = ?").bind(key).run();
    throw new HttpError(502, "Couldn't send the samples, try again in a minute");
  }
  return json({ sent, of: all.length });
});

// ---------- Every-two-months "still right?" ----------

// One-tap link from the check-in email: no sign in, signed per venue + month.
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
    const confirmHref = edited ? `${env.API_URL}/confirm?v=${encodeURIComponent(r.venue_id)}&m=${month}&s=${s}` : null;
    await send(env, { to: r.email, ...monthlyCheckEmail(env.SITE_URL, { venue: v, month, confirmHref }) }).catch((e) => console.error("monthly mail", r.venue_id, e));
  }
}

// A new spot from a guest's photo shows up once the pipeline has added it
// to the site's data; then the guest gets their "it's live" email. Gives up
// after 3 days (the spot matched a venue under another name, say).
async function newSpotsLive(env: Env) {
  const rows = (
    await env.DB.prepare(
      "SELECT id, name, email, published FROM submissions WHERE status = 'published' AND notified_at IS NULL AND decided_at > ?",
    )
      .bind(new Date(Date.now() - 3 * 86_400_000).toISOString())
      .all<{ id: string; name: string | null; email: string; published: string }>()
  ).results;
  if (!rows.length) return;
  const dir = await venueDirectory(env);
  for (const r of rows) {
    const p = JSON.parse(r.published) as Published;
    const v: VenueInfo | undefined = dir.get(p.venue_id);
    if (!v) continue;
    await send(env, { to: r.email, ...submissionLiveEmail(env.SITE_URL, { name: r.name, spot: v, hours: fmtHours(p.hh), deals: p.hh.deals.length, isNew: true }) })
      .then(() => env.DB.prepare("UPDATE submissions SET notified_at = ? WHERE id = ?").bind(now(), r.id).run())
      .catch((e) => console.error("live mail", r.id, e));
  }
}

async function notifyAdmins(env: Env, mail: Email) {
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

  async scheduled(ev, env) {
    await newSpotsLive(env);
    if (ev.cron !== "7 12 * * *") return;
    await env.DB.prepare("DELETE FROM event_seen WHERE day < ?").bind(today()).run();
    const d = new Date();
    // 1st of Jan, Mar, May, Jul, Sep and Nov: once every 2 months.
    if (d.getUTCDate() === 1 && d.getUTCMonth() % 2 === 0) await monthlyCheck(env);
  },
} satisfies ExportedHandler<Env>;

