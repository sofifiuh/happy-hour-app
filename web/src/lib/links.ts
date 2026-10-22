import { absoluteUrl, spotPath } from "@/lib/routes";
import type { Venue } from "./types";

// Where "Report a wrong time" goes. Placeholder until the support address
// for the stores (tracker item stor-09) is set up.
export const SUPPORT_EMAIL = "hello@alittlehang.com";

export function reportLink(v: Venue) {
  const subject = `Wrong happy hour info: ${v.name}`;
  const body = `Venue: ${v.name}\nAddress: ${v.address}\nLink: ${absoluteUrl(spotPath(v.id))}\n\nWhat's wrong (times, deals, closed?):\n`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// "2026-09-02" -> "Sep 2" (adds the year when it isn't this year).
export function fmtChecked(iso: string, now = new Date()) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}
