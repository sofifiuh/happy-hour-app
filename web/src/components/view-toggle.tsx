import { List, Map as MapIcon } from "lucide-react";
import { Link } from "react-router";
import { setNav } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Floating List / Map pill pinned to the bottom of both views.
export function ViewToggle({ view }: { view: "list" | "map" }) {
  const item = (active: boolean) =>
    cn(
      "flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-[color,background-color,transform] active:scale-95",
      active ? "bg-cream text-ink" : "text-cream/80",
    );
  return (
    <nav
      aria-label="View"
      className="pointer-events-auto flex w-[220px] gap-1 rounded-full bg-ink-2/95 p-1 shadow-[0_8px_30px_rgb(0_0_0/0.45)] ring-1 ring-white/5 backdrop-blur"
    >
      <Link to="/" replace viewTransition onClick={() => setNav("swap")} aria-current={view === "list" ? "page" : undefined} className={item(view === "list")}>
        <List className="size-4" /> List
      </Link>
      <Link to="/map" replace viewTransition onClick={() => setNav("swap")} aria-current={view === "map" ? "page" : undefined} className={item(view === "map")}>
        <MapIcon className="size-4" /> Map
      </Link>
    </nav>
  );
}
