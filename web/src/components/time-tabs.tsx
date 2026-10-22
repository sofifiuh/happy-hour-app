import { CalendarClock } from "lucide-react";
import { DAY_SHORT, fmtTime } from "@/lib/hours";
import { useStore, type TimeTab } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS: { key: Exclude<TimeTab, "plan">; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Happening now" },
  { key: "upcoming", label: "Upcoming" },
];

// All / Happening now / Upcoming / Date & Time, as in Sofia's list header.
export function TimeTabs({ onOpenPlan, className }: { onOpenPlan: () => void; className?: string }) {
  const { filters, setFilters } = useStore();
  const planLabel = filters.tab === "plan" && filters.plan ? `${DAY_SHORT[filters.plan.day]}, ${fmtTime(filters.plan.time)}` : "Date & Time";
  const chip = (active: boolean) =>
    cn(
      "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-[color,background-color,transform] duration-200 active:scale-95",
      active ? "bg-cream text-ink" : "bg-ink-3 text-cream/80 hover:text-cream",
    );
  return (
    <div role="tablist" className={cn("no-scrollbar fade-x flex gap-2 overflow-x-auto px-4 py-1", className)}>
      {TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={filters.tab === t.key}
          className={chip(filters.tab === t.key)}
          onClick={() => setFilters({ tab: t.key })}
        >
          {t.key === "live" && <span className={cn("size-2 rounded-full bg-lime", filters.tab === "live" && "bg-[#7a8a00]")} />}
          {t.label}
        </button>
      ))}
      <button role="tab" aria-selected={filters.tab === "plan"} className={chip(filters.tab === "plan")} onClick={onOpenPlan}>
        <CalendarClock className="size-4" />
        {planLabel}
      </button>
    </div>
  );
}
