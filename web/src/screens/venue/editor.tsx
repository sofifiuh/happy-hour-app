import { ArrowDown, ArrowUp, Check, ImagePlus, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useToast } from "@/components/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { api, type Stats, type VenueEdit } from "@/lib/api";
import { fmtChecked } from "@/lib/links";
import { DAY_SHORT } from "@/lib/hours";
import { queryParams, spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, ErrorLine, Field, H2, message, SignIn, useMe, VenueShell } from "./shared";

type Form = Required<Omit<VenueEdit, "photo">> & { photo: string | null };
type Deal = Form["hh"]["deals"][number];
type Win = Form["hh"]["extra"][number];

// Starting point: the venue's saved edit, else today's listing.
function formFrom(v: Venue, saved: VenueEdit | null): Form {
  return {
    hh: saved?.hh ?? {
      days: v.hh.days,
      start: v.hh.start,
      end: v.hh.end,
      extra: v.hh.extra.map((w) => ({ days: w.days, start: w.start, end: w.end, label: w.label ?? null })),
      deals: v.hh.deals.map((d) => ({ ...d })),
    },
    description: saved?.description ?? v.description ?? "",
    phone: saved?.phone !== undefined ? saved.phone : v.phone,
    website: saved?.website !== undefined ? saved.website : v.website,
    amenities: saved?.amenities ?? { patio: v.amenities.patio, liveMusic: v.amenities.liveMusic, groups: v.amenities.groups },
    photo: saved?.photo ?? null,
    gallery: saved?.gallery ?? [],
    closed: saved?.closed ?? false,
  };
}

