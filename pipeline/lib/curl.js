// Fetch via the system curl binary rather than Node's fetch: curl honors the
// environment's HTTPS_PROXY + CA bundle out of the box, which Node's
// undici-based fetch does not.
import { execFile } from "node:child_process";
import fs from "node:fs";

export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * GET a URL, writing the body to outFile.
 * Resolves to { status, contentType, finalUrl, error } — never rejects.
 */
export function curlGet(url, outFile, { timeout = 30 } = {}) {
  return new Promise((resolve) => {
    const args = [
      "-sS",
      "-L",
      "--compressed",
      "--max-time", String(timeout),
      "--max-redirs", "8",
      "-A", UA,
      "-H", "Accept: text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      "-H", "Accept-Language: en-CA,en;q=0.9",
      "-o", outFile,
      "-w", "%{http_code}\t%{content_type}\t%{url_effective}",
      url,
    ];
    execFile("curl", args, { encoding: "utf8", maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      const [status = "0", contentType = "", finalUrl = url] = (stdout || "").trim().split("\t");
      const result = {
        status: Number(status) || 0,
        contentType: (contentType || "").toLowerCase(),
        finalUrl,
        error: null,
      };
      if (err && result.status === 0) {
        result.error = (stderr || err.message || "curl failed").trim().slice(0, 300);
        try { fs.rmSync(outFile, { force: true }); } catch {}
      }
      resolve(result);
    });
  });
}

/** GET a URL and parse the response as JSON (for APIs like Nominatim).
 *  Async — never blocks the event loop — and shares the proxy/CA seam. */
export function curlJson(url, { timeout = 25, userAgent = UA, headers = [], body = null } = {}) {
  const args = ["-sS", "--max-time", String(timeout), "-H", `User-Agent: ${userAgent}`];
  for (const h of headers) args.push("-H", h);
  if (body !== null) args.push("-X", "POST", "-H", "Content-Type: application/json", "-d", JSON.stringify(body));
  return new Promise((resolve, reject) => {
    execFile("curl", [...args, url],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error((stderr || err.message).trim().slice(0, 200)));
        try { resolve(JSON.parse(stdout)); } catch (e) { reject(new Error(`bad JSON from ${url.slice(0, 60)}: ${e.message}`)); }
      });
  });
}

/** Run up to `limit` async jobs concurrently over `items`. */
export async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
