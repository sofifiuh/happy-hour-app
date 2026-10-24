import type { Env } from "./env";
import { HttpError, newId, now, randomToken, sha256 } from "./http";
import { signInEmail } from "./email";
import { admins, send } from "./mail";

const LINK_MINUTES = 30;
const SESSION_DAYS = 60;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface User {
  id: string;
  email: string;
  admin: boolean;
}

export function cleanEmail(v: unknown) {
  const e = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (!EMAIL.test(e) || e.length > 200) throw new HttpError(400, "Enter a valid email");
  return e;
}

// Emails a one-time sign-in link to the site, which trades it for a session.
// `next` is a site path to return to after signing in ("/venue/claim/x").
export async function startLogin(env: Env, email: string, next: string) {
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM login_tokens WHERE email = ? AND expires_at > ?",
  )
    .bind(email, new Date(Date.now() + (LINK_MINUTES - 10) * 60_000).toISOString())
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= 3) throw new HttpError(429, "We just sent a few links. Check your inbox, or try again in 10 minutes");

  const token = randomToken();
  await env.DB.prepare("INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), email, new Date(Date.now() + LINK_MINUTES * 60_000).toISOString())
    .run();
  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/venue";
  const link = `${env.SITE_URL}/venue/login?token=${token}&next=${encodeURIComponent(path)}`;
  await send(env, { to: email, ...signInEmail(env.SITE_URL, link, LINK_MINUTES) });
  return env.DEV_LINKS === "1" ? link : null;
}

export async function finishLogin(env: Env, token: string) {
  const hash = await sha256(token);
  const row = await env.DB.prepare("SELECT email, expires_at, used_at FROM login_tokens WHERE token_hash = ?")
    .bind(hash)
    .first<{ email: string; expires_at: string; used_at: string | null }>();
  if (!row || row.used_at || row.expires_at < now()) throw new HttpError(400, "That sign-in link has expired. Ask for a new one");
  await env.DB.prepare("UPDATE login_tokens SET used_at = ? WHERE token_hash = ?").bind(now(), hash).run();

  let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(row.email).first<{ id: string }>();
  if (!user) {
    user = { id: newId() };
    await env.DB.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)").bind(user.id, row.email, now()).run();
  }
  const session = randomToken();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(session), user.id, now(), new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString())
    .run();
  return { session, email: row.email };
}

// Sessions travel as a bearer token (the site keeps it in localStorage), so
// the API works from any domain without third-party cookies.
export async function currentUser(req: Request, env: Env): Promise<User | null> {
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
  if (!m) return null;
  const row = await env.DB.prepare(
    "SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
  )
    .bind(await sha256(m[1]), now())
    .first<{ id: string; email: string }>();
  return row ? { ...row, admin: admins(env).includes(row.email) } : null;
}

export async function requireUser(req: Request, env: Env) {
  const u = await currentUser(req, env);
  if (!u) throw new HttpError(401, "Sign in first");
  return u;
}

export async function logout(req: Request, env: Env) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
  if (m) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(m[1])).run();
}

export async function ownsVenue(env: Env, user: User, venueId: string) {
  if (user.admin) return true;
  const row = await env.DB.prepare("SELECT 1 FROM owners WHERE venue_id = ? AND user_id = ?").bind(venueId, user.id).first();
  return !!row;
}

export async function requireOwner(env: Env, user: User, venueId: string) {
  if (!(await ownsVenue(env, user, venueId))) throw new HttpError(403, "You don't manage this venue");
}

// HMAC for links that act without signing in (the monthly confirm email).
export async function sign(env: Env, text: string) {
  if (!env.SIGNING_KEY) throw new HttpError(503, "Signing key isn't set");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SIGNING_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
