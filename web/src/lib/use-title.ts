import { useEffect } from "react";

const SITE = "A Little Hang";

// Per-route document title, e.g. "Joe Fortes · happy hour 3–5pm | A Little Hang".
// `exact` sets the title as given (venue pages build their own, with the
// site name only when it fits; see lib/seo.ts). `enabled` false leaves the
// title to another screen on top (the desktop venue panel over the list).
export function useTitle(title?: string | null, exact = false, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    document.title = title ? (exact ? title : `${title} | ${SITE}`) : `Vancouver Happy Hours Right Now | ${SITE}`;
  }, [title, exact, enabled]);
}
