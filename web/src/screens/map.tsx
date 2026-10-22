import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { FiltersDrawer } from "@/components/filters-drawer";
import { MapCard } from "@/components/map-card";
import { PlanDrawer } from "@/components/plan-drawer";
import { SearchBar } from "@/components/search-bar";
import { TimeTabs } from "@/components/time-tabs";
import { VenueMap } from "@/components/venue-map";
import { ViewToggle } from "@/components/view-toggle";
import { reducedMotion } from "@/lib/motion";
import { useStore } from "@/lib/store";
import { useIsDesktop } from "@/lib/use-media";
import { useTitle } from "@/lib/use-title";

const CAROUSEL_MAX = 40;

export function MapScreen() {
  const desktop = useIsDesktop();
  useTitle("Map of happy hours near you");
  const { rows, now } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const cards = useMemo(() => {
    const top = mappable.slice(0, CAROUSEL_MAX);
    if (selected && !top.some((r) => r.venue.id === selected)) {
      const sel = mappable.find((r) => r.venue.id === selected);
      if (sel) top.unshift(sel);
    }
    return top;
  }, [mappable, selected]);

  // A pin tap scrolls the strip to its card.
  useEffect(() => {
    if (!selected) return;
    const el = strip.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selected)}"]`);
    if (el && strip.current) {
      programmaticScroll.current = true;
      strip.current.scrollTo({ left: el.offsetLeft - 16, behavior: reducedMotion() ? "auto" : "smooth" });
      setTimeout(() => (programmaticScroll.current = false), 500);
    }
  }, [selected]);

  // Desktop shows the map beside the list on "/".
  if (desktop) return <Navigate to="/" replace />;

  const onStripScroll = () => {
    if (programmaticScroll.current || !strip.current) return;
    const s = strip.current;
    const mid = s.scrollLeft + s.clientWidth / 2;
    let best: string | null = null;
    let bestD = Infinity;
    s.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - mid);
      if (d < bestD) {
        bestD = d;
        best = el.dataset.id!;
      }
    });
    if (best && best !== selected) setSelected(best);
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-ink">
      <VenueMap rows={mappable} selected={selected} onSelect={setSelected} focusOffset={110} locateClassName={cards.length ? "bottom-[302px]" : "bottom-28"} />

      <h1 className="sr-only">Map of happy hours</h1>
      <header className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-ink via-ink/80 to-transparent pt-safe pb-6">
        <SearchBar className="px-4 pt-3" onOpenFilters={() => setFiltersOpen(true)} />
        <TimeTabs className="pt-3" onOpenPlan={() => setPlanOpen(true)} />
      </header>

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[max(env(safe-area-inset-bottom),20px)]">
        {cards.length > 0 ? (
          <div
            ref={strip}
            onScroll={onStripScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-4"
          >
            {cards.map((r, i) => (
              <div
                key={r.venue.id}
                data-id={r.venue.id}
                style={{ "--i": Math.min(i, 3) } as CSSProperties}
                className="animate-rise w-[calc(100vw-56px)] max-w-[360px] shrink-0 snap-start"
              >
                <MapCard row={r} now={now} active={selected ? r.venue.id === selected : i === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-rise mx-4 mb-4 rounded-[24px] bg-ink-2">
            <EmptyState emoji="🗺️" title="No spots on the map" body="Nothing matches here. Try another time or fewer filters." />
          </div>
        )}
        <div className="flex justify-center">
          <ViewToggle view="map" />
        </div>
      </div>

      <FiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <PlanDrawer open={planOpen} onOpenChange={setPlanOpen} />
    </div>
  );
}
