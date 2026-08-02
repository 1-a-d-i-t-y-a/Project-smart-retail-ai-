import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Layers } from "lucide-react";
import SentimentBadge from "../components/SentimentBadge";
import { analyzeSentiment, analyzeBulk, getSentimentHistory, getSentimentSummary } from "../api/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDistanceToNow } from "date-fns";

const COLORS = { positive: "#10B981", negative: "#EF4444", neutral: "#64748B" };

export default function SentimentPage() {
  const [text, setText] = useState("");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ counts: { positive: 0, negative: 0, neutral: 0 }, total: 0 });

  const refresh = async () => {
    const [h, s] = await Promise.all([getSentimentHistory(50), getSentimentSummary()]);
    setHistory(h);
    setSummary(s);
  };

  useEffect(() => { refresh(); }, []);

  const runSingle = async () => {
    if (!text.trim()) return toast.error("Enter feedback text");
    setBusy(true);
    try {
      const r = await analyzeSentiment(text.trim(), "single");
      toast.success(`${r.label.toUpperCase()} · ${(r.confidence * 100).toFixed(0)}%`);
      setText("");
      refresh();
    } catch { toast.error("Analysis failed"); }
    finally { setBusy(false); }
  };

  const runBulk = async () => {
    const items = bulk.split("\n").map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return toast.error("Add one review per line");
    setBusy(true);
    try {
      await analyzeBulk(items);
      toast.success(`Analysed ${items.length} reviews`);
      setBulk("");
      refresh();
    } catch { toast.error("Bulk analysis failed"); }
    finally { setBusy(false); }
  };

  const pieData = Object.entries(summary.counts).map(([k, v]) => ({ name: k, value: v, color: COLORS[k] }));

  return (
    <div data-testid="sentiment-page" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Single review</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-4">Analyse a single feedback</h3>
          <Textarea
            data-testid="sentiment-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a customer review, comment, or survey response…"
            className="min-h-[110px] bg-slate-950 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
          />
          <div className="flex justify-end mt-3">
            <Button data-testid="btn-analyze-single" onClick={runSingle} disabled={busy} className="bg-rose-500 hover:bg-rose-600 text-white">
              <Sparkles size={14} /> Analyse
            </Button>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Bulk</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-4">Analyse many at once</h3>
          <Textarea
            data-testid="sentiment-bulk-input"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"One review per line…\nGreat service, super fast delivery.\nProduct broke after two days, terrible.\nIt's fine, nothing special."}
            className="min-h-[140px] font-mono text-xs bg-slate-950 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
          />
          <div className="flex justify-end mt-3">
            <Button data-testid="btn-analyze-bulk" onClick={runBulk} disabled={busy} variant="outline" className="border-white/15 bg-slate-950 hover:bg-slate-800 hover:text-white text-slate-200">
              <Layers size={14} /> Run batch
            </Button>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">History</div>
              <h3 className="font-display font-light text-xl text-white mt-1">Recent analyses</h3>
            </div>
            <div className="text-xs text-slate-500">{history.length} entries</div>
          </div>
          <ul data-testid="sentiment-history" className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
            {history.length === 0 && <li className="py-6 text-sm text-slate-500 text-center">Nothing analysed yet</li>}
            {history.map((h) => (
              <li key={h.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white line-clamp-2">{h.text}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{formatDistanceToNow(new Date(h.created_at), { addSuffix: true })} · confidence {(h.confidence * 100).toFixed(0)}%</div>
                </div>
                <SentimentBadge label={h.label} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Distribution</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-2">Overall tone</h3>
          <div className="h-52">
            {summary.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="#020617" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#F8FAFC", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">Waiting for data</div>
            )}
          </div>
          <div className="space-y-2 mt-3">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                  <span className="capitalize text-slate-300">{p.name}</span>
                </div>
                <span className="font-mono text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
