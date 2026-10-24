// Every email the Worker sends, built on one branded layout. Each template
// returns the subject plus an HTML and a plain-text body.
//
// The HTML is written for email clients, not browsers: tables for layout,
// inline styles, no SVG (Gmail drops it), and a dark mode that Apple Mail,
// iOS Mail and Outlook.com pick up from the classes in <style>. Clients
// that ignore <style> still get the light version. The header band is
// always ink with an opaque logo image, so it survives Gmail's forced
// dark mode too. Colours are the brand tokens in web/src/index.css.
//
// This file has no runtime imports, so `node scripts/email-preview.ts`
// can render every template without the Worker.

export interface Email {
  subject: string;
  html: string;
  text: string;
}

interface Link {
  label: string;
  href: string;
}

interface Layout {
  site: string;
  preheader: string;
  kicker: string; // the small label in the header band
  title: string;
  paragraphs: string[];
  quote?: string; // something a person wrote, shown as a panel
  details?: [string, string][]; // label / value rows
  perks?: [string, string][]; // title / line, with pop-colour markers
  cta?: Link;
  secondary?: Link;
  showLink?: boolean; // print the button's URL under it
  note?: string; // small print under the buttons
  reason: string; // footer: why this email came
}

export const SUPPORT_EMAIL = "jason@setsail.ca";

const C = {
  page: "#f5f1e7",
  card: "#fffdf8",
  panel: "#f5f1e7",
  line: "#e3dccd",
  text: "#1b1b1b",
  dim: "#625c53",
  link: "#bd3600",
  ink: "#1b1b1b",
  cream: "#f3efe4",
  creamDim: "#a7a196",
  orange: "#ff4900",
  pops: ["#ff4900", "#ffb530", "#ecfe54", "#f7b2b7", "#bfdbe6"],
};
const DARK = { page: "#121212", card: "#242322", panel: "#2f2d2b", line: "#3a3835", text: "#f3efe4", dim: "#a7a196", link: "#ff7a45" };

const SANS = "'Funnel Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const DISPLAY = "'Funnel Display','Funnel Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function button(link: Link, primary: boolean) {
  const style = primary
    ? `background:${C.orange};color:${C.ink};border:2px solid ${C.orange}`
    : `background:transparent;color:${C.text};border:2px solid ${C.line}`;
  // The <i> spacers give Outlook for Windows the padding it ignores on <a>.
  return `<a href="${esc(link.href)}" class="${primary ? "btn" : "btn2 t-main bd"}" style="${style};display:inline-block;border-radius:999px;padding:14px 26px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:600;text-decoration:none;mso-padding-alt:0;text-align:center"><!--[if mso]><i style="mso-font-width:130%;mso-text-raise:28px" hidden>&#8202;&#8202;&#8202;</i><![endif]--><span style="mso-text-raise:14px">${esc(link.label)}</span><!--[if mso]><i style="mso-font-width:130%" hidden>&#8202;&#8202;&#8202;&#8203;</i><![endif]--></a>`;
}

