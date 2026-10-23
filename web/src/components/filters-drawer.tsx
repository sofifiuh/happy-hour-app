import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { matchesAmenity, useStore, type AmenityKey } from "@/lib/store";

export const AMENITIES: { key: AmenityKey; emoji: string; label: string }[] = [
  { key: "topScore", emoji: "✨", label: "Top happy hours (Hang Score 7.5+)" },
  { key: "patio", emoji: "🌳", label: "Patio" },
  { key: "lateNight", emoji: "🌙", label: "Late night (on till 9pm or later)" },
  { key: "food", emoji: "🍟", label: "Food deals" },
  { key: "drink", emoji: "🍸", label: "Drink deals" },
  { key: "transit", emoji: "🚇", label: "Near transit" },
];

export function FiltersDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { venues, filters, setFilters, rows } = useStore();
  const counts = useMemo(
    () => Object.fromEntries(AMENITIES.map((a) => [a.key, venues.filter((v) => matchesAmenity(v, a.key)).length])),
    [venues],
  );
  const toggle = (key: AmenityKey, on: boolean) =>
    setFilters({ amenities: on ? [...filters.amenities, key] : filters.amenities.filter((k) => k !== key) });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Only show spots with all of these.</DrawerDescription>
          </div>
        </DrawerHeader>
        <ul className="overflow-y-auto px-5">
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
