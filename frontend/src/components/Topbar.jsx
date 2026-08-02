import { Search, Bell, Radio } from "lucide-react";

export default function Topbar({ title, subtitle }) {
  return (
    <div
      data-testid="app-topbar"
      className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-8 py-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-1.5">Smart Retail AI</div>
          <h1 className="font-display text-3xl font-light tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border border-white/10 rounded-md bg-slate-900/60 text-slate-400 text-sm w-72">
            <Search size={14} />
            <input
              data-testid="topbar-search"
              className="bg-transparent outline-none placeholder:text-slate-500 flex-1 text-slate-200"
              placeholder="Search customers, feedback…"
            />
          </div>
          <button data-testid="topbar-live" className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-md bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring" />
            <Radio size={14} />
            <span className="text-xs uppercase tracking-[0.16em]">Live</span>
          </button>
          <button data-testid="topbar-bell" className="p-2 border border-white/10 rounded-md bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            <Bell size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
