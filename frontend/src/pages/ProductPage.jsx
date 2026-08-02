import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UploadCloud, Image as ImgIcon, Trash2 } from "lucide-react";
import { classifyProduct, productHistory, productSummary } from "../api/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";

const CAT_COLORS = ["#F43F5E", "#38BDF8", "#10B981", "#F59E0B", "#A78BFA", "#F472B6", "#22D3EE"];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProductPage() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const refresh = async () => {
    const [h, s] = await Promise.all([productHistory(50), productSummary()]);
    setHistory(h);
    setSummary(s);
  };

  useEffect(() => { refresh(); }, []);

  const handleFile = async (f) => {
    if (!f) return;
    if (!/image\/(png|jpeg|jpg|webp)/.test(f.type)) return toast.error("Use PNG, JPG or WEBP");
    const b64 = await fileToBase64(f);
    setFile(f);
    setPreview(b64);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const runClassify = async () => {
    if (!preview) return toast.error("Pick an image first");
    setBusy(true);
    try {
      const r = await classifyProduct(preview, file?.name);
      setResult(r);
      toast.success(`${r.category} · ${(r.confidence * 100).toFixed(0)}%`);
      refresh();
    } catch { toast.error("Classification failed"); }
    finally { setBusy(false); }
  };

  const reset = () => { setPreview(null); setFile(null); setResult(null); };

  return (
    <div data-testid="product-page" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <div
          data-testid="upload-dropzone"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`dropzone p-8 bg-slate-900 border-2 border-dashed rounded-md text-center cursor-pointer ${
            dragOver ? "border-rose-500 bg-rose-500/5" : "border-white/15 hover:border-rose-500/60 hover:bg-rose-500/5"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            data-testid="upload-input"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {preview ? (
            <div className="flex flex-col items-center">
              <img src={preview} alt="preview" className="max-h-72 rounded border border-white/10" />
              <div className="mt-4 flex gap-2">
                <Button data-testid="btn-classify" onClick={(e) => { e.stopPropagation(); runClassify(); }} disabled={busy} className="bg-rose-500 hover:bg-rose-600 text-white">
                  Classify product
                </Button>
                <Button data-testid="btn-reset-upload" onClick={(e) => { e.stopPropagation(); reset(); }} variant="outline" className="border-white/15 bg-slate-950 hover:bg-slate-800 hover:text-white text-slate-200">
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-slate-400">
              <UploadCloud className="mx-auto text-slate-500" size={28} />
              <div className="mt-3 font-display text-lg text-white">Drop a product image</div>
              <div className="text-xs text-slate-500 mt-1">PNG · JPG · WEBP — under 5 MB</div>
            </div>
          )}
        </div>

        {result && (
          <div data-testid="classify-result" className="p-5 bg-slate-900 border border-rose-500/40 rounded-md rise-in">
            <div className="text-[10px] uppercase tracking-[0.22em] text-rose-400">Result</div>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display font-light text-3xl text-white">{result.category}</h3>
              <div className="text-sm text-slate-400">{(result.confidence * 100).toFixed(0)}% confident</div>
            </div>
            {result.subcategory && <div className="mt-1 text-sm text-slate-300">Subcategory: <span className="text-rose-300">{result.subcategory}</span></div>}
            {result.description && <p className="mt-3 text-sm text-slate-400 leading-relaxed">{result.description}</p>}
          </div>
        )}

        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">History</div>
              <h3 className="font-display font-light text-xl text-white mt-1">Classified products</h3>
            </div>
            <div className="text-xs text-slate-500">{history.length} items</div>
          </div>
          {history.length === 0 && <div className="text-sm text-slate-500 py-6 text-center"><ImgIcon className="mx-auto mb-2 text-slate-600" size={22} />Nothing classified yet</div>}
          <ul data-testid="product-history" className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {history.slice(0, 12).map((p) => (
              <li key={p.id} className="border border-white/10 rounded overflow-hidden group">
                <div className="aspect-square bg-slate-950 overflow-hidden">
                  <img src={p.image_base64} alt={p.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-rose-400 font-semibold">{p.category}</div>
                  {p.subcategory && <div className="text-xs text-slate-400 mt-0.5">{p.subcategory}</div>}
                  <div className="text-[10px] text-slate-500 mt-1">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Category breakdown</div>
          <h3 className="font-display font-light text-xl text-white mt-1 mb-2">Distribution</h3>
          <div className="h-72">
            {summary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#F8FAFC", fontSize: 12 }} cursor={{ fill: "rgba(244,63,94,0.08)" }} />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                    {summary.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">No data yet</div>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-2">Model</div>
          <div className="font-display text-lg text-white">Gemini 3 Flash Vision</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Product photos are sent to Gemini with a fixed retail category taxonomy. The model returns a category, subcategory, one-line description, and a confidence score.
          </p>
        </div>
      </div>
    </div>
  );
}
