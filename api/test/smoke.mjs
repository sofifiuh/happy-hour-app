// End-to-end run of the venue API against `wrangler dev` (see README):
// sign in, claim by matching domain, claim by review, admin approve, edit,
// photo, counts, stats, report, public edits.
const API = process.env.API ?? "http://127.0.0.1:8787";
let failures = 0;
const ok = (cond, what) => {
  console.log(`${cond ? "ok  " : "FAIL"} ${what}`);
  if (!cond) failures++;
};

async function call(method, path, { token, body, raw, type } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(token && { authorization: `Bearer ${token}` }),
      ...(body && { "content-type": "application/json" }),
      ...(raw && { "content-type": type }),
      origin: "http://localhost:5173",
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
    redirect: "manual",
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, data, headers: res.headers };
}

async function signIn(email) {
  const start = await call("POST", "/auth/start", { body: { email, next: "/venue" } });
  const token = new URL(start.data.devLink).searchParams.get("token");
  const done = await call("POST", "/auth/verify", { body: { token } });
  const again = await call("POST", "/auth/verify", { body: { token } });
  return { session: done.data.session, reused: again.status };
}

const owner = await signIn("manager@ancoradining.com");
ok(!!owner.session, "sign in with an email link");
ok(owner.reused === 400, "a sign-in link works only once");

const c1 = await call("POST", "/claims", { token: owner.session, body: { venue_id: "ancora", name: "Sam", role: "GM", phone: "604" } });
ok(c1.data?.claim?.status === "approved" && c1.data.claim.method === "domain", "email at the venue's domain is approved at once");
ok(c1.headers.get("access-control-allow-origin") === "http://localhost:5173", "CORS for the site");

const me = await call("GET", "/me", { token: owner.session });
ok(me.data?.venues?.some((v) => v.id === "ancora"), "owner sees their venue");

const other = await signIn("someone@gmail.com");
const c2 = await call("POST", "/claims", { token: other.session, body: { venue_id: "earls-test-kitchen", name: "Lee", role: "Owner" } });
ok(c2.data?.claim?.status === "pending", "other emails wait for review");
const lic = await call("PUT", `/claims/${c2.data.claim.id}/licence`, { token: other.session, raw: new Uint8Array([1, 2, 3]), type: "application/pdf" });
ok(lic.status === 200, "licence upload");
const denied = await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { closed: false } });
ok(denied.status === 403, "can't edit before approval");

const admin = await signIn("admin@example.com");
const q = await call("GET", "/admin/queue", { token: admin.session });
ok(q.data?.claims?.some((c) => c.id === c2.data.claim.id && c.licence), "claim and licence in the admin queue");
ok((await call("GET", "/admin/queue", { token: other.session })).status === 403, "queue is admin only");
const ap = await call("POST", `/admin/claims/${c2.data.claim.id}`, { token: admin.session, body: { decision: "approve" } });
ok(ap.status === 200, "admin approves");

const edit = {
  hh: { days: [1, 2, 3, 4, 5], start: "15:00", end: "18:00", extra: [{ days: [5, 6], start: "21:00", end: null, label: "Late" }], deals: [{ name: "House lager", price: "$2", category: "drink", description: "" }, { name: "Oysters", price: "$1.50", category: "food", description: "each" }] },
  description: "Waterfront patio",
  amenities: { patio: true },
};
const put = await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: edit });
ok(put.status === 200 && put.data.flags.length === 1, "edit saves; a $2 drink is flagged for a look");
const bad = await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { hh: { ...edit.hh, start: "3pm" } } });
ok(bad.status === 400, "bad times are refused");
const hot = await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { photo: "https://evil.example/x.jpg" } });
ok(hot.status === 400, "outside photos are refused");

const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
const up = await call("POST", "/venues/earls-test-kitchen/photos", { token: other.session, raw: png, type: "image/png" });
ok(up.status === 201 && up.data.url.includes("/photos/venues/earls-test-kitchen/"), "photo upload");
const img = await fetch(up.data.url);
ok(img.status === 200 && img.headers.get("content-type") === "image/png", "photo is served");
const withPhoto = await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { ...edit, photo: up.data.url, gallery: [up.data.url] } });
ok(withPhoto.status === 200, "edit with an uploaded photo");

const pub = await call("GET", "/public/edits");
ok(pub.data?.edits?.["earls-test-kitchen"]?.hh?.start === "15:00" && pub.data.claimed.includes("ancora"), "public edits and claimed list");

for (let i = 0; i < 3; i++) await call("POST", "/e", { body: { v: "earls-test-kitchen", t: "view" } });
await call("POST", "/e", { body: { v: "earls-test-kitchen", t: "directions" } });
await call("POST", "/e", { body: { v: "nope", t: "view" } });
const st = await call("GET", "/venues/earls-test-kitchen/stats", { token: other.session });
ok(st.data?.week?.view === 1 && st.data.week.directions === 1, "counts once per person per day");
ok((await call("GET", "/venues/ancora/stats", { token: other.session })).status === 403, "stats are owner only");

const rep = await call("POST", "/reports", { body: { venue_id: "ancora", message: "Ends at 5 now", email: "guest@example.com" } });
ok(rep.status === 201, "report a wrong time");
const q2 = await call("GET", "/admin/queue", { token: admin.session });
ok(q2.data.reports.some((r) => r.venue_id === "ancora") && q2.data.flagged.some((f) => f.venue_id === "earls-test-kitchen"), "report and flagged edit in the queue");

ok((await call("POST", "/venues/earls-test-kitchen/confirm", { token: other.session })).status === 200, "owner confirms it's still right");
const bye = await call("POST", "/auth/logout", { token: other.session });
ok(bye.status === 200 && (await call("GET", "/me", { token: other.session })).status === 401, "sign out ends the session");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
