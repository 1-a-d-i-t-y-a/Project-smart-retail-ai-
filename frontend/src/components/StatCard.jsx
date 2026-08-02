export default function StatCard({ label, value, delta, icon: Icon, accent = "rose", testId }) {
  const accentMap = {
    rose: "text-rose-400",
    sky: "text-sky-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };
  return (
    <div
      data-testid={testId}
      className="relative rise-in p-5 bg-slate-900 border border-white/10 rounded-md hover:border-white/20 transition-colors duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
        {Icon && <Icon size={16} className={accentMap[accent]} strokeWidth={1.6} />}
      </div>
      <div className="mt-4 font-display font-light text-4xl tracking-tight text-white">{value}</div>
      {delta && (
        <div className="mt-2 text-xs text-slate-400">
          <span className={accentMap[accent]}>{delta}</span> vs. yesterday
        </div>
      )}
    </div>
  );
}
