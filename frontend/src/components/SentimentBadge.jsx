import { cn } from "@/lib/utils";

export default function SentimentBadge({ label, className }) {
  const styles = {
    positive: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    negative: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    neutral: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  };
  return (
    <span
      data-testid={`sentiment-badge-${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 border rounded text-[10px] uppercase tracking-[0.16em] font-semibold",
        styles[label] || styles.neutral,
        className,
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {label}
    </span>
  );
}
