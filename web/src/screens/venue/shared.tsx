import { Mail } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, apiEnabled, session, setMyVenues, type Me } from "@/lib/api";
import { absoluteUrl } from "@/lib/routes";
import { useTitle } from "@/lib/use-title";
import { cn } from "@/lib/utils";

// The signed-in owner, or null; `reload` after a claim or sign-out.
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "in" | "out">(session() ? "loading" : "out");
  const reload = useCallback(() => {
    if (!session()) {
      setMe(null);
      setState("out");
      return;
    }
    api<Me>("GET", "/me")
      .then((m) => {
        setMyVenues(m.venues.map((v) => v.id));
        setMe(m);
        setState("in");
      })
      .catch(() => setState("out"));
  }, []);
  useEffect(reload, [reload]);
  // Signing in from the email opens a new tab; pick that session up here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === "alh:session" && reload();
    const onVisible = () => document.visibilityState === "visible" && !!session() !== (state !== "out") && reload();
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload, state]);
  return { me, state, reload };
}

export function VenueShell({ title, children, right, back = "/venue" }: { title: string; children: ReactNode; right?: ReactNode; back?: string }) {
  useTitle(title);
  return (
    <main className="mx-auto min-h-dvh max-w-2xl pb-24">
      <PageHeader title={title} right={right} back={back} />
      <div className="px-5">
        {apiEnabled ? (
          children
        ) : (
          <Card>
            <p className="text-[15px]">Venue tools are coming soon. Email us in the meantime and we'll update your listing.</p>
          </Card>
        )}
      </div>
    </main>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[22px] bg-ink-2 p-5", className)}>{children}</div>;
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mt-8 mb-3 font-display text-[20px] font-bold tracking-tight", className)}>{children}</h2>;
}

export { Field };

export function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-3 text-[14px] text-orange-fg">
      {error}
    </p>
  );
}

export const message = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

// Email in, sign-in link out. `next` is where the link lands afterwards.
export function SignIn({ next, lead }: { next: string; lead?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ devLink?: string }>("POST", "/auth/start", { email, next });
      // Local development: the API hands the link back instead of mailing it.
      if (r.devLink) {
        const u = new URL(r.devLink);
        window.location.href = absoluteUrl(u.pathname + u.search);
      }
      setSent(email);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <Card className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Mail className="size-6" />
        </span>
        <p className="mt-4 font-display text-[20px] font-bold">Check your email</p>
        <p className="mt-1 text-[15px] text-muted-foreground">We sent a sign-in link to {sent}. It works once, for 30 minutes.</p>
        <Button variant="ghost" className="mt-3" onClick={() => setSent(null)}>
          Use a different email
        </Button>
      </Card>
    );

  return (
    <Card>
      <form onSubmit={submit}>
        {lead && <p className="mb-4 text-[15px] text-muted-foreground">{lead}</p>}
        <Field label="Work email" hint="Use your email at the venue's own website and we can confirm you straight away.">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbar.ca" />
        </Field>
        <ErrorLine error={error} />
        <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
    </Card>
  );
}
