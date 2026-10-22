import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-cream/30 bg-ink p-0.5 transition-colors hit data-[checked]:border-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[22px] rounded-full bg-muted-foreground shadow transition-[transform,background-color] duration-300 ease-[var(--ease-out)] data-[checked]:translate-x-5 data-[checked]:bg-cream" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
