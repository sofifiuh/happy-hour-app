// Renders every email with sample data, for looking at and for test sends:
//   node --experimental-strip-types scripts/email-preview.ts [out-dir]
// Writes <name>.html, <name>.txt and index.json (subject per email).
import { mkdirSync, writeFileSync } from "node:fs";
import * as e from "../src/email.ts";

const site = "https://alittlehang.com";
const venue = { id: "ancora", name: "Ancora Waterfront Dining", address: "1600 Howe St, Vancouver", phone: "(604) 681-1164", website: "https://ancoradining.com" };
const confirm = "https://api.alittlehang.com/confirm?v=ancora&m=2026-11&s=sample";

const emails: Record<string, e.Email> = {
  "1-sign-in": e.signInEmail(site, `${site}/venue/login?token=sample-token-1234567890abcdef&next=%2Fvenue%2Fclaim%2Fancora`, 30),
  "2-claim-received": e.claimReceivedEmail(site, { name: "Maya", role: "General manager", venue }),
  "3-claim-approved": e.claimApprovedEmail(site, { name: "Maya", venue }),
  "4-claim-rejected": e.claimRejectedEmail(site, { name: "Maya", venue, note: "We called the listed number and the manager on shift didn't recognise the name." }),
  "5-monthly-check": e.monthlyCheckEmail(site, { venue, month: "2026-11", confirmHref: confirm }),
  "6-monthly-check-new": e.monthlyCheckEmail(site, { venue, month: "2026-11", confirmHref: null }),
  "7-owner-report": e.ownerReportEmail(site, { venue, message: "Happy hour ends at 5 now, not 6. The oyster deal is gone too." }),
  "8-admin-claim-review": e.adminClaimEmail(site, { auto: false, name: "Maya", role: "General manager", email: "maya@gmail.com", phone: "604 555 0199", venue }),
  "9-admin-claim-auto": e.adminClaimEmail(site, { auto: true, name: "Maya", role: "Owner", email: "maya@ancoradining.com", phone: null, venue }),
  "10-admin-report": e.adminReportEmail(site, { venue, message: "Happy hour ends at 5 now, not 6. The oyster deal is gone too.", email: "guest@example.com" }),
  "11-admin-edit-flag": e.adminEditFlagEmail(site, { venue, flags: ["Drink under $3: Draft lager $2.50"] }),
};

const out = process.argv[2] ?? "email-preview";
mkdirSync(out, { recursive: true });
for (const [name, m] of Object.entries(emails)) {
  writeFileSync(`${out}/${name}.html`, m.html);
  writeFileSync(`${out}/${name}.txt`, `Subject: ${m.subject}\n\n${m.text}`);
}
writeFileSync(`${out}/index.json`, JSON.stringify(Object.fromEntries(Object.entries(emails).map(([k, m]) => [k, m.subject])), null, 2));
console.log(`${Object.keys(emails).length} emails in ${out}/`);
