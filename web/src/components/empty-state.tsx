import type { ReactNode } from "react";

export function EmptyState({ emoji, title, body, action }: { emoji: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="animate-rise flex flex-col items-center px-8 py-16 text-center">
      <span className="animate-pop mb-4 grid size-16 place-items-center rounded-full bg-ink-2 text-3xl">{emoji}</span>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-1.5 max-w-[30ch] text-[15px] text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
