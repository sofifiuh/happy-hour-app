import { asset, BROWSER_ROUTER } from "@/lib/routes";
import { Link } from "react-router";
import { Wordmark } from "@/components/wordmark";
import { useStore } from "@/lib/store";

// Every v1 screen side by side at phone size: the review board for
// comparing against Sofia's Figma frames.
export function ScreensBoard() {
  const { venues, rows } = useStore();
  const withDeals = rows.find((r) => r.occ.status === "live" && r.venue.hh.deals.length >= 4)?.venue ?? venues.find((v) => v.hh.deals.length >= 4);
  const noDeals = venues.find((v) => v.hh.deals.length === 0);
  const savedIds = rows.slice(0, 4).map((r) => r.venue.id).join(",");

  const screens: { title: string; note: string; path: string }[] = [
    { title: "Welcome", note: "First run: brand moment + location ask", path: "/welcome" },
    { title: "List: all", note: "Grouped by happening now / later today / coming up", path: "/" },
    { title: "List: happening now", note: "Live deals only, soonest-ending first", path: "/?tab=live" },
    { title: "Filters", note: "Amenity switches with live counts", path: "/?sheet=filters" },
    { title: "Date & time", note: "Plan by day + named time slots", path: "/?sheet=plan" },
    { title: "Planned: Fri after work", note: "Results for a chosen day and time", path: "/?tab=plan&plan=5@16:00" },
    { title: "Map", note: "Pins by status, swipeable cards", path: "/map" },
    { title: "Best of", note: "Top Hangout Scores by neighbourhood and city", path: "/best?in=gastown" },
    ...(withDeals ? [{ title: "Venue page", note: `${withDeals.name}: deals, times, map, sticky bar`, path: `/spot/${withDeals.id}` }] : []),
    ...(noDeals ? [{ title: "Venue: deals not listed", note: `${noDeals.name}: times only`, path: `/spot/${noDeals.id}` }] : []),
    { title: "Search: neighbourhood", note: "Search covers name, street, city and neighbourhood", path: "/?q=gastown" },
    { title: "Empty search", note: "No results state", path: "/?q=zzzz" },
    { title: "Location", note: "Explains near me first; neighbourhood picker as the fallback", path: "/?sheet=location" },
    { title: "Saved spots", note: "Hearted spots on this device, reminder switch", path: `/saved?saved=${savedIds}` },
    { title: "Saved: empty", note: "Before anything is saved", path: "/saved?saved=" },
    ...(withDeals ? [{ title: "Reminder opt-in", note: "Asked once, right after the first save", path: `/spot/${withDeals.id}?sheet=notify` }] : []),
    { title: "Offline", note: "Cached spots stay usable without a connection", path: "/?offline=1" },
    { title: "Couldn't load", note: "First visit with no connection", path: "/?error=1&q=zzzz-no-data" },
    { title: "Not found", note: "Old or broken links", path: "/this-page-does-not-exist" },
    { title: "About", note: "What the app is and where times come from", path: "/about" },
    { title: "Privacy", note: "No accounts, location stays on device", path: "/privacy" },
    { title: "Terms", note: "Times are a guide, 19+", path: "/terms" },
  ];

  const frameUrl = (path: string) => {
    const [p, q] = path.split("?");
    return `${BROWSER_ROUTER ? "" : "#"}${p}?frame=1${q ? `&${q}` : ""}`;
  };

  return (
    <div className="min-h-dvh bg-[#121212] px-6 py-10">
      <header className="mx-auto mb-10 flex max-w-[1800px] flex-wrap items-end justify-between gap-4">
        <div>
          <Wordmark className="h-16 text-cream" />
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
        <figure className="w-[390px]">
          <div className="flex h-[864px] flex-col justify-center rounded-[44px] bg-[#f2f2f7] px-5 ring-[10px] ring-[#2a2a2a]">
            <div className="ml-auto w-[280px] overflow-hidden rounded-[22px] bg-[#e5e5ea]">
              <img src={asset("og.png")} alt="" className="block w-full" />
              <div className="px-3.5 py-2.5 text-[#1c1c1e]">
                <p className="text-[14px] font-semibold leading-tight">A Little Hang: happy hours near you, right now</p>
                <p className="mt-0.5 text-[12px] text-[#6c6c70]">alittlehang.com</p>
              </div>
            </div>
            <p className="mt-2 mr-1 text-right text-[11px] text-[#8e8e93]">Delivered</p>
          </div>
          <figcaption className="mt-4 px-2">
            <p className="font-display text-lg font-bold">Share preview</p>
            <p className="text-sm text-muted-foreground">Link card in Messages. Per-venue cards come with prerendered venue pages at launch.</p>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
