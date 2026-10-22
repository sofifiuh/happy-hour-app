import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap", {
  variants: {
    variant: {
      default: "bg-ink-3 text-cream",
      live: "bg-lime text-on-pop",
      upcoming: "bg-amber text-on-pop",
      pink: "bg-pink text-on-pop",
      sky: "bg-sky-fg/15 text-sky-fg",
      outline: "border border-border text-muted-foreground",
    },
    size: {
      default: "h-7 px-3 text-[13px]",
      sm: "h-6 px-2.5 text-xs",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Badge({ className, variant, size, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
