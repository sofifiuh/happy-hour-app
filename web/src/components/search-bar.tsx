import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SearchBar({ onOpenFilters, className }: { onOpenFilters: () => void; className?: string }) {
  const { filters, setFilters } = useStore();
  const count = filters.amenities.length;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          placeholder="Search bars and restaurants"
          aria-label="Search"
          className="pr-10 pl-11"
          enterKeyHint="search"
        />
        {filters.query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setFilters({ query: "" })}
            className="hit absolute! top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-line text-cream"
          >
            <X className="size-3.5" />
          </button>
        )}
      </label>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={count ? `Filters, ${count} on` : "Filters"}
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-full transition-[color,background-color,transform] active:scale-90",
          count ? "bg-primary text-primary-foreground" : "bg-input text-cream",
        )}
      >
        <SlidersHorizontal className="size-[18px]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-cream text-[11px] font-bold text-ink">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
