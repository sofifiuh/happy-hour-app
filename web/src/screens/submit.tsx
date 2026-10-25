import { ArrowRight, BadgeCheck, Camera, Check, Clock, Heart, ImagePlus, Loader2, MapPin, Plus, Search, Send, Store, Timer, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Field } from "@/components/field";
import { Days } from "@/components/hours-fields";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VenuePhoto } from "@/components/venue-photo";
import { track } from "@/lib/analytics";
import { ApiError, apiEnabled, apiForm } from "@/lib/api";
import { reducedMotion } from "@/lib/motion";
import { spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { useTitle } from "@/lib/use-title";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "jason@setsail.ca";
const MAX_PHOTOS = 4;

interface Photo {
  key: number;
  blob: Blob | null; // null while it's being shrunk
  url: string;
}

interface NewPlace {
  name: string;
  address: string;
  website: string;
}

// Menus need their small print, so keep more pixels than venue photos do.
// JPEG because the API takes it from every browser; HEIC from an iPhone
// decodes here in Safari and arrives as a JPEG.
async function shrink(file: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// /submit: "Add a happy hour". Anyone can send a photo of a menu or sign,
// for a spot we list (?venue=<id>) or one we don't; it lands in the review
// queue, and the guest gets a thank-you email now and another when it's live.
export function SubmitScreen() {
  useTitle("Add a happy hour");
  const [params] = useSearchParams();
  const { byId, venues } = useStore();
  const navigate = useNavigate();
  const [venueId, setVenueId] = useState<string | null>(params.get("venue"));
  const venue = venueId ? byId(venueId) : undefined;
  const [place, setPlace] = useState<NewPlace | null>(params.get("name") ? { name: params.get("name")!, address: "", website: "" } : null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [knowTimes, setKnowTimes] = useState(false);
  const [hh, setHH] = useState({ days: [1, 2, 3, 4, 5], start: "15:00", end: "18:00" });
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [worksThere, setWorksThere] = useState(false);
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ step: number; text: string } | null>(null);
  const [done, setDone] = useState<{ email: string; spot: string; photo: string | null; venueId: string | null; worksThere: boolean } | null>(null);
  const doneHeading = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    track({ name: "submit_opened", from: params.get("from") ?? (params.get("venue") ? "venue" : "direct") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!done) return;
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "instant" : "smooth" });
    doneHeading.current?.focus({ preventScroll: true });
  }, [done]);

  const addPhotos = async (files: FileList | File[] | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)).slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) return;
    setError(null);
    const added = list.map((f, i) => ({ key: Date.now() + i, blob: null, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...added]);
    for (const [i, f] of list.entries()) {
      const blob = await shrink(f);
      if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) {
        setPhotos((p) => p.filter((x) => x.key !== added[i].key));
        setError({ step: 2, text: "That photo format didn't open here. Try a screenshot, or a JPEG or PNG." });
        continue;
      }
      setPhotos((p) => p.map((x) => (x.key === added[i].key ? { ...x, blob, url: URL.createObjectURL(blob) } : x)));
    }
  };

  const removePhoto = (key: number) => setPhotos((p) => p.filter((x) => x.key !== key));

  const reset = () => {
    setVenueId(null);
    setPlace(null);
    setPhotos([]);
    setKnowTimes(false);
    setNote("");
    setDone(null);
    setError(null);
    navigate("/submit", { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fail = (step: number, text: string) => {
      setError({ step, text });
      document.getElementById(`step-${step}`)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    };
    if (!venue && !(place?.name.trim() && place.address.trim())) return fail(1, place ? "Add the spot's name and where it is." : "Pick the spot, or add it if we don't list it yet.");
    if (!photos.length) return fail(2, "Add a photo of the menu or sign.");
    if (photos.some((p) => !p.blob)) return fail(2, "One sec, your photos are still getting ready.");
    if (knowTimes && !hh.days.length) return fail(3, "Pick the days, or switch the times off.");
    if (!email.trim()) return fail(4, "Add your email so we can say thanks.");

    const form = new FormData();
    if (venue) form.append("venue_id", venue.id);
    else if (place) {
      form.append("place_name", place.name.trim());
      form.append("place_address", place.address.trim());
      if (place.website.trim()) form.append("place_website", place.website.trim());
    }
    if (knowTimes) form.append("hh", JSON.stringify(hh));
    if (note.trim()) form.append("note", note.trim());
    form.append("email", email.trim());
    if (name.trim()) form.append("name", name.trim());
    if (worksThere) form.append("works_there", "1");
    if (company) form.append("company", company);
    for (const p of photos) form.append("photos", p.blob!, "menu.jpg");

    setBusy(true);
    setError(null);
    try {
      await apiForm("/submissions", form);
      track({ name: "happy_hour_submitted", kind: venue ? "listed" : "new", photos: photos.length });
      setDone({ email: email.trim(), spot: venue?.name ?? place!.name.trim(), photo: photos[0]?.url ?? null, venueId: venue?.id ?? null, worksThere });
    } catch (err) {
      setError({ step: 0, text: err instanceof ApiError ? err.message : "Something went wrong. Try again in a moment." });
    } finally {
      setBusy(false);
    }
  };

  if (!apiEnabled)
    return (
      <Page>
        <Intro venue={venue} />
        <div className="mt-5 rounded-[22px] bg-ink-2 p-5 text-[15px]">
          Email a photo of the menu or sign to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("A happy hour for A Little Hang")}`} className="font-semibold text-orange-fg underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>{" "}
          and we'll add it.
        </div>
      </Page>
    );

  if (done) return <Page><Thanks done={done} headingRef={doneHeading} onAnother={reset} /></Page>;

  return (
    <Page>
      <Intro venue={venue} />
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Step n={1} title="Where is it?" error={error?.step === 1 ? error.text : null}>
          {venue ? (
            <Chosen venue={venue} onChange={() => setVenueId(null)} />
          ) : place ? (
            <PlaceFields place={place} onChange={setPlace} onSearch={() => setPlace(null)} />
          ) : (
            <SpotSearch venues={venues} onPick={(id) => (setVenueId(id), setError(null))} onNew={(n) => (setPlace({ name: n, address: "", website: "" }), setError(null))} />
          )}
        </Step>

        <Step n={2} title="Snap the happy hour" error={error?.step === 2 ? error.text : null}>
          <PhotoPicker photos={photos} onAdd={addPhotos} onRemove={removePhoto} />
        </Step>

        <Step n={3} title="When is it?" optional error={error?.step === 3 ? error.text : null}>
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span className="text-[15px]">I know the days and times</span>
            <Switch checked={knowTimes} onCheckedChange={setKnowTimes} />
          </label>
          {knowTimes && (
            <div className="mt-3 animate-rise space-y-4">
              <Days value={hh.days} onChange={(days) => setHH({ ...hh, days })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts">
                  <Input type="time" value={hh.start} onChange={(e) => setHH({ ...hh, start: e.target.value })} />
                </Field>
                <Field label="Ends">
                  <Input type="time" value={hh.end} onChange={(e) => setHH({ ...hh, end: e.target.value })} />
                </Field>
              </div>
            </div>
          )}
          <div className="mt-4">
            <Field label="Anything else?" hint="Deals the photo cuts off, a late-night happy hour, patio only…">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder="Half-price wings until 6"
                className="w-full resize-none rounded-[20px] bg-input px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </Field>
          </div>
        </Step>

        <Step n={4} title="Where do we send the thanks?" error={error?.step === 4 ? error.text : null}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="First name (optional)">
              <Input autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya" />
            </Field>
          </div>
          <label className="mt-3 flex min-h-11 items-center justify-between gap-4">
            <span>
              <span className="block text-[15px]">I work there</span>
              <span className="block text-[12px] text-muted-foreground">We'll show you how to manage the listing yourself.</span>
            </span>
            <Switch checked={worksThere} onCheckedChange={setWorksThere} />
          </label>
          {/* Hidden from people; bots fill it in. */}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden value={company} onChange={(e) => setCompany(e.target.value)} className="absolute -left-[9999px] size-px opacity-0" />
        </Step>

        {error?.step === 0 && (
          <p role="alert" className="px-1 text-[14px] text-orange-fg">
            {error.text}
          </p>
        )}
        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Sending {photos.length === 1 ? "your photo" : `${photos.length} photos`}…
              </>
            ) : (
              <>
                <Send className="size-4" /> Send it in
              </>
            )}
          </Button>
          <p className="mt-3 px-2 text-center text-[12px] leading-relaxed text-muted-foreground">
            Only our team sees your photos. We email you about this happy hour and nothing else. See our{" "}
            <Link to="/privacy" className="text-cream underline underline-offset-4">
              privacy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-cream underline underline-offset-4">
              terms
            </Link>
            .
          </p>
        </div>
      </form>
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-xl pb-24">
      <PageHeader title="Add a happy hour" back="/" />
      <div className="px-5">{children}</div>
    </main>
  );
}

// A warm card with the stamp turning, or the venue's own photo when the
// guest came from its page ("Got a newer menu?").
function Intro({ venue }: { venue?: Venue }) {
  return (
    <section className="theme-dark relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#ff4900_0%,#b8231b_55%,#751927_100%)] text-white">
      {venue && (
        <>
          <VenuePhoto venue={venue} eager large className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
        </>
      )}
      <div className="relative p-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-semibold backdrop-blur-md">
            <Camera className="size-3.5" /> {venue ? "Got a newer menu?" : "Know a good one?"}
          </span>
          <Stamp />
        </div>
        <h2 className="-mt-3 max-w-[15ch] font-display text-[32px] leading-[1.02] font-extrabold tracking-tight text-balance sm:text-[36px]">
          {venue ? venue.name : "Spotted a happy hour?"}
        </h2>
        <p className="mt-2 max-w-[36ch] text-[15px] leading-snug text-white/80">
          {venue
            ? "Snap their menu or happy hour sign. We'll check it and update the listing for everyone."
            : "Snap the menu or the sign. We'll check it and put it on the map for everyone."}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5 text-[12px] font-semibold">
          {[
            { icon: Timer, label: "30 seconds" },
            { icon: UserRound, label: "No account" },
            { icon: BadgeCheck, label: "Checked by a person" },
          ].map(({ icon: Icon, label }, i) => (
            <li key={label} style={{ "--i": i + 1 } as CSSProperties} className="inline-flex animate-rise items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-md">
              <Icon className="size-3.5" /> {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const RING = "THANK YOU · GOOD HANG · A LITTLE HANG · ";

// The pink thank-you stamp (also on the emails: api/scripts/email-assets.mjs).
// It turns slowly on the form and lands with sparks when the photo is in.
function Stamp({ landed = false, className }: { landed?: boolean; className?: string }) {
  return (
    <div className={cn("relative size-[84px] shrink-0", className)} aria-hidden>
      {landed &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <span key={a} style={{ "--a": `${a}deg` } as CSSProperties} className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 animate-spark rounded-full bg-pink" />
        ))}
      <div className={cn("relative size-full", landed ? "animate-stamp" : "-rotate-12")}>
        <svg viewBox="0 0 100 100" className={cn("absolute inset-0 size-full", !landed && "animate-spin-slow")}>
          <defs>
            <path id="thanks-ring" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
          </defs>
          <circle cx="50" cy="50" r="48" className="fill-pink" />
          <circle cx="50" cy="50" r="30" className="fill-none stroke-on-pop/40 stroke-[1.5]" />
          <text className="fill-on-pop font-display text-[9.5px] font-extrabold tracking-[0.08em]">
            <textPath href="#thanks-ring" textLength="236" lengthAdjust="spacing">
              {RING}
            </textPath>
          </text>
        </svg>
        <span className="absolute inset-0 grid place-items-center text-on-pop">
          <Heart className="size-7" />
        </span>
      </div>
    </div>
  );
}

function Step({ n, title, optional, error, children }: { n: number; title: string; optional?: boolean; error: string | null; children: ReactNode }) {
  return (
    <section id={`step-${n}`} aria-labelledby={`step-${n}-title`} style={{ "--i": n + 2 } as CSSProperties} className="animate-rise scroll-mt-24 rounded-[22px] bg-ink-2 p-5">
      <h2 id={`step-${n}-title`} className="mb-4 flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary font-display text-[14px] font-extrabold text-primary-foreground tabular">{n}</span>
        <span className="font-display text-[19px] leading-tight font-bold tracking-tight">{title}</span>
        {optional && <span className="ml-auto rounded-full bg-ink-3 px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">Optional</span>}
      </h2>
      {children}
      {error && (
        <p role="alert" className="mt-3 animate-rise text-[14px] text-orange-fg">
          {error}
        </p>
      )}
    </section>
  );
}

function Chosen({ venue, onChange }: { venue: Venue; onChange: () => void }) {
  return (
    <div className="flex animate-pop items-center gap-3 rounded-2xl bg-ink-3/60 p-2.5 pr-3">
      <VenuePhoto venue={venue} className="size-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{venue.name}</p>
        <p className="truncate text-[13px] text-muted-foreground">{venue.address}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onChange}>
        Change
      </Button>
    </div>
  );
}

function SpotSearch({ venues, onPick, onNew }: { venues: Venue[]; onPick: (id: string) => void; onNew: (name: string) => void }) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const t = norm(q);
    if (t.length < 2) return [];
    const scored: [number, Venue][] = [];
    for (const v of venues) {
      const n = norm(v.name);
      const at = n.indexOf(t);
      if (at >= 0) scored.push([at === 0 ? 0 : n.includes(` ${t}`) ? 1 : 2, v]);
      else if (norm(v.address).includes(t)) scored.push([3, v]);
    }
    return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).slice(0, 5).map(([, v]) => v);
  }, [q, venues]);
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${venues.length || ""} spots by name`.replace("  ", " ")}
          aria-label="Search spots by name"
          autoComplete="off"
          className="pl-10"
        />
      </div>
      {matches.length > 0 && (
        <ul className="mt-2 space-y-1" aria-label="Matching spots">
          {matches.map((v, i) => (
            <li key={v.id} style={{ "--i": i } as CSSProperties} className="animate-rise">
              <button type="button" onClick={() => onPick(v.id)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-ink-3 active:scale-[0.99]">
                <MapPin className="size-4 shrink-0 text-orange-fg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{v.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">{v.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => onNew(q.trim())}
        className="mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-dashed border-border px-3 py-2 text-left text-[15px] transition-colors hover:border-muted-foreground"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-orange-fg">
          <Plus className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          {q.trim().length >= 2 ? (
            <>
              <span className="font-semibold">Add “{q.trim()}”</span>
              <span className="block text-[13px] text-muted-foreground">It's not on A Little Hang yet</span>
            </>
          ) : (
            <>
              <span className="font-semibold">It's not on A Little Hang yet</span>
              <span className="block text-[13px] text-muted-foreground">Add a new spot</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

function PlaceFields({ place, onChange, onSearch }: { place: NewPlace; onChange: (p: NewPlace) => void; onSearch: () => void }) {
  return (
    <div className="animate-rise space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2.5 text-[13px] text-cream">
        <Store className="size-4 shrink-0 text-orange-fg" />
        <span className="flex-1">A new spot for the map. Nice find.</span>
        <button type="button" onClick={onSearch} className="font-semibold text-orange-fg underline-offset-4 hover:underline">
          Search instead
        </button>
      </div>
      <Field label="Name">
        <Input autoFocus value={place.name} onChange={(e) => onChange({ ...place, name: e.target.value })} placeholder="The Sunny Side" maxLength={100} />
      </Field>
      <Field label="Where it is" hint="The address, or the street and neighbourhood.">
        <Input value={place.address} onChange={(e) => onChange({ ...place, address: e.target.value })} placeholder="2245 Commercial Dr, Vancouver" maxLength={160} />
      </Field>
      <Field label="Website or Instagram (optional)">
        <Input value={place.website} onChange={(e) => onChange({ ...place, website: e.target.value })} placeholder="https://" maxLength={300} inputMode="url" />
      </Field>
    </div>
  );
}

function PhotoPicker({ photos, onAdd, onRemove }: { photos: Photo[]; onAdd: (f: FileList | File[] | null) => void; onRemove: (key: number) => void }) {
  const [over, setOver] = useState(false);
  const full = photos.length >= MAX_PHOTOS;
  return (
    <div>
      {photos.length > 0 && (
        <ul className="mb-3 grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <li key={p.key} className="relative aspect-[3/4] animate-pop-in overflow-hidden rounded-2xl bg-ink-3">
              <img src={p.url} alt={`Photo ${i + 1}`} className={cn("size-full object-cover transition-opacity", !p.blob && "opacity-50")} />
              {!p.blob && <Loader2 className="absolute inset-0 m-auto size-5 animate-spin text-white" />}
              <button
                type="button"
                onClick={() => onRemove(p.key)}
                aria-label={`Remove photo ${i + 1}`}
                className="hit absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-transform active:scale-90"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <label
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => (e.preventDefault(), setOver(false), onAdd(e.dataTransfer.files))}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-[border-color,background-color,transform] focus-within:border-primary active:scale-[0.99]",
            photos.length ? "min-h-16 flex-row gap-2 py-3" : "min-h-44 gap-1 px-6 py-6",
            over ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground",
          )}
        >
          {photos.length ? (
            <>
              <ImagePlus className="size-5 text-orange-fg" />
              <span className="text-[15px] font-semibold">Add another photo</span>
              <span className="text-[13px] text-muted-foreground">({MAX_PHOTOS - photos.length} left)</span>
            </>
          ) : (
            <>
              <span className="mb-2 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                <Camera className="size-6" />
              </span>
              <span className="text-[16px] font-semibold">Take a photo or choose one</span>
              <span className="max-w-[30ch] text-[13px] text-muted-foreground">The menu, a chalkboard, a sign, or a screenshot of their post. Up to {MAX_PHOTOS}.</span>
            </>
          )}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => (onAdd(e.target.files), (e.target.value = ""))} />
        </label>
      )}
    </div>
  );
}

function Thanks({
  done,
  headingRef,
  onAnother,
}: {
  done: { email: string; spot: string; photo: string | null; venueId: string | null; worksThere: boolean };
  headingRef: React.RefObject<HTMLParagraphElement | null>;
  onAnother: () => void;
}) {
  return (
    <div className="pt-2">
      <section className="relative flex flex-col items-center rounded-[28px] bg-ink-2 px-5 pt-8 pb-6 text-center">
        <div className="relative">
          {done.photo ? (
            <div className="animate-pop-in -rotate-3 rounded-[10px] bg-white p-2 pb-7 shadow-(--shadow-float)">
              <img src={done.photo} alt="" className="h-44 w-36 rounded-[4px] object-cover" />
            </div>
          ) : (
            <div className="grid size-36 place-items-center rounded-full bg-primary/15 text-orange-fg">
              <Camera className="size-10" />
            </div>
          )}
          <Stamp landed className="absolute -right-10 -bottom-6" />
        </div>
        <p ref={headingRef} tabIndex={-1} className="mt-10 font-display text-[28px] leading-tight font-extrabold tracking-tight outline-none">
          Got it. Thank you!
        </p>
        <p className="mx-auto mt-2 max-w-[34ch] text-[15px] text-muted-foreground">
          We'll read it, check the times at {done.spot}, and email <span className="text-cream">{done.email}</span> when it's live. Usually within a day.
        </p>
        <ol className="mt-6 w-full max-w-xs space-y-3 text-left text-[14px]">
          <Progress done label="Photo sent" />
          <Progress active label="A person checks it" />
          <Progress label="It goes live for everyone" />
        </ol>
      </section>

      {done.worksThere && done.venueId && (
        <Link
          to={`/venue/claim/${done.venueId}`}
          style={{ "--i": 3 } as CSSProperties}
          className="mt-3 flex animate-rise items-center gap-3.5 rounded-[20px] bg-ink-2 p-4 text-[14px] transition-transform active:scale-[0.98]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-on-pop">
            <Store className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Run {done.spot}? Claim it free</span>
            <span className="block text-muted-foreground">Update your times and deals yourself, any time.</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button size="lg" variant="secondary" onClick={onAnother}>
          <Camera className="size-4" /> Add another
        </Button>
        <Link to={done.venueId ? spotPath(done.venueId) : "/"} className={cn(buttonVariants({ size: "lg" }))}>
          {done.venueId ? `Back to ${done.spot}` : "Find a happy hour"} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function Progress({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          done ? "bg-lime text-on-pop" : active ? "animate-live bg-amber/20 text-amber-fg" : "bg-ink-3 text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <Clock className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className={cn(done || active ? "text-cream" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}