// Phones send 4–12 MB photos; 1600px WebP is plenty and uploads fast.
async function shrink(file: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function VenueEditor() {
  const { id = "" } = useParams();
  const { byId, loading, refreshEdits } = useStore();
  const venue = byId(id);
  const { me, state } = useMe();
  const toast = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [meta, setMeta] = useState<{ updated_at?: string; confirmed_at?: string }>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const allowed = me && (me.admin || me.venues.some((v) => v.id === id));

  useEffect(() => {
    if (!allowed || !venue || form) return;
    api<{ data: VenueEdit | null; updated_at?: string; confirmed_at?: string }>("GET", `/venues/${id}/edit`)
      .then((r) => {
        setForm(formFrom(venue, r.data));
        setMeta(r);
      })
      .catch((e) => setError(message(e)));
    api<Stats>("GET", `/venues/${id}/stats`).then(setStats).catch(() => {});
  }, [allowed, venue, id, form]);

  useEffect(() => {
    const p = queryParams();
    if (p.get("confirmed") === "1") toast("Thanks, your listing is confirmed");
    if (p.get("confirm") === "expired") toast("That link expired. Tap “Still right” below instead");
  }, [toast]);

  if (!venue) return <VenueShell title="Your listing">{loading ? <Skeleton className="h-60 rounded-[22px]" /> : <Card>We can't find that venue.</Card>}</VenueShell>;
  if (state === "loading") return <VenueShell title={venue.name}><Skeleton className="h-60 rounded-[22px]" /></VenueShell>;
  if (state === "out") return <VenueShell title={venue.name}><SignIn next={`/venue/${id}`} lead="Sign in to edit your listing." /></VenueShell>;
  if (!allowed)
    return (
      <VenueShell title={venue.name}>
        <Card>
          <p className="text-[15px]">You don't manage this venue yet.</p>
          <Link to={`/venue/claim/${id}`} className={cn(buttonVariants(), "mt-4")}>
            Claim it
          </Link>
        </Card>
      </VenueShell>
    );

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setHH = (patch: Partial<Form["hh"]>) => setForm((f) => (f ? { ...f, hh: { ...f.hh, ...patch } } : f));

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      const body: VenueEdit = { ...form, description: form.description || null, photo: form.photo };
      const r = await api<{ updated_at: string; flags: string[] }>("PUT", `/venues/${id}/edit`, body);
      setMeta({ updated_at: r.updated_at, confirmed_at: r.updated_at });
      refreshEdits();
      toast(r.flags.length ? "Saved. We'll double-check a drink price" : "Saved. It's live in a minute or two");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    try {
      await api("POST", `/venues/${id}/confirm`);
      setMeta((m) => ({ ...m, confirmed_at: new Date().toISOString() }));
      refreshEdits();
      toast("Thanks, marked as still right");
    } catch (e) {
      setError(message(e));
    }
  };

  const upload = async (files: FileList | null, cover: boolean) => {
    if (!files?.length || !form) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of [...files].slice(0, 12)) urls.push((await api<{ url: string }>("POST", `/venues/${id}/photos`, undefined, await shrink(f))).url);
      if (cover) set({ photo: urls[0], gallery: [...urls.slice(1), ...form.gallery].slice(0, 12) });
      else set({ gallery: [...form.gallery, ...urls].slice(0, 12) });
    } catch (e) {
      setError(message(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <VenueShell title={venue.name}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <Link to={spotPath(id)} className="inline-flex min-h-11 items-center text-cream underline underline-offset-4">
          See your page
        </Link>
        {meta.updated_at && <span>Last saved {fmtChecked(meta.updated_at.slice(0, 10))}</span>}
      </div>

      <StatsCard stats={stats} />

      {meta.confirmed_at && (
        <Card className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[14px]">
            <span className="font-semibold">Still right?</span>{" "}
            <span className="text-muted-foreground">Confirmed {fmtChecked(meta.confirmed_at.slice(0, 10))}</span>
          </p>
          <Button size="sm" variant="secondary" onClick={confirm}>
            <Check /> Still right
          </Button>
        </Card>
      )}

      {!form ? (
        error ? <ErrorLine error={error} /> : <Skeleton className="mt-6 h-96 rounded-[22px]" />
      ) : (
        <>
          <H2>Happy hour</H2>
          <Card className="space-y-5">
            <Days value={form.hh.days} onChange={(days) => setHH({ days })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <Input type="time" value={form.hh.start} onChange={(e) => setHH({ start: e.target.value })} required />
              </Field>
              <Field label="Ends">
                <Input type="time" value={form.hh.end} onChange={(e) => setHH({ end: e.target.value })} required />
              </Field>
            </div>
            {form.hh.extra.map((w, i) => (
              <ExtraWindow
                key={i}
                win={w}
                onChange={(next) => setHH({ extra: form.hh.extra.map((x, j) => (j === i ? next : x)) })}
                onRemove={() => setHH({ extra: form.hh.extra.filter((_, j) => j !== i) })}
              />
            ))}
            {form.hh.extra.length < 6 && (
              <Button variant="ghost" size="sm" onClick={() => setHH({ extra: [...form.hh.extra, { days: [5, 6], start: "21:00", end: null, label: "Late night" }] })}>
                <Plus /> Add another time (late night, weekend…)
              </Button>
            )}
          </Card>

          <H2>Deals</H2>
          <Deals deals={form.hh.deals} onChange={(deals) => setHH({ deals })} />

          <H2>Photos</H2>
          <Card>
            <div className="grid grid-cols-3 gap-2">
              {form.photo && <Thumb url={form.photo} cover onRemove={() => set({ photo: null })} />}
              {form.gallery.map((g, i) => (
                <Thumb
                  key={g}
                  url={g}
                  onCover={() => set({ photo: g, gallery: [...form.gallery.filter((x) => x !== g), ...(form.photo ? [form.photo] : [])] })}
                  onRemove={() => set({ gallery: form.gallery.filter((_, j) => j !== i) })}
                />
              ))}
              <label className={cn("grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-edge/20 text-muted-foreground", uploading && "opacity-50")}>
                <span className="flex flex-col items-center gap-1 text-[12px]">
                  <ImagePlus className="size-6" /> {uploading ? "Uploading…" : "Add photos"}
                </span>
                <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files, !form.photo)} />
              </label>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Bright photos of the room, patio, drinks and food work best. The starred one is your cover.{!form.photo && venue.photo ? " Until you add one, we show the photo we found." : ""}
            </p>
          </Card>

          <H2>About</H2>
          <Card className="space-y-4">
            <Field label="A line about your happy hour" hint="Shown on your page. Up to 400 characters.">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set({ description: e.target.value })}
                maxLength={400}
                rows={3}
                className="w-full resize-none rounded-[20px] bg-input px-4 py-3 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value || null })} />
            </Field>
            <Field label="Website" hint="The full link, like https://yourplace.ca">
              <Input type="url" value={form.website ?? ""} onChange={(e) => set({ website: e.target.value || null })} />
            </Field>
            <Toggle label="Patio" checked={!!form.amenities.patio} onChange={(patio) => set({ amenities: { ...form.amenities, patio } })} />
            <Toggle label="Live music" checked={!!form.amenities.liveMusic} onChange={(liveMusic) => set({ amenities: { ...form.amenities, liveMusic } })} />
            <Toggle label="Good for groups" checked={!!form.amenities.groups} onChange={(groups) => set({ amenities: { ...form.amenities, groups } })} />
            <Toggle label="Temporarily closed" hint="Hides you from the list until you switch it off." checked={form.closed} onChange={(closed) => set({ closed })} />
          </Card>

          <ErrorLine error={error} />
          <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-ink via-ink to-transparent px-5 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
            <Button size="lg" className="w-full" disabled={busy || uploading} onClick={save}>
              {busy ? "Saving…" : "Save and publish"}
            </Button>
          </div>
        </>
      )}
    </VenueShell>
  );
}

