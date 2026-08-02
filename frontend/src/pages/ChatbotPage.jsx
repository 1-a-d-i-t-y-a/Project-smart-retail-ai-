import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Plus, Trash2 } from "lucide-react";
import { sendChatMessage, getChatHistory, getFaqs, addFaq, deleteFaq } from "../api/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function useSessionId() {
  const [id] = useState(() => {
    let s = localStorage.getItem("chat_session_id");
    if (!s) {
      s = "s-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("chat_session_id", s);
    }
    return s;
  });
  return id;
}

export default function ChatbotPage() {
  const sessionId = useSessionId();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef(null);

  // FAQ admin
  const [faqs, setFaqs] = useState([]);
  const [tag, setTag] = useState("");
  const [patterns, setPatterns] = useState("");
  const [responses, setResponses] = useState("");

  const loadHistory = async () => {
    const h = await getChatHistory(sessionId);
    setMessages(h);
  };
  const loadFaqs = async () => setFaqs(await getFaqs());

  useEffect(() => { loadHistory(); loadFaqs(); }, [sessionId]);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { id: "tmp-" + Date.now(), role: "user", content: msg, created_at: new Date().toISOString() }]);
    setBusy(true);
    try {
      const r = await sendChatMessage(sessionId, msg);
      setMessages((m) => [...m, { id: r.message_id, role: "bot", content: r.reply, source: r.source, intent: r.intent, created_at: new Date().toISOString() }]);
    } catch { toast.error("Chat failed"); } finally { setBusy(false); }
  };

  const saveFaq = async () => {
    if (!tag.trim() || !patterns.trim() || !responses.trim()) return toast.error("Tag, patterns and responses required");
    await addFaq({
      tag: tag.trim(),
      patterns: patterns.split("\n").map(s => s.trim()).filter(Boolean),
      responses: responses.split("\n").map(s => s.trim()).filter(Boolean),
    });
    setTag(""); setPatterns(""); setResponses("");
    loadFaqs();
    toast.success("FAQ added");
  };

  const removeFaq = async (id) => {
    await deleteFaq(id);
    loadFaqs();
    toast.success("FAQ removed");
  };

  const suggestions = ["What are your hours?", "Return policy?", "Any offers this week?", "How long is shipping?"];

  return (
    <div data-testid="chatbot-page">
      <Tabs defaultValue="chat">
        <TabsList className="bg-slate-900 border border-white/10">
          <TabsTrigger value="chat" data-testid="tab-chat" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Chat</TabsTrigger>
          <TabsTrigger value="admin" data-testid="tab-admin" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">FAQ admin ({faqs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 p-0 bg-slate-900 border border-white/10 rounded-md flex flex-col h-[70vh]">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Session</div>
                <div className="font-mono text-xs text-slate-400 mt-1">{sessionId}</div>
              </div>
              <div ref={scrollerRef} data-testid="chat-scroller" className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-slate-500 mt-16">
                    <div className="font-display text-xl text-white mb-1">Ask me anything</div>
                    <div>Store hours, returns, shipping, offers — I've got answers.</div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} rise-in`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-md border ${
                      m.role === "user"
                        ? "bg-slate-950 border-rose-500/60 text-white"
                        : "bg-slate-800/60 border-white/10 text-slate-100"
                    }`}>
                      {m.role !== "user" && (
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                          Bot · {m.source === "ai" ? "AI" : "Rule"} {m.intent ? `· ${m.intent}` : ""}
                        </div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-md border border-white/10 bg-slate-800/60 text-slate-400 text-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-white/10 flex gap-2">
                <Input
                  data-testid="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Ask a question…"
                  className="bg-slate-950 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-rose-500"
                />
                <Button data-testid="btn-chat-send" onClick={send} disabled={busy} className="bg-rose-500 hover:bg-rose-600 text-white">
                  <Send size={14} />
                </Button>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">Suggestions</div>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    data-testid={`suggest-${s.slice(0, 8)}`}
                    onClick={() => setInput(s)}
                    className="w-full text-left text-sm px-3 py-2 border border-white/10 rounded hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-white text-slate-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-6 mb-2">How it works</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Messages are matched against a rule-based intents file first. If nothing matches confidently, Gemini 3 Flash generates a reply.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Add custom FAQ</div>
              <h3 className="font-display font-light text-xl text-white mt-1 mb-4">Teach the bot</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Tag</label>
                  <Input data-testid="faq-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. loyalty_program" className="bg-slate-950 border-white/10 text-white focus-visible:ring-rose-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Patterns (one per line)</label>
                  <Textarea data-testid="faq-patterns" value={patterns} onChange={(e) => setPatterns(e.target.value)} placeholder={"loyalty program\ndo you have rewards\npoints"} className="bg-slate-950 border-white/10 text-white min-h-[90px] focus-visible:ring-rose-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Responses (one per line)</label>
                  <Textarea data-testid="faq-responses" value={responses} onChange={(e) => setResponses(e.target.value)} placeholder={"Yes! Earn 1 point per $1 spent, redeemable for rewards."} className="bg-slate-950 border-white/10 text-white min-h-[90px] focus-visible:ring-rose-500" />
                </div>
                <Button data-testid="btn-add-faq" onClick={saveFaq} className="bg-rose-500 hover:bg-rose-600 text-white w-full">
                  <Plus size={14} /> Save FAQ
                </Button>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-white/10 rounded-md">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mb-3">Custom FAQs</div>
              {faqs.length === 0 && <div className="text-sm text-slate-500 py-4">No custom FAQs yet. Built-in intents are always active.</div>}
              <ul className="space-y-3 max-h-[520px] overflow-y-auto">
                {faqs.map((f) => (
                  <li key={f.id} data-testid={`faq-${f.id}`} className="p-3 border border-white/10 rounded">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-widest text-rose-400 font-semibold">{f.tag}</div>
                      <button onClick={() => removeFaq(f.id)} data-testid={`btn-del-faq-${f.id}`} className="text-slate-500 hover:text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Patterns: {f.patterns.join(" · ")}</div>
                    <div className="mt-1 text-sm text-slate-200">{f.responses[0]}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
