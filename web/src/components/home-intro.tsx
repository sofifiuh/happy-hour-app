import { BROWSER_ROUTER } from "@/lib/routes";
import { homeIntro } from "@/lib/seo";
import { useStore } from "@/lib/store";

// What the site covers, in plain words, under the home list. The static home
// page (scripts/prerender.mjs) carries the same paragraphs, so search engines
// read them before and after the app boots. Links go to the hub pages, which
// exist only on the alittlehang.com build.
export function HomeIntro() {
  const { hubs, venues } = useStore();
  if (!BROWSER_ROUTER || !Object.keys(hubs).length || !venues.length) return null;
  return (
    <section aria-labelledby="home-intro" className="mt-8 border-t border-border pt-6">
      <h2 id="home-intro" className="font-display text-[20px] font-bold tracking-tight">
        Local happy hours, checked nightly
      </h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
        {homeIntro(hubs, venues.length).map((para, i) => (
          <p key={i}>
            {para.map((b, j) =>
              typeof b === "string" ? (
                b
              ) : (
                <a key={j} href={b.href} className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary">
                  {b.text}
                </a>
              ),
            )}
          </p>
        ))}
      </div>
    </section>
  );
}
