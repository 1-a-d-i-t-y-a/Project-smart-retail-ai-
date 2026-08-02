import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, StarOff } from "lucide-react";
import SentimentBadge from "./SentimentBadge";
import { getCustomerDetail, updateCustomer } from "../api/client";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDetailDialog({ customerId, open, onOpenChange, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!customerId) return;
    setDetail(null);
    const d = await getCustomerDetail(customerId);
    setDetail(d);
  };

  useEffect(() => {
    if (open) load();
  }, [open, customerId]);

  const toggleVip = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateCustomer(customerId, { is_vip: !detail.customer.is_vip });
      setDetail({ ...detail, customer: updated });
      toast.success(updated.is_vip ? "Marked as VIP" : "Removed VIP flag");
      onChanged?.();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="customer-detail-dialog"
        className="bg-slate-950 border border-white/10 max-w-3xl max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-light text-2xl text-white">
            Customer detail
          </DialogTitle>
        </DialogHeader>

        {!detail && <div className="py-10 text-center text-slate-500 text-sm">Loading…</div>}

        {detail && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="flex items-start gap-4 p-4 border border-white/10 rounded-md bg-slate-900">
              <img
                src={detail.customer.image_base64}
                alt={detail.customer.name}
                className="w-24 h-24 rounded object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl text-white">{detail.customer.name}</h3>
                  {detail.customer.is_vip && (
                    <span className="text-[10px] uppercase tracking-[0.22em] px-2 py-0.5 border border-amber-500/50 bg-amber-500/10 text-amber-300 rounded">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Registered {formatDistanceToNow(new Date(detail.customer.created_at), { addSuffix: true })}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Stat label="Visits" value={detail.customer.visit_count} />
                  <Stat label="Feedback" value={detail.feedback.length} />
                  <Stat label="Products" value={detail.products.length} />
                </div>
              </div>
              <Button
                data-testid="btn-toggle-vip"
                onClick={toggleVip}
                disabled={saving}
                variant="outline"
                className="border-white/15 bg-slate-950 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-300 text-slate-200"
              >
                {detail.customer.is_vip ? <StarOff size={14} /> : <Star size={14} />}
                {detail.customer.is_vip ? "Remove VIP" : "Mark VIP"}
              </Button>
            </div>

            {/* Visits list */}
            <Section title="Visit log" empty={detail.visits.length === 0} emptyMsg="No visits recorded yet.">
              <ul className="space-y-1">
                {detail.visits.map((v) => (
                  <li key={v.id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                    <span className="text-slate-300">{new Date(v.timestamp).toLocaleString()}</span>
                    <span className="text-slate-500 text-xs">{v.is_new ? "First visit" : "Return"}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Feedback */}
            <Section title={`Feedback (${detail.feedback.length})`} empty={detail.feedback.length === 0} emptyMsg="No feedback attached to this customer yet.">
              <ul className="space-y-2">
                {detail.feedback.map((f) => (
                  <li key={f.id} className="p-3 border border-white/10 rounded flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">{f.text}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.16em]">
                        {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <SentimentBadge label={f.label} />
                  </li>
                ))}
              </ul>
            </Section>

            {/* Products */}
            <Section title={`Products browsed (${detail.products.length})`} empty={detail.products.length === 0} emptyMsg="No products attached to this customer yet.">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {detail.products.map((p) => (
                  <li key={p.id} className="border border-white/10 rounded overflow-hidden">
                    <div className="aspect-square bg-slate-950 overflow-hidden">
                      <img src={p.image_base64} alt={p.category} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs uppercase tracking-widest text-rose-400 font-semibold">{p.category}</div>
                      {p.subcategory && <div className="text-xs text-slate-400">{p.subcategory}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-white/10 rounded p-2 bg-slate-950">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="font-display text-xl text-white mt-0.5">{value}</div>
    </div>
  );
}

function Section({ title, children, empty, emptyMsg }) {
  return (
    <div className="p-4 border border-white/10 rounded-md bg-slate-900">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">{title}</div>
      {empty ? <div className="text-sm text-slate-500">{emptyMsg}</div> : children}
    </div>
  );
}
