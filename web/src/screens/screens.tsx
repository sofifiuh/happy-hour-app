import { Link } from "react-router";
import { Wordmark } from "@/components/wordmark";
import { useStore } from "@/lib/store";

// Every v1 screen side by side at phone size: the review board for
// comparing against Sophie's Figma frames.
export function ScreensBoard() {
  const { venues, rows } = useStore();
  const withDeals = rows.find((r) => r.occ.status === "live" && r.venue.hh.deals.length >= 4)?.venue ?? venues.find((v) => v.hh.deals.length >= 4);
  const noDeals = venues.find((v) => v.hh.deals.length === 0);

  const screens: { title: string; note: string; path: string }[] = [
    { title: "Welcome", note: "First run: brand moment + location ask", path: "/welcome" },
    { title: "List: all", note: "Grouped by happening now / later today / coming up", path: "/" },
    { title: "List: happening now", note: "Live deals only, soonest-ending first", path: "/?tab=live" },
    { title: "Filters", note: "Amenity switches with live counts", path: "/?sheet=filters" },
    { title: "Date & time", note: "Plan by day + named time slots", path: "/?sheet=plan" },
    { title: "Planned: Fri after work", note: "Results for a chosen day and time", path: "/?tab=plan&plan=5@16:00" },
    { title: "Map", note: "Pins by status, swipeable cards", path: "/map" },
    ...(withDeals ? [{ title: "Venue page", note: `${withDeals.name}: deals, times, map, sticky bar`, path: `/spot/${withDeals.id}` }] : []),
    ...(noDeals ? [{ title: "Venue: deals not listed", note: `${noDeals.name}: times only`, path: `/spot/${noDeals.id}` }] : []),
    { title: "Empty search", note: "No results state", path: "/?q=zzzz" },
  ];

  const frameUrl = (path: string) => {
    const [p, q] = path.split("?");
    return `#${p}?frame=1${q ? `&${q}` : ""}`;
  };

  return (
    <div className="min-h-dvh bg-[#121212] px-6 py-10">
      <header className="mx-auto mb-10 flex max-w-[1800px] flex-wrap items-end justify-between gap-4">
        <div>
          <Wordmark inline className="text-[40px]" />
          <p className="mt-2 text-muted-foreground">All v1 screens, live with real data. Tap any screen to use it.</p>
        </div>
        <Link to="/" className="text-sm font-semibold text-primary">
          Open the app →
        </Link>
      </header>
      <div className="mx-auto grid max-w-[1800px] grid-cols-[repeat(auto-fill,minmax(390px,1fr))] justify-items-center gap-x-8 gap-y-12">
        {screens.map((s) => (
          <figure key={s.title} className="w-[390px]">
            <div className="overflow-hidden rounded-[44px] bg-ink ring-[10px] ring-[#2a2a2a]">
              <iframe title={s.title} src={frameUrl(s.path)} className="block h-[844px] w-[390px] border-0" loading="lazy" />
            </div>
            <figcaption className="mt-4 px-2">
              <p className="font-display text-lg font-bold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
