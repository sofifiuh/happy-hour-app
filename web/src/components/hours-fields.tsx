import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import type { VenueEdit } from "@/lib/api";
import { DAY_SHORT } from "@/lib/hours";
import { cn } from "@/lib/utils";

// Happy hour fields shared by the owner's editor, the review queue and
// "Add a happy hour": day chips, an extra time window, the deal list.
type HH = NonNullable<VenueEdit["hh"]>;
type Deal = HH["deals"][number];
type Win = HH["extra"][number];

export function Days({ value, onChange }: { value: number[]; onChange: (d: number[]) => void }) {
  return (
    <div role="group" aria-label="Days" className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={cn("h-10 min-w-12 rounded-full px-3 text-[14px] font-medium transition-colors", on ? "bg-primary text-primary-foreground" : "bg-ink-3 text-cream")}
          >
            {DAY_SHORT[d]}
          </button>
        );
      })}
    </div>
  );
}

export function ExtraWindow({ win, onChange, onRemove }: { win: Win; onChange: (w: Win) => void; onRemove: () => void }) {
  return (
    <div className="space-y-3 rounded-2xl bg-ink-3/60 p-4">
      <div className="flex items-center gap-2">
        <Input value={win.label ?? ""} placeholder="Label, like Late night" onChange={(e) => onChange({ ...win, label: e.target.value || null })} className="flex-1" aria-label="Label" />
        <Button variant="ghost" size="icon-sm" aria-label="Remove this time" onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      <Days value={win.days} onChange={(days) => onChange({ ...win, days })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts">
          <Input type="time" value={win.start} onChange={(e) => onChange({ ...win, start: e.target.value })} />
        </Field>
        <Field label="Ends" hint="Leave empty for until close">
          <Input type="time" value={win.end ?? ""} onChange={(e) => onChange({ ...win, end: e.target.value || null })} />
        </Field>
      </div>
    </div>
  );
}

export function Deals({ deals, onChange }: { deals: Deal[]; onChange: (d: Deal[]) => void }) {
  const update = (i: number, patch: Partial<Deal>) => onChange(deals.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <div className="space-y-2">
      {deals.map((d, i) => (
        <div key={i} className="space-y-3 rounded-[22px] bg-ink-2 p-4">
          <div className="flex gap-2">
            <Input value={d.name} placeholder="House lager" onChange={(e) => update(i, { name: e.target.value })} aria-label="Deal name" className="flex-1" />
            <Input value={d.price} placeholder="$6" onChange={(e) => update(i, { price: e.target.value })} aria-label="Price" className="w-24" />
          </div>
          <div className="flex items-center gap-2">
            {(["drink", "food"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={d.category === c}
                onClick={() => update(i, { category: c })}
                className={cn("h-9 rounded-full px-4 text-[13px] font-medium", d.category === c ? "bg-cream text-ink" : "bg-ink-3 text-cream")}
              >
                {c === "drink" ? "Drink" : "Food"}
              </button>
            ))}
            <span className="flex-1" />
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.name || "deal"}`} onClick={() => onChange(deals.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
          <Input value={d.description} placeholder="Details (optional): 16 oz, each, after 9pm…" onChange={(e) => update(i, { description: e.target.value })} aria-label="Details" />
        </div>
      ))}
      {deals.length < 40 && (
        <Button variant="secondary" className="w-full" onClick={() => onChange([...deals, { name: "", price: "", category: "drink", description: "" }])}>
          <Plus /> Add a deal
        </Button>
      )}
      <p className="px-1 text-[12px] text-muted-foreground">Drink prices must follow BC's minimum drink price rules.</p>
    </div>
  );
}
