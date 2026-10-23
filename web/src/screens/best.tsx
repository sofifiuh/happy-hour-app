import { ArrowLeft, List, Map as MapIcon, Share2, X } from "lucide-react";
import { type CSSProperties, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { fmtScore, TOP_SCORE } from "@/components/hang-score";
import { MapCard } from "@/components/map-card";
import { Countdown, StatusDot } from "@/components/status";
import { useToast } from "@/components/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { VenuePhoto } from "@/components/venue-photo";
import { distanceKm, walkLabel } from "@/lib/geo";
import { endingSoon, fmtRange, occurrence, statusLabel } from "@/lib/hours";
import { goBack, markHero } from "@/lib/motion";
import { absoluteUrl, BROWSER_ROUTER, spotPath } from "@/lib/routes";
import { shareLink } from "@/lib/share";
import { useStore, type Row } from "@/lib/store";
import type { BestList } from "@/lib/types";
import { useIsDesktop } from "@/lib/use-media";
import { useTitle } from "@/lib/use-title";
import { cn } from "@/lib/utils";

const DesktopMap = lazy(() => import("@/components/desktop-map"));
const VenueMap = lazy(() => import("@/components/venue-map").then((m) => ({ default: m.VenueMap })));

// The static, indexed copy of each list (scripts/prerender.mjs).
const bestPath = (slug: string) => (slug === "metro" ? "/happy-hour/best/" : `/happy-hour/${slug}/best/`);

// "Best of": each neighbourhood's and city's top Hangout Scores, picked
// with chips, as a ranked list (and a map of the same spots). Opens on the
// list nearest you unless the link names one (?in=gastown).
export function BestScreen() {
  const { best, venues, byId, now, location, deviceLocation, area, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const desktop = useIsDesktop();
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Nearest neighbourhood or city list to you (or your picked area), if
  // one is within a few km; otherwise all of Metro Vancouver.
  const nearest = useMemo(() => {
    if (!deviceLocation && !area) return "metro";
    let pick = "metro";
    let bestD = 4;
    for (const b of best) {
      if (b.kind === "metro") continue;
      const pts = b.ids.map(byId).filter((v) => v?.lat != null && v.lng != null);
      if (!pts.length) continue;
      const c = { lat: pts.reduce((s, v) => s + v!.lat!, 0) / pts.length, lng: pts.reduce((s, v) => s + v!.lng!, 0) / pts.length };
      // Neighbourhoods win over the city that contains them.
      const d = distanceKm(location, c) + (b.kind === "city" ? 1.5 : 0);
      if (d < bestD) [bestD, pick] = [d, b.slug];
    }
    return pick;
  }, [best, byId, location, deviceLocation, area]);

  const slug = params.get("in") ?? nearest;
  const list: BestList | undefined = best.find((b) => b.slug === slug) ?? best.find((b) => b.slug === "metro");
  const year = useMemo(() => venues.map((v) => v.checked).filter(Boolean).sort().pop()?.slice(0, 4) ?? String(now.getFullYear()), [venues, now]);
  const title = list ? `Best happy hours in ${list.name}` : "Best happy hours";
  useTitle(list ? `${title} (${year})` : title);

  const rows = useMemo<Row[]>(
    () =>
      (list?.ids ?? [])
        .map(byId)
        .filter((v) => v != null)
        .map((venue) => ({
          venue,
          occ: occurrence(venue, now),
          km: location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null,
        })),
    [list, byId, now, location],
  );

  // Keep the picked chip in view.
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chips.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [list?.slug]);

  const pick = (s: string) => {
    setSelected(null);
    setParams(s === nearest && !params.get("in") ? {} : { in: s }, { replace: true });
  };
  const groups: { label: string; lists: BestList[] }[] = [
    { label: "Metro", lists: best.filter((b) => b.kind === "metro") },
    { label: "Neighbourhoods", lists: best.filter((b) => b.kind === "area") },
    { label: "Cities", lists: best.filter((b) => b.kind === "city") },
  ];

  const share = async () => {
    if (!list) return;
    const url = BROWSER_ROUTER ? window.location.origin + bestPath(list.slug) : absoluteUrl(`/best?in=${list.slug}`);
    const r = await shareLink(`${title} (${year})`, `The ${list.ids.length} best happy hours in ${list.name}, ranked`, url);
    if (r === "copied") toast("Link copied");
  };

  const picked = selected ? rows.find((r) => r.venue.id === selected) : undefined;
  const showMap = !desktop && view === "map";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(400px,460px)_1fr]">
      <div className={cn("relative min-h-dvh pb-16", showMap && "h-dvh overflow-hidden pb-0")}>
        <header className="sticky top-0 z-20 bg-ink/90 pt-safe backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <button
              onClick={() => goBack(navigate)}
              aria-label="Back"
              className="hit grid size-10 shrink-0 place-items-center rounded-full bg-ink-2 text-cream transition-transform active:scale-90"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="min-w-0 flex-1 font-display text-[24px] leading-[1.05] font-extrabold tracking-tight">
              Best of
              <span className="block truncate text-[13px] font-sans font-medium tracking-normal text-muted-foreground">
                {list ? `${list.name} · ${year} · ranked by Hangout Score` : "Ranked by Hangout Score"}
              </span>
            </h1>
            {list && (
              <button
                onClick={share}
                aria-label="Share this list"
                className="hit grid size-10 shrink-0 place-items-center rounded-full bg-ink-2 text-cream transition-transform active:scale-90"
              >
                <Share2 className="size-[18px]" />
              </button>
            )}
          </div>
          <div ref={chips} role="group" aria-label="Pick a neighbourhood or city" className="no-scrollbar fade-x flex gap-2 overflow-x-auto px-4 py-2">
            {groups.map((g) =>
              g.lists.map((b, i) => (
                <button
                  key={b.slug}
                  aria-pressed={b.slug === list?.slug}
                  onClick={() => pick(b.slug)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-medium transition-[color,background-color,transform] duration-200 active:scale-95",
                    b.slug === list?.slug ? "bg-cream text-ink" : "bg-ink-3 text-cream/80 hover:text-cream",
                    i === 0 && g.label !== "Metro" && "ml-2",
                  )}
                >
                  {b.kind === "metro" ? "All Metro" : b.name.replace(/ Vancouver$/, b.kind === "area" ? "" : " Vancouver")}
                </button>
              )),
            )}
          </div>
          {!desktop && (
            <div className="px-4 pt-1 pb-3">
              <div role="tablist" aria-label="View" className="flex rounded-full bg-ink-2 p-1">
                {(["list", "map"] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={view === k}
                    onClick={() => setView(k)}
                    className={cn(
                      "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-[color,background-color] duration-200",
                      view === k ? "bg-cream text-ink" : "text-cream/80",
                    )}
                  >
                    {k === "list" ? <List className="size-4" /> : <MapIcon className="size-4" />}
                    {k === "list" ? "Ranked list" : "Map"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {showMap ? (
          <div className="absolute inset-0 top-0 -z-0">
            <Suspense fallback={<div className="h-full bg-ink-2" />}>
              <VenueMap
                rows={rows.filter((r) => r.venue.lat != null)}
                selected={selected}
                onSelect={setSelected}
                ranked
                insetTop={190}
                locateClassName="bottom-6"
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
            </Suspense>
          </div>
        ) : (
          <main className="px-4">
            {!list ? (
              loading || !best.length ? (
                <div className="space-y-2.5 pt-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-[96px] rounded-2xl" />
                  ))}
                </div>
              ) : (
                <EmptyState emoji="🏆" title="No lists yet" body="Best-of lists show up once a place has enough scored happy hours." />
              )
            ) : (
              <>
                <p className="pt-2 pb-3 text-[14px] leading-snug text-muted-foreground">
                  The top {rows.length} of {list.scored} scored happy hours in {list.name}, from real menu prices, deals, hours and vibe.
                </p>
                <ol key={list.slug} className="space-y-2.5">
                  {rows.map((r, i) => (
                    <li key={r.venue.id} id={`row-${r.venue.id}`} style={{ "--i": i } as CSSProperties} className={cn("animate-rise rounded-2xl", selected === r.venue.id && "ring-2 ring-primary")}>
                      <BestRow row={r} rank={i + 1} now={now} onHover={desktop ? setHovered : undefined} />
                    </li>
                  ))}
                </ol>
                <section className="mt-6 rounded-[22px] bg-ink-2 p-4 text-[14px] leading-snug">
                  <h2 className="font-display text-[17px] font-bold">How we rank</h2>
                  <p className="mt-1.5 text-muted-foreground">
                    Value 40%, selection 25%, hours 20% and vibe 15%, worked out the same way for every spot from its own menu. Nobody pays to rank,
                    and Google star ratings aren't used. Lists update every night with the menus.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5">
                    <Link to="/about#hang-score" className="inline-flex min-h-11 items-center font-semibold text-orange-fg underline-offset-4 hover:underline">
                      How we score
                    </Link>
                    {BROWSER_ROUTER && (
                      <a href={bestPath(list.slug)} className="inline-flex min-h-11 items-center font-semibold text-orange-fg underline-offset-4 hover:underline">
                        Full page for {list.name}
                      </a>
                    )}
                  </div>
                </section>
              </>
            )}
          </main>
        )}
      </div>
      {desktop && (
        <aside aria-label="Map" className="sticky top-0 h-dvh p-3 pl-1">
          <div className="relative h-full overflow-hidden rounded-[28px] bg-ink-2 ring-1 ring-edge/5">
            <Suspense fallback={null}>
              <DesktopMap ranked rows={rows} now={now} selected={selected} hovered={hovered} onSelect={setSelected} />
            </Suspense>
          </div>
        </aside>
      )}
    </div>
  );
}

