import { Camera, Check, ExternalLink, Forward, Maximize2, Plus, Send, Store, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Days, Deals, ExtraWindow } from "@/components/hours-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL, session, type VenueEdit } from "@/lib/api";
import { DAY_SHORT, fmtTime } from "@/lib/hours";
import { fmtChecked } from "@/lib/links";
import { spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, Field } from "./shared";

export interface Submission {
  id: string;
  venue_id: string | null;
  venue_name: string | null;
  managed: boolean;
  place_name: string | null;
  place_address: string | null;
  place_website: string | null;
  hh: { days: number[]; start: string; end: string | null } | null;
  note: string | null;
  name: string | null;
  email: string;
  works_there: boolean;
  photos: number;
  created_at: string;
}

type HH = NonNullable<VenueEdit["hh"]>;

const REASONS = [
  "The photo was too blurry to read. Could you send a closer one?",
  "We couldn't see a happy hour on this menu.",
  "Our listing already matches this menu, so nothing needed changing.",
  "This spot is outside Metro Vancouver, where we don't list happy hours yet.",
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// Admin-only photos need the session, so they load as blobs.
function usePhoto(id: string, n: number) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    let made: string | null = null;
    fetch(`${API_URL}/admin/submissions/${id}/photos/${n}`, { headers: { authorization: `Bearer ${session()}` } })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => {
        made = URL.createObjectURL(b);
        if (live) setUrl(made);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id, n]);
  return url;
}

