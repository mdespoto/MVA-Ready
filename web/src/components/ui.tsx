import type { ReactNode } from "react";

const BADGE_TONES = {
  teal: "bg-teal-tint text-teal-dim",
  gold: "bg-gold-tint text-gold",
  green: "bg-green-tint text-green",
  amber: "bg-amber-tint text-amber",
  coral: "bg-coral-tint text-coral",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "teal",
}: {
  value: number;
  tone?: "teal" | "coral" | "amber";
}) {
  const fill = tone === "coral" ? "bg-coral" : tone === "amber" ? "bg-amber" : "bg-teal";
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
      <span className={`block h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(20,38,43,.06),0_8px_24px_rgba(20,38,43,.06)] ${className}`}>
      {children}
    </div>
  );
}
