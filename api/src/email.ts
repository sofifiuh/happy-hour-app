// Every email the Worker sends, built on one layout that matches the claim
// page: the venue's photo with an owner's stamp, a card with one big
// button, and icon rows for what to do next. Each template returns the
// subject plus an HTML and a plain-text body.
//
// The HTML is written for email clients, not browsers: tables for layout,
// inline styles, PNG images (Gmail drops SVG; they're drawn by
// scripts/email-assets.mjs into web/public/email/), and a dark mode that
// Apple Mail, iOS Mail and Outlook.com pick up from the classes in <style>.
// Clients that ignore <style> get the light version. The hero is always
// dark, so it survives Gmail's forced dark mode too. Colours are the brand
// tokens in web/src/index.css.
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

interface Hero {
  chip: string; // the label in the pill, e.g. "Official owner"
  chipIcon: string; // a white icon in web/public/email/chip-*.png
  name: string; // the venue's name, big
  sub?: string; // its address
  photo?: string | null; // banner image, 1120x480
  tint?: number; // which warm gradient when there's no photo
  stamp?: "owner" | "claim" | "thanks";
}

interface Row {
  icon: string; // web/public/email/icon-*.png
  title: string;
  body: string;
}

interface Layout {
  site: string;
  preheader: string;
  hero: Hero;
  title: string;
  paragraphs: string[];
  quote?: string; // something a person wrote, shown as a panel
  details?: [string, string][]; // label / value rows
  cta?: Link;
  secondary?: Link;
  showLink?: boolean; // print the button's URL under it
  note?: string; // small print at the bottom of the card
  rowsLabel?: string;
  rows?: Row[];
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
  tint: "#ffe3d6", // orange at ~15% on the card, behind icons
  ink: "#1b1b1b",
  cream: "#f3efe4",
  orange: "#ff4900",
};
const DARK = { page: "#1b1b1b", card: "#242322", panel: "#2f2d2b", line: "#3a3835", text: "#f3efe4", dim: "#a7a196", link: "#ff7a45", tint: "#3d2519" };

// The venue page's warm fallbacks for spots without a photo, darkened at the
// bottom so the name stays readable. [top, bottom]
const TINTS: [string, string][] = [
  ["#ff4900", "#751927"],
  ["#ffb530", "#8a2a0b"],
  ["#f7b2b7", "#6b3d3a"],
  ["#ff6237", "#2f2d2b"],
];

const SANS = "'Funnel Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const DISPLAY = "'Funnel Display','Funnel Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Keep the last two words together so a headline never ends on one word.
const noWidow = (s: string) => esc(s).replace(/ (\S+)$/, "&nbsp;$1");

function button(link: Link, primary: boolean) {
  const style = primary
    ? `background:${C.orange};color:${C.ink};border:2px solid ${C.orange}`
    : `background:transparent;color:${C.text};border:2px solid #b9ae9a`;
  const label = primary ? `${esc(link.label)}&nbsp;&nbsp;&rarr;` : esc(link.label);
  // The <i> spacers give Outlook for Windows the padding it ignores on <a>.
  return `<a href="${esc(link.href)}" class="${primary ? "btn" : "btn2 t-main"}" style="${style};display:block;border-radius:999px;padding:16px 24px;font-family:${SANS};font-size:17px;line-height:22px;font-weight:600;text-decoration:none;text-align:center;mso-padding-alt:0"><!--[if mso]><i style="mso-font-width:150%;mso-text-raise:30px" hidden>&#8202;&#8202;</i><![endif]--><span style="mso-text-raise:15px">${label}</span><!--[if mso]><i style="mso-font-width:150%" hidden>&#8202;&#8202;&#8203;</i><![endif]--></a>`;
}

