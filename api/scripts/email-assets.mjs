// Draws the images the emails use (logo, icons, owner stamps) into
// web/public/email/, from the same sources as the site: the Figma logo
// path, lucide icons and the claim page's stamp. Emails can't use SVG
// (Gmail drops it), so these are PNGs at 3x. Run after changing any of them:
//   node scripts/email-assets.mjs
// Needs the web app's node_modules and Playwright with Chromium.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "../../web");
const out = resolve(web, "public/email");
const { chromium } = createRequire(import.meta.url)("playwright");

const ORANGE = "#ff4900";
const ICONS = ["clock", "sparkles", "image-plus", "phone", "badge-check", "chart-column", "message-circle", "pencil-line", "flag", "calendar-check", "key-round", "file-up", "store", "triangle-alert", "scan-search", "mail"];

function lucide(name, { color, width = 2 }) {
  const src = readFileSync(resolve(web, `node_modules/lucide-react/dist/esm/icons/${name}.mjs`), "utf8");
  const { node } = new Function(`return ${/const __iconData = (\{[\s\S]*?\n\});/.exec(src)[1]}`)();
  const kids = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${kids}</svg>`;
}

const logoPath = /LOGO_PATH =\s*"([^"]+)"/.exec(readFileSync(resolve(web, "src/components/logo-path.ts"), "utf8"))[1];
const font = resolve(web, "node_modules/@fontsource/funnel-display/files/funnel-display-latin-800-normal.woff2");

// The claim page's stamp: ring text on a circle, check or shop in the
// middle. "thanks" is the submit page's pink thank-you stamp.
function stamp(kind) {
  const owned = kind === "owner";
  const thanks = kind === "thanks";
  const ring = owned ? "OFFICIAL OWNER · A LITTLE HANG · " : thanks ? "THANK YOU · GOOD HANG · A LITTLE HANG · " : "CLAIM YOUR LISTING · A LITTLE HANG · ";
  const fill = owned ? "#ecfe54" : thanks ? "#f7b2b7" : "rgba(0,0,0,0.55)";
  const ink = owned || thanks ? "#1b1b1b" : "#ffffff";
  const mid = owned
    ? `<g transform="translate(32.6 32.6) scale(1.45)" stroke-width="3">${lucide("check", { color: ink, width: 3 }).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`
    : `<g transform="translate(34.8 34.8) scale(1.27)" stroke-width="2">${lucide(thanks ? "heart" : "store", { color: ink }).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <defs><path id="r" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>
    <circle cx="50" cy="50" r="48" fill="${fill}"/>
    <circle cx="50" cy="50" r="30" stroke="${owned || thanks ? "rgba(27,27,27,0.4)" : "rgba(255,255,255,0.4)"}" stroke-width="1.5"/>
    <text style="font-family:'FD';font-weight:800;font-size:9.5px;letter-spacing:0.08em" fill="${ink}"><textPath href="#r" textLength="236" lengthAdjust="spacing">${ring}</textPath></text>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="${ink}">${mid}</g>
  </svg>`;
}

const jobs = [
  // 56x54 logo on ink, opaque so forced dark mode can't hide it
  ["logo.png", 168, 162, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 134 128"><rect x="-2" y="-2" width="134" height="128" fill="#1b1b1b"/><path fill="#f3efe4" d="${logoPath}"/></svg>`, false],
  ["stamp-owner.png", 276, 276, stamp("owner"), true],
  ["stamp-claim.png", 276, 276, stamp("claim"), true],
  ["stamp-thanks.png", 276, 276, stamp("thanks"), true],
  ...["store", "key-round", "flag", "calendar-check", "badge-check", "triangle-alert", "camera"].map((n) => [`chip-${n}.png`, 42, 42, lucide(n, { color: "#ffffff" }), true]),
  ...ICONS.map((n) => [`icon-${n}.png`, 66, 66, lucide(n, { color: ORANGE }), true]),
];

const browser = await chromium.launch();
for (const [file, w, h, svg, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(
    `<style>@font-face{font-family:FD;src:url(data:font/woff2;base64,${readFileSync(font).toString("base64")})}html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style>${svg}`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(out, file), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
}
await browser.close();
console.log(`${jobs.length} images in ${out}`);
