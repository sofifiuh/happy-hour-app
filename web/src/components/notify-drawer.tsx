import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

export const REMIND_KEY = "alh:reminders";

export function remindersOn() {
  try {
    return localStorage.getItem(REMIND_KEY) === "on";
  } catch {
    return false;
  }
}

export function setReminders(on: boolean) {
  try {
    localStorage.setItem(REMIND_KEY, on ? "on" : "off");
  } catch {
    // storage blocked
  }
}

export function remindersAsked() {
  try {
    return localStorage.getItem(REMIND_KEY) !== null;
  } catch {
    return true;
  }
}

// Asked once, right after someone saves their first spot: the moment a
// reminder obviously helps. Sending them is native-app work (Capacitor).
export function NotifyDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const answer = async (on: boolean) => {
    setReminders(on);
    if (on && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // some browsers only allow this from an installed app
      }
    }
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col items-center px-6 pt-6 pb-6 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
            <BellRing className="size-7" />
          </span>
          <DrawerTitle className="mt-4">Want a heads-up?</DrawerTitle>
          <DrawerDescription className="mt-2 max-w-[32ch] text-[15px]">
            We'll nudge you 30 minutes before happy hour starts at your saved spots. Turn it off any time in Saved.
          </DrawerDescription>
          <Button size="lg" className="mt-6 w-full" onClick={() => answer(true)}>
            Remind me
          </Button>
          <Button size="lg" variant="ghost" className="mt-2 w-full" onClick={() => answer(false)}>
            Not now
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
