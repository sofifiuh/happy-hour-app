import { Heart, LocateFixed, MapPin } from "lucide-react";
import { type CSSProperties, lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { FiltersDrawer } from "@/components/filters-drawer";
import { LocationDrawer } from "@/components/location-drawer";
import { OfflineBanner } from "@/components/offline-banner";
import { PlanDrawer } from "@/components/plan-drawer";
import { SearchBar } from "@/components/search-bar";
import { TimeTabs } from "@/components/time-tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueRow } from "@/components/venue-row";
import { ViewToggle } from "@/components/view-toggle";
import { Wordmark } from "@/components/wordmark";
import { DAY_FULL, fmtTime } from "@/lib/hours";
import { InfoNav } from "@/screens/info";
import { ExploreLinks } from "@/components/explore-links";
import { reducedMotion } from "@/lib/motion";
import { useStore, type Row } from "@/lib/store";
import { useIsDesktop } from "@/lib/use-media";
import { useTitle } from "@/lib/use-title";
import { cn } from "@/lib/utils";

const DesktopMap = lazy(() => import("@/components/desktop-map"));

const PAGE = 40;

export function Home() {
  const { rows, now, loading, loadFailed, filters, resetFilters, setFilters, locationState, origin, saved } = useStore();
  const [params] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(params.get("sheet") === "filters");
  const [planOpen, setPlanOpen] = useState(params.get("sheet") === "plan");
  const [locationOpen, setLocationOpen] = useState(params.get("sheet") === "location");
  const [limit, setLimit] = useState(PAGE);
  const desktop = useIsDesktop();
  useTitle(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (filters.tab === "plan" && filters.plan) {
      return [{ title: `On ${DAY_FULL[filters.plan.day]} at ${fmtTime(filters.plan.time)}`, rows }];
    }
    const live: Row[] = [];
    const soon: Row[] = [];
    const later: Row[] = [];
    const none: Row[] = [];
    for (const r of rows) {
      if (r.occ.status === "live") live.push(r);
      else if (r.occ.status === "upcoming" && r.occ.start!.toDateString() === now.toDateString()) soon.push(r);
      else if (r.occ.status === "upcoming") later.push(r);
      else none.push(r);
    }
    return [
      { title: "Happy hours happening now", rows: live, live: true },
      { title: "Later today", rows: soon },
      { title: "Coming up", rows: later },
      { title: "Times not listed", rows: none },
    ].filter((s) => s.rows.length);
  }, [rows, filters.tab, filters.plan, now]);

  // Desktop: a pin click brings its row into view in the list, showing
  // more rows first if it's further down than the list has loaded.
  const order = useMemo(() => sections.flatMap((s) => s.rows.map((r) => r.venue.id)), [sections]);
  const at = selected ? order.indexOf(selected) : -1;
  useEffect(() => {
    if (at >= limit) setLimit(at + PAGE);
  }, [at, limit]);
  useEffect(() => {
    if (!selected || at < 0 || at >= limit) return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(`row-${selected}`);
      if (!el) return;
      // Glide to nearby rows; jump to far ones rather than scroll for seconds.
      const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 2;
      el.scrollIntoView({ block: "center", behavior: far || reducedMotion() ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(id);
    // Scroll on a new selection (or once its row has loaded), not on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, at >= 0 && at < limit]);

  let budget = limit;
  let n = 0;
  return (
    <div className="lg:grid lg:grid-cols-[minmax(400px,460px)_1fr]">
    <div className="relative min-h-dvh pb-28 lg:pb-10">
      <a
        href="#results"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("results")?.focus();
        }}
        className="sr-only z-50 rounded-full bg-cream px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to spots
      </a>
      <header className="sticky top-0 z-20 bg-ink/90 pt-safe backdrop-blur-xl">
        <h1 className="sr-only">Happy hours in Vancouver</h1>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Link to="/welcome" aria-label="A Little Hang" className="grid min-h-11 min-w-11 place-items-center">
            <Wordmark className="h-10 text-cream" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocationOpen(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink-2 px-3.5 text-[13px] font-medium text-sky-fg transition-transform active:scale-95"
            >
              {locationState === "granted" ? (
                <>
                  <LocateFixed className="size-4" /> Near me
                </>
              ) : locationState === "asking" ? (
                <>
                  <LocateFixed className="size-4" /> Finding you…
                </>
              ) : (
                <>
                  <MapPin className="size-4 shrink-0" />
                  <span className="max-w-[9.5rem] truncate">Near {origin.name}</span>
                  <span className="text-cream/60">· Change</span>
                </>
              )}
            </button>
            <Link to="/saved" aria-label="Saved spots" className="relative grid size-11 place-items-center rounded-full bg-ink-2 text-cream transition-transform active:scale-90">
              <Heart className="size-[18px]" />
              {saved.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular">
                  {saved.length}
                </span>
              )}
            </Link>
          </div>
        </div>
        <SearchBar className="px-4" onOpenFilters={() => setFiltersOpen(true)} />
        <TimeTabs className="py-3" onOpenPlan={() => setPlanOpen(true)} />
      </header>

      <OfflineBanner />
      <main id="results" tabIndex={-1} className="px-4 outline-none">
        {loadFailed && rows.length === 0 ? (
          <EmptyState
            emoji="📡"
            title="Couldn't load happy hours"
            body="Check your connection and try again. Once loaded, spots stay on your phone for next time."
            action={<Button onClick={() => window.location.reload()}>Try again</Button>}
          />
        ) : loading && rows.length === 0 ? (
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-[84px] rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            emoji={filters.tab === "live" ? "🌙" : "🔍"}
            title={filters.tab === "live" ? "Nothing pouring right now" : "No hangs match"}
            body={
              filters.tab === "live"
                ? "Happy hours are quiet at the moment. See what starts next."
                : "Try a different search, or loosen the filters."
            }
            action={
              filters.tab === "live" ? (
                <Button onClick={() => setFilters({ tab: "upcoming" })}>See upcoming</Button>
              ) : (
                <Button variant="secondary" onClick={() => { resetFilters(); setFilters({ query: "" }); }}>
                  Clear everything
                </Button>
              )
            }
          />
        ) : (
          sections.map((s) => {
            if (budget <= 0) return null;
            const shown = s.rows.slice(0, budget);
            budget -= shown.length;
            return (
              <section key={s.title} className="pt-3 pb-2">
                <h2 className="mb-2.5 flex items-baseline justify-between">
                  <span className="font-display text-[20px] font-bold tracking-tight">{s.title}</span>
                  <span className="text-[13px] text-muted-foreground tabular">{s.rows.length}</span>
                </h2>
                <ul key={filters.tab} className="space-y-2.5">
                  {shown.map((r) => (
                    <li
                      key={r.venue.id}
                      id={`row-${r.venue.id}`}
                      style={{ "--i": n++ } as CSSProperties}
                      aria-current={selected === r.venue.id || undefined}
                      className={cn(
                        "animate-rise scroll-mt-48 rounded-2xl transition-[box-shadow,transform] duration-300 ease-out",
                        selected === r.venue.id && "animate-pop ring-2 ring-primary shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
                      )}
                    >
                      <VenueRow row={r} now={now} onHover={desktop ? setHovered : undefined} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
        {rows.length > limit && (
          <div className="flex justify-center py-6">
            <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE * 2)}>
              Show more spots
            </Button>
          </div>
        )}
        <ExploreLinks />
        {rows.length > 0 && rows.length <= limit && <InfoNav />}
      </main>

      {!desktop && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),20px)]">
          <ViewToggle view="list" />
        </div>
      )}

      <FiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <PlanDrawer open={planOpen} onOpenChange={setPlanOpen} />
      <LocationDrawer open={locationOpen} onOpenChange={setLocationOpen} />
    </div>
    {desktop && (
      <aside aria-label="Map" className="sticky top-0 h-dvh p-3 pl-1">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-ink-2 ring-1 ring-edge/5">
          <Suspense fallback={null}>
            <DesktopMap rows={rows} now={now} selected={selected} hovered={hovered} onSelect={setSelected} />
          </Suspense>
        </div>
      </aside>
    )}
    </div>
  );
}
