import { BadgeCheck, Clock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, ErrorLine, Field, message, SignIn, useMe, VenueShell } from "./shared";

// /venue/claim/:id: "Own or manage this place?"
export function VenueClaim() {
  const { id = "" } = useParams();
  const { byId, loading, refreshEdits } = useStore();
  const venue = byId(id);
  const { me, state, reload } = useMe();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [licence, setLicence] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"approved" | "pending" | null>(null);

  if (!venue)
    return <VenueShell title="Claim a listing">{loading ? <Skeleton className="h-40 rounded-[22px]" /> : <Card>We can't find that venue.</Card>}</VenueShell>;

  const already = me?.venues.some((v) => v.id === id);
  const pending = me?.claims.find((c) => c.venue_id === id && c.status === "pending");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ claim: { id: string; status: "approved" | "pending" } }>("POST", "/claims", { venue_id: id, name, role, phone: phone || undefined });
      if (licence && r.claim.status === "pending") await api("PUT", `/claims/${r.claim.id}/licence`, undefined, licence);
      setResult(r.claim.status);
      refreshEdits();
      reload();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <VenueShell title="Claim your listing">
      <p className="mb-1 font-display text-[24px] leading-tight font-extrabold">{venue.name}</p>
      <p className="mb-5 text-[14px] text-muted-foreground">{venue.address}</p>

      {state === "loading" && <Skeleton className="h-40 rounded-[22px]" />}
      {state === "out" && <SignIn next={`/venue/claim/${id}`} lead="First, sign in with your work email. Claiming is free." />}

      {me && (already || result === "approved") && (
        <Card className="text-center">
          <BadgeCheck className="mx-auto size-10 text-lime-fg" />
          <p className="mt-3 font-display text-[20px] font-bold">You manage {venue.name}</p>
          <p className="mt-1 text-[15px] text-muted-foreground">Your email matches the venue's website, so you're confirmed.</p>
          <Link to={`/venue/${id}`} className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}>
            Edit your listing
          </Link>
        </Card>
      )}

      {me && !already && (pending || result === "pending") && (
        <Card className="text-center">
          <Clock className="mx-auto size-10 text-amber-fg" />
          <p className="mt-3 font-display text-[20px] font-bold">Thanks, we're checking</p>
          <p className="mt-1 text-[15px] text-muted-foreground">
            We'll confirm you manage {venue.name}, usually within a day, often by calling the venue's listed number. You'll get an email at {me.email}.
          </p>
        </Card>
      )}

      {me && !already && !pending && !result && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Your name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Your role" hint="Owner, general manager, bar manager, marketing…">
              <Input required value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <Field label="Phone (optional)" hint="So we can reach you if we need to check.">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </Field>
            <Field label="Liquor or business licence (optional)" hint="A photo or PDF speeds things up if your email isn't at the venue's domain.">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setLicence(e.target.files?.[0] ?? null)}
                className="block w-full text-[14px] text-muted-foreground file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:text-[14px] file:font-medium file:text-secondary-foreground"
              />
            </Field>
            <p className="text-[13px] text-muted-foreground">
              Signed in as {me.email}. By claiming you confirm you're allowed to manage this listing and agree to our{" "}
              <Link to="/terms" className="text-cream underline underline-offset-4">terms</Link>.
            </p>
            <ErrorLine error={error} />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Claim this listing"}
            </Button>
          </form>
        </Card>
      )}
    </VenueShell>
  );
}
