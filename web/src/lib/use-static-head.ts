import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { BROWSER_ROUTER } from "@/lib/routes";

// The page the visitor landed on carries its own prerendered <head>
// (scripts/prerender.mjs): canonical, description, social tags, JSON-LD.
// After an in-app navigation the head would still describe that first
// page, so SEO tools (and anyone sharing the URL from the address bar's
// page state) saw the home page's schema on a venue. Swap those tags for
// the ones in the new URL's prerendered file.
const SELECTOR = [
  'script[type="application/ld+json"]',
  'link[rel="canonical"]',
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[property^="og:"]',
  'meta[property^="place:"]',
  'meta[name^="twitter:"]',
].join(",");

export function useStaticHead() {
  const { pathname } = useLocation();
  const first = useRef(pathname);
  useEffect(() => {
    if (!BROWSER_ROUTER || pathname === first.current) return;
    first.current = "";
    let live = true;
    fetch(pathname, { headers: { Accept: "text/html" } })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "")
      .then((html) => {
        if (!live) return;
        const next = html ? new DOMParser().parseFromString(html, "text/html").head.querySelectorAll(SELECTOR) : [];
        document.head.querySelectorAll(SELECTOR).forEach((el) => el.remove());
        next.forEach((el) => document.head.append(document.importNode(el, true)));
      });
    return () => {
      live = false;
    };
  }, [pathname]);
}
