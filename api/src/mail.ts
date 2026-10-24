import type { Env } from "./env";
import type { Email } from "./email";
import { HttpError } from "./http";

export interface Mail extends Email {
  to: string;
}

// Sent through Cloudflare Email Service when its binding is there, else
// Resend's HTTP API. With neither (local dev) the mail is logged instead,
// so every flow still runs end to end. The bodies come from ./email.
export async function send(env: Env, mail: Mail) {
  const { to, subject, text, html } = mail;
  if (!env.EMAIL && !env.RESEND_API_KEY) {
    if (env.DEV_LINKS === "1") {
      console.log(`[mail] to ${to}: ${subject}\n${text}`);
      return;
    }
    throw new HttpError(503, "Email isn't set up yet");
  }
  if (env.EMAIL) {
    const m = /^(.*)<(.+)>$/.exec(env.MAIL_FROM);
    try {
      await env.EMAIL.send({ from: m ? { name: m[1].trim(), email: m[2] } : env.MAIL_FROM, to, subject, text, html });
      return;
    } catch (e) {
      console.error("mail failed", e);
      throw new HttpError(502, "Couldn't send the email, try again in a minute");
    }
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    console.error("mail failed", res.status, await res.text());
    throw new HttpError(502, "Couldn't send the email, try again in a minute");
  }
}

export const admins = (env: Env) =>
  env.ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
