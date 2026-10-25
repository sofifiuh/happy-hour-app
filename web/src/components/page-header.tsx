import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { goBack } from "@/lib/motion";

// `back` is where the arrow goes when there is no in-app page to return to.
export function PageHeader({ title, right, back }: { title: string; right?: ReactNode; back?: string }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-ink/90 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur-xl">
      <button
        onClick={() => goBack(navigate, false, -1, back)}
        aria-label="Back"
        className="hit grid size-10 shrink-0 place-items-center rounded-full bg-ink-2 text-cream transition-transform active:scale-90"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h1 className="flex-1 font-display text-[24px] font-extrabold tracking-tight">{title}</h1>
      {right}
    </header>
  );
}
