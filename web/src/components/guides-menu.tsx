import { Popover } from "@base-ui/react/popover";
import { BookOpen, ChartNoAxesColumn, ChevronRight, ListOrdered, MapPinned, ReceiptText, Trophy, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { track } from "@/lib/analytics";
import { reducedMotion } from "@/lib/motion";
import { BROWSER_ROUTER } from "@/lib/routes";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// "Guides": the way from the list and map to the content pages (best-of
// lists, the Happy Hour Index, the research hub, every spot A–Z, and the
// neighbourhood/day/deal hubs at the bottom of the list). A pill at the top
// right of the desktop map opens it as a popover; on phones a pill beside
// the List / Map toggle opens it as a sheet. The pages are static, so the links are plain
// anchors, and they only exist on the alittlehang.com build.

const bestHref = (slug: string) => (slug === "metro" ? "/happy-hour/best/" : `/happy-hour/${slug}/best/`);

// Scroll the list to the hub links ("Explore happy hours") at its foot.
function toExplore() {
  const el = document.getElementById("explore");
  if (!el) return;
  el.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

function GuidesContent({ onDone, title, description, explore = true }: { onDone: () => void; title: ReactNode; description: ReactNode; explore?: boolean }) {
  const { best, venues } = useStore();
  const metro = best.find((b) => b.slug === "metro");
  const top = useMemo(() => (metro ? venues.find((v) => v.id === metro.ids[0]) : undefined), [metro, venues]);
  const places = best.filter((b) => b.slug !== "metro");
  const go = (guide: string) => track({ name: "guide_clicked", guide });

  const row = "group flex min-h-16 items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-ink-3/70 focus-visible:bg-ink-3/70 focus-visible:outline-none active:scale-[0.99]";
  const tile = "grid size-10 shrink-0 place-items-center rounded-[14px] bg-ink-3 text-cream";
  const chevron = <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />;
  const text = (name: string, line: ReactNode) => (
    <span className="min-w-0">
      <span className="block font-semibold leading-tight">{name}</span>
      <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{line}</span>
    </span>
  );

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        {title}
        {description}
      </div>

      {/* Best of leads: it's the page most people come for. Pink is the
          rankings colour, so only this one gets a colour. */}
      <div className="mx-2 rounded-[22px] bg-score/12 p-1.5 ring-1 ring-score/25">
        <a href={bestHref("metro")} onClick={() => go("best")} className={cn(row, "hover:bg-score/15 focus-visible:bg-score/15")}>
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-score text-on-pop">
            <Trophy className="size-5" />
          </span>
          {text(
            "Best happy hours, ranked",
            top ? (
              <>
                #1 overall: <span className="font-medium text-cream">{top.name}</span>
              </>
            ) : (
              "Top 10 by Hangout Score, place by place"
            ),
          )}
          {chevron}
        </a>
        {places.length > 0 && (
          <ul aria-label="Best-of lists by place" className="no-scrollbar mt-0.5 flex gap-1.5 overflow-x-auto px-1.5 pb-1.5 [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]">
            {places.map((b) => (
              <li key={b.slug} className="shrink-0">
                <a
                  href={bestHref(b.slug)}
                  onClick={() => go(`best:${b.slug}`)}
                  className="inline-flex h-8 items-center rounded-full bg-ink-2 px-3 text-[13px] font-medium ring-1 ring-edge/8 transition-colors hover:bg-ink-3"
                >
                  {b.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ul className="space-y-0.5 p-2">
        <li>
          <a href="/happy-hour-index/" onClick={() => go("index")} className={row}>
            <span className={tile}>
              <ReceiptText className="size-5" />
            </span>
            {text("Happy Hour Index", "What a pint, wine and a cocktail really cost")}
            {chevron}
          </a>
        </li>
        <li>
          <a href="/research/" onClick={() => go("research")} className={row}>
            <span className={tile}>
              <ChartNoAxesColumn className="size-5" />
            </span>
            {text("Research and data", "Stats and trends from every menu we track")}
            {chevron}
          </a>
        </li>
        <li>
          <a href="/spots/" onClick={() => go("spots")} className={row}>
            <span className={tile}>
              <ListOrdered className="size-5" />
            </span>
            {text("Every spot, A–Z", venues.length ? `All ${venues.length} happy hours in one list` : "Every happy hour in one list")}
            {chevron}
          </a>
        </li>
        {explore && (
        <li>
          <button
            type="button"
            onClick={() => {
              go("explore");
              onDone();
              // Let the sheet or popover close before the list scrolls.
              setTimeout(toExplore, 220);
            }}
            className={cn(row, "w-full text-left")}
          >
            <span className={tile}>
              <MapPinned className="size-5" />
            </span>
            {text("By neighbourhood, day or deal", "Downtown, Kits, Tuesdays, oysters and more")}
            {chevron}
          </button>
        </li>
        )}
      </ul>
    </div>
  );
}

// Desktop: a pill floating at the top right of the map.
export function GuidesPill({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  if (!BROWSER_ROUTER) return null;
  return (
    // Modal, so the click that dismisses it lands on the backdrop and
    // never reaches the map underneath (a pin click opens a venue).
    <Popover.Root
      modal
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) track({ name: "guides_opened", from: "desktop" });
      }}
    >
      <Popover.Trigger
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full bg-ink-2/95 pr-4 pl-3.5 text-[14px] font-semibold text-cream shadow-(--shadow-float) ring-1 ring-edge/10 backdrop-blur transition-[transform,background-color] hover:bg-ink-3 active:scale-95 data-[popup-open]:bg-cream data-[popup-open]:text-ink",
          className,
        )}
      >
        <BookOpen className="size-[18px]" /> Guides
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-40">
          <Popover.Popup className="w-[380px] origin-(--transform-origin) overflow-hidden rounded-[26px] bg-ink-2 pb-1 text-cream shadow-(--shadow-float) ring-1 ring-edge/10 outline-none transition-[opacity,scale,translate] duration-200 ease-out data-[ending-style]:-translate-y-1 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <GuidesContent
              onDone={() => setOpen(false)}
              title={<Popover.Title className="font-display text-[22px] font-extrabold tracking-tight">Guides</Popover.Title>}
              description={<Popover.Description className="mt-0.5 text-[13px] text-muted-foreground">Rankings, prices and data from local happy hours.</Popover.Description>}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Phones: a pill beside the List / Map toggle at the bottom of the list
// and map screens (thumb reach, always in view), opening a sheet.
export function GuidesButton({ from, className }: { from: "list" | "map"; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!BROWSER_ROUTER) return null;
  // A Drawer trigger, so closing the sheet hands focus back to it.
  return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger
          onClick={() => {
            setOpen(true);
            track({ name: "guides_opened", from });
          }}
          className={cn(
            "pointer-events-auto inline-flex h-11 items-center gap-1.5 rounded-full bg-ink-2/95 pr-4 pl-3.5 text-[14px] font-semibold text-cream shadow-(--shadow-float) ring-1 ring-edge/5 backdrop-blur transition-transform active:scale-95",
            className,
          )}
        >
          <BookOpen className="size-4" /> Guides
        </DrawerTrigger>
        <DrawerContent>
          <div className="no-scrollbar overflow-y-auto pb-3">
            <GuidesContent
              explore={from === "list"}
              onDone={() => setOpen(false)}
              title={
                <div className="flex items-center justify-between">
                  <DrawerTitle>Guides</DrawerTitle>
                  <DrawerClose aria-label="Close" className="-mr-1 grid size-10 place-items-center rounded-full bg-ink-3 text-cream active:scale-90">
                    <X className="size-[18px]" />
                  </DrawerClose>
                </div>
              }
              description={<DrawerDescription className="mt-0.5">Rankings, prices and data from local happy hours.</DrawerDescription>}
            />
          </div>
        </DrawerContent>
      </Drawer>
  );
}