function hero(l: Layout) {
  const h = l.hero;
  const [top, bottom] = TINTS[(h.tint ?? 0) % TINTS.length];
  const img = (file: string, w: number, alt = "") =>
    `<img src="${esc(l.site)}/email/${file}" width="${w}" height="${w}" alt="${alt}" style="display:block;width:${w}px;height:${w}px;border:0">`;
  // With a photo, the text sits on it like the claim page: the banner has
  // the dark fade baked in, and Outlook for Windows gets it through VML.
  const bg = h.photo
    ? `background-color:${C.ink};background-image:url('${esc(h.photo)}');background-size:cover;background-position:center`
    : `background-color:${bottom};background-image:linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.6)),linear-gradient(160deg,${top} 0%,${bottom} 100%)`;
  const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:#3a3330;background:rgba(0,0,0,0.45);border-radius:999px;padding:7px 14px 7px 11px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td valign="middle" style="padding-right:7px">${img(`chip-${h.chipIcon}.png`, 14)}</td>
                <td valign="middle" style="font-family:${SANS};font-size:12px;line-height:16px;font-weight:600;color:#ffffff;white-space:nowrap">${esc(h.chip)}</td>
              </tr></table>
            </td>
          </tr></table>
        </td>
        ${h.stamp ? `<td valign="top" align="right" width="92" style="width:92px">${img(`stamp-${h.stamp}.png`, 92, h.stamp === "owner" ? "Official owner" : h.stamp === "thanks" ? "Thank you" : "")}</td>` : ""}
      </tr></table>
      <h1 class="h1" style="margin:${h.photo ? 96 : h.stamp ? 24 : 72}px 0 0;font-family:${DISPLAY};font-size:36px;line-height:38px;font-weight:800;letter-spacing:-0.8px;color:#ffffff">${noWidow(h.name)}</h1>
      ${h.sub ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:15px;line-height:20px;color:#e9e4da"><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(h.sub)}" style="color:#e9e4da;text-decoration:none">${esc(h.sub)}</a></p>` : ""}`;
  return `<tr><td style="padding:0 0 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
    <tr><td class="pad hero" bgcolor="${h.photo ? C.ink : bottom}" ${h.photo ? `background="${esc(h.photo)}" ` : ""}style="${bg};border-radius:28px;padding:20px 26px 26px">
      ${
        h.photo
          ? `<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:560px;height:320px"><v:fill type="frame" src="${esc(h.photo)}" color="${C.ink}"/><v:textbox inset="20px,20px,26px,26px" style="mso-fit-shape-to-text:true"><![endif]--><div>${inner}</div><!--[if gte mso 9]></v:textbox></v:rect><![endif]-->`
          : inner
      }
    </td></tr>
  </table>
</td></tr>`;
}

function html(l: Layout) {
  const p = (s: string) =>
    `<p class="t-dim" style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:25px;color:${C.dim}">${esc(s)}</p>`;

  const quote = l.quote
    ? `<tr><td style="padding:6px 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="4" style="background:${C.orange};border-radius:4px;font-size:0;line-height:0">&nbsp;</td>
        <td class="bg-panel t-main" align="left" style="background:${C.panel};border-radius:0 14px 14px 0;padding:16px 18px;font-family:${SANS};font-size:16px;line-height:24px;color:${C.text}">${esc(l.quote).replace(/\n/g, "<br>")}</td>
      </tr></table></td></tr>`
    : "";

  const details = l.details?.length
    ? `<tr><td style="padding:6px 0 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-panel" style="background:${C.panel};border-radius:16px;border-collapse:separate">
        ${l.details
          .map(
            ([k, v], i) => `<tr>
          <td class="t-dim${i ? " bd" : ""}" align="left" valign="top" style="padding:12px 0 12px 18px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:13px;line-height:20px;color:${C.dim};white-space:nowrap;width:30%">${esc(k)}</td>
          <td class="t-main${i ? " bd" : ""}" align="left" valign="top" style="padding:12px 18px 12px 12px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${SANS};font-size:15px;line-height:20px;color:${C.text};font-weight:500;word-break:break-word">${detailValue(v)}</td>
        </tr>`,
          )
          .join("")}
      </table></td></tr>`
    : "";

  const buttons = [l.cta && button(l.cta, true), l.secondary && button(l.secondary, false)]
    .filter(Boolean)
    .map((b) => `<tr><td style="padding:6px 0 4px">${b}</td></tr>`)
    .join("");

  const showLink =
    l.showLink && l.cta
      ? `<tr><td class="t-dim" style="padding:14px 0 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.dim}">Button not working? Paste this into your browser:<br><a href="${esc(l.cta.href)}" class="t-link" style="color:${C.link};word-break:break-all;text-decoration:underline">${esc(l.cta.href)}</a></td></tr>`
      : "";

  const note = l.note
    ? `<tr><td style="padding:22px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="bd" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
       <tr><td class="t-dim" style="padding:16px 0 0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.dim}">${esc(l.note)}</td></tr>`
    : "";

  const rows = l.rows?.length
    ? `<tr><td style="padding:12px 0 0">
        ${l.rowsLabel ? `<p class="t-dim" style="margin:0 0 10px;padding:0 4px;font-family:${SANS};font-size:13px;line-height:18px;font-weight:600;color:${C.dim}">${esc(l.rowsLabel)}</p>` : ""}
        ${l.rows
          .map(
            (r) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-card card" style="background:${C.card};border:1px solid ${C.line};border-radius:20px;border-collapse:separate;margin:0 0 10px"><tr>
          <td width="44" valign="middle" style="padding:16px 0 16px 16px;width:44px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td class="bg-tint" width="44" height="44" align="center" valign="middle" style="background:${C.tint};border-radius:44px;width:44px;height:44px"><img src="${esc(l.site)}/email/icon-${r.icon}.png" width="22" height="22" alt="" style="display:block;width:22px;height:22px;border:0;margin:0 auto"></td></tr></table>
          </td>
          <td valign="middle" style="padding:16px 18px 16px 14px;font-family:${SANS};font-size:15px;line-height:21px">
            <span class="t-main" style="color:${C.text};font-weight:600">${esc(r.title)}</span><br>
            <span class="t-dim" style="color:${C.dim}">${esc(r.body)}</span>
          </td>
        </tr></table>`,
          )
          .join("")}
      </td></tr>`
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
a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}
u + #body a,#MessageViewBody a,.x_body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}
.btn:hover{background:#ff6a2e !important;border-color:#ff6a2e !important}
@media (max-width:620px){
  .wrap{padding:16px 12px 32px !important}
  .pad{padding-left:22px !important;padding-right:22px !important}
  .h1{font-size:30px !important;line-height:32px !important}
  .hero{padding:16px 18px 22px !important}
  .h2{font-size:24px !important;line-height:29px !important}
}
@media (prefers-color-scheme:dark){
  .bg-page{background:${DARK.page} !important}
  .bg-card{background:${DARK.card} !important}
  .bg-panel{background:${DARK.panel} !important}
  .bg-tint{background:${DARK.tint} !important}
  .t-main{color:${DARK.text} !important}
  .t-dim{color:${DARK.dim} !important}
  .t-link{color:${DARK.link} !important}
  .bd{border-color:${DARK.line} !important}
  .card{border-color:${DARK.card} !important}
  .btn2{border-color:#6a645a !important}
}
[data-ogsc] .t-main{color:${DARK.text} !important}
[data-ogsc] .t-dim{color:${DARK.dim} !important}
[data-ogsc] .t-link{color:${DARK.link} !important}
[data-ogsb] .bg-page{background:${DARK.page} !important}
[data-ogsb] .bg-card{background:${DARK.card} !important}
[data-ogsb] .bg-panel{background:${DARK.panel} !important}
[data-ogsb] .bg-tint{background:${DARK.tint} !important}
</style>
</head>
<body id="body" class="bg-page x_body" style="margin:0;padding:0;background:${C.page};word-spacing:normal">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};opacity:0">${esc(l.preheader)}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
<div role="article" aria-roledescription="email" aria-label="${esc(l.title)}" lang="en">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background:${C.page}">
<tr><td align="center" class="wrap" style="padding:32px 16px 48px">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto">

<tr><td style="padding:0 4px 16px"><a href="${esc(l.site)}" style="text-decoration:none"><img src="${esc(l.site)}/email/logo.png" width="44" height="42" alt="A Little Hang" style="display:block;width:44px;height:42px;border-radius:10px;color:${C.text};font-family:${DISPLAY};font-size:11px;line-height:13px;font-weight:700"></a></td></tr>

${hero(l)}

<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card bg-card" style="background:${C.card};border:1px solid ${C.line};border-radius:24px;border-collapse:separate">
    <tr><td class="pad" align="center" style="padding:32px 32px 30px;text-align:center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="padding:0 0 12px"><h2 class="h2 t-main" style="margin:0;font-family:${DISPLAY};font-size:27px;line-height:32px;font-weight:800;letter-spacing:-0.5px;color:${C.text}">${noWidow(l.title)}</h2></td></tr>
        <tr><td align="center">${l.paragraphs.map(p).join("")}</td></tr>
        ${quote}${details}${buttons}${showLink}${note}
      </table>
    </td></tr>
  </table>
</td></tr>

${rows}

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
  if (l.cta) out.push(`${l.cta.label}:`, l.cta.href, "");
  if (l.secondary) out.push(`${l.secondary.label}:`, l.secondary.href, "");
  if (l.note) out.push(l.note, "");
  if (l.rows) out.push(...(l.rowsLabel ? [l.rowsLabel] : []), ...l.rows.map((r) => `- ${r.title}: ${r.body}`), "");
  out.push("--", "A Little Hang", "Happy hours near you, right now.", l.site.replace(/^https?:\/\//, ""), "", l.reason, `Help: ${SUPPORT_EMAIL}`);
  return out.join("\n");
}

const build = (subject: string, l: Layout): Email => ({ subject, html: html(l), text: text(l) });

// ---------- The emails ----------

export interface Venue {
  id: string;
  name: string;
  address: string;
  // From the site's venues.json: "photos/<id>.webp" when the site has its
  // own copy, which also means a JPEG banner at photos/email/<id>.jpg.
  photo?: string | null;
}

// Emails and phone numbers in details are our own links, so mail apps
// don't auto-link them in their own blue.
function detailValue(v: string): string {
  const link = (href: string) => `<a href="${esc(href)}" class="t-link" style="color:${C.link};text-decoration:none">${esc(v)}</a>`;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return link(`mailto:${v}`);
  if (/^\+?[\d\s().-]{7,}$/.test(v)) return link(`tel:${v.replace(/[^\d+]/g, "")}`);
  return esc(v);
}

// The venue's own photo when the site has one, else a warm gradient.
function venueHero(site: string, v: Venue, h: Omit<Hero, "name" | "sub" | "photo" | "tint">): Hero {
  return {
    ...h,
    name: v.name,
    sub: v.address,
    photo: v.photo?.startsWith("photos/") ? `${site}/photos/email/${encodeURIComponent(v.id)}.jpg` : null,
    tint: [...v.id].reduce((a, c) => a + c.charCodeAt(0), 0),
  };
}

const WINS: Row[] = [
  { icon: "clock", title: "Check your happy hour times", body: "Guests plan around them, so make them exact." },
  { icon: "sparkles", title: "Add this week's deals", body: "Prices and specials are what people tap for." },
  { icon: "image-plus", title: "Upload your best photo", body: "Your own shot leads your listing." },
];

export function signInEmail(site: string, link: string, minutes: number) {
  return build("Your A Little Hang sign-in link", {
    site,
    preheader: `Tap to sign in. The link works once and expires in ${minutes} minutes.`,
    hero: { chip: "Sign in", chipIcon: "key-round", name: "Your sign-in link is here", sub: `Works once, for ${minutes} minutes`, tint: 0 },
    title: "Tap to sign in",
    paragraphs: ["One tap and you're in. No password to remember."],
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
    hero: venueHero(site, o.venue, { chip: "Claim received", chipIcon: "store", stamp: "claim" }),
    title: `Thanks, ${o.name}. We're on it.`,
    paragraphs: [
      "A real person checks every claim, so nobody can take over a listing that isn't theirs. We'll email you as soon as it's done.",
    ],
    cta: { label: "View your claim", href: `${site}/venue/claim/${o.venue.id}` },
    note: `Want it faster? Email a photo of your liquor licence to ${SUPPORT_EMAIL} and we can approve it without a call.`,
    rowsLabel: "What happens next",
    rows: [
      { icon: "phone", title: "We call the venue", body: `Usually the listed number, to confirm you're the ${o.role.toLowerCase()}.` },
      { icon: "badge-check", title: "You get the keys", body: "We email you the moment it's approved." },
      { icon: "pencil-line", title: "Make it yours", body: "Fix times, deals and photos yourself, any time." },
    ],
    reason: `You're getting this because you asked to manage ${o.venue.name} on A Little Hang.`,
  });
}

