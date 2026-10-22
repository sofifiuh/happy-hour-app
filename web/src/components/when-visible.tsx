import { useEffect, useRef, useState, type ReactNode } from "react";

// Renders `children` once the placeholder scrolls near the viewport, so
// heavy below-the-fold pieces (the venue page's MapLibre map) don't load
// with the page.
export function WhenVisible({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className={className}>
      {seen && children}
    </div>
  );
}
