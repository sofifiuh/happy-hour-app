import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DAY_SHORT, fmtTime, nowHHMM } from "@/lib/hours";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Named slots first (how people actually plan), then every hour.
const SLOTS = [
  { label: "Lunch", time: "12:00" },
  { label: "After work", time: "16:00" },
  { label: "Dinner", time: "18:00" },
  { label: "Late night", time: "21:00" },
];
const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 11).padStart(2, "0")}:00`);

export function PlanDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { filters, setFilters } = useStore();
  const today = new Date().getDay();
  const [day, setDay] = useState(filters.plan?.day ?? today);
  const [time, setTime] = useState(filters.plan?.time ?? (nowHHMM() < "16:00" ? "16:00" : "18:00"));

  const pill = (active: boolean) =>
    cn(
      "h-10 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-ink-3 text-cream",
    );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div>
            <DrawerTitle>Plan a hang</DrawerTitle>
            <DrawerDescription>See what's on for a day and time.</DrawerDescription>
          </div>
        </DrawerHeader>
        <div className="space-y-6 overflow-y-auto px-5 pt-2 pb-4">
          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Day</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_SHORT.map((d, i) => {
                const idx = (today + i) % 7;
                return (
                  <button key={d} className={cn(pill(day === idx), "flex h-14 flex-col items-center justify-center px-0")} onClick={() => setDay(idx)}>
                    <span className="text-[13px]">{i === 0 ? "Today" : DAY_SHORT[idx]}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Time</h3>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s.time}
                  className={cn(pill(time === s.time), "flex h-14 items-center justify-between rounded-2xl px-4")}
                  onClick={() => setTime(s.time)}
                >
                  <span className="font-semibold">{s.label}</span>
                  <span className="tabular opacity-80">{fmtTime(s.time)}</span>
                </button>
              ))}
            </div>
            <div className="no-scrollbar fade-x -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
              {HOURS.map((h) => (
                <button key={h} className={cn(pill(time === h), "tabular")} onClick={() => setTime(h)}>
                  {fmtTime(h)}
                </button>
              ))}
            </div>
          </section>
        </div>
        <DrawerFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setFilters({ tab: "all", plan: null });
              onOpenChange(false);
            }}
          >
            Reset
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setFilters({ tab: "plan", plan: { day, time } });
              onOpenChange(false);
            }}
          >
            Show {day === today ? "today" : DAY_SHORT[day]} at {fmtTime(time)}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
