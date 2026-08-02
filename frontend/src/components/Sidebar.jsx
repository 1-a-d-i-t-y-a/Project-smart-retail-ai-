import { NavLink } from "react-router-dom";
import { LayoutDashboard, Camera, MessageSquareText, ScanSearch, PackageSearch, Sparkles } from "lucide-react";

const items = [
  { to: "/", label: "Overview", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/face", label: "Face Recognition", icon: Camera, tid: "nav-face" },
  { to: "/sentiment", label: "Sentiment", icon: ScanSearch, tid: "nav-sentiment" },
  { to: "/chatbot", label: "FAQ Chatbot", icon: MessageSquareText, tid: "nav-chatbot" },
  { to: "/products", label: "Product Classifier", icon: PackageSearch, tid: "nav-products" },
];

export default function Sidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-slate-950/90 backdrop-blur-xl z-30 flex flex-col"
    >
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-rose-500 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.35)]">
            <Sparkles size={16} className="text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display font-black text-[15px] leading-none tracking-tight text-white">RETAIL/IQ</div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mt-1">Customer AI</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">Modules</div>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            data-testid={it.tid}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150",
                isActive
                  ? "bg-rose-500/10 text-white border-l-2 border-rose-500 pl-[10px]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              ].join(" ")
            }
          >
            <it.icon size={16} strokeWidth={1.8} />
            <span className="font-medium">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-4 p-4 border border-white/10 bg-slate-900 rounded-md">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-1">Powered by</div>
        <div className="text-sm font-medium text-white">Gemini 3 Flash</div>
        <div className="text-xs text-slate-400 mt-1">Vision · Text · Sentiment</div>
      </div>
    </aside>
  );
}
