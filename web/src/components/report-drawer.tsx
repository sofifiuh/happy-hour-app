import { useState } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import type { Venue } from "@/lib/types";

// "Report a wrong time": goes to the review queue, and to the venue's
// manager when it has one.
export function ReportDrawer({ venue, open, onOpenChange }: { venue: Venue; open: boolean; onOpenChange: (o: boolean) => void }) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/reports", { venue_id: venue.id, message, email: email || undefined });
      onOpenChange(false);
      setMessage("");
      toast("Thanks, we'll take a look");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>What's wrong at {venue.name}?</DrawerTitle>
          <DrawerDescription>Times, deals, prices, or closed for good? We check every report.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-5">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            autoFocus
            aria-label="What's wrong"
            placeholder="Happy hour ends at 5 now, not 6"
            className="w-full resize-none rounded-[20px] bg-input px-4 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email, if you'd like a reply (optional)" aria-label="Your email (optional)" />
          {error && (
            <p role="alert" className="text-[14px] text-orange-fg">
              {error}
            </p>
          )}
        </div>
        <DrawerFooter>
          <Button size="lg" className="w-full" disabled={busy || message.trim().length < 3} onClick={send}>
            {busy ? "Sending…" : "Send report"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
