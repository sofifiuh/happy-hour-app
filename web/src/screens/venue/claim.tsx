import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock,
  FileUp,
  ImagePlus,
  MessageCircle,
  PencilLine,
  Sparkles,
  Store,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VenuePhoto } from "@/components/venue-photo";
import { api } from "@/lib/api";
import { reducedMotion } from "@/lib/motion";
import { BROWSER_ROUTER, spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import type { Venue } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  ErrorLine,
  Field,
  message,
  SignIn,
  useMe,
  VenueShell,
} from "./shared";

const ROLES = ["Owner", "General manager", "Bar manager", "Marketing"];

// /venue/claim/:id: "Own or manage this place?" Made to feel like picking up
// the keys: the venue's own photo, an owner's stamp, and a thump when it lands.
export function VenueClaim() {
  const { id = "" } = useParams();
  const { byId, loading, refreshEdits } = useStore();
  const venue = byId(id);
  const { me, state, reload } = useMe();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [otherRole, setOtherRole] = useState(false);
  const [phone, setPhone] = useState("");
  const [licence, setLicence] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"approved" | "pending" | null>(null);
  const resultHeading = useRef<HTMLParagraphElement>(null);

  // The form sits below the fold, so bring the stamp and the outcome into view and tell screen readers.
  useEffect(() => {
    if (!result) return;
    window.scrollTo({
      top: 0,
      behavior: reducedMotion() ? "instant" : "smooth",
    });
    resultHeading.current?.focus({ preventScroll: true });
  }, [result]);

  if (!venue)
    return (
      <VenueShell title="Claim a listing" back="/spots">
        {loading ? (
          <Skeleton className="h-72 rounded-[28px]" />
        ) : (
          <Card>
            We can't find that venue.{" "}
            <Link
              to="/spots"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Browse all spots
            </Link>
          </Card>
        )}
      </VenueShell>
    );

  const already = !!me?.venues.some((v) => v.id === id);
  const pending = me?.claims.find(
    (c) => c.venue_id === id && c.status === "pending",
  );
  const owned = !!me && (already || result === "approved");
  const waiting = !!me && !owned && (!!pending || result === "pending");
  const step = state !== "in" ? 1 : owned ? 3 : waiting ? 3 : 2;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      setError("Pick your role at the venue");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api<{
        claim: { id: string; status: "approved" | "pending" };
      }>("POST", "/claims", {
        venue_id: id,
        name,
        role,
        phone: phone || undefined,
      });
      if (licence && r.claim.status === "pending")
        await api("PUT", `/claims/${r.claim.id}/licence`, undefined, licence);
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
    <VenueShell
      title={owned ? "It's official" : "Claim your listing"}
      back={spotPath(id)}
    >
      <ClaimHero venue={venue} owned={owned} landed={result === "approved"} />

      {state === "loading" && <Skeleton className="mt-5 h-40 rounded-[22px]" />}

      {state !== "loading" && !owned && !waiting && <Steps step={step} />}

      {state === "out" && (
        <>
          <Perks />
          <div className="mt-5">
            <SignIn
              next={`/venue/claim/${id}`}
              lead="Start with your work email. Claiming is free, and it takes about a minute."
            />
          </div>
        </>
      )}

      {owned && (
        <Card className="mt-5 animate-rise text-center">
          <p
            ref={resultHeading}
            tabIndex={-1}
            className="font-display text-[24px] leading-tight font-extrabold outline-none"
          >
            You run {venue.name} on A Little Hang
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
            Your listing now carries an{" "}
            <span className="font-semibold text-cream">
              Updated by the venue
            </span>{" "}
            badge. Guests will trust what they read, because it came from you.
          </p>
          <Link
            to={`/venue/${id}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
          >
            Make it yours <ArrowRight className="size-4" />
          </Link>
        </Card>
      )}

      {owned && (
        <section className="mt-5">
          <p className="mb-2.5 px-1 text-[13px] font-semibold text-muted-foreground">
            Three quick wins
          </p>
          <div className="space-y-2.5">
            {WINS.map(({ icon: Icon, title, body }, i) => (
              <Link
                key={title}
                to={`/venue/${id}`}
                style={{ "--i": i + 2 } as CSSProperties}
                className="flex animate-rise items-center gap-3.5 rounded-[20px] bg-ink-2 p-4 transition-transform active:scale-[0.98]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-[14px]">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-muted-foreground">{body}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
          {BROWSER_ROUTER && (
            <a
              href={`/badge/${id}/`}
              className="mt-2.5 flex items-center gap-3.5 rounded-[20px] border border-dashed border-border p-4 text-[14px] transition-colors hover:border-muted-foreground"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-on-pop">
                <BadgeCheck className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Show it off</span>
                <span className="block text-muted-foreground">
                  Put the A Little Hang badge on your website.
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </a>
          )}
        </section>
      )}

      {waiting && (
        <Card className="mt-5 animate-rise">
          <span className="grid size-12 place-items-center rounded-full bg-amber/15 text-amber-fg">
            <Clock className="size-6" />
          </span>
          <p
            ref={resultHeading}
            tabIndex={-1}
            className="mt-3 font-display text-[22px] leading-tight font-extrabold outline-none"
          >
            Nice. We're checking your keys.
          </p>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Your email isn't at {venue.name}'s website, so a person confirms it,
            usually within a day. We may call the venue's listed number. You'll
            get an email at <span className="text-cream">{me?.email}</span> the
            moment it's done.
          </p>
          <ol className="mt-5 space-y-3 text-[14px]">
            <Progress done label="Claim sent" />
            <Progress active label="We confirm you work there" />
            <Progress label="You update times, deals and photos" />
          </ol>
        </Card>
      )}

      {me && !owned && !waiting && (
        <Card className="mt-5">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <p className="font-display text-[20px] leading-tight font-extrabold">
                Tell us who you are
              </p>
              <p className="mt-1 text-[14px] text-muted-foreground">
                So guests know the listing is in good hands.
              </p>
            </div>
            <Field label="Your name">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="First and last"
              />
            </Field>
            <fieldset>
              <legend className="mb-2 block text-[13px] font-semibold text-cream">
                Your role
              </legend>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Chip
                    key={r}
                    on={!otherRole && role === r}
                    onClick={() => (setOtherRole(false), setRole(r))}
                  >
                    {r}
                  </Chip>
                ))}
                <Chip
                  on={otherRole}
                  onClick={() => (setOtherRole(true), setRole(""))}
                >
                  Something else
                </Chip>
              </div>
              {otherRole && (
                <Input
                  autoFocus
                  required
                  className="mt-3"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Your role"
                  aria-label="Your role"
                />
              )}
            </fieldset>
            <Field
              label="Phone (optional)"
              hint="Only so we can reach you if we need to check something."
            >
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="604 555 0123"
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-cream">
                Liquor or business licence (optional)
              </span>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors focus-within:border-primary",
                  licence
                    ? "border-lime-fg/60 bg-lime/5"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    licence ? "bg-lime text-on-pop" : "bg-ink-3 text-cream",
                  )}
                >
                  {licence ? (
                    <Check className="size-5" />
                  ) : (
                    <FileUp className="size-5" />
                  )}
                </span>
                <span className="min-w-0 text-[14px]">
                  <span className="block truncate font-semibold">
                    {licence ? licence.name : "Add a photo or PDF"}
                  </span>
                  <span className="block text-muted-foreground">
                    {licence
                      ? "Tap to change"
                      : "Gets you confirmed faster if your email isn't at the venue's domain."}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setLicence(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Signed in as <span className="text-cream">{me.email}</span>. By
              claiming, you confirm you're allowed to manage {venue.name} and
              agree to our{" "}
              <Link
                to="/terms"
                className="text-cream underline underline-offset-4"
              >
                terms
              </Link>
              .
            </p>
            <ErrorLine error={error} />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? (
                "Claiming…"
              ) : (
                <>
                  Yes, I run this place <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      )}
    </VenueShell>
  );
}

// The venue's own photo with an owner's stamp turning in the corner. When the
// claim goes through, the stamp lands on the photo and sparks fly.
function ClaimHero({
  venue,
  owned,
  landed,
}: {
  venue: Venue;
  owned: boolean;
  landed: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-ink-2">
      <VenuePhoto venue={venue} eager large className="h-56 sm:h-64" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
        <Store className="size-3.5" />{" "}
        {owned ? "Official owner" : "Is this your place?"}
      </span>
      <div className="absolute top-3 right-3">
        <Stamp owned={owned} landed={landed} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="font-display text-[30px] leading-[1.02] font-extrabold tracking-tight text-balance">
          {venue.name}
        </p>
        <p className="mt-1 truncate text-[14px] text-white/75">
          {venue.address}
        </p>
      </div>
    </section>
  );
}

const RING = {
  owned: "OFFICIAL OWNER · A LITTLE HANG · ",
  open: "CLAIM YOUR LISTING · A LITTLE HANG · ",
};

// `landed`: the claim just went through, so the stamp lands with sparks.
// Coming back to an approved claim shows it already in place.
function Stamp({ owned, landed }: { owned: boolean; landed: boolean }) {
  return (
    <div className="relative size-[92px]" aria-hidden>
      {landed &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <span
            key={a}
            style={{ "--a": `${a}deg` } as CSSProperties}
            className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 animate-spark rounded-full bg-lime"
          />
        ))}
      <div
        className={cn(
          "relative size-full",
          landed
            ? "animate-stamp"
            : owned
              ? "-rotate-12"
              : "-rotate-12 opacity-90",
        )}
      >
        <svg
          viewBox="0 0 100 100"
          className={cn(
            "absolute inset-0 size-full",
            !owned && "animate-spin-slow",
          )}
        >
          <defs>
            <path
              id="stamp-ring"
              d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
            />
          </defs>
          <circle
            cx="50"
            cy="50"
            r="48"
            className={owned ? "fill-lime" : "fill-black/40"}
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            className={cn(
              "fill-none stroke-[1.5]",
              owned ? "stroke-on-pop/40" : "stroke-white/40",
            )}
          />
          <text
            className={cn(
              "font-display text-[9.5px] font-extrabold tracking-[0.08em]",
              owned ? "fill-on-pop" : "fill-white",
            )}
          >
            <textPath
              href="#stamp-ring"
              textLength="236"
              lengthAdjust="spacing"
            >
              {owned ? RING.owned : RING.open}
            </textPath>
          </text>
        </svg>
        <span
          className={cn(
            "absolute inset-0 grid place-items-center",
            owned ? "text-on-pop" : "text-white",
          )}
        >
          {owned ? (
            <Check className="size-8" strokeWidth={3} />
          ) : (
            <Store className="size-7" />
          )}
        </span>
      </div>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Sign in", "About you", "It's yours"];
  return (
    <ol
      className="mt-5 flex items-center gap-2"
      aria-label={`Step ${step} of 3`}
    >
      {labels.map((l, i) => {
        const n = i + 1;
        return (
          <li
            key={l}
            className={cn("flex items-center gap-2", n < 3 && "flex-1")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular transition-colors",
                n < step
                  ? "bg-lime text-on-pop"
                  : n === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-ink-3 text-muted-foreground",
              )}
            >
              {n < step ? <Check className="size-4" strokeWidth={3} /> : n}
            </span>
            <span
              className={cn(
                "text-[13px] whitespace-nowrap",
                n === step
                  ? "font-semibold text-cream"
                  : "hidden text-muted-foreground min-[380px]:inline",
              )}
            >
              {l}
            </span>
            {n < 3 && (
              <span
                className={cn(
                  "h-px min-w-2 flex-1",
                  n < step ? "bg-lime-fg/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const PERKS = [
  {
    icon: PencilLine,
    title: "Your times, your words",
    body: "Fix hours, deals and photos yourself, any time.",
  },
  {
    icon: Store,
    title: "The venue badge",
    body: "Your listing says Updated by the venue.",
  },
  {
    icon: BarChart3,
    title: "See who's looking",
    body: "Views, saves, calls and directions each week.",
  },
  {
    icon: MessageCircle,
    title: "Hear it first",
    body: "Guest reports about your listing come to you.",
  },
];

const WINS = [
  {
    icon: Clock,
    title: "Check your happy hour times",
    body: "Guests plan around them, so make them exact.",
  },
  {
    icon: Sparkles,
    title: "Add this week's deals",
    body: "Prices and specials are what people tap for.",
  },
  {
    icon: ImagePlus,
    title: "Upload your best photo",
    body: "Your own shot leads your listing.",
  },
];

function Perks() {
  return (
    <section className="mt-5">
      <div className="grid grid-cols-2 gap-2.5">
        {PERKS.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            style={{ "--i": i } as CSSProperties}
            className="animate-rise rounded-[20px] bg-ink-2 p-4"
          >
            <Icon className="size-5 text-primary" />
            <p className="mt-2.5 text-[14px] leading-snug font-semibold">
              {title}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[13px] text-muted-foreground">
        Free. No card, no catch.
      </p>
    </section>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-[background-color,transform] active:scale-95",
        on ? "bg-cream text-ink" : "bg-ink-3 text-cream hover:bg-line",
      )}
    >
      {on && <Check className="size-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}

function Progress({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          done
            ? "bg-lime text-on-pop"
            : active
              ? "bg-amber/20 text-amber-fg animate-live"
              : "bg-ink-3 text-muted-foreground",
        )}
      >
        {done ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <span
        className={cn(done || active ? "text-cream" : "text-muted-foreground")}
      >
        {label}
      </span>
    </li>
  );
}
