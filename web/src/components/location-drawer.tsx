import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AREAS } from "@/lib/geo";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Explains "near me" before the browser's own prompt, and offers a
// neighbourhood instead, so the list still sorts by distance without it.
export function LocationDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { locationState, requestLocation, area, setArea } = useStore();
  const denied = locationState === "denied";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div>
            <DrawerTitle>{denied ? "Pick a neighbourhood" : "See what's closest"}</DrawerTitle>
            <DrawerDescription className="mt-1">
              {denied
                ? "Location is off for this site. Choose where you are and we'll sort spots by walking distance."
                : "We use your location only on this device, to sort spots by walking distance. It's never stored or shared."}
            </DrawerDescription>
          </div>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-6">
          {!denied && (
            <Button
              size="lg"
              className="mt-2 w-full"
              disabled={locationState === "asking"}
              onClick={() => {
                setArea(null);
                requestLocation();
                onOpenChange(false);
              }}
            >
              <LocateFixed /> {locationState === "asking" ? "Finding you…" : "Use my location"}
            </Button>
          )}
          <p className={cn("mb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase", denied ? "mt-2" : "mt-6")}>
            {denied ? "Neighbourhoods" : "Or pick a neighbourhood"}
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => {
              const on = area?.name === a.name;
              return (
                <button
                  key={a.name}
                  onClick={() => {
                    setArea(a);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors",
                    on ? "bg-cream text-ink" : "bg-ink-3 text-cream active:bg-line",
                  )}
                >
                  {on && <MapPin className="size-4" />}
                  {a.name}
                </button>
              );
            })}
          </div>
          {area && (
            <button onClick={() => setArea(null)} className="mt-5 text-[14px] font-medium text-muted-foreground underline underline-offset-4">
              Clear neighbourhood
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