function StatsCard({ stats }: { stats: Stats | null }) {
  const items: { key: keyof Stats["week"]; label: string }[] = [
    { key: "view", label: "Page views" },
    { key: "save", label: "Saves" },
    { key: "directions", label: "Directions" },
    { key: "call", label: "Calls" },
    { key: "website", label: "Website taps" },
    { key: "share", label: "Shares" },
  ];
  const max = useMemo(() => Math.max(1, ...(stats?.daily.map((d) => d.views) ?? [1])), [stats]);
  return (
    <Card className="mt-2">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-pink-fg uppercase">Last 7 days</p>
      {!stats ? (
        <Skeleton className="mt-3 h-24" />
      ) : (
        <>
          <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden>
            {stats.daily.map((d) => (
              <span key={d.day} className="flex-1 rounded-t-md bg-primary/70" style={{ height: `${Math.max(6, (d.views / max) * 100)}%` }} title={`${d.day}: ${d.views}`} />
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-4">
            {items.map(({ key, label }) => {
              const now = stats.week[key];
              const diff = now - stats.prev[key];
              return (
                <div key={key}>
                  <dt className="text-[12px] text-muted-foreground">{label}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span className="font-display text-[24px] font-extrabold tabular">{now}</span>
                    {diff !== 0 && (
                      <span className={cn("inline-flex items-center text-[12px] font-semibold", diff > 0 ? "text-lime-fg" : "text-muted-foreground")}>
                        {diff > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                        {Math.abs(diff)}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-3 text-[12px] text-muted-foreground">People, counted once a day each. Arrows compare with the week before.</p>
        </>
      )}
    </Card>
  );
}

function Days({ value, onChange }: { value: number[]; onChange: (d: number[]) => void }) {
  return (
    <div role="group" aria-label="Days" className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={cn("h-10 min-w-12 rounded-full px-3 text-[14px] font-medium transition-colors", on ? "bg-primary text-primary-foreground" : "bg-ink-3 text-cream")}
          >
            {DAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}

function ExtraWindow({ win, onChange, onRemove }: { win: Win; onChange: (w: Win) => void; onRemove: () => void }) {
  return (
    <div className="space-y-3 rounded-2xl bg-ink-3/60 p-4">
      <div className="flex items-center gap-2">
        <Input value={win.label ?? ""} placeholder="Label, like Late night" onChange={(e) => onChange({ ...win, label: e.target.value || null })} className="flex-1" aria-label="Label" />
        <Button variant="ghost" size="icon-sm" aria-label="Remove this time" onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      <Days value={win.days} onChange={(days) => onChange({ ...win, days })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts">
          <Input type="time" value={win.start} onChange={(e) => onChange({ ...win, start: e.target.value })} />
        </Field>
        <Field label="Ends" hint="Leave empty for until close">
          <Input type="time" value={win.end ?? ""} onChange={(e) => onChange({ ...win, end: e.target.value || null })} />
        </Field>
      </div>
    </div>
  );
}

function Deals({ deals, onChange }: { deals: Deal[]; onChange: (d: Deal[]) => void }) {
  const update = (i: number, patch: Partial<Deal>) => onChange(deals.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <div className="space-y-2">
      {deals.map((d, i) => (
        <Card key={i} className="space-y-3 p-4">
          <div className="flex gap-2">
            <Input value={d.name} placeholder="House lager" onChange={(e) => update(i, { name: e.target.value })} aria-label="Deal name" className="flex-1" />
            <Input value={d.price} placeholder="$6" onChange={(e) => update(i, { price: e.target.value })} aria-label="Price" className="w-24" />
          </div>
          <div className="flex items-center gap-2">
            {(["drink", "food"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={d.category === c}
                onClick={() => update(i, { category: c })}
                className={cn("h-9 rounded-full px-4 text-[13px] font-medium", d.category === c ? "bg-cream text-ink" : "bg-ink-3 text-cream")}
              >
                {c === "drink" ? "Drink" : "Food"}
              </button>
            ))}
            <span className="flex-1" />
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.name || "deal"}`} onClick={() => onChange(deals.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
          <Input value={d.description} placeholder="Details (optional): 16 oz, each, after 9pm…" onChange={(e) => update(i, { description: e.target.value })} aria-label="Details" />
        </Card>
      ))}
      {deals.length < 40 && (
        <Button variant="secondary" className="w-full" onClick={() => onChange([...deals, { name: "", price: "", category: "drink", description: "" }])}>
          <Plus /> Add a deal
        </Button>
      )}
      <p className="px-1 text-[12px] text-muted-foreground">Drink prices must follow BC's minimum drink price rules.</p>
    </div>
  );
}

function Thumb({ url, cover, onCover, onRemove }: { url: string; cover?: boolean; onCover?: () => void; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-3">
      <img src={url} alt="" className="size-full object-cover" />
      <div className="absolute inset-x-1 bottom-1 flex justify-between">
        <button
          type="button"
          onClick={onCover}
          disabled={cover}
          aria-label={cover ? "Cover photo" : "Make this the cover"}
          className="grid size-8 place-items-center rounded-full bg-ink/75 text-cream backdrop-blur"
        >
          <Star className={cn("size-4", cover && "fill-amber text-amber")} />
        </button>
        <button type="button" onClick={onRemove} aria-label="Remove photo" className="grid size-8 place-items-center rounded-full bg-ink/75 text-cream backdrop-blur">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4">
      <span>
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-[12px] text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