export function claimApprovedEmail(site: string, o: { name: string; venue: Venue }) {
  return build(`You now manage ${o.venue.name} on A Little Hang`, {
    site,
    preheader: "Update your happy hour times, deals and photos any time.",
    hero: venueHero(site, o.venue, { chip: "Official owner", chipIcon: "store", stamp: "owner" }),
    title: `You run ${o.venue.name} on A Little Hang`,
    paragraphs: [
      `You're all set, ${o.name}. Your listing now carries an Updated by the venue badge, and changes show on the site within a few minutes.`,
    ],
    cta: { label: "Make it yours", href: `${site}/venue/${o.venue.id}` },
    note: "Every couple of months we'll send a quick reminder to check your times. One tap if nothing changed.",
    rowsLabel: "Three quick wins",
    rows: WINS,
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang.`,
  });
}

export function claimRejectedEmail(site: string, o: { name: string; venue: Venue; note: string | null }) {
  return build(`About your claim for ${o.venue.name}`, {
    site,
    preheader: "Send us one thing that shows you run it and we'll take another look.",
    hero: venueHero(site, o.venue, { chip: "Claim update", chipIcon: "store", stamp: "claim" }),
    title: "We couldn't confirm it yet",
    paragraphs: [`Hi ${o.name}, we weren't able to confirm that you manage ${o.venue.name}.`],
    quote: o.note ?? undefined,
    cta: { label: "Send us proof", href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Claim for ${o.venue.name}`)}` },
    note: `Email ${SUPPORT_EMAIL} a photo of the liquor licence and we'll take another look. Or claim again from a work email at the venue's own domain, which is usually approved instantly.`,
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
    hero: venueHero(site, o.venue, o.auto ? { chip: "Auto-approved", chipIcon: "badge-check", stamp: "owner" } : { chip: "Needs review", chipIcon: "store", stamp: "claim" }),
    title: o.auto ? "Claimed and approved" : "A claim to review",
    paragraphs: [
      o.auto
        ? `${o.name} claimed it. Approved automatically: their email matches the venue's website.`
        : `${o.name} asked to claim it. Call the listed number or check their licence, then approve or reject.`,
    ],
    details: [
      ["Name", `${o.name}, ${o.role}`],
      ["Email", o.email],
      ...(o.phone ? ([["Their phone", o.phone]] as [string, string][]) : []),
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
    hero: venueHero(site, o.venue, { chip: "Guest report", chipIcon: "flag" }),
    title: "A guest reported a problem",
    paragraphs: ["Here's what they said:"],
    quote: o.message,
    details: [["Reply to", o.email ?? "They didn't leave an email"]],
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}

export function ownerReportEmail(site: string, o: { venue: Venue; message: string; photo?: boolean }) {
  return build(o.photo ? `A guest sent your happy hour menu: ${o.venue.name}` : `A guest flagged your listing: ${o.venue.name}`, {
    site,
    preheader: o.message.slice(0, 120),
    hero: venueHero(site, o.venue, { chip: o.photo ? "From a guest" : "Guest report", chipIcon: o.photo ? "camera" : "flag", stamp: "owner" }),
    title: o.photo ? "A guest sent your happy hour" : "A guest flagged your listing",
    paragraphs: [o.photo ? "You keep your own listing, so we passed this straight to you:" : "Someone looking at your spot on A Little Hang thinks something's off:"],
    quote: o.message,
    cta: { label: "Update your listing", href: `${site}/venue/${o.venue.id}` },
    note: "If everything's already right, there's nothing to do. Guests trust listings that are kept fresh.",
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang.`,
  });
}

export function monthlyCheckEmail(site: string, o: { venue: Venue; month: string; confirmHref: string | null }) {
  const monthName = new Date(`${o.month}-15T12:00:00Z`).toLocaleString("en-CA", { month: "long", timeZone: "UTC" });
  const edit = `${site}/venue/${o.venue.id}`;
  return build(`Is the happy hour at ${o.venue.name} still right?`, {
    site,
    preheader: "Ten seconds, one tap. Guests trust A Little Hang because the times are right.",
    hero: venueHero(site, o.venue, { chip: `${monthName} check-in`, chipIcon: "calendar-check", stamp: "owner" }),
    title: "Is your happy hour still right?",
    paragraphs: [
      "Guests trust A Little Hang because the times are right. Take ten seconds to check yours.",
      ...(o.confirmHref ? [] : ["You haven't added your own times yet, so guests see what we found online. Take a look and fix anything that's off."]),
    ],
    cta: o.confirmHref ? { label: "Yes, it's still right", href: o.confirmHref } : { label: "Check your listing", href: edit },
    secondary: o.confirmHref ? { label: "Something changed", href: edit } : undefined,
    note: o.confirmHref ? "Tapping “Yes” marks your times as checked. No sign-in needed." : undefined,
    reason: `You're getting this because you manage ${o.venue.name} on A Little Hang. We send a check-in every two months.`,
  });
}

export function adminEditFlagEmail(site: string, o: { venue: Venue; flags: string[] }) {
  return build(`Edit to check: ${o.venue.name}`, {
    site,
    preheader: o.flags.join("; ").slice(0, 120),
    hero: venueHero(site, o.venue, { chip: "Edit to check", chipIcon: "triangle-alert" }),
    title: "An edit worth a look",
    paragraphs: ["The owner saved an edit that's live now. BC has minimum drink prices, so very cheap drinks are usually a typo."],
    quote: o.flags.join("\n"),
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}

// ---------- "Submit a happy hour" ----------

// A guest's submission: a venue we list, or a new spot by name.
export interface Spot {
  id: string | null; // set for a venue we list
  name: string;
  address: string;
  photo?: string | null;
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Mon–Fri" / "Mon, Wed, Sat" / "Every day", Monday first.
export function fmtDays(days: number[]) {
  if (days.length === 7) return "Every day";
  const order = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const idx = order.map((d) => (d + 6) % 7);
  const run = idx.every((d, i) => i === 0 || d === idx[i - 1] + 1);
  return run && order.length > 2 ? `${DAY[order[0]]}–${DAY[order[order.length - 1]]}` : order.map((d) => DAY[d]).join(", ");
}

// "3pm" / "3:30pm" from "15:00" / "15:30".
export function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hh = h % 12 || 12;
  return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

export function fmtHours(hh: { days: number[]; start: string; end: string | null }) {
  return `${fmtDays(hh.days)}, ${fmtTime(hh.start)}–${hh.end ? fmtTime(hh.end) : "close"}`;
}

function spotHero(site: string, s: Spot, h: Omit<Hero, "name" | "sub" | "photo" | "tint">): Hero {
  if (s.id) return venueHero(site, { id: s.id, name: s.name, address: s.address, photo: s.photo }, h);
  return { ...h, name: s.name, sub: s.address, photo: null, tint: [...s.name].reduce((a, c) => a + c.charCodeAt(0), 1) };
}

const hi = (name: string | null) => (name ? `Thanks, ${name}.` : "Thank you.");

export function submissionReceivedEmail(site: string, o: { name: string | null; spot: Spot; worksThere: boolean }) {
  return build(`Thanks for the happy hour at ${o.spot.name}`, {
    site,
    preheader: "It's in our queue. A real person reads every photo and we'll email you when it's live.",
    hero: spotHero(site, o.spot, { chip: "Happy hour received", chipIcon: "camera", stamp: "thanks" }),
    title: `${hi(o.name)} We've got it.`,
    paragraphs: [
      `Your photo of the happy hour at ${o.spot.name} is in our queue. A real person reads every one, checks the times and deals, and puts it live.`,
    ],
    cta: o.spot.id ? { label: `See ${o.spot.name}`, href: `${site}/spots/${encodeURIComponent(o.spot.id)}.html` } : { label: "Find a happy hour now", href: site },
    note: o.worksThere && o.spot.id ? `Work at ${o.spot.name}? Claim the listing for free and update your times yourself, any time: ${site}/venue/claim/${o.spot.id}` : undefined,
    rowsLabel: "What happens next",
    rows: [
      { icon: "scan-search", title: "We read your photo", body: "Times, days and every deal, checked by a person." },
      { icon: "badge-check", title: "It goes live", body: o.spot.id ? "Usually within a day." : "We add the spot to the map, usually within a day." },
      { icon: "mail", title: "You hear from us", body: "We email you the link the moment it's up." },
    ],
    reason: `You're getting this because you sent A Little Hang the happy hour at ${o.spot.name}.`,
  });
}

export function submissionLiveEmail(site: string, o: { name: string | null; spot: Spot & { id: string }; hours: string; deals: number; isNew: boolean }) {
  return build(`It's live: the happy hour at ${o.spot.name}`, {
    site,
    preheader: `${o.hours}. Thanks for helping everyone find a good hang.`,
    hero: spotHero(site, o.spot, { chip: "It's live", chipIcon: "badge-check", stamp: "thanks" }),
    title: o.isNew ? `${o.spot.name} is on the map` : "Your happy hour is live",
    paragraphs: [
      `${hi(o.name)} ${o.isNew ? `We added ${o.spot.name} to A Little Hang` : `We updated ${o.spot.name}`} from your photo, so the next person who goes gets the right times.`,
    ],
    details: [
      ["When", o.hours],
      ...(o.deals ? ([["Deals", `${o.deals} listed`]] as [string, string][]) : []),
    ],
    cta: { label: "See it live", href: `${site}/spots/${encodeURIComponent(o.spot.id)}.html` },
    secondary: { label: "Send another happy hour", href: `${site}/submit` },
    reason: `You're getting this because you sent A Little Hang the happy hour at ${o.spot.name}.`,
  });
}

export function submissionClosedEmail(site: string, o: { name: string | null; spot: Spot; reason: string | null; forwarded: boolean }) {
  return build(o.forwarded ? `We passed your photo to ${o.spot.name}` : `About the happy hour at ${o.spot.name}`, {
    site,
    preheader: o.forwarded ? "They keep their own listing, so it's in their hands now." : "We couldn't put this one live, but thank you for sending it.",
    hero: spotHero(site, o.spot, { chip: o.forwarded ? "Passed to the venue" : "Submission update", chipIcon: "camera" }),
    title: o.forwarded ? "It's with the venue now" : "We couldn't add this one",
    paragraphs: [
      o.forwarded
        ? `${hi(o.name)} ${o.spot.name} keeps its own listing on A Little Hang, so we sent your photo straight to their team to update.`
        : `${hi(o.name)} We read your photo of ${o.spot.name}, but we couldn't put it live this time.`,
    ],
    quote: o.reason ?? undefined,
    cta: { label: "Send another happy hour", href: `${site}/submit` },
    note: o.forwarded ? undefined : `Have a clearer photo, or think we got it wrong? Reply to ${SUPPORT_EMAIL} and we'll take another look.`,
    reason: `You're getting this because you sent A Little Hang the happy hour at ${o.spot.name}.`,
  });
}

export function adminSubmissionEmail(
  site: string,
  o: { spot: Spot; name: string | null; email: string; photos: number; hours: string | null; note: string | null; worksThere: boolean; managed: boolean },
) {
  return build(`Happy hour to review: ${o.spot.name}`, {
    site,
    preheader: `${o.photos} photo${o.photos === 1 ? "" : "s"} from ${o.name ?? o.email}${o.spot.id ? "" : ", a spot we don't list yet"}.`,
    hero: spotHero(site, o.spot, { chip: o.spot.id ? "Happy hour update" : "New spot", chipIcon: "camera" }),
    title: o.spot.id ? "A happy hour to check" : "A new spot to add",
    paragraphs: [
      o.managed
        ? `A guest sent a photo for ${o.spot.name}. The venue manages its own listing, so pass it to them from the queue.`
        : "Read the photo, fix the times and deals, then publish or decline.",
    ],
    quote: o.note ?? undefined,
    details: [
      ["From", o.name ? `${o.name}${o.worksThere ? " (works there)" : ""}` : o.worksThere ? "Works there" : "A guest"],
      ["Email", o.email],
      ["Photos", String(o.photos)],
      ["Their reading", o.hours ?? "Not given"],
    ],
    cta: { label: "Open the review queue", href: `${site}/venue/admin` },
    reason: "You're getting this because you're an admin on A Little Hang.",
  });
}

// Every email with sample data, for the preview script and the admin's
// "Email me samples" button.
// `real` is a venue with its own photo, so the samples show a real banner.
export function samples(site: string, api: string, real?: Venue): Record<string, Email> {
  const venue = { id: "ancora", name: "Ancora Waterfront Dining", address: "1600 Howe St, Vancouver", phone: "(604) 681-1164", website: "https://ancoradining.com", photo: "photos/ancora.webp", ...real };
  const plain = { ...venue, id: "brewhall", name: "Brewhall", address: "97 E 2nd Ave, Vancouver", photo: null };
  const report = "Happy hour ends at 5 now, not 6. The oyster deal is gone too.";
  const newSpot = { id: null, name: "The Sunny Side", address: "2245 Commercial Dr, Vancouver" };
  const month = new Date().toISOString().slice(0, 7);
  return {
    "1-sign-in": signInEmail(site, `${site}/venue/login?token=sample&next=%2Fvenue`, 30),
    "2-claim-received": claimReceivedEmail(site, { name: "Maya", role: "General manager", venue }),
    "3-claim-approved": claimApprovedEmail(site, { name: "Maya", venue }),
    "4-claim-rejected": claimRejectedEmail(site, { name: "Maya", venue: plain, note: "We called the listed number and the manager on shift didn't recognise the name." }),
    "5-check-in": monthlyCheckEmail(site, { venue, month, confirmHref: `${api}/confirm?v=ancora&m=${month}&s=sample` }),
    "6-check-in-new": monthlyCheckEmail(site, { venue: plain, month, confirmHref: null }),
    "7-owner-report": ownerReportEmail(site, { venue, message: report }),
    "8-admin-claim-review": adminClaimEmail(site, { auto: false, name: "Maya", role: "General manager", email: "maya@gmail.com", phone: "604 555 0199", venue }),
    "9-admin-claim-auto": adminClaimEmail(site, { auto: true, name: "Maya", role: "Owner", email: "maya@ancoradining.com", phone: null, venue: plain }),
    "10-admin-report": adminReportEmail(site, { venue, message: report, email: "guest@example.com" }),
    "11-admin-edit-flag": adminEditFlagEmail(site, { venue: plain, flags: ["Drink under $3: Draft lager $2.50"] }),
    "12-submission-received": submissionReceivedEmail(site, { name: "Maya", spot: venue, worksThere: false }),
    "13-submission-received-new": submissionReceivedEmail(site, { name: null, spot: newSpot, worksThere: false }),
    "14-submission-live": submissionLiveEmail(site, { name: "Maya", spot: venue, hours: fmtHours({ days: [1, 2, 3, 4, 5], start: "15:00", end: "18:00" }), deals: 6, isNew: false }),
    "15-submission-live-new": submissionLiveEmail(site, { name: "Maya", spot: { ...newSpot, id: "the-sunny-side" }, hours: fmtHours({ days: [0, 1, 2, 3, 4, 5, 6], start: "14:00", end: "17:00" }), deals: 0, isNew: true }),
    "16-submission-declined": submissionClosedEmail(site, { name: "Maya", spot: plain, reason: "The photo was too blurry to read the prices. Could you send a closer one?", forwarded: false }),
    "17-submission-forwarded": submissionClosedEmail(site, { name: null, spot: venue, reason: null, forwarded: true }),
    "18-admin-submission": adminSubmissionEmail(site, { spot: newSpot, name: "Maya", email: "maya@gmail.com", photos: 2, hours: fmtHours({ days: [1, 2, 3, 4], start: "15:00", end: "18:00" }), note: "New patio, half-price wings until 6.", worksThere: false, managed: false }),
    "19-owner-photo": ownerReportEmail(site, { venue, photo: true, message: "A guest sent us a photo of your happy hour menu.\nThey read it as: Mon–Fri, 3pm–6pm." }),
  };
}
