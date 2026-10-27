import { ArrowLeft, BadgeCheck, Camera, X, ChevronDown, ExternalLink, Flag, Footprints, Globe, Heart, Images, Lightbulb, MessageCircle, Navigation, Phone, Share, Star, Store } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { ScoreCard, ScoreChip } from "@/components/hang-score";
import { GOOGLE_KEY, GoogleMapEmbed, GoogleRating } from "@/components/google-place";
import { MiniMap } from "@/components/mini-map";
import { NotifyDrawer, remindersAsked } from "@/components/notify-drawer";
import { PhotoViewer } from "@/components/photo-viewer";
import { ReportDrawer } from "@/components/report-drawer";
import { StatusDot } from "@/components/status";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { VenuePhoto } from "@/components/venue-photo";
import { walkLabel, distanceKm } from "@/lib/geo";
import { endingSoon, fmtRange, nowHHMM, occurrence, statusLabel } from "@/lib/hours";
import { fmtChecked, reportLink, tipLink } from "@/lib/links";
import { backLabel, goBackToBase } from "@/lib/back-to";
import { useIsDesktop } from "@/lib/use-media";
import { useSwipeBack } from "@/lib/use-swipe-back";
import { useTitle } from "@/lib/use-title";
import { absoluteUrl, BROWSER_ROUTER, queryParams, spotPath } from "@/lib/routes";
import { dayRuns, googleReviewsLink, nearby, quoteCredit, redditLink, redditName, runLabel, venueAbout, venueFaq, venueTitle } from "@/lib/seo";
import { track } from "@/lib/analytics";
import { apiEnabled, count, myVenues } from "@/lib/api";
import { shareLink } from "@/lib/share";
import { useStore } from "@/lib/store";
import type { BestList, Category, Photo, Venue } from "@/lib/types";
import { cn } from "@/lib/utils";


function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "their website";
  }
}

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

