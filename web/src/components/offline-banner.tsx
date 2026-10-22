import { WifiOff } from "lucide-react";
import { useStore } from "@/lib/store";

export function OfflineBanner() {
  const { online, venues } = useStore();
  if (online) return null;
  return (
    <div role="status" className="mx-4 mb-2 flex items-center gap-2.5 rounded-2xl bg-ink-3 px-4 py-3 text-[13px]">
      <WifiOff className="size-4 shrink-0 text-amber-fg" />
      <span>
        <span className="font-semibold">You're offline.</span>{" "}
        <span className="text-muted-foreground">
          {venues.length ? "Showing spots from your last visit; times still update." : "Connect to load happy hours."}
        </span>
      </span>
    </div>
  );
}
