import { useMemo } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { track } from "@/lib/analytics";
import { matchesAmenity, useStore, type AmenityKey } from "@/lib/store";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/use-media";
import { cn } from "@/lib/utils";

export const AMENITIES: { key: AmenityKey; emoji: string; label: string }[] = [
  { key: "topScore", emoji: "✨", label: "Top happy hours (Hangout Score 7.5+)" },
  { key: "patio", emoji: "🌳", label: "Patio" },
  { key: "lateNight", emoji: "🌙", label: "Late night (on till 9pm or later)" },
  { key: "food", emoji: "🍟", label: "Food deals" },
  { key: "drink", emoji: "🍸", label: "Drink deals" },
  { key: "transit", emoji: "🚇", label: "Near transit" },
];

const THEMES: { key: ThemePref; label: string; Icon: typeof Sun }[] = [
  { key: "system", label: "Auto", Icon: Monitor },
  { key: "light", label: "Light", Icon: Sun },
  { key: "dark", label: "Dark", Icon: Moon },
];

// Light / dark / follow the device. Lives with the filters as the app's one
// settings sheet; it isn't a filter, so Clear all leaves it alone.
function AppearancePicker() {
  const pref = useThemePref();
  return (
    <section className="pt-5 pb-4" aria-labelledby="appearance-label">
      <h3 id="appearance-label" className="text-sm font-semibold text-muted-foreground">
        Appearance
      </h3>
      <div role="radiogroup" aria-labelledby="appearance-label" className="mt-2 flex gap-1 rounded-full bg-ink-3 p-1">
        {THEMES.map(({ key, label, Icon }) => {
          const on = pref === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setThemePref(key)}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-[color,background-color,transform] active:scale-95",
                on ? "bg-cream text-ink" : "text-cream/80",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function FiltersDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { venues, filters, setFilters, rows } = useStore();
  const counts = useMemo(
    () => Object.fromEntries(AMENITIES.map((a) => [a.key, venues.filter((v) => matchesAmenity(v, a.key)).length])),
    [venues],
  );
  const toggle = (key: AmenityKey, on: boolean) => {
    if (on) track({ name: "filter_applied", filter: key });
    setFilters({ amenities: on ? [...filters.amenities, key] : filters.amenities.filter((k) => k !== key) });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Only show spots with all of these.</DrawerDescription>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto px-5">
          <ul>
            {AMENITIES.map((a) => {
              const on = filters.amenities.includes(a.key);
              return (
                <li key={a.key} className="border-b border-border last:border-0">
                  <label className="flex min-h-14 items-center gap-3 py-2">
                    <span className="grid size-9 place-items-center rounded-full bg-ink-3 text-base">{a.emoji}</span>
                    <span className="flex-1 text-[15px]">
                      {a.label}
                      <span className="ml-2 text-xs text-muted-foreground">{counts[a.key]}</span>
                    </span>
                    <Switch checked={on} onCheckedChange={(c) => toggle(a.key, c)} aria-label={a.label} />
                  </label>
                </li>
              );
            })}
          </ul>
          <AppearancePicker />
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => setFilters({ amenities: [] })} disabled={!filters.amenities.length}>
            Clear all
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Show {rows.length} {rows.length === 1 ? "spot" : "spots"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
