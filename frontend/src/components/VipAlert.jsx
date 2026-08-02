import { Crown, X } from "lucide-react";

export default function VipAlert({ customer, onClose }) {
  if (!customer) return null;
  return (
    <div
      data-testid="vip-alert"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative rise-in w-[420px] max-w-[90vw] border border-amber-400/60 bg-slate-950 rounded-md p-6 text-center"
        style={{ boxShadow: "0 0 0 1px rgba(251,191,36,0.2), 0 0 60px rgba(251,191,36,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="btn-close-vip-alert"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center pulse-ring">
          <Crown size={30} className="text-amber-300" strokeWidth={1.8} />
        </div>
        <div className="mt-4 text-[10px] uppercase tracking-[0.32em] text-amber-400">VIP customer</div>
        <div className="mt-2">
          <img
            src={customer.image_base64}
            alt={customer.name}
            className="w-20 h-20 rounded object-cover border border-amber-400/40 mx-auto"
          />
        </div>
        <h2 className="mt-4 font-display font-light text-3xl text-white">Welcome back, {customer.name}!</h2>
        <p className="mt-2 text-sm text-slate-400">
          {customer.visit_count} previous {customer.visit_count === 1 ? "visit" : "visits"} on record. Greet them warmly.
        </p>
      </div>
    </div>
  );
}
