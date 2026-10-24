import { BROWSER_ROUTER } from "@/lib/routes";
import { useStore } from "@/lib/store";
import type { HubKind } from "@/lib/types";

const GROUPS: { title: string; kinds: HubKind[] }[] = [
  { title: "Vancouver neighbourhoods", kinds: ["area"] },
  { title: "Around Metro Vancouver", kinds: ["city"] },
  { title: "By day", kinds: ["day"] },
  { title: "By deal", kinds: ["deal", "vibe"] },
];

// Links to the static hub pages (/happy-hour/<slug>/), so the home page
// leads crawlers and people to every neighbourhood, city, day and deal.
// Hub pages exist only on the alittlehang.com build.
export function ExploreLinks() {
  const { hubs, best } = useStore();
  const entries = Object.entries(hubs);
  if (!BROWSER_ROUTER || !entries.length) return null;
  return (
    <nav aria-label="Explore happy hours" className="mt-8 space-y-5 border-t border-border pt-6">
      <h2 className="font-display text-[20px] font-bold tracking-tight">Explore happy hours</h2>
      <a href="/research/" className="flex flex-col gap-0.5 rounded-2xl bg-ink-2 px-4 py-3 ring-1 ring-edge/5">
        <span className="font-semibold">Research and data</span>
        <span className="text-[13px] text-muted-foreground">Happy hour prices, rankings and free data to use with a credit</span>
      </a>
      {best.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Best happy hours, ranked</h3>
          <ul className="flex flex-wrap gap-2">
            {best.map((b) => (
              <li key={b.slug}>
                <a
                  href={b.slug === "metro" ? "/happy-hour/best/" : `/happy-hour/${b.slug}/best/`}
                  className="inline-flex min-h-10 items-center rounded-full bg-ink-2 px-3.5 text-[14px] font-medium ring-1 ring-edge/5"
                >
                  {b.kind === "metro" ? "All of Metro Vancouver" : b.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {GROUPS.map((g) => {
        const list = entries.filter(([, h]) => g.kinds.includes(h.kind));
        if (!list.length) return null;
        return (
          <section key={g.title}>
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{g.title}</h3>
            <ul className="flex flex-wrap gap-2">
              {list.map(([slug, h]) => (
                <li key={slug}>
                  <a href={`/happy-hour/${slug}/`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink-2 px-3.5 text-[14px] font-medium ring-1 ring-edge/5">
                    {h.short ?? h.label}
                    <span className="text-[12px] text-muted-foreground tabular">{h.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
