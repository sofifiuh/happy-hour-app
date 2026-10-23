import { useEffect } from "react";

const SITE = "A Little Hang";

// Per-route document title, e.g. "Joe Fortes · happy hour 3–5pm | A Little Hang".
// `exact` sets the title as given (venue pages build their own, with the
// site name only when it fits; see lib/seo.ts).
export function useTitle(title?: string | null, exact = false) {
  useEffect(() => {
    document.title = title ? (exact ? title : `${title} | ${SITE}`) : `${SITE}: Vancouver happy hours right now`;
  }, [title, exact]);
}
