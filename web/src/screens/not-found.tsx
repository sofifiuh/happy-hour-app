import { useNavigate } from "react-router";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center pb-16">
      <Wordmark className="mb-6 h-16 text-cream" />
      <EmptyState
        emoji="🍂"
        title="This page wandered off"
        body="The link may be old, or the spot may have closed. Plenty more are pouring."
        action={<Button onClick={() => navigate("/", { replace: true })}>Back to happy hours</Button>}
      />
    </div>
  );
}
