// End-to-end run of the venue API against `wrangler dev` (see README):
// sign in, claim by matching domain, claim by review, admin approve, edit,
// photo, counts, stats, report, public edits, submit a happy hour.
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
ok((await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { website: "http://www.example.ca/" } })).status === 200, "plain http websites are kept");
ok((await call("PUT", "/venues/earls-test-kitchen/edit", { token: other.session, body: { website: "javascript:alert(1)" } })).status === 400, "non-web links are refused");

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
// ---------- Submit a happy hour ----------
async function submit(fields, photos = [png]) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  for (const p of photos) form.append("photos", new Blob([p], { type: "image/png" }), "menu.png");
  const res = await fetch(API + "/submissions", { method: "POST", body: form, headers: { origin: "http://localhost:5173" } });
  return { status: res.status, data: await res.json().catch(() => null) };
}
const s1 = await submit({ venue_id: "brewhall", email: "guest@example.com", name: "Maya", hh: JSON.stringify({ days: [1, 2, 3], start: "15:00", end: "18:00" }), note: "New menu" });
ok(s1.status === 201 && s1.data.id, "a guest sends a menu photo for a listed venue");
ok((await submit({ email: "guest@example.com" }, [])).status === 400, "a submission needs a photo");
ok((await submit({ email: "guest@example.com", place_name: "X" })).status === 400, "a new spot needs an address");
ok((await submit({ email: "bot@example.com", company: "Spam Inc" })).status === 201, "the honeypot pretends to work");
const s2 = await submit({ email: "guest2@example.com", place_name: "The Sunny Side", place_address: "2245 Commercial Dr", works_there: "1" });
ok(s2.status === 201, "a guest sends a spot we don't list");
const s3 = await submit({ venue_id: "ancora", email: "guest3@example.com" });
const q3 = await call("GET", "/admin/queue", { token: admin.session });
const sub1 = q3.data.submissions.find((x) => x.id === s1.data.id);
ok(sub1?.hh?.start === "15:00" && sub1.photos === 1 && sub1.venue_name, "submission with the guest's reading in the queue");
ok(q3.data.submissions.find((x) => x.id === s3.data.id)?.managed === true, "the queue knows ancora manages itself");
const photo = await fetch(`${API}/admin/submissions/${s1.data.id}/photos/0`, { headers: { authorization: `Bearer ${admin.session}` } });
ok(photo.status === 200 && photo.headers.get("content-type") === "image/png", "admin sees the photo");
ok((await fetch(`${API}/admin/submissions/${s1.data.id}/photos/0`)).status === 401, "photos are private");
const hhPub = { days: [1, 2, 3, 4, 5], start: "15:00", end: "18:00", extra: [], deals: [{ name: "Lager", price: "$6", category: "drink", description: "" }] };
ok((await call("POST", `/admin/submissions/${s3.data.id}`, { token: admin.session, body: { decision: "publish", hh: hhPub } })).status === 409, "a self-managed venue can't be overwritten");
ok((await call("POST", `/admin/submissions/${s3.data.id}`, { token: admin.session, body: { decision: "forward" } })).status === 200, "it's passed to the venue instead");
const p1 = await call("POST", `/admin/submissions/${s1.data.id}`, { token: admin.session, body: { decision: "publish", hh: hhPub } });
ok(p1.status === 200 && p1.data.venue_id === "brewhall" && !p1.data.new, "publish a listed venue");
const pub2 = await call("GET", "/public/edits");
ok(pub2.data.community?.brewhall?.hh?.deals?.length === 1, "it shows at once in the public feed");
const p2 = await call("POST", `/admin/submissions/${s2.data.id}`, { token: admin.session, body: { decision: "publish", hh: hhPub, place: { name: "The Sunny Side", address: "2245 Commercial Dr, Vancouver", website: "https://sunny.example" } } });
ok(p2.status === 200 && p2.data.venue_id === "the-sunny-side" && p2.data.new, "publish a new spot with the pipeline's id");
const feed = await call("GET", "/public/submissions");
ok(feed.data.submissions.length === 2 && feed.data.submissions.every((x) => !x.email) && feed.data.submissions.some((x) => x.new && x.address), "the pipeline feed has both, without emails");
ok((await call("POST", `/admin/submissions/${s2.data.id}`, { token: admin.session, body: { decision: "decline" } })).status === 404, "a decided submission is closed");

const bye = await call("POST", "/auth/logout", { token: other.session });
ok(bye.status === 200 && (await call("GET", "/me", { token: other.session })).status === 401, "sign out ends the session");

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
