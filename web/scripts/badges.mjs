// "Find our happy hour on A Little Hang" badges that venues can put on their
// own site (prerender.mjs writes badge/<id>.svg, badge/<id>-light.svg and a
// badge/<id>/ page with the embed code). Each badge says the best thing that's
// true about the venue today, and changes with the nightly data:
//   ranked  "#3 best in Gastown"      on a neighbourhood or city best-of list
//   top     "Hangout Score 8.4"       a score of TOP_SCORE or more
//   basic   "A Little Hang"           every other venue
// Nothing a venue pays for or links back with changes which one it gets.
//
// Text is drawn as glyph outlines (opentype.js, like the share cards), so the
// SVG looks the same inside an <img> on any site, with no web font to load.

export const TOP_SCORE = 7.5; // components/hang-score.tsx TOP_SCORE
export const BADGE_H = 56;

const THEMES = {
  dark: { bg: "#1b1b1b", stroke: null, tile: "#ff4900", mark: "#1b1b1b", top: "#a7a196", main: "#f3efe4" },
  light: { bg: "#fffdf7", stroke: "#ddd5c4", tile: "#ff4900", mark: "#1b1b1b", top: "#6b6559", main: "#1b1b1b" },
};

// What the badge says for a venue: { kind, top, main, alt }.
export function badgeText(v, ranked) {
  if (ranked) {
    const main = `#${ranked.rank} best in ${ranked.list.name}`;
    return { kind: "ranked", top: "Ranked on A Little Hang", main, alt: `${main}, ranked on A Little Hang` };
  }
  if (v.score && v.score.total >= TOP_SCORE) {
    const main = `Hangout Score ${v.score.total.toFixed(1)}`;
    return { kind: "top", top: "Top happy hour on A Little Hang", main, alt: `Top happy hour on A Little Hang: ${main} out of 10` };
  }
  return { kind: "basic", top: "Find our happy hour on", main: "A Little Hang", alt: "Find our happy hour on A Little Hang" };
}

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// faces: { display, sans } opentype fonts; logo: LOGO_PATH (viewBox 0 0 130 124).
export function badgeSvg({ top, main, alt }, { faces, logo, theme = "dark" }) {
  const t = THEMES[theme];
  const TOP_SIZE = 11.5, X = 58, PAD = 16;
  // Long list names ("#3 best in South Granville & Fairview") step down a size.
  const MAIN_SIZE = faces.display.getAdvanceWidth(main, 18) > 260 ? 16 : 18;
  const w = Math.ceil(X + Math.max(faces.sans.getAdvanceWidth(top, TOP_SIZE), faces.display.getAdvanceWidth(main, MAIN_SIZE)) + PAD);
  const topPath = faces.sans.getPath(top, X, 23, TOP_SIZE).toPathData(2);
  const mainPath = faces.display.getPath(main, X, 42, MAIN_SIZE).toPathData(2);
  // The logo, 26 wide, centred on a 40×40 orange tile.
  const s = 26 / 130;
  const tile = `<rect x="8" y="8" width="40" height="40" rx="10" fill="${t.tile}"/><path transform="translate(${(28 - 65 * s).toFixed(2)} ${(28 - 62 * s).toFixed(2)}) scale(${s.toFixed(4)})" d="${logo}" fill="${t.mark}"/>`;
  const frame = t.stroke
    ? `<rect x=".5" y=".5" width="${w - 1}" height="${BADGE_H - 1}" rx="11.5" fill="${t.bg}" stroke="${t.stroke}"/>`
    : `<rect width="${w}" height="${BADGE_H}" rx="12" fill="${t.bg}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${BADGE_H}" viewBox="0 0 ${w} ${BADGE_H}" role="img" aria-label="${xml(alt)}"><title>${xml(alt)}</title>${frame}${tile}<path d="${topPath}" fill="${t.top}"/><path d="${mainPath}" fill="${t.main}"/></svg>`;
}
