import type { ReactNode } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/page-header";
import { Wordmark } from "@/components/wordmark";
import { SUPPORT_EMAIL } from "@/lib/links";

export type InfoPage = "about" | "privacy" | "terms";

const TITLES: Record<InfoPage, string> = { about: "About", privacy: "Privacy", terms: "Terms" };

// Draft copy for review before launch; the stores need privacy and terms
// pages reachable from inside the app.
export function Info({ page }: { page: InfoPage }) {
  return (
    <div className="min-h-dvh pb-16">
      <PageHeader title={TITLES[page]} />
      <article className="px-5 text-[15px] leading-relaxed text-cream/90">
        {page === "about" && <About />}
        {page === "privacy" && <Privacy />}
        {page === "terms" && <Terms />}
        <p className="mt-10 rounded-2xl bg-ink-2 px-4 py-3 text-[13px] text-muted-foreground">
          Draft for review. Questions or corrections:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cream underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <InfoNav current={page} />
      </article>
    </div>
  );
}

export function InfoNav({ current }: { current?: InfoPage }) {
  return (
    <nav className="mt-6 flex justify-center gap-5 text-[13px] text-muted-foreground">
      {(Object.keys(TITLES) as InfoPage[])
        .filter((p) => p !== current)
        .map((p) => (
          <Link key={p} to={`/${p}`} className="underline-offset-4 hover:underline">
            {TITLES[p]}
          </Link>
        ))}
    </nav>
  );
}

function H({ children }: { children: ReactNode }) {
  return <h2 className="mt-7 mb-2 font-display text-[19px] font-bold tracking-tight text-cream">{children}</h2>;
}

function About() {
  return (
    <>
      <Wordmark className="my-4 h-24 text-cream" />
      <p>
        A Little Hang shows you which Vancouver bars and restaurants have happy hour on right now, what's starting soon, and what the deals
        are, so you can pick a spot in seconds.
      </p>
      <H>Where the times come from</H>
      <p>
        We gather happy hour times and menus from each venue's own website and listings, and re-check them regularly. Spots marked
        Verified have been checked against their current menu by a person. Times change, so if something looks off, tap "Report a wrong
        time" on the spot's page and we'll fix it.
      </p>
      <H>Made in Vancouver</H>
      <p>Designed by Sofia. Built for people who like a deal and a good patio.</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <p className="mt-2">The short version: we don't have accounts, and what you do in the app stays on your device.</p>
      <H>Location</H>
      <p>
        If you allow it, your location is used on your device to sort spots by walking distance. It isn't sent to us or stored. You can
        pick a neighbourhood instead, or turn location off in your browser or phone settings.
      </p>
      <H>Saved spots and reminders</H>
      <p>
        Saved spots and your reminder setting are kept in your browser or the app's storage on your device. Clearing site data or
        deleting the app removes them.
      </p>
      <H>Usage data</H>
      <p>
        We may collect anonymous usage counts (for example, which screens are opened) to improve the app. These don't identify you.
        This section will list the exact tool before launch.
      </p>
      <H>Links to other sites</H>
      <p>Venue websites, maps and phone links open other services, which have their own privacy policies.</p>
    </>
  );
}

function Terms() {
  return (
    <>
      <p className="mt-2">By using A Little Hang you agree to these terms.</p>
      <H>Information is a guide</H>
      <p>
        Happy hour times, prices and deals are set by each venue and can change without notice. We work to keep them accurate but can't
        guarantee them. Please check with the venue before you go.
      </p>
      <H>Drink responsibly</H>
      <p>You must be of legal drinking age in British Columbia (19+) to buy alcohol. Please don't drink and drive.</p>
      <H>Venue names and photos</H>
      <p>Venue names, logos and photos belong to their owners and are shown to help you find them. Photo credits appear where known.</p>
      <H>Changes</H>
      <p>We may update these terms. The latest version is always here.</p>
    </>
  );
}
