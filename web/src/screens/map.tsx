import { X } from "lucide-react";
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
import { useStore } from "@/lib/store";
import { useIsDesktop } from "@/lib/use-media";
import { useTitle } from "@/lib/use-title";
import { cn } from "@/lib/utils";

const CAROUSEL_MAX = 40;

export function MapScreen() {
  const desktop = useIsDesktop();
  useTitle("Map of happy hours near you");
  const { rows, now } = useStore();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  // A pin tap selects a spot and pops its card up beside the pin, and the
  // card strip steps aside. Swiping the strip only follows a spot: it
  // rings that pin and eases the map to it.
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  const mappable = useMemo(() => rows.filter((r) => r.venue.lat != null && r.venue.lng != null), [rows]);
  const cards = useMemo(() => mappable.slice(0, CAROUSEL_MAX), [mappable]);
  const picked = selected ? mappable.find((r) => r.venue.id === selected) : undefined;

  // Closing a pin's card brings the strip back on the card it had.
  useEffect(() => {
    if (selected || !focused) return;
    const el = strip.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(focused)}"]`);
    if (el && strip.current) {
      programmaticScroll.current = true;
      strip.current.scrollTo({ left: el.offsetLeft - 16, behavior: "auto" });
      setTimeout(() => (programmaticScroll.current = false), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (best && best !== focused) setFocused(best);
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-ink">
      <VenueMap
        rows={mappable}
        selected={selected}
        hovered={selected ? null : focused}
        follow={selected ? null : focused}
        onSelect={setSelected}
        insetTop={150}
        insetBottom={96}
        locateClassName={cards.length && !selected ? "bottom-[176px]" : "bottom-24"}
        popover={
          picked && (
            <>
              <MapCard row={picked} now={now} active />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute -top-3 -right-2 z-10 grid size-9 place-items-center rounded-full bg-ink-2 text-cream shadow-lg ring-1 ring-edge/15 transition-transform active:scale-90"
              >
                <X className="size-4" />
              </button>
            </>
          )
        }
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
            aria-hidden={!!selected || undefined}
            inert={!!selected || undefined}
            className={cn(
              "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2.5 transition-[transform,opacity] duration-300 ease-out",
              selected && "pointer-events-none translate-y-[calc(100%+16px)] opacity-0",
            )}
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