// `panel`: shown beside the list and map on desktop (screens/home.tsx),
// which passes the venue's `id` and closes it with `onClose`.
export function Spot({ id: panelId, panel = false, onClose }: { id?: string; panel?: boolean; onClose?: () => void }) {
  const params = useParams();
  const id = panelId ?? (params.id ?? params.file ?? "").replace(/\.html$/, "");
  const { byId, venues, hubs, best, now, loading, deviceLocation, area, saved, toggleSaved } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const venue = byId(id);
  const viewedId = venue?.id;
  useEffect(() => {
    if (!viewedId) return;
    track({ name: "venue_viewed", venue_id: viewedId });
    count(viewedId, "view");
  }, [viewedId]);
  const page = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);
  const desktop = useIsDesktop();
  const back = backLabel(desktop);
  // In the panel, going back to the list or map is closing it.
  const closes = panel && (back === "Map" || back === "List");
  const onBack = panel && onClose ? onClose : () => goBackToBase(navigate, desktop);
  useSwipeBack([page, bar], () => goBackToBase(navigate, desktop, true), !!venue && !panel);
  useTitle(venue ? venueTitle(venue) : loading ? null : "Spot not found", !!venue);
  const [cat, setCat] = useState<Category>("drink");
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const closePhotos = useCallback(() => setPhotosOpen(false), []);
  // The header shade waits for the photo, then fades in over it, so the
  // dark wash never lands on an empty frame or pops in after the hero flight.
  const [shadeFor, setShadeFor] = useState<string | null>(null);
  const showShade = useCallback(() => setShadeFor(id), [id]);
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
      <div className={cn("grid place-items-center", panel ? "h-full" : "min-h-dvh")}>
        <EmptyState emoji="🍂" title="We can't find that spot" body="It may have closed or moved." action={<Button onClick={() => navigate("/")}>Back to the list</Button>} />
      </div>
    );
  }

  // The list beside the panel is the page's <main>.
  const Root = panel ? "article" : "main";
  const near = nearby(venue, venues);
  const occ = occurrence(venue, now);
  const soon = endingSoon(occ, now);
  const today = now.getDay();
  const nowT = nowHHMM(now);
  const tab = deals[cat].length || !deals[cat === "food" ? "drink" : "food"].length ? cat : cat === "food" ? "drink" : "food";
  // Walking time only from a real starting point, not the Downtown default.
  const location = deviceLocation ?? area;
  const km = location && venue.lat != null && venue.lng != null ? distanceKm(location, { lat: venue.lat, lng: venue.lng }) : null;
  const pills = amenityPills(venue);
  const photos: Photo[] = venue.photo ? [{ src: venue.photo, credit: venue.photoCredit, link: venue.photoCreditUrl ?? null }, ...(venue.gallery ?? [])] : [];
  const q = encodeURIComponent(`${venue.name}, ${venue.address}`);

  const isSaved = saved.includes(venue.id);
  const onSave = () => {
    const nowSaved = toggleSaved(venue.id);
    if (nowSaved) {
      track({ name: "saved", venue_id: venue.id });
      count(venue.id, "save");
    }
    toast(nowSaved ? "Saved to your spots" : "Removed from your spots");
    if (nowSaved && !remindersAsked()) setTimeout(() => setNotifyOpen(true), 600);
  };
  const checked = venue.checked ? fmtChecked(venue.checked, now) : null;
  const sourceUrl = venue.source?.url ?? venue.hh.source ?? null;
  const sourceHost = sourceUrl ? hostOf(sourceUrl) : null;
  // City › neighbourhood above the name, linking to their hub pages (the
  // static page's breadcrumb). Without hub pages, the names alone.
  const placeHubs = BROWSER_ROUTER
    ? (venue.hubs ?? [])
        .map((path) => ({ path, hub: hubs[path.split("/").filter(Boolean).pop()!] }))
        .filter(({ hub }) => hub?.kind === "city" || hub?.kind === "area")
        .sort((a, b) => (a.hub.kind === "city" ? -1 : 1) - (b.hub.kind === "city" ? -1 : 1))
        .map(({ path, hub }) => ({ label: hub.label, path: path as string | null }))
    : [];
  const places = placeHubs.length
    ? placeHubs
    : [venue.city, venue.area?.name].filter((l, i, a): l is string => !!l && a.indexOf(l) === i).map((label) => ({ label, path: null }));

  const openDirections = () => {
    track({ name: "directions_clicked", venue_id: venue.id });
    count(venue.id, "directions");
    setDirectionsOpen(true);
  };

  const onShare = async () => {
    track({ name: "share_clicked", venue_id: venue.id });
    count(venue.id, "share");
    const res = await shareLink(`${venue.name} on A Little Hang`, `Happy hour at ${venue.name}: ${fmtRange(venue.hh.start, venue.hh.end)}`, absoluteUrl(spotPath(venue.id)));
    if (res === "copied") toast("Link copied");
  };

  return (
    <>
    <Root ref={page} className={cn(panel ? "pb-8" : "mx-auto min-h-dvh max-w-2xl pb-28")}>
      {/* Photo header */}
      <div className="relative">
        <VenuePhoto
          venue={venue}
          eager
          hero={panel ? undefined : "hero"}
          large
          onReady={showShade}
          className={cn("w-full", panel ? (venue.photo ? "h-[min(36vh,300px)]" : "h-[200px]") : cn("lg:rounded-b-[28px]", venue.photo ? "h-[min(42vh,340px)]" : "h-[240px]"))}
        />
        <div
          style={{ viewTransitionName: panel ? undefined : "hero-shade" }}
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-ink transition-opacity duration-700 ease-[var(--ease-out)]",
            venue.photo ? "from-black/45" : "from-black/15",
            shadeFor === id ? "opacity-100 delay-150" : "opacity-0",
          )}
        />
        {photos.length > 0 && (
          <button onClick={() => setPhotosOpen(true)} aria-label={photos.length > 1 ? `View ${photos.length} photos` : "View photo"} className="absolute inset-0 cursor-zoom-in">
            {photos.length > 1 && (
              <span className="absolute right-4 bottom-[72px] inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-semibold text-cream backdrop-blur">
                <Images className="size-3.5" /> {photos.length}
              </span>
            )}
          </button>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] [&_button]:pointer-events-auto">
          {/* Always back to where browsing started, not the previous venue. */}
          {closes ? (
            <button
              onClick={onBack}
              aria-label="Close"
              aria-keyshortcuts="Escape"
              className="flex h-11 items-center gap-1.5 rounded-full bg-ink/70 pr-4 pl-3 text-[14px] font-semibold text-cream backdrop-blur transition-[transform,background-color] hover:bg-ink/85 active:scale-90"
            >
              <X className="size-5" />
              Close
            </button>
          ) : (
            <button
              onClick={onBack}
              aria-label={back === "Back" ? "Back" : `Back to ${back}`}
              className="flex h-11 items-center gap-1.5 rounded-full bg-ink/70 pr-4 pl-3 text-[14px] font-semibold text-cream backdrop-blur transition-transform active:scale-90"
            >
              <ArrowLeft className="size-5" />
              {back}
            </button>
          )}
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
        {venue.closed && (
          <p role="status" className="mb-3 inline-flex rounded-full bg-orange px-3 py-1 text-[13px] font-semibold text-on-pop">
            Temporarily closed
          </p>
        )}
        {venue.closed ? null : occ.status === "live" ? (
          <Badge variant="live" className="mb-3">
            <span className="size-1.5 rounded-full bg-on-pop" /> Happening now · {statusLabel(occ, now).toLowerCase()}
          </Badge>
        ) : occ.status === "upcoming" ? (
          <Badge variant="upcoming" className="mb-3">{statusLabel(occ, now)}</Badge>
        ) : null}
        {places.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 text-[12px] leading-none font-semibold tracking-[0.12em] text-pink-fg uppercase">
            {places.map((p, i) => (
              <span key={p.label}>
                {i > 0 && <span aria-hidden className="px-1.5 opacity-60">›</span>}
                {p.path ? (
                  <a href={p.path} className="-my-2 inline-block py-2 underline-offset-4 hover:underline">
                    {p.label}
                  </a>
                ) : (
                  p.label
                )}
              </span>
            ))}
          </nav>
        )}
        {/* Reads as the search: "Mangos Kitchen Bar Happy Hour", same words as the title. */}
        <h1 className={cn("font-display font-extrabold tracking-[-0.025em] text-balance", panel ? "text-[30px]" : "text-[34px]", "leading-[1.02]")}>
          {venue.name}
          {!/happy hour/i.test(venue.name) && <span className="text-pink-fg"> Happy Hour</span>}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {venue.address}
          {km != null && walkLabel(km) && <span className="text-sky-fg"> · {walkLabel(km)}</span>}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          {venue.score && (
            <button
              onClick={() => document.getElementById("hang-score")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              aria-label={`${venue.score.total.toFixed(1)} Hangout Score out of 10, see how it scores`}
              className="-my-3 inline-flex min-h-11 items-center gap-1.5 font-semibold"
            >
              <ScoreChip score={venue.score} /> Hangout Score
            </button>
          )}
          {/* Not in the desktop panel: it sits beside our MapLibre map, and Google's
              terms bar showing Places content near a non-Google map. */}
          {!panel && <GoogleRating placeId={venue.placeId} />}
          {venue.hh.verified && (
            <Badge variant="sky" size="sm">
              <BadgeCheck className="size-3.5" /> Verified
            </Badge>
          )}
          {venue.byVenue && (
            <Badge variant="sky" size="sm">
              <Store className="size-3.5" /> Updated by the venue
            </Badge>
          )}
        </div>
        {pills.length > 0 && (
          <div role="region" aria-label="Amenities" tabIndex={0} className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
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
        <h2 className={cn("mb-3 font-display text-[20px] font-bold tracking-tight", venue.hh.deals.length > 0 && "sr-only")}>Happy hour deals</h2>
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
            // Both lists stay in the page (the other one hidden) so the whole
            // menu is there for search engines, not just the open tab.
            (["drink", "food"] as const).map(
              (c) =>
                deals[c].length > 0 && (
                  <div key={c} role="tabpanel" hidden={tab !== c}>
                    <h3 className="sr-only">{c === "drink" ? "Drinks" : "Food"}</h3>
                    <ul>
                      {deals[c].map((d, i) => (
                        <li key={`${d.name}-${i}`} className="border-b border-border py-3.5 last:border-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[15px] font-semibold">{d.name}</span>
                            <span className="shrink-0 font-display text-[16px] font-bold text-pink-fg tabular">{d.price}</span>
                          </div>
                          {d.description && <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{d.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )
          ) : (
            <div className="py-6 text-center">
              <p className="text-[15px] font-semibold">Deals not listed yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">We know the times, but haven't confirmed the menu.</p>
              {venue.hh.source && (
                <a href={venue.hh.source} target="_blank" rel="noopener" className="mt-1 inline-flex min-h-11 items-center gap-1 px-2 text-[14px] font-semibold text-orange-fg">
                  See their menu <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {venue.score && (
        <section id="hang-score" style={{ "--i": 3 } as CSSProperties} className="animate-rise mt-8 scroll-mt-6 px-5">
          <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">How this happy hour scores</h2>
          <ScoreCard score={venue.score} />
          <RankLink best={best} venue={venue} />
        </section>
      )}

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
                  "flex items-start justify-between gap-4 rounded-2xl px-4 py-3 text-[15px]",
                  isToday && "bg-ink-2 ring-1 ring-edge/5",
                  !wins.length && "text-muted-foreground",
                )}
              >
                <span className="flex flex-col">
                  <span className={cn(isToday && "font-semibold")}>{runLabel(run.days)}</span>
                  {isToday && <span className="mt-0.5 text-[11px] font-bold tracking-[0.08em] text-pink-fg uppercase">Today</span>}
                </span>
                {wins.length ? (
                  <ul className="flex flex-col items-end gap-1.5 tabular">
                    {wins.map((w, i) => {
                      const live = isToday && occ.status === "live" && nowT >= w.start && (w.end <= w.start || nowT < w.end);
                      return (
                        <li key={i} className="flex items-center gap-2 whitespace-nowrap">
                          {w.label && <span className="text-[13px] text-muted-foreground">{w.label}</span>}
                          {live && <StatusDot occ={occ} />}
                          <span className={cn(live && "font-bold text-lime-fg")}>{fmtRange(w.start, w.end)}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <span>No happy hour</span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 px-3 text-[13px] text-muted-foreground">
          <span>
            {venue.byVenue ? "From the venue" : venue.hh.fromGuest ? "From a guest's menu photo, checked by us" : venue.hh.verified ? "Verified against their menu" : "From their website"}
            {checked && `, times checked ${checked}`}
            {sourceUrl && (
              <>
                {" · "}
                {/* "your mom" until hovered or focused, then the real site. Both
                    share one grid cell so the link doesn't change size under the
                    pointer. Taps still open it; screen readers get the site. */}
                <span className="whitespace-nowrap">
                  Source:{" "}
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    aria-label={`Source: ${sourceHost}`}
                    title={sourceUrl}
                    className="group/src -my-3 inline-grid py-3 underline underline-offset-4 hover:text-cream focus-visible:text-cream"
                  >
                    <span className="col-start-1 row-start-1 transition-opacity duration-150 group-hover/src:opacity-0 group-focus-visible/src:opacity-0">your mom</span>
                    <span aria-hidden className="col-start-1 row-start-1 opacity-0 transition-opacity duration-150 group-hover/src:opacity-100 group-focus-visible/src:opacity-100">
                      {sourceHost}
                    </span>
                  </a>
                </span>
              </>
            )}
          </span>
          <span className="flex flex-wrap gap-x-4">
            {apiEnabled ? (
              <>
                <button onClick={() => setReportOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-cream">
                  <Flag className="size-3.5" /> Report a wrong time
                </button>
                <Link to={`/submit?venue=${encodeURIComponent(venue.id)}`} viewTransition className="inline-flex min-h-11 items-center gap-1.5 font-medium text-cream">
                  <Camera className="size-3.5" /> Send a newer menu
                </Link>
              </>
            ) : (
              <a href={reportLink(venue)} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-cream">
                <Flag className="size-3.5" /> Report a wrong time
              </a>
            )}
            {/* Static page with the venue's embed badge (scripts/badges.mjs); only the alittlehang.com build has it. */}
            {BROWSER_ROUTER && (
              <a href={`/badge/${venue.id}/`} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-cream">
                <BadgeCheck className="size-3.5" /> Get a badge for your site
              </a>
            )}
          </span>
        </div>
      </section>

      {/* What people say: hand-picked press quotes (quotes.json), then links.
          Google's and Reddit's terms don't allow copying or summarizing their
          reviews and posts, so for those we only link. */}
      <section style={{ "--i": 4 } as CSSProperties} className="animate-rise mt-8 px-5">
        <h2 className="mb-1 font-display text-[20px] font-bold tracking-tight">What people say</h2>
        <p className="mb-3 text-[14px] text-muted-foreground">
          {venue.quotes?.length ? `What's been written about the ${venue.name} happy hour, and where to read more.` : `See what locals say about the ${venue.name} happy hour.`}
        </p>
        {venue.quotes?.map((q) => (
          <figure key={q.url + q.text} className="mb-2 rounded-[22px] bg-ink-2 px-4 pt-4 pb-1">
            <blockquote cite={q.url} className="text-[15px] leading-snug font-medium">
              “{q.text}”
            </blockquote>
            <figcaption className="mt-0.5 text-[13px] text-muted-foreground">
              <a href={q.url} target="_blank" rel="nofollow noopener noreferrer" onClick={() => track({ name: "people_say_clicked", venue_id: venue.id, kind: "quote" })} className="inline-flex min-h-11 items-center gap-1 underline underline-offset-2 hover:text-cream">
                {quoteCredit(q)}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </figcaption>
          </figure>
        ))}
        <ul className="rounded-[22px] bg-ink-2 px-4">
          {[
            { href: redditLink(venue), icon: MessageCircle, label: "Search Reddit", sub: `“${redditName(venue)} happy hour”`, ext: true, kind: "reddit" },
            { href: googleReviewsLink(venue), icon: Star, label: "Read Google reviews", sub: "Opens Google Maps", ext: true, kind: "google" },
            { href: tipLink(venue), icon: Lightbulb, label: "Been here? Send us a tip", sub: "Best deal, busy times, what to skip", ext: false, kind: "tip" },
          ].map((l) => (
            <li key={l.kind} className="border-b border-border last:border-0">
              <a
                href={l.href}
                {...(l.ext && { target: "_blank", rel: "nofollow noopener noreferrer" })}
                onClick={() => track({ name: "people_say_clicked", venue_id: venue.id, kind: l.kind })}
                className="flex min-h-14 items-center gap-3 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-3">
                  <l.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">
                    {l.label}
                    {l.ext && <span className="sr-only"> (opens in a new tab)</span>}
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground">{l.sub}</span>
                </span>
                {l.ext ? <ExternalLink className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground" />}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Location */}
      {venue.lat != null && venue.lng != null && (
        <section style={{ "--i": 5 } as CSSProperties} className="animate-rise mt-8 px-5">
          <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">Find us here</h2>
          <button onClick={openDirections} className="block w-full overflow-hidden rounded-[22px] bg-ink-2 text-left">
            {/* Google's terms: its rating can't sit near a non-Google map. */}
            {GOOGLE_KEY ? (
              <GoogleMapEmbed placeId={venue.placeId} query={`${venue.name} ${venue.address}`} className="h-[170px] w-full" />
            ) : (
              <MiniMap lat={venue.lat} lng={venue.lng} others={near as { lat: number; lng: number }[]} className="h-[170px] w-full" />
            )}
            <div className="flex items-center justify-between gap-3 p-4">
              <span className="text-[15px]">{venue.address}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-orange-fg">
                <Navigation className="size-4" /> Directions
              </span>
            </div>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {venue.phone && (
              <Button variant="secondary" render={<a href={`tel:${venue.phone}`} onClick={() => count(venue.id, "call")} />}>
                <Phone /> Call
              </Button>
            )}
            {venue.website && (
              <Button
                variant="secondary"
                render={<a href={venue.website} target="_blank" rel="noopener" onClick={() => count(venue.id, "website")} />}
                className={cn(!venue.phone && "col-span-2")}
              >
                <Globe /> Website
              </Button>
            )}
          </div>
        </section>
      )}

      {/* About, nearby, more hubs, questions: the same words the static page
          carries (scripts/prerender.mjs), so search sees one page. */}
      <section style={{ "--i": 6 } as CSSProperties} className="animate-rise mt-8 px-5">
        <h2 className="mb-2 font-display text-[20px] font-bold tracking-tight">About {venue.name}</h2>
        {venue.description && <p className="mb-2 text-[15px] leading-relaxed text-cream">{venue.description}</p>}
        <p className="text-[15px] leading-relaxed text-muted-foreground">{venueAbout(venue)}</p>
      </section>

      {near.length > 0 && (
        <section style={{ "--i": 7 } as CSSProperties} className="animate-rise mt-8 px-5">
          <h2 className="mb-3 font-display text-[20px] font-bold tracking-tight">Happy hours nearby</h2>
          <ul className="rounded-[22px] bg-ink-2 px-4">
            {near.map((o) => {
              // Walk from this spot, not from you: "3 min walk" or "1.4 km away".
              const walk = walkLabel(distanceKm({ lat: venue.lat!, lng: venue.lng! }, { lat: o.lat!, lng: o.lng! }));
              return (
                <li key={o.id} className="border-b border-border last:border-0">
                  <Link to={spotPath(o.id)} className="flex min-h-12 items-center justify-between gap-3 py-3 text-[15px]">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{o.name}</span>
                      {walk && (
                        <span className="mt-0.5 flex items-center gap-1 text-[13px] text-sky-fg">
                          <Footprints className="size-3.5 shrink-0" />
                          {walk}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-[13px] text-muted-foreground tabular">{fmtRange(o.hh.start, o.hh.end || "23:59")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {BROWSER_ROUTER && (venue.hubs?.length ?? 0) > 0 && (
        <nav aria-label="More happy hours" className="mt-6 flex flex-wrap gap-2 px-5">
          {venue.hubs!.map((path) => {
            const slug = path.split("/").filter(Boolean).pop()!;
            const hub = hubs[slug];
            if (!hub) return null;
            return (
              <a key={path} href={path} className="inline-flex min-h-10 items-center rounded-full bg-ink-2 px-3.5 text-[14px] font-medium ring-1 ring-edge/5">
                {hub.kind === "city" || hub.kind === "area" ? `Happy hours in ${hub.label}` : hub.label}
              </a>
            );
          })}
        </nav>
      )}

      <section style={{ "--i": 8 } as CSSProperties} className="animate-rise mt-8 px-5">
        <h2 className="mb-2 font-display text-[20px] font-bold tracking-tight">{venue.name} happy hour questions</h2>
        <div className="rounded-[22px] bg-ink-2 px-4">
          {venueFaq(venue).map((f) => (
            <details key={f.q} className="group border-b border-border last:border-0">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                <h3 className="text-[15px] font-semibold">{f.q}</h3>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {apiEnabled && (
        <Link
          to={myVenues().includes(venue.id) ? `/venue/${venue.id}` : `/venue/claim/${venue.id}`}
          className="mx-5 mt-8 flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-[14px] ring-1 ring-edge/10 transition-colors hover:bg-ink-2"
        >
          <Store className="size-5 shrink-0 text-pink-fg" />
          <span className="flex-1">
            {myVenues().includes(venue.id) ? (
              <span className="font-semibold">Manage this listing</span>
            ) : (
              <>
                <span className="block font-semibold">Own or manage {venue.name}?</span>
                <span className="text-muted-foreground">Claim this listing free to keep your times and deals right.</span>
              </>
            )}
          </span>
          <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
        </Link>
      )}

      <Link to="/" className="sr-only">
        Back to list
      </Link>
    </Root>

      {/* Sticky bar (outside main so the swipe-back transform doesn't pin it to the page) */}
      <aside
        ref={bar}
        aria-label="Happy hour and directions"
        className={cn("z-30 border-t border-border bg-ink/95 backdrop-blur-xl", panel ? "sticky bottom-0" : "fixed inset-x-0 bottom-0")}
      >
        <div className={cn("mx-auto flex items-center justify-between gap-3 px-5 pt-3", panel ? "pb-3.5" : "max-w-md pb-[max(env(safe-area-inset-bottom),14px)] lg:max-w-2xl")}>
          <div className="min-w-0">
            {occ.start && occ.end ? (
              <>
                <p className="flex items-center gap-2 font-display text-[20px] leading-tight font-extrabold whitespace-nowrap tabular">
                  <StatusDot occ={occ} />
                  {fmtRange(occ.start, occ.end)}
                </p>
                <p className={cn("mt-0.5 truncate text-xs", soon ? "font-semibold text-orange-fg" : "text-muted-foreground")}>
                  {occ.status === "live" ? `On now · ${statusLabel(occ, now).toLowerCase()}` : statusLabel(occ, now)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No happy hour times listed</p>
            )}
          </div>
          {venue.lat != null && venue.lng != null ? (
            <Button onClick={openDirections} className="shrink-0">
              <Navigation /> Directions
            </Button>
          ) : (
            <Button variant="cream" onClick={onShare} className="shrink-0">
              <Share /> Share
            </Button>
          )}
        </div>
      </aside>

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
      {apiEnabled && <ReportDrawer venue={venue} open={reportOpen} onOpenChange={setReportOpen} />}
      {photosOpen && <PhotoViewer photos={photos} name={venue.name} open onClose={closePhotos} />}
    </>
  );
}

// "#3 of the best in Gastown": where the venue places on its own
// neighbourhood's (else city's) best-of list, linking to that list.
function RankLink({ best, venue }: { best: BestList[]; venue: Venue }) {
  const lists = [venue.area?.slug, venue.city?.toLowerCase().replace(/[^a-z0-9]+/g, "-")].map((s) => best.find((b) => b.slug === s));
  const list = lists.find((b) => b?.ids.includes(venue.id));
  if (!list) return null;
  const rank = list.ids.indexOf(venue.id) + 1;
  return (
    <Link
      to={`/best?in=${list.slug}`}
      viewTransition
      className="mt-2.5 flex min-h-12 items-center gap-3 rounded-2xl bg-ink-2 px-4 py-2.5 text-[14px] font-semibold transition-colors hover:bg-ink-3"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-display text-[14px] font-extrabold text-primary-foreground tabular">#{rank}</span>
      <span className="flex-1">Ranked #{rank} of the best happy hours in {list.name}</span>
      <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />
    </Link>
  );
}
