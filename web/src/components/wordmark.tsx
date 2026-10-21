import { cn } from "@/lib/utils";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/components/logo-path";

// The stacked "a / little / hang" logo Jason picked from Sofia's Figma.
// Sized by height; colour follows the text colour.
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} role="img" aria-label="A Little Hang" className={cn("w-auto fill-current", className)}>
      <path d={LOGO_PATH} />
    </svg>
  );
}
