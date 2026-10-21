import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-ink-3", className)} {...props} />;
}

export { Skeleton };
