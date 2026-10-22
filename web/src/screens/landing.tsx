import { asset } from "@/lib/routes";
import { useTitle } from "@/lib/use-title";
import { ArrowRight, LocateFixed } from "lucide-react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { setNav } from "@/lib/motion";
import { useStore } from "@/lib/store";

export const SEEN_KEY = "alh:seen-welcome";

// First-run welcome. Brand moment + one ask (location), then straight
// into the list. Shown once; reachable again at #/welcome.
export function Landing() {
  useTitle(null);
  const navigate = useNavigate();
  const { requestLocation, rows } = useStore();
  const live = rows.filter((r) => r.occ.status === "live").length;

  const go = (withLocation: boolean) => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    if (withLocation) requestLocation();
    setNav("forward");
    navigate("/", { replace: true, viewTransition: true });
  };

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-ink">
      <img src={asset("photos/east-van-brewing-company.webp")} alt="" fetchPriority="high" className="absolute inset-0 size-full scale-105 animate-[settle_1600ms_var(--ease-out)_both] object-cover" />
      {/* warm duotone wash, echoing the silhouette shots on the brand board */}
      <div className="absolute inset-0 bg-[#ff4900] mix-blend-multiply opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-ink" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-safe text-cream">
        <Wordmark className="animate-pop h-[168px] text-white drop-shadow-[0_4px_30px_rgb(0_0_0/0.35)]" />
      </div>

      <div className="relative px-6 pb-[max(env(safe-area-inset-bottom),28px)]">
        <h1 style={{ "--i": 4 } as CSSProperties} className="animate-rise font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em]">
          Happy hours
          <br />
          near you, <span className="text-lime">right now.</span>
        </h1>
        <p style={{ "--i": 6 } as CSSProperties} className="animate-rise mt-3 max-w-[32ch] text-[16px] text-cream/80">
          {live > 0 ? `${live} spots in Vancouver are pouring deals right now.` : "Real deals from 450+ Vancouver bars and restaurants, checked against their own menus."}
        </p>
        <div style={{ "--i": 8 } as CSSProperties} className="animate-rise mt-7 flex flex-col gap-3">
          <Button size="lg" onClick={() => go(true)} className="w-full justify-between pr-2 pl-6">
            <span className="flex items-center gap-2">
              <LocateFixed className="size-5" /> Find a hang near me
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-ink/15">
              <ArrowRight className="size-5" />
            </span>
          </Button>
          <Button size="lg" variant="ghost" onClick={() => go(false)} className="w-full text-cream/80">
            Just browse Vancouver
          </Button>
        </div>
      </div>
    </main>
  );
}
