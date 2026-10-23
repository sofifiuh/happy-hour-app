import type { ReactNode } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/page-header";
import { Wordmark } from "@/components/wordmark";
import { SUPPORT_EMAIL } from "@/lib/links";
import { useTitle } from "@/lib/use-title";

export type InfoPage = "about" | "privacy" | "terms";

const TITLES: Record<InfoPage, string> = { about: "About", privacy: "Privacy", terms: "Terms" };

// Plain-language about, privacy and terms pages, linked from the list.
export function Info({ page }: { page: InfoPage }) {
  useTitle(TITLES[page]);
  return (
    <main className="mx-auto min-h-dvh max-w-2xl pb-16">
      <PageHeader title={TITLES[page]} />
      <article className="px-5 text-[15px] leading-relaxed text-cream/90">
        {page === "about" && <About />}
        {page === "privacy" && <Privacy />}
        {page === "terms" && <Terms />}
        <p className="mt-10 rounded-2xl bg-ink-2 px-4 py-3 text-[13px] text-muted-foreground">
          Questions or corrections:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cream underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <InfoNav current={page} />
      </article>
    </main>
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
        We read happy hour times and deals from each venue's own website: their happy hour page, a menu PDF, or a photo of the menu. A
        few come from a listing elsewhere when the venue doesn't publish one. Every night we re-check each source, and each spot's page
        links to the exact page we read and the date it last matched. Spots marked Verified have also been checked against their current
        menu by a person. Times change, so if something looks off, tap "Report a wrong time" on the spot's page and we'll fix it.
      </p>
      <H>
        <span id="hang-score">How the Hangout Score works</span>
      </H>
      <p>
        Every happy hour with enough deal info gets a Hangout Score out of 10. It's worked out from what's on the spot's page, the same way
        for every venue:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <b className="text-cream">Value (40%)</b>: each deal's price against what Vancouver spots typically charge for the same kind of
          thing (a pint, a glass of wine, a cocktail, oysters), plus how cheap the cheapest drink is.
        </li>
        <li>
          <b className="text-cream">Selection (25%)</b>: how many deals, how many kinds of drink, and whether there's food too.
        </li>
        <li>
          <b className="text-cream">Hours (20%)</b>: hours of happy hour a week, weekends, and a late-night window.
        </li>
        <li>
          <b className="text-cream">Vibe (15%)</b>: patio, live music, good for groups, and near transit.
        </li>
      </ul>
      <p className="mt-3">
        Value, Selection and Hours compare each spot with every other one, so 8 or more on one of those means roughly the top quarter of the city. Scores update when
        deals or times change. No venue can pay for a score or a higher one, and Google ratings aren't part of it. Spots with too few
        listed deals show no score until we have their menu.
      </p>
      <H>Made in Vancouver</H>
      <p>Designed by Sofia. Built for people who like a deal and a good patio.</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <p className="mt-2">The short version: we don't have accounts, your location and saved spots stay on your device, and our analytics is cookieless and anonymous.</p>
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
        We use PostHog for cookieless, privacy-friendly analytics, so we can see which features help and fix what doesn't. It sets no
        cookies, stores no identifier on your device, records no sessions or screens, and we don't use it for advertising.
      </p>
      <p className="mt-3">What we count: pages viewed, and a few actions such as searching (not what you typed), turning on a filter,
        opening a venue, saving, sharing, asking for directions and installing the app. Like any web request, these reach PostHog's
        servers in the US with your browser type and IP address, which PostHog uses for a rough location. We don't collect your name,
        email, precise location or anything you type.</p>
      <p className="mt-3">If your browser sends Do Not Track, analytics stays off. We don't use any other analytics, advertising or
        tracking tools.</p>
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