function html(l: Layout) {
  const p = (s: string, extra = "") =>
    `<p class="t-main" style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:26px;color:${C.text}${extra}">${esc(s)}</p>`;
  const pops = C.pops.map((c) => `<td width="20%" height="4" style="background:${c};font-size:0;line-height:0">&nbsp;</td>`).join("");

  const quote = l.quote
    ? `<tr><td style="padding:4px 0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="4" style="background:${C.orange};border-radius:4px;font-size:0;line-height:0">&nbsp;</td>
        <td class="bg-panel t-main" style="background:${C.panel};border-radius:0 12px 12px 0;padding:16px 18px;font-family:${SANS};font-size:16px;line-height:24px;color:${C.text}">${esc(l.quote).replace(/\n/g, "<br>")}</td>
      </tr></table></td></tr>`
    : "";

  const details = l.details?.length
    ? `<tr><td style="padding:4px 0 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-panel" style="background:${C.panel};border-radius:14px">
        ${l.details
          .map(
            ([k, v], i) => `<tr>
          <td class="t-dim${i ? " bd" : ""}" valign="top" style="padding:12px 0 12px 18px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:13px;line-height:20px;color:${C.dim};white-space:nowrap;width:30%">${esc(k)}</td>
          <td class="t-main${i ? " bd" : ""}" valign="top" style="padding:12px 18px 12px 12px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:15px;line-height:20px;color:${C.text};font-weight:500;word-break:break-word">${esc(v)}</td>
        </tr>`,
          )
          .join("")}
      </table></td></tr>`
    : "";

  const perks = l.perks?.length
    ? `<tr><td style="padding:4px 0 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${l.perks
          .map(
            ([t, s], i) => `<tr>
          <td width="28" valign="top" style="padding:5px 0 14px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="12" height="12" style="background:${[C.pops[0], C.pops[1], C.pops[3]][i % 3]};border-radius:12px;font-size:0;line-height:0">&nbsp;</td></tr></table></td>
          <td valign="top" style="padding:0 0 14px;font-family:${SANS};font-size:15px;line-height:22px">
            <span class="t-main" style="color:${C.text};font-weight:600">${esc(t)}</span><br>
            <span class="t-dim" style="color:${C.dim}">${esc(s)}</span>
          </td>
        </tr>`,
          )
          .join("")}
      </table></td></tr>`
    : "";

  const buttons =
    l.cta || l.secondary
      ? `<tr><td style="padding:8px 0 8px">
        ${l.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="stack" style="display:inline-table;margin:0 8px 8px 0"><tr><td>${button(l.cta, true)}</td></tr></table>` : ""}
        ${l.secondary ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="stack" style="display:inline-table;margin:0 0 8px 0"><tr><td>${button(l.secondary, false)}</td></tr></table>` : ""}
      </td></tr>`
      : "";

  const showLink =
    l.showLink && l.cta
      ? `<tr><td class="t-dim" style="padding:8px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.dim}">Button not working? Paste this into your browser:<br><a href="${esc(l.cta.href)}" class="t-link" style="color:${C.link};word-break:break-all;text-decoration:underline">${esc(l.cta.href)}</a></td></tr>`
      : "";

  const note = l.note
    ? `<tr><td style="padding:20px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="bd" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
       <tr><td class="t-dim" style="padding:16px 0 0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.dim}">${esc(l.note)}</td></tr>`
    : "";

  const host = l.site.replace(/^https?:\/\//, "");

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(l.title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>td,th,p,a,span,h1{font-family:'Segoe UI',Arial,sans-serif !important}</style><![endif]-->
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@700;800&family=Funnel+Sans:wght@400;500;600&display=swap" rel="stylesheet"><!--<![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important}
.btn:hover{background:#ff6a2e !important;border-color:#ff6a2e !important}
@media (max-width:620px){
  .wrap{padding:16px 10px 32px !important}
  .pad{padding-left:24px !important;padding-right:24px !important}
  .h1{font-size:28px !important;line-height:34px !important}
  .stack{display:table !important;width:100% !important;margin:0 0 10px 0 !important}
  .stack a{display:block !important}
}
@media (prefers-color-scheme:dark){
  .bg-page{background:${DARK.page} !important}
  .bg-card{background:${DARK.card} !important}
  .bg-panel{background:${DARK.panel} !important}
  .t-main{color:${DARK.text} !important}
  .t-dim{color:${DARK.dim} !important}
  .t-link{color:${DARK.link} !important}
  .bd{border-color:${DARK.line} !important}
  .card{border-color:${DARK.line} !important}
}
[data-ogsc] .t-main{color:${DARK.text} !important}
[data-ogsc] .t-dim{color:${DARK.dim} !important}
[data-ogsc] .t-link{color:${DARK.link} !important}
[data-ogsb] .bg-page{background:${DARK.page} !important}
[data-ogsb] .bg-card{background:${DARK.card} !important}
[data-ogsb] .bg-panel{background:${DARK.panel} !important}
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background:${C.page};word-spacing:normal">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0">${esc(l.preheader)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>
<div role="article" aria-roledescription="email" aria-label="${esc(l.title)}" lang="en">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background:${C.page}">
<tr><td align="center" class="wrap" style="padding:40px 16px 48px">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto">

<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card bg-card" style="background:${C.card};border:1px solid ${C.line};border-radius:24px;border-collapse:separate;mso-border-alt:none">
    <tr><td class="pad hero" style="background:${C.ink};border-radius:23px 23px 0 0;padding:28px 40px 36px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="top"><a href="${esc(l.site)}" style="text-decoration:none"><img src="${esc(l.site)}/email/logo.png" width="56" height="54" alt="A Little Hang" style="display:block;width:56px;height:54px;color:${C.cream};font-family:${DISPLAY};font-size:16px;font-weight:700"></a></td>
        <td valign="top" align="right" style="padding-top:4px;font-family:${SANS};font-size:12px;line-height:16px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:${C.cream};white-space:nowrap"><span style="color:${C.pops[2]};font-size:14px">&#9679;</span>&nbsp; ${esc(l.kicker)}</td>
      </tr></table>
      <h1 class="h1" style="margin:36px 0 0;font-family:${DISPLAY};font-size:34px;line-height:40px;font-weight:800;letter-spacing:-0.7px;color:${C.cream}">${esc(l.title).replace(/ (\S+)$/, "&nbsp;$1")}</h1>
    </td></tr>
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${pops}</tr></table></td></tr>
    <tr><td class="pad" style="padding:32px 40px 36px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td>${l.paragraphs.map((s) => p(s)).join("")}</td></tr>
        ${quote}${details}${perks}${buttons}${showLink}${note}
      </table>
    </td></tr>
  </table>
</td></tr>

<tr><td align="center" style="padding:28px 24px 0">
  <p class="t-main" style="margin:0 0 6px;font-family:${DISPLAY};font-size:15px;line-height:20px;font-weight:700;color:${C.text}">A Little Hang</p>
  <p class="t-dim" style="margin:0 0 14px;font-family:${SANS};font-size:13px;line-height:20px;color:${C.dim}">Happy hours near you, right now. Made in Vancouver.</p>
  <p class="t-dim" style="margin:0 0 14px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.dim}">${esc(l.reason)}</p>
  <p style="margin:0;font-family:${SANS};font-size:12px;line-height:18px">
    <a href="${esc(l.site)}" class="t-link" style="color:${C.link};text-decoration:none;font-weight:600">${esc(host)}</a>
    <span class="t-dim" style="color:${C.dim}">&nbsp;&middot;&nbsp;</span>
    <a href="mailto:${SUPPORT_EMAIL}" class="t-link" style="color:${C.link};text-decoration:none;font-weight:600">Get help</a>
  </p>
</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</div>
</body>
</html>`;
}

function text(l: Layout) {
  const out = [l.title, "", ...l.paragraphs.flatMap((s) => [s, ""])];
  if (l.quote) out.push(...l.quote.split("\n").map((s) => `> ${s}`), "");
  if (l.details) out.push(...l.details.map(([k, v]) => `${k}: ${v}`), "");
  if (l.perks) out.push(...l.perks.map(([t, s]) => `- ${t}: ${s}`), "");
  if (l.cta) out.push(`${l.cta.label}:`, l.cta.href, "");
  if (l.secondary) out.push(`${l.secondary.label}:`, l.secondary.href, "");
  if (l.note) out.push(l.note, "");
  out.push("--", "A Little Hang", "Happy hours near you, right now.", l.site.replace(/^https?:\/\//, ""), "", l.reason, `Help: ${SUPPORT_EMAIL}`);
  return out.join("\n");
}

const build = (subject: string, l: Layout): Email => ({ subject, html: html(l), text: text(l) });

// ---------- The emails ----------

interface Venue {
  id: string;
  name: string;
  address: string;
}

export function signInEmail(site: string, link: string, minutes: number) {
  return build("Your A Little Hang sign-in link", {
    site,
    preheader: `Tap to sign in. The link works once and expires in ${minutes} minutes.`,
    kicker: "Sign in",
    title: "Here's your sign-in link",
    paragraphs: [`Tap the button to sign in to A Little Hang. The link works once and expires in ${minutes} minutes.`],
    cta: { label: "Sign in to A Little Hang", href: link },
    showLink: true,
    note: "Didn't ask for this? You can safely ignore this email. Nobody can sign in without the link.",
    reason: "You're getting this because someone entered this address to sign in on alittlehang.com.",
  });
}

export function claimReceivedEmail(site: string, o: { name: string; role: string; venue: Venue }) {
  return build(`We got your claim for ${o.venue.name}`, {
    site,
    preheader: "We check every claim by hand and will email you as soon as it's done.",
    kicker: "Claim received",
    title: `Thanks, ${o.name}. We're on it.`,
    paragraphs: [
      `We got your claim for ${o.venue.name}. A real person checks every claim, usually by calling the venue's listed number, so nobody can take over a listing that isn't theirs.`,
      "We'll email you as soon as it's done.",
    ],
    details: [
      ["Venue", o.venue.name],
      ["Address", o.venue.address],
      ["Your role", o.role],
    ],
    cta: { label: "View your claim", href: `${site}/venue/claim/${o.venue.id}` },
    note: "Want it faster? Upload a photo of your liquor licence on the claim page and we can approve it without a call.",
    reason: `You're getting this because you asked to manage ${o.venue.name} on A Little Hang.`,
  });
}

export function claimApprovedEmail(site: string, o: { name: string; venue: Venue }) {
  return build(`You now manage ${o.venue.name} on A Little Hang`, {
    site,
    preheader: "Update your happy hour times, deals and photos any time.",
    kicker: "Claim approved",
    title: `${o.venue.name} is yours`,
    paragraphs: [`You're all set, ${o.name}. Your listing now has an official owner, and changes you make show on the site within a few minutes.`],
    perks: [
      ["Keep your times right", "Happy hour days, times and deals, straight from you."],
      ["Show it off", "Add your own photos and tags so guests know the vibe."],
      ["See what's working", "How many people view, save, call and get directions."],
    ],
    cta: { label: "Edit your listing", href: `${site}/venue/${o.venue.id}` },
    note: "Each month we'll send a quick reminder to check your times. One tap if nothing changed.",
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang.`,
  });
}

export function claimRejectedEmail(site: string, o: { name: string; venue: Venue; note: string | null }) {
  return build(`About your claim for ${o.venue.name}`, {
    site,
    preheader: "Send us one thing that shows you run it and we'll take another look.",
    kicker: "Claim update",
    title: "We couldn't confirm it yet",
    paragraphs: [`Hi ${o.name}, we weren't able to confirm that you manage ${o.venue.name}.`],
    quote: o.note ?? undefined,
    cta: { label: "Try again with your licence", href: `${site}/venue/claim/${o.venue.id}` },
    secondary: { label: "Email us", href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Claim for ${o.venue.name}`)}` },
    note: "A work email at the venue's own domain, or a photo of the liquor licence, is usually all it takes.",
    reason: `You're getting this because you asked to manage ${o.venue.name} on A Little Hang.`,
  });
}

export function adminClaimEmail(
  site: string,
  o: { auto: boolean; name: string; role: string; email: string; phone: string | null; venue: Venue & { phone: string | null; website: string | null } },
) {
  return build(`${o.auto ? "Claimed" : "Claim to review"}: ${o.venue.name}`, {
    site,
    preheader: `${o.name} (${o.role}) ${o.auto ? "claimed" : "wants to claim"} ${o.venue.name}.`,
    kicker: o.auto ? "Auto-approved" : "Needs review",
    title: o.auto ? `${o.venue.name} was claimed` : `${o.venue.name} needs a look`,
    paragraphs: [
      o.auto
        ? `${o.name} claimed ${o.venue.name}. Approved automatically: their email matches the venue's website.`
        : `${o.name} asked to claim ${o.venue.name}. Call the listed number or check their licence, then approve or reject.`,
    ],
    details: [
      ["Name", `${o.name}, ${o.role}`],
      ["Email", o.email],
      ...(o.phone ? ([["Their phone", o.phone]] as [string, string][]) : []),
      ["Venue", `${o.venue.name}, ${o.venue.address}`],
      ["Listed phone", o.venue.phone ?? "None"],
      ["Website", o.venue.website ?? "None"],
    ],
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}

export function adminReportEmail(site: string, o: { venue: Venue; message: string; email: string | null }) {
  return build(`Report: ${o.venue.name}`, {
    site,
    preheader: o.message.slice(0, 120),
    kicker: "Guest report",
    title: `Report on ${o.venue.name}`,
    paragraphs: ["Someone reported a problem with this listing:"],
    quote: o.message,
    details: [
      ["Venue", `${o.venue.name}, ${o.venue.address}`],
      ["Reply to", o.email ?? "They didn't leave an email"],
    ],
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}

export function ownerReportEmail(site: string, o: { venue: Venue; message: string }) {
  return build(`A guest flagged your listing: ${o.venue.name}`, {
    site,
    preheader: o.message.slice(0, 120),
    kicker: "Guest report",
    title: "A guest flagged your listing",
    paragraphs: [`Someone looking at ${o.venue.name} on A Little Hang thinks something's off:`],
    quote: o.message,
    cta: { label: "Update your listing", href: `${site}/venue/${o.venue.id}` },
    note: "If everything's already right, there's nothing to do. Guests trust listings that are kept fresh.",
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang.`,
  });
}

export function monthlyCheckEmail(site: string, o: { venue: Venue; month: string; confirmHref: string | null }) {
  const monthName = new Date(`${o.month}-15T12:00:00Z`).toLocaleString("en-CA", { month: "long", timeZone: "UTC" });
  const edit = `${site}/venue/${o.venue.id}`;
  return build(`Is ${o.venue.name}'s happy hour still right?`, {
    site,
    preheader: "Ten seconds, one tap. Guests trust A Little Hang because the times are right.",
    kicker: `${monthName} check-in`,
    title: `Is ${o.venue.name}'s happy hour still right?`,
    paragraphs: [
      "Guests trust A Little Hang because the times are right. Take ten seconds to check yours.",
      ...(o.confirmHref ? [] : ["You haven't added your own times yet, so guests see what we found online. Take a look and fix anything that's off."]),
    ],
    cta: o.confirmHref ? { label: "Yes, it's still right", href: o.confirmHref } : { label: "Check your listing", href: edit },
    secondary: o.confirmHref ? { label: "Something changed", href: edit } : undefined,
    note: o.confirmHref ? "Tapping “Yes” marks your times as checked this month. No sign-in needed." : undefined,
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang. We send one check-in a month.`,
  });
}

export function adminEditFlagEmail(site: string, o: { venue: Venue; flags: string[] }) {
  return build(`Edit to check: ${o.venue.name}`, {
    site,
    preheader: o.flags.join("; ").slice(0, 120),
    kicker: "Edit to check",
    title: `${o.venue.name} changed something odd`,
    paragraphs: ["The owner saved an edit that's live now but worth a look. BC has minimum drink prices, so very cheap drinks are usually a typo."],
    quote: o.flags.join("\n"),
    details: [["Venue", `${o.venue.name}, ${o.venue.address}`]],
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}
