// Scores a venue photo so the app can skip ones that make a bad hero: logos
// and graphics (transparent PNGs, a handful of flat colours), near-black
// shots, washed-out flat images and tiny thumbnails. Returns the reason a
// photo is rejected, or null when it's fine.
import sharp from "sharp";

export async function photoProblem(src) {
  const img = sharp(src, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if ((meta.width ?? 0) < 240 || (meta.height ?? 0) < 150) return "too small";

  // Transparent pixels mean a cut-out logo or graphic, not a photo.
  if (meta.hasAlpha) {
    const { data } = await sharp(src, { failOn: "none" }).ensureAlpha().extractChannel(3).resize(64, 64, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    const clear = data.reduce((n, a) => n + (a < 250 ? 1 : 0), 0) / data.length;
    if (clear > 0.05) return "transparent graphic";
  }

  const { data, info } = await img.flatten({ background: "#ffffff" }).resize(64, 64, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  let sum = 0;
  let sq = 0;
  const bins = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += l;
    sq += l * l;
    const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }
  const mean = sum / px;
  const sd = Math.sqrt(sq / px - mean * mean);
  const top3 = [...bins.values()].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / px;

  if (process.env.PHOTO_DEBUG) console.log({ src: String(src).split("/").pop(), mean: Math.round(mean), sd: Math.round(sd), top3: +top3.toFixed(2), colours: bins.size });
  // Near-black with nothing in it (a dark logo on black, a failed render).
  if (mean < 30 && sd < 30) return "too dark";
  if (sd < 14) return "flat";
  // A photo spreads over many colours; a logo or flyer sits on a few flat
  // ones (black-and-white photos still spread across greys).
  if (top3 > 0.6 || (bins.size < 40 && top3 > 0.4)) return "graphic";
  return null;
}

// CLI: node scripts/photo-quality.mjs <files...> prints a score line each.
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of process.argv.slice(2)) console.log((await photoProblem(f).catch((e) => "error " + e.message)) ?? "ok", f);
}
