// Renders every email with sample data, for looking at and for test sends:
//   node --experimental-strip-types scripts/email-preview.ts [out-dir]
// Writes <name>.html, <name>.txt and index.json (subject per email).
import { mkdirSync, writeFileSync } from "node:fs";
import * as e from "../src/email.ts";

const emails = e.samples("https://alittlehang.com", "https://api.alittlehang.com");

const out = process.argv[2] ?? "email-preview";
mkdirSync(out, { recursive: true });
for (const [name, m] of Object.entries(emails)) {
  writeFileSync(`${out}/${name}.html`, m.html);
  writeFileSync(`${out}/${name}.txt`, `Subject: ${m.subject}\n\n${m.text}`);
}
writeFileSync(`${out}/index.json`, JSON.stringify(Object.fromEntries(Object.entries(emails).map(([k, m]) => [k, m.subject])), null, 2));
console.log(`${Object.keys(emails).length} emails in ${out}/`);
