import { ArrowLeft, BadgeCheck, ExternalLink, Flag, Globe, Heart, Navigation, Phone, Share, Star } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { MiniMap } from "@/components/mini-map";
import { NotifyDrawer, remindersAsked } from "@/components/notify-drawer";
import { StatusDot } from "@/components/status";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { VenuePhoto } from "@/components/venue-photo";
import { walkLabel, distanceKm } from "@/lib/geo";
import { DAY_FULL, DAY_SHORT, endingSoon, fmtRange, nowHHMM, occurrence, statusLabel, windowsForDay } from "@/lib/hours";
import { fmtChecked, reportLink } from "@/lib/links";
import { goBack } from "@/lib/motion";
import { useTitle } from "@/lib/use-title";
import { absoluteUrl, queryParams, spotPath } from "@/lib/routes";
import { shareLink } from "@/lib/share";
import { useStore } from "@/lib/store";
import type { Category, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";


function amenityPills(v: Venue) {
  const a = v.amenities;
  return [
    a.patio && { emoji: "🌳", label: "Patio" },
    a.transit && { emoji: "🚇", label: a.transitStation ? `Near ${a.transitStation}` : "Near transit" },
    a.accessible && { emoji: "♿", label: "Accessible" },
    a.liveMusic && { emoji: "🎵", label: "Live music" },
    a.groups && { emoji: "👯", label: "Good for groups" },
  ].filter(Boolean) as { emoji: string; label: string }[];
}

// Consecutive days (Mon-first) with the same windows collapse into one
// row: "Every day", "Mon–Fri", "Sat & Sun".
const WEEK = [1, 2, 3, 4, 5, 6, 0];
function dayRuns(v: Venue) {
  const runs: { days: number[]; key: string; wins: ReturnType<typeof windowsForDay> }[] = [];
  for (const d of WEEK) {
    const wins = windowsForDay(v, d);
    const key = wins.map((w) => `${w.start}-${w.end}`).join();
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.days.push(d);
    else runs.push({ days: [d], key, wins });
  }
  return runs;
}

function runLabel(days: number[]) {
  if (days.length === 7) return "Every day";
  if (days.length === 1) return DAY_FULL[days[0]];
  if (days.length === 2) return `${DAY_SHORT[days[0]]} & ${DAY_SHORT[days[1]]}`;
  return `${DAY_SHORT[days[0]]}–${DAY_SHORT[days[days.length - 1]]}`;
}

export function Spot() {
  const params = useParams();
  const id = (params.id ?? params.file ?? "").replace(/\.html$/, "");
  const { byId, now, loading, deviceLocation, area, saved, toggleSaved } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const venue = byId(id);
  useTitle(venue ? `${venue.name} · happy hour ${fmtRange(venue.hh.start, venue.hh.end)}` : loading ? null : "Spot not found");
  const [cat, setCat] = useState<Category>("drink");
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(() => queryParams().get("sheet") === "notify");

  const deals = useMemo(() => {
    if (!venue) return { food: [], drink: [] };
    return {
      food: venue.hh.deals.filter((d) => d.category === "food"),
      drink: venue.hh.deals.filter((d) => d.category === "drink"),
    };
  }, [venue]);

  if (!venue) {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-[300px] rounded-none" />
          <div className="space-y-3 px-5">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      );
    }
    return (
      <div className="grid min-h-dvh place-items-center">
        <EmptyState emoji="🍂" title="We can't find that spot" body="It may have closed or moved." action={<Button onClick={() => navigate("/")}>Back to the list</Button>} />
      </div>
    );
  }

  const occ = occurrence(venue, now);
  const soon = endingSoon(occ, now);
  const today = now.getDay();
  const nowT = nowHHMM(now);
  const tab = deals[cat].length || !deals[cat === "food" ? "drink" : "food"].length ? cat : cat === "food" ? "drink" : "food";
  // Walking time only from a real starting point, not the Downtown default.
  const location = deviceLocation ?? area;
  const km = location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null;
  const pills = amenityPills(venue);
  const q = encodeURIComponent(`${venue.name}, ${venue.address}`);

  const isSaved = saved.includes(venue.id);
  const onSave = () => {
    const nowSaved = toggleSaved(venue.id);
    toast(nowSaved ? "Saved to your spots" : "Removed from your spots");
    if (nowSaved && !remindersAsked()) setTimeout(() => setNotifyOpen(true), 600);
  };
  const checked = venue.checked ? fmtChecked(venue.checked, now) : null;

  const onShare = async () => {
    const res = await shareLink(`${venue.name} on A Little Hang`, `Happy hour at ${venue.name}: ${fmtRange(venue.hh.start, venue.hh.end)}`, absoluteUrl(spotPath(venue.id)));
    if (res === "copied") toast("Link copied");
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl pb-28">
      {/* Photo header */}
      <div className="relative">
        <VenuePhoto venue={venue} eager hero="hero" className="h-[min(42vh,340px)] w-full lg:rounded-b-[28px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-ink" />
        <div className="absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <button
            onClick={() => goBack(navigate)}
            aria-label="Back"
            className="grid size-11 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition-transform active:scale-90"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              aria-label={isSaved ? "Remove from saved" : "Save"}
              aria-pressed={isSaved}
              className="grid size-11 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition-transform active:scale-90"
            >
              <Heart className={cn("size-[18px]", isSaved && "fill-primary text-primary")} />
            </button>
            <button onClick={onShare} aria-label="Share" className="grid size-11 place-items-center rounded-full bg-ink/70 text-cream backdrop-blur transition-transform active:scale-90">
              <Share className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Identity */}
      <section style={{ "--i": 1 } as CSSProperties} className="animate-rise relative -mt-14 px-5">
        {occ.status === "live" ? (
          <Badge variant="live" className="mb-3">
            <span className="size-1.5 rounded-full bg-ink" /> Happening now · {statusLabel(occ, now).toLowerCase()}
          </Badge>
        ) : occ.status === "upcoming" ? (
          <Badge variant="upcoming" className="mb-3">{statusLabel(occ, now)}</Badge>
        ) : null}
        <h1 className="font-display text-[34px] leading-[1.02] font-extrabold tracking-[-0.025em]">{venue.name}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {venue.address}
          {km != null && walkLabel(km) && <span className="text-sky"> · {walkLabel(km)}</span>}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          {venue.rating != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 fill-amber text-amber" /> {venue.rating.toFixed(1)}
              {venue.ratings ? <span className="text-muted-foreground">({venue.ratings.toLocaleString()})</span> : null}
            </span>
          )}
          {venue.hh.verified && (
            <Badge variant="sky" size="sm">
              <BadgeCheck className="size-3.5" /> Verified
            </Badge>
          )}
          {checked && <span className="text-muted-foreground">Times checked {checked}</span>}
        </div>
        {pills.length > 0 && (
          <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
            {pills.map((p) => (
              <Badge key={p.label} className="h-8 shrink-0 bg-ink-2 px-3">
                <span>{p.emoji}</span> {p.label}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Deals */}
      <section style={{ "--i": 2 } as CSSProperties} className="animate-rise mt-7 px-5">
        {venue.hh.deals.length === 0 && <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">Deals</h2>}
        <div role="tablist" className={cn("mb-3 flex gap-6", venue.hh.deals.length === 0 && "hidden")}>
          {(["drink", "food"] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={tab === c}
              onClick={() => setCat(c)}
              className={cn(
                "relative pt-2 pb-2.5 font-display text-[19px] font-bold transition-colors",
                tab === c ? "text-cream after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary" : "text-muted-foreground",
              )}
            >
              {c === "drink" ? "Drinks" : "Food"}
              <span className="ml-1.5 text-[13px] font-medium text-muted-foreground tabular">{deals[c].length}</span>
            </button>
          ))}
        </div>
        <div className="rounded-[22px] bg-ink-2 px-4">
          {deals[tab].length ? (
            <ul>
              {deals[tab].map((d, i) => (
                <li key={`${d.name}-${i}`} className="border-b border-border py-3.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold">{d.name}</span>
                    <span className="shrink-0 font-display text-[16px] font-bold text-pink tabular">{d.price}</span>
                  </div>
                  {d.description && <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{d.description}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[15px] font-semibold">Deals not listed yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">We know the times, but haven't confirmed the menu.</p>
              {venue.hh.source && (
                <a href={venue.hh.source} target="_blank" rel="noopener" className="mt-1 inline-flex min-h-11 items-center gap-1 px-2 text-[14px] font-semibold text-primary">
                  See their menu <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Schedule */}
      <section style={{ "--i": 3 } as CSSProperties} className="animate-rise mt-8 px-5">
        <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">Happy hour times</h2>
        <ul className="space-y-1">
          {dayRuns(venue).map((run) => {
            const wins = run.wins;
            const isToday = run.days.includes(today);
            return (
              <li
                key={run.days.join()}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px]",
                  isToday && "bg-ink-2",
                  !wins.length && "text-muted-foreground",
                )}
              >
                <span className={cn("flex items-center gap-2", isToday && "font-semibold")}>
                  {runLabel(run.days)}
                  {isToday && <Badge size="sm" variant="pink">Today</Badge>}
                </span>
                <span className="flex items-center gap-1.5 tabular">
                  {wins.length
                    ? wins.map((w, i) => {
                        const live = isToday && occ.status === "live" && nowT >= w.start && (w.end <= w.start || nowT < w.end);
                        return (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span className="text-muted-foreground">·</span>}
                            {live && <StatusDot occ={occ} />}
                            <span className={cn(live && "font-bold text-lime")}>{fmtRange(w.start, w.end)}</span>
                            {w.label && <span className="text-[13px] text-muted-foreground">{w.label}</span>}
                          </span>
                        );
                      })
                    : "None"}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 px-3 text-[13px] text-muted-foreground">
          <span>
            {venue.hh.verified ? "Verified against their menu" : "From their website"}
            {venue.hh.source && (
              <>
                {" · "}
                <a href={venue.hh.source} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center underline underline-offset-4">
                  source
                </a>
              </>
            )}
          </span>
          <a href={reportLink(venue)} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-cream">
            <Flag className="size-3.5" /> Report a wrong time
          </a>
        </div>
      </section>

      {/* Location */}
      {venue.lat != null && venue.lng != null && (
        <section style={{ "--i": 4 } as CSSProperties} className="animate-rise mt-8 px-5">
          <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">Find us here</h2>
          <button onClick={() => setDirectionsOpen(true)} className="block w-full overflow-hidden rounded-[22px] bg-ink-2 text-left">
            <MiniMap lat={venue.lat} lng={venue.lng} className="h-[170px] w-full" />
            <div className="flex items-center justify-between gap-3 p-4">
              <span className="text-[15px]">{venue.address}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-primary">
                <Navigation className="size-4" /> Directions
              </span>
            </div>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {venue.phone && (
              <Button variant="secondary" render={<a href={`tel:${venue.phone}`} />}>
                <Phone /> Call
              </Button>
            )}
            {venue.website && (
              <Button variant="secondary" render={<a href={venue.website} target="_blank" rel="noopener" />} className={cn(!venue.phone && "col-span-2")}>
                <Globe /> Website
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 lg:max-w-2xl pt-3 pb-[max(env(safe-area-inset-bottom),14px)]">
          <div className="min-w-0">
            {occ.start && occ.end ? (
              <>
                <p className="flex items-center gap-2 font-display text-[20px] font-extrabold tabular">
                  <StatusDot occ={occ} />
                  {fmtRange(occ.start, occ.end)}
                  {soon && <span className="text-[15px] font-bold text-orange">ending soon</span>}
                </p>
                <p className="text-xs text-muted-foreground">{occ.status === "live" ? "Happy hour on now" : statusLabel(occ, now)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No happy hour times listed</p>
            )}
          </div>
          {venue.lat != null && venue.lng != null ? (
            <Button onClick={() => setDirectionsOpen(true)}>
              <Navigation /> Directions
            </Button>
          ) : (
            <Button variant="cream" onClick={onShare}>
              <Share /> Share
            </Button>
          )}
        </div>
      </div>

      <Drawer open={directionsOpen} onOpenChange={setDirectionsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Get directions</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 px-5 pt-1 pb-6">
            <Button size="lg" variant="secondary" className="w-full justify-start" render={<a href={`https://maps.apple.com/?q=${q}`} target="_blank" rel="noopener" />}>
              Apple Maps
            </Button>
            <Button size="lg" variant="secondary" className="w-full justify-start" render={<a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener" />}>
              Google Maps
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <NotifyDrawer open={notifyOpen} onOpenChange={setNotifyOpen} />

      <Link to="/" className="sr-only">
        Back to list
      </Link>
    </main>
  );
}
