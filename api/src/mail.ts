import type { Env } from "./env";
import { esc, HttpError } from "./http";

export interface Mail {
  to: string;
  subject: string;
  // Plain paragraphs; a { link } entry becomes a button.
  lines: (string | { label: string; href: string })[];
}

// Sent through Resend's HTTP API. Without a key (local dev) the mail is
// logged instead, so every flow still runs end to end.
export async function send(env: Env, mail: Mail) {
  const text = mail.lines.map((l) => (typeof l === "string" ? l : `${l.label}: ${l.href}`)).join("\n\n");
  if (!env.RESEND_API_KEY) {
    if (env.DEV_LINKS === "1") {
      console.log(`[mail] to ${mail.to}: ${mail.subject}\n${text}`);
      return;
    }
    throw new HttpError(503, "Email isn't set up yet");
  }
  const html = mail.lines
    .map((l) =>
      typeof l === "string"
        ? `<p style="margin:0 0 16px">${esc(l)}</p>`
        : `<p style="margin:24px 0"><a href="${esc(l.href)}" style="background:#d63d00;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${esc(l.label)}</a></p>`,
    )
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      text,
      html: `<div style="font:16px/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#1b1b1b;max-width:520px">${html}<p style="color:#6a645a;font-size:13px">A Little Hang · alittlehang.com</p></div>`,
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
