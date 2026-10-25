import { Camera, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { apiEnabled } from "@/lib/api";
import { cn } from "@/lib/utils";

// "Know a happy hour we're missing?": the way into /submit from lists.
export function SubmitPrompt({ className, from }: { className?: string; from: string }) {
  if (!apiEnabled) return null;
  return (
    <Link
      to={`/submit?from=${from}`}
      viewTransition
      className={cn(
        "group flex min-h-16 items-center gap-3.5 rounded-[22px] bg-ink-2 p-4 ring-1 ring-edge/5 transition-[background-color,transform] hover:bg-ink-3 active:scale-[0.99]",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
        <Camera className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] leading-tight font-bold">Know a happy hour we're missing?</span>
        <span className="block text-[14px] text-muted-foreground">Snap the menu and we'll add it.</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
