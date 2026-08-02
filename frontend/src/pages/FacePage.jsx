import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { Camera, UserPlus, ScanFace, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  registerFace,
  recognizeFace,
  listCustomers,
  listVisits,
  deleteCustomer,
} from "../api/client";
import { formatDistanceToNow } from "date-fns";

export default function FacePage() {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [visits, setVisits] = useState([]);

  const refresh = useCallback(async () => {
    const [c, v] = await Promise.all([listCustomers(), listVisits(50)]);
    setCustomers(c);
    setVisits(v);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const capture = () => {
    if (!webcamRef.current) return null;
    return webcamRef.current.getScreenshot({ width: 480, height: 360 });
  };

  const handleRegister = async () => {
    if (!name.trim()) return toast.error("Enter a customer name first");
    const img = capture();
    if (!img) return toast.error("Webcam not ready");
    setBusy(true);
    try {
      const c = await registerFace(name.trim(), img);
      toast.success(`Registered ${c.name}`);
      setName("");
      setLastResult({ kind: "registered", customer: c });
      refresh();
    } catch (e) {
      toast.error("Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRecognize = async () => {
    const img = capture();
    if (!img) return toast.error("Webcam not ready");
    setBusy(true);
    setLastResult(null);
    try {
      const r = await recognizeFace(img);
      setLastResult({ kind: "recognized", ...r });
      if (r.matched) toast.success(`Welcome back, ${r.customer.name}`);
      else toast.info("No match — looks like a new visitor");
      refresh();
    } catch (e) {
      toast.error("Recognition failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this customer and their visits?")) return;
    await deleteCustomer(id);
    toast.success("Customer removed");
    refresh();
  };

  return (
    <div data-testid="face-page" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Webcam panel */}
        <div className="lg:col-span-3 p-5 bg-slate-900 border border-white/10 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Live capture</div>
              <h3 className="font-display font-light text-xl text-white mt-1">Webcam feed</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 pulse-ring" />
              CAM 01
            </div>
          </div>

          <div className="relative corner-brackets border border-white/10 bg-black rounded-md overflow-hidden aspect-[4/3]">
            <span className="cb-tr" />
            <span className="cb-bl" />
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
              data-testid="webcam-preview"
            />
            <div className="absolute inset-0 scanlines pointer-events-none" />
            {lastResult?.kind === "recognized" && lastResult.matched && (
              <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-slate-950/80 backdrop-blur border border-rose-500/40 rounded flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-rose-400">Match</div>
                  <div className="font-display text-lg text-white">{lastResult.customer.name}</div>
                </div>
                <div className="text-xs text-slate-300">
                  {(lastResult.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            )}
            {lastResult?.kind === "recognized" && !lastResult.matched && (
              <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-slate-950/80 backdrop-blur border border-white/20 rounded">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Unmatched</div>
                <div className="text-sm text-white">No customer in database</div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <Input
              data-testid="face-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name to register"
              className="bg-slate-950 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
            />
            <Button
              data-testid="btn-register-face"
              disabled={busy}
              onClick={handleRegister}
              variant="outline"
              className="border-white/15 bg-slate-950 hover:bg-slate-800 hover:text-white text-slate-200"
            >
              <UserPlus size={14} /> Register
            </Button>
            <Button
              data-testid="btn-recognize-face"
              disabled={busy}
              onClick={handleRecognize}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              <ScanFace size={14} /> Recognize
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Tip: Register a customer with their name, then click Recognize on a fresh capture to test.
            Uses Gemini 3 Flash Vision — no local model download.
          </p>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="w-full bg-slate-900 border border-white/10">
              <TabsTrigger value="customers" data-testid="tab-customers" className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Customers ({customers.length})</TabsTrigger>
              <TabsTrigger value="visits" data-testid="tab-visits" className="flex-1 data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Visits ({visits.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="customers" className="mt-4">
              <div className="p-4 bg-slate-900 border border-white/10 rounded-md">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">Registered</div>
                {customers.length === 0 && (
                  <div className="text-sm text-slate-500 py-6 text-center">
                    <User className="mx-auto mb-2 text-slate-600" size={22} />
                    Nobody registered yet
                  </div>
                )}
                <ul className="space-y-2 max-h-[520px] overflow-y-auto">
                  {customers.map((c) => (
                    <li key={c.id} data-testid={`customer-${c.id}`} className="flex items-center gap-3 p-2 border border-white/5 rounded hover:border-white/15 transition-colors">
                      <img src={c.image_base64} alt={c.name} className="w-10 h-10 rounded object-cover border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{c.name}</div>
                        <div className="text-[11px] text-slate-500">Visits: {c.visit_count}</div>
                      </div>
                      <button data-testid={`btn-delete-${c.id}`} onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="visits" className="mt-4">
              <div className="p-4 bg-slate-900 border border-white/10 rounded-md">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">Visit log</div>
                {visits.length === 0 && (
                  <div className="text-sm text-slate-500 py-6 text-center">
                    <Camera className="mx-auto mb-2 text-slate-600" size={22} />
                    No visits logged
                  </div>
                )}
                <ul className="space-y-2 max-h-[520px] overflow-y-auto">
                  {visits.map((v) => (
                    <li key={v.id} className="flex items-center justify-between p-2 border border-white/5 rounded">
                      <div className="text-sm text-white truncate">{v.customer_name}</div>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(v.timestamp), { addSuffix: true })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
