import { ChevronRight, Clock, ShieldCheck, Store } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, setSession } from "@/lib/api";
import { queryParams } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Card, ErrorLine, H2, message, SignIn, useMe, VenueShell } from "./shared";

// /venue: the owner's venues and claims, or the sign-in form.
export function VenueHome() {
  const { me, state, reload } = useMe();
  const signOut = async () => {
    await api("POST", "/auth/logout").catch(() => {});
    setSession(null);
    reload();
  };

  return (
    <VenueShell
      title="For venues"
      right={
        me && (
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        )
      }
    >
      {state === "loading" && <Skeleton className="h-40 rounded-[22px]" />}
      {state === "out" && (
        <>
          <p className="mb-5 text-[16px] leading-relaxed text-muted-foreground">
            Run a bar or restaurant in Vancouver? Claim your listing free to keep your happy hour times, deals and photos right, and see how many people look you up.
          </p>
          <SignIn next="/venue" />
          <p className="mt-5 text-[14px] text-muted-foreground">
            New here? Find your venue on <Link to="/spots" className="text-cream underline underline-offset-4">the list</Link> and tap "Own or manage this place?"
          </p>
        </>
      )}
      {me && (
        <>
          <p className="text-[14px] text-muted-foreground">Signed in as {me.email}</p>
          {me.admin && (
            <Link to="/venue/admin" className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl bg-ink-2 px-4 text-[15px] font-semibold">
              <ShieldCheck className="size-5 text-sky-fg" /> <span className="flex-1">Review queue</span> <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          )}
          <H2>Your venues</H2>
          {me.venues.length ? (
            <ul className="space-y-2">
              {me.venues.map((v) => (
                <li key={v.id}>
                  <Link to={`/venue/${v.id}`} className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink-2 px-4 text-[15px] font-semibold transition-colors hover:bg-ink-3">
                    <Store className="size-5 text-pink-fg" /> <span className="flex-1">{v.name}</span> <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Card>
              <p className="text-[15px] text-muted-foreground">
                None yet. Find your venue on <Link to="/spots" className="text-cream underline underline-offset-4">the list</Link> and tap "Own or manage this place?"
              </p>
            </Card>
          )}
          {me.claims.some((c) => c.status !== "approved") && (
            <>
              <H2>Claims</H2>
              <ul className="space-y-2">
                {me.claims
                  .filter((c) => c.status !== "approved")
                  .map((c) => (
                    <li key={c.id} className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink-2 px-4 py-3 text-[15px]">
                      <Clock className="size-5 text-amber-fg" />
                      <span className="flex-1">{c.venue_name}</span>
                      <Badge size="sm">{c.status === "pending" ? "Being checked" : "Not approved"}</Badge>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </>
      )}
    </VenueShell>
  );
}

// /venue/login?token=…&next=…: the link from the sign-in email.
export function VenueLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(false); // the link works once; don't spend it twice
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    const p = queryParams();
    const token = p.get("token");
    const next = p.get("next") ?? "/venue";
    if (!token) {
      setError("That link is missing its sign-in code.");
      return;
    }
    api<{ session: string }>("POST", "/auth/verify", { token })
      .then((r) => {
        setSession(r.session);
        navigate(next.startsWith("/") && !next.startsWith("//") ? next : "/venue", { replace: true });
      })
      .catch((e) => setError(message(e)));
  }, [navigate]);

  return (
    <VenueShell title="Signing in">
      {error ? (
        <Card>
          <ErrorLine error={error} />
          <Link to="/venue" className={cn(buttonVariants(), "mt-4")}>
            Get a new link
          </Link>
        </Card>
      ) : (
        <Skeleton className="h-24 rounded-[22px]" />
      )}
    </VenueShell>
  );
}
