import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { FiltersDrawer } from "@/components/filters-drawer";
import { MapCard } from "@/components/map-card";
import { PlanDrawer } from "@/components/plan-drawer";
import { SearchBar } from "@/components/search-bar";
import { TimeTabs } from "@/components/time-tabs";
import { VenueMap } from "@/components/venue-map";
import { ViewToggle } from "@/components/view-toggle";
import { markHero } from "@/lib/motion";
import { spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import { useIsDesktop } from "@/lib/use-media";
import { useTitle } from "@/lib/use-title";

const CAROUSEL_MAX = 40;
const FOCUS_KEY = "alh:map-focus";

export function MapScreen() {
  const desktop = useIsDesktop();
  useTitle("Map of happy hours near you");
  const { rows, now } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  // A pin tap opens that spot straight away. Swiping the strip only
  // follows a spot: it rings that pin and eases the map to it.
  const navigate = useNavigate();
  // Coming back from a venue puts the strip and map where you left them.
  const [focused, setFocused] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(FOCUS_KEY);
    } catch {
      return null;
    }
  });
  const strip = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const cards = useMemo(() => mappable.slice(0, CAROUSEL_MAX), [mappable]);

  useEffect(() => {
    try {
      if (focused) sessionStorage.setItem(FOCUS_KEY, focused);
    } catch {
      // Private mode: the strip just starts at the top next time.
    }
  }, [focused]);
  // Scroll the strip back to the remembered card, once.
  useEffect(() => {
    const el = focused && strip.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(focused)}"]`);
    if (!el || !strip.current) return;
    programmaticScroll.current = true;
    strip.current.scrollTo({ left: el.offsetLeft - 16, behavior: "auto" });
    setTimeout(() => (programmaticScroll.current = false), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (best && best !== focused) setFocused(best);
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-ink">
      <VenueMap
        rows={mappable}
        selected={null}
        hovered={focused}
        follow={focused}
        onSelect={(id) => {
          if (!id) return;
          markHero(null, id);
          navigate(spotPath(id), { viewTransition: true });
        }}
        remember="alh:map-camera"
        insetTop={150}
        insetBottom={96}
        locateClassName={cards.length ? "bottom-[176px]" : "bottom-24"}
      />

      <h1 className="sr-only">Map of happy hours</h1>
      <header className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-ink via-ink/80 to-transparent pt-safe pb-6">
        <SearchBar className="px-4 pt-3" onOpenFilters={() => setFiltersOpen(true)} />
        <TimeTabs className="pt-3" onOpenPlan={() => setPlanOpen(true)} />
      </header>

      <div className="absolute inset-x-0 bottom-0 z-10 pb-[max(env(safe-area-inset-bottom),12px)]">
        {cards.length > 0 ? (
          <div
            ref={strip}
            onScroll={onStripScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2.5"
          >
            {cards.map((r, i) => (
              <div
                key={r.venue.id}
                data-id={r.venue.id}
                style={{ "--i": Math.min(i, 3) } as CSSProperties}
                className="animate-rise w-[calc(100vw-56px)] max-w-[360px] shrink-0 snap-start"
              >
                <MapCard row={r} now={now} active={focused ? r.venue.id === focused : i === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-rise mx-4 mb-2.5 rounded-[24px] bg-ink-2">
            <EmptyState emoji="🗺️" title="No spots on the map" body="Nothing matches here. Try another time or fewer filters." />
          </div>
        )}
        <div className="flex justify-center">
          <ViewToggle view="map" />
        </div>
      </div>

      <FiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <PlanDrawer open={planOpen} onOpenChange={setPlanOpen} />
    </main>
  );
}
