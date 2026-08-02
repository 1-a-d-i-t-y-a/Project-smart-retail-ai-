import { useEffect, useState } from "react";
import { Users, TrendingUp, Bot, Package, Activity, ScanFace, MessageSquareText, PackageSearch } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import StatCard from "../components/StatCard";
import { getStats, getTimeline, getCategoryDist, getActivity } from "../api/client";
import { formatDistanceToNow } from "date-fns";

const SENTIMENT_COLORS = { positive: "#10B981", negative: "#EF4444", neutral: "#64748B" };
const CAT_COLORS = ["#F43F5E", "#38BDF8", "#10B981", "#F59E0B", "#A78BFA", "#F472B6", "#22D3EE"];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cats, setCats] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStats(), getTimeline(7), getCategoryDist(), getActivity(10)])
      .then(([s, t, c, a]) => {
        if (!mounted) return;
        setStats(s);
        setTimeline(t);
        setCats(c);
        setActivity(a);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const sentimentData = stats
    ? Object.entries(stats.sentiment_breakdown).map(([k, v]) => ({ name: k, value: v, color: SENTIMENT_COLORS[k] }))
    : [];

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard testId="stat-customers" label="Total Customers" value={stats?.total_customers ?? "—"} icon={Users} accent="sky" delta="+0" />
        <StatCard testId="stat-visits-today" label="Visits Today" value={stats?.visits_today ?? "—"} icon={ScanFace} accent="rose" delta="+0" />
        <StatCard testId="stat-feedback" label="Feedback" value={stats?.total_feedback ?? "—"} icon={TrendingUp} accent="emerald" delta="+0" />
        <StatCard testId="stat-chat" label="Chat Queries" value={stats?.chatbot_queries ?? "—"} icon={Bot} accent="violet" delta="+0" />
        <StatCard testId="stat-products" label="Products Classified" value={stats?.products_classified ?? "—"} icon={Package} accent="amber" delta="+0" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Traffic</div>
              <h3 className="font-display font-light text-xl text-white mt-1">Visits · last 7 days</h3>
            </div>
            <div className="text-xs text-slate-500">Total: {timeline.reduce((a, b) => a + b.visits, 0)}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#F8FAFC", fontSize: 12 }} />
                <Line type="monotone" dataKey="visits" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3, fill: "#F43F5E" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Sentiment Split</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-2">Feedback tone</h3>
          <div className="h-56">
            {sentimentData.length > 0 && sentimentData.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentData} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#020617" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#F8FAFC", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">No feedback yet</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            {sentimentData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                <span className="text-slate-400 capitalize">{s.name}</span>
                <span className="text-white font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Categories</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-3">Product distribution</h3>
          <div className="h-64">
            {cats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cats} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#F8FAFC", fontSize: 12 }} cursor={{ fill: "rgba(244,63,94,0.06)" }} />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                    {cats.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">No products classified yet</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Live feed</div>
              <h3 className="font-display font-light text-xl text-white mt-1">Recent activity</h3>
            </div>
            <Activity size={16} className="text-slate-500" />
          </div>
          <ul data-testid="activity-list" className="divide-y divide-white/5">
            {loading && <li className="py-6 text-sm text-slate-500">Loading…</li>}
            {!loading && activity.length === 0 && (
              <li className="py-6 text-sm text-slate-500">No activity yet — try registering a customer or analysing feedback.</li>
            )}
            {activity.map((a, i) => (
              <li key={i} className="py-3 flex items-start gap-3" style={{ animationDelay: `${i * 30}ms` }}>
                <ActivityIcon kind={a.kind} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{a.title}</div>
                  <div className="text-xs text-slate-400 truncate">{a.detail}</div>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.14em] whitespace-nowrap">
                  {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ kind }) {
  const map = {
    visit: { Icon: ScanFace, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    feedback: { Icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    chat: { Icon: MessageSquareText, color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
    product: { Icon: PackageSearch, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  };
  const { Icon, color } = map[kind] || map.feedback;
  return (
    <div className={`w-8 h-8 flex items-center justify-center border rounded ${color} shrink-0`}>
      <Icon size={14} strokeWidth={1.8} />
    </div>
  );
}
