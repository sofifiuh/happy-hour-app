import { useMemo } from "react";
import { Link } from "react-router";
import { PageHeader } from "@/components/page-header";
import { spotPath } from "@/lib/routes";
import { useStore } from "@/lib/store";
import { useTitle } from "@/lib/use-title";

// Every venue A–Z at /spots/ (kept from the old site for search engines and
// people who browse by name).
export function AllSpots() {
  useTitle("All Metro Vancouver happy hour spots, A–Z");
  const { venues } = useStore();
  const groups = useMemo(() => {
    const by = new Map<string, typeof venues>();
    for (const v of [...venues].sort((a, b) => a.name.localeCompare(b.name))) {
      const k = /[a-z]/i.test(v.name[0]) ? v.name[0].toUpperCase() : "#";
      by.set(k, [...(by.get(k) ?? []), v]);
    }
    return [...by];
  }, [venues]);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-16">
      <PageHeader title="All spots A–Z" />
      <main className="px-4">
        <p className="mb-4 text-[15px] text-muted-foreground">
          {venues.length} Metro Vancouver bars and restaurants, with happy hour times and deals from their own menus.
        </p>
        {groups.map(([letter, list]) => (
          <section key={letter} className="mb-5">
            <h2 className="sticky top-[68px] z-10 bg-ink/90 py-1 font-display text-[20px] font-bold backdrop-blur">{letter}</h2>
            <ul className="divide-y divide-border rounded-2xl bg-ink-2 px-4">
              {list.map((v) => (
                <li key={v.id}>
                  <Link to={spotPath(v.id)} viewTransition className="block py-3 transition-colors hover:text-orange">
                    <span className="block text-[15px] font-semibold">{v.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{v.address}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