// A ranked row: the place number, photo, name with its score, then where it
// is and whether it's on now.
function BestRow({ row, rank, now, onHover }: { row: Row; rank: number; now: Date; onHover?: (id: string | null) => void }) {
  const { venue, occ, km } = row;
  const score = venue.score!;
  const walk = km != null ? walkLabel(km) : "";
  const soon = endingSoon(occ, now);
  return (
    <Link
      to={spotPath(venue.id)}
      viewTransition
      onClick={(e) => markHero(e.currentTarget, venue.id)}
      onMouseEnter={onHover && (() => onHover(venue.id))}
      onMouseLeave={onHover && (() => onHover(null))}
      className="relative flex items-stretch gap-3.5 overflow-hidden rounded-2xl bg-ink-2 pr-3 transition-[background-color,transform] duration-200 ease-out hover:bg-ink-3/70 active:scale-[0.985] active:bg-ink-3"
    >
      <VenuePhoto venue={venue} className="min-h-[96px] w-[84px] shrink-0 self-stretch" />
      <span
        aria-label={`Number ${rank}`}
        className={cn(
          "absolute top-1.5 left-1.5 grid h-7 min-w-7 place-items-center rounded-full px-1.5 font-display text-[14px] leading-none font-extrabold tabular shadow-md",
          rank <= 3 ? "bg-primary text-primary-foreground" : "bg-ink/85 text-cream",
        )}
      >
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3">
        <span className="line-clamp-2 font-display text-[16px] leading-[1.15] font-bold">{venue.name}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {venue.area?.name ?? venue.city}
          {walk && <span className="text-sky-fg"> · {walk}</span>}
        </span>
        <span className="flex items-center gap-1.5 text-[12px]">
          <StatusDot occ={occ} />
          {occ.start && occ.end ? <span className="font-semibold tabular">{fmtRange(occ.start, occ.end)}</span> : <span className="text-muted-foreground">No times listed</span>}
          {occ.status !== "scheduled" && occ.status !== "none" && (
            <Countdown label={statusLabel(occ, now)} className={cn("truncate", soon ? "text-orange-fg" : occ.status === "live" ? "text-lime-fg/80" : "text-muted-foreground")} />
          )}
        </span>
      </div>
      <span
        className={cn(
          "my-auto grid size-[52px] shrink-0 place-items-center rounded-2xl font-display text-[20px] leading-none font-extrabold tabular",
          score.total >= TOP_SCORE ? "bg-lime text-on-pop" : "bg-ink-3 text-cream",
        )}
      >
        <span className="sr-only">Hangout Score </span>
        <span className="flex flex-col items-center">
          {fmtScore(score.total)}
          <span aria-hidden className="mt-0.5 font-sans text-[10px] font-semibold opacity-70">/10</span>
        </span>
      </span>
    </Link>
  );
}
