import { cn } from "@/lib/utils";

// The stacked "a / little / hang." mark from Sophie's Branding page,
// set in Funnel Display ExtraBold (her bold variant). The serif variant
// uses Elanor, which is personal-use only until a licence is bought.
export function Wordmark({ className, inline = false }: { className?: string; inline?: boolean }) {
  if (inline) {
    return (
      <span className={cn("font-display font-extrabold tracking-[-0.03em] leading-none", className)}>
        a little hang<span className="text-primary">.</span>
      </span>
    );
  }
  return (
    <span style={{ lineHeight: 0.84 }} className={cn("inline-flex flex-col items-center font-display font-extrabold tracking-[-0.04em]", className)}>
      <span className="block">a</span>
      <span className="block">little</span>
      <span className="block">
        hang<span className="text-primary">.</span>
      </span>
    </span>
  );
}