function Thumb({ id, n, onOpen }: { id: string; n: number; onOpen: (url: string) => void }) {
  const url = usePhoto(id, n);
  return (
    <button
      type="button"
      disabled={!url}
      onClick={() => url && onOpen(url)}
      aria-label={`Open photo ${n + 1}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink-3 transition-transform active:scale-[0.98]"
    >
      {url ? <img src={url} alt="" className="size-full animate-fade object-cover" /> : <Camera className="absolute inset-0 m-auto size-5 text-muted-foreground" />}
      <span className="absolute right-1.5 bottom-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
        <Maximize2 className="size-3.5" />
      </span>
    </button>
  );
}

// Full-size photo over the page, to read the small print. Esc or tap closes.
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-label="Photo" className="fixed inset-0 z-50 animate-fade overflow-auto bg-black/90" onClick={onClose}>
      <img src={url} alt="" className="mx-auto min-h-full w-auto max-w-none object-contain sm:max-w-full" />
      <button type="button" aria-label="Close" onClick={onClose} className="fixed top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
        <X className="size-5" />
      </button>
    </div>
  );
}

function startingHours(s: Submission, v: Venue | undefined): HH {
  const base: HH = v
    ? {
        days: v.hh.days,
        start: v.hh.start,
        end: v.hh.end,
        extra: v.hh.extra.map((w) => ({ days: w.days, start: w.start, end: w.end, label: w.label ?? null })),
        deals: v.hh.deals.map((d) => ({ ...d })),
      }
    : { days: [1, 2, 3, 4, 5], start: "15:00", end: "18:00", extra: [], deals: [] };
  return s.hh ? { ...base, days: s.hh.days, start: s.hh.start, end: s.hh.end ?? base.end } : base;
}

// One guest submission in the review queue: the photos, who sent it, and
// (once opened) the happy hour to publish, prefilled from the guest's
// reading or the listing we have.
export function SubmissionCard({ s, onDecide }: { s: Submission; onDecide: (body: Record<string, unknown>, done: string) => Promise<boolean> }) {
  const { byId, venues } = useStore();
  const [target, setTarget] = useState<string | null>(s.venue_id);
  const venue = target ? byId(target) : undefined;
  const [open, setOpen] = useState(false);
  const [hh, setHH] = useState<HH>(() => startingHours(s, venue));
  const [place, setPlace] = useState({ name: s.place_name ?? "", address: s.place_address ?? "", website: s.place_website ?? "" });
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const managed = s.managed && target === s.venue_id;

  // A "new spot" that we may already list under the same name.
  const lookalikes = useMemo(() => {
    if (s.venue_id || !s.place_name) return [];
    const n = norm(s.place_name);
    return venues.filter((v) => {
      const m = norm(v.name);
      return n.length > 2 && (m.includes(n) || n.includes(m));
    }).slice(0, 3);
  }, [s, venues]);

  const decide = async (body: Record<string, unknown>, done: string) => {
    setBusy(true);
    const ok = await onDecide(body, done);
    if (!ok) setBusy(false);
  };

  const retarget = (id: string | null) => {
    setTarget(id);
    setHH(startingHours(s, id ? byId(id) : undefined));
  };

  const setH = (patch: Partial<HH>) => setHH((h) => ({ ...h, ...patch }));

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-orange-fg">{s.venue_id ? <Camera className="size-5" /> : <Plus className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            {s.venue_id ? (
              <Link to={spotPath(s.venue_id)} className="font-display text-[18px] font-bold underline-offset-4 hover:underline">
                {s.venue_name}
              </Link>
            ) : (
              <span className="font-display text-[18px] font-bold">{s.place_name}</span>
            )}
            {!s.venue_id && <Badge size="sm" variant="pink">New spot</Badge>}
            {s.managed && (
              <Badge size="sm" variant="outline">
                <Store /> Runs its own listing
              </Badge>
            )}
          </p>
          {!s.venue_id && <p className="text-[14px] text-muted-foreground">{s.place_address}</p>}
          <p className="mt-1 text-[13px] text-muted-foreground">
            {s.name ? `${s.name} · ` : ""}
            <a href={`mailto:${s.email}`} className="underline underline-offset-4">
              {s.email}
            </a>
            {s.works_there ? " · works there" : ""} · {fmtChecked(s.created_at.slice(0, 10)) ?? s.created_at.slice(0, 10)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: s.photos }, (_, n) => (
          <Thumb key={n} id={s.id} n={n} onOpen={setPhoto} />
        ))}
      </div>
      {photo && <Lightbox url={photo} onClose={() => setPhoto(null)} />}

      {(s.note || s.hh) && (
        <div className="rounded-2xl border-l-4 border-primary bg-ink-3/60 px-4 py-3 text-[14px]">
          {s.hh && (
            <p>
              <span className="text-muted-foreground">They read it as </span>
              <HoursText days={s.hh.days} start={s.hh.start} end={s.hh.end} />
            </p>
          )}
          {s.note && <p className="mt-1 whitespace-pre-line">{s.note}</p>}
        </div>
      )}
      {!s.venue_id && s.place_website && (
        <a href={/^https?:/.test(s.place_website) ? s.place_website : `https://${s.place_website}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[14px] text-cream underline underline-offset-4">
          <ExternalLink className="size-3.5" /> {s.place_website}
        </a>
      )}

      {!open && !declining && (
        <div className="grid grid-cols-2 gap-2">
          {managed ? (
            <Button disabled={busy} onClick={() => decide({ decision: "forward" }, "Passed to the venue")}>
              <Forward /> Pass to the venue
            </Button>
          ) : (
            <Button onClick={() => setOpen(true)}>Review and publish</Button>
          )}
          <Button variant="secondary" onClick={() => setDeclining(true)}>
            Decline
          </Button>
        </div>
      )}

      {declining && (
        <div className="animate-rise space-y-3">
          <p className="text-[13px] font-semibold text-cream">Tell them why (sent in the email)</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
                className={cn("rounded-2xl px-3 py-2 text-left text-[13px] transition-colors", reason === r ? "bg-cream text-ink" : "bg-ink-3 text-cream hover:bg-line")}
              >
                {r}
              </button>
            ))}
          </div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write your own" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeclining(false)}>
              Back
            </Button>
            <Button disabled={busy} onClick={() => decide({ decision: "decline", reason: reason || undefined }, "Declined, and we let them know")}>
              Decline and email
            </Button>
          </div>
        </div>
      )}

      {open && (
        <div className="animate-rise space-y-4 border-t border-border pt-4">
          {!s.venue_id && (
            <>
              {lookalikes.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-amber/10 p-3 text-[14px]">
                  <p className="font-semibold text-amber-fg">Already listed?</p>
                  {lookalikes.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => retarget(target === v.id ? null : v.id)}
                      aria-pressed={target === v.id}
                      className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors", target === v.id ? "bg-cream text-ink" : "bg-ink-3 hover:bg-line")}
                    >
                      {target === v.id && <Check className="size-4" />}
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{v.name}</span> <span className="opacity-70">{v.address}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!target && (
                <div className="space-y-3">
                  <Field label="Name">
                    <Input value={place.name} onChange={(e) => setPlace({ ...place, name: e.target.value })} />
                  </Field>
                  <Field label="Address" hint="Street and city, as Google Maps would find it. The map pin comes from this.">
                    <Input value={place.address} onChange={(e) => setPlace({ ...place, address: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input type="url" value={place.website} onChange={(e) => setPlace({ ...place, website: e.target.value })} placeholder="https://" />
                  </Field>
                </div>
              )}
            </>
          )}
          <div className="space-y-4">
            <p className="text-[13px] font-semibold text-cream">Happy hour, as the photo shows it</p>
            <Days value={hh.days} onChange={(days) => setH({ days })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <Input type="time" value={hh.start} onChange={(e) => setH({ start: e.target.value })} />
              </Field>
              <Field label="Ends">
                <Input type="time" value={hh.end} onChange={(e) => setH({ end: e.target.value })} />
              </Field>
            </div>
            {hh.extra.map((w, i) => (
              <ExtraWindow
                key={i}
                win={w}
                onChange={(next) => setH({ extra: hh.extra.map((x, j) => (j === i ? next : x)) })}
                onRemove={() => setH({ extra: hh.extra.filter((_, j) => j !== i) })}
              />
            ))}
            {hh.extra.length < 6 && (
              <Button variant="ghost" size="sm" onClick={() => setH({ extra: [...hh.extra, { days: [5, 6], start: "21:00", end: null, label: "Late night" }] })}>
                <Plus /> Add another time
              </Button>
            )}
          </div>
          <Deals deals={hh.deals} onChange={(deals) => setH({ deals })} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button
              disabled={busy || (!target && !(place.name.trim() && place.address.trim()))}
              onClick={() =>
                decide(
                  { decision: "publish", hh: { ...hh, deals: hh.deals.filter((d) => d.name.trim()) }, ...(target ? { venue_id: target } : { place }) },
                  target ? "Published. It's live now" : "Published. It goes on the map within the hour",
                )
              }
            >
              <Send /> Publish
            </Button>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {target
              ? "Shows on the site in a minute. The guest gets an “It's live” email now."
              : "The next data publish (hourly) places it on the map from the address, and the guest gets an “It's live” email once it's up."}
          </p>
        </div>
      )}
    </Card>
  );
}

function HoursText({ days, start, end }: { days: number[]; start: string; end: string | null }) {
  const order = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return (
    <span className="font-semibold">
      {days.length === 7 ? "every day" : order.map((d) => DAY_SHORT[d]).join(", ")}, {fmtTime(start)}–{end ? fmtTime(end) : "close"}
    </span>
  );
}
