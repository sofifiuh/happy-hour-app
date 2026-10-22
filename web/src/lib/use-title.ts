import { useEffect } from "react";

const SITE = "A Little Hang";

// Per-route document title, e.g. "Joe Fortes · happy hour 3–5pm | A Little Hang".
export function useTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE}: happy hours near you, right now`;
  }, [title]);
}
