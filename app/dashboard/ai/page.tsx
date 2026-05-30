/**
 * KEDA AI - Sohbet Asistanı
 * Groq llama-3.3-70b ile güçlendirilmiş
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Groq from "groq-sdk";
import { Send, Plus, Trash2, Sparkles } from "lucide-react";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `Sen KEDA'nın AI asistanısın. KEDA, öğrencilere yardımcı olan akıllı bir çalışma platformudur.
Kullanıcılara ders çalışma, konu anlama, sınav hazırlığı ve akademik sorularda yardım ediyorsun.
Türkçe konuş. Açık, anlaşılır ve öğretici ol. Gerektiğinde örnekler ver.`;

const STARTER_PROMPTS = [
  { icon: "📚", text: "Türev konusunu basitçe anlat" },
  { icon: "🧠", text: "Etkili çalışma teknikleri nelerdir?" },
  { icon: "📝", text: "Sınav stresini nasıl yönetebilirim?" },
  { icon: "🔬", text: "Newton'un hareket yasalarını özetle" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

function getTime() {
  return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// Markdown'ı basit HTML'e çevir
function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style='background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 style='font-size:1rem;font-weight:600;color:#e2e8f0;margin:12px 0 6px'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 style='font-size:1.1rem;font-weight:700;color:#e2e8f0;margin:14px 0 8px'>$1</h2>")
    .replace(/^- (.+)$/gm, "<li style='margin:4px 0;padding-left:4px'>$1</li>")
    .replace(/(<li.*<\/li>)/s, "<ul style='padding-left:20px;margin:8px 0'>$1</ul>")
    .replace(/\n\n/g, "</p><p style='margin:8px 0'>")
    .replace(/\n/g, "<br>");
}

export default function AIPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  useEffect(() => {
    // LocalStorage'dan geçmiş yükle
    try {
      const saved = localStorage.getItem("keda_ai_sessions");
      if (saved) {
        const parsed: Session[] = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      }
    } catch { /* ignore */ }
  }, []);

  const saveSessions = (updated: Session[]) => {
    setSessions(updated);
    try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const newSession = () => {
    const id = Date.now().toString();
    const session: Session = {
      id,
      title: "Yeni Sohbet",
      messages: [],
      createdAt: new Date().toLocaleString("tr-TR"),
    };
    const updated = [session, ...sessions];
    saveSessions(updated);
    setActiveId(id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeId === id) setActiveId(updated[0]?.id || null);
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    let currentId = activeId;

    // Aktif session yoksa yeni oluştur
    if (!currentId) {
      const id = Date.now().toString();
      const session: Session = { id, title: content.slice(0, 40), messages: [], createdAt: new Date().toLocaleString("tr-TR") };
      const updated = [session, ...sessions];
      saveSessions(updated);
      setActiveId(id);
      currentId = id;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, time: getTime() };

    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== currentId) return s;
        const newMessages = [...s.messages, userMsg];
        return {
          ...s,
          messages: newMessages,
          title: s.messages.length === 0 ? content.slice(0, 40) : s.title,
        };
      });
      try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });

    setLoading(true);

    try {
      const currentSession = sessions.find(s => s.id === currentId);
      const history = (currentSession?.messages || []).slice(-10).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      const aiContent = completion.choices[0]?.message?.content || "Bir yanıt üretilemedi.";
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: aiContent, time: getTime() };

      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== currentId) return s;
          return { ...s, messages: [...s.messages, aiMsg] };
        });
        try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Bir hata oluştu: " + (err instanceof Error ? err.message : "Bilinmeyen hata"),
        time: getTime(),
      };
      setSessions(prev => {
        const updated = prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, errMsg] } : s);
        try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Kullanıcı";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-white/5 p-4" style={{ background: "var(--bg-secondary)" }}>
        <button onClick={newSession}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium mb-4">
          <Plus className="w-4 h-4" />
          Yeni Sohbet
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.length === 0 && (
            <p className="text-slate-600 text-xs text-center py-6">Henüz sohbet yok</p>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveId(s.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${activeId === s.id ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-red-400 transition-all ml-1 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ana chat alanı */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-white font-semibold text-sm">KEDA AI</span>
          </div>
          <span className="text-xs text-slate-600 bg-white/5 px-3 py-1 rounded-full">Llama 3.3 · Groq</span>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Boş ekran */}
            {!activeSession || activeSession.messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-12">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Merhaba, {userName}</h2>
                <p className="text-slate-500 text-sm mb-10">Sana nasıl yardımcı olabilirim?</p>
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {STARTER_PROMPTS.map((p) => (
                    <button key={p.text} onClick={() => sendMessage(p.text)}
                      className="keda-card p-4 text-left hover:border-indigo-500/30 transition-colors group">
                      <span className="text-lg mb-2 block">{p.icon}</span>
                      <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{p.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {activeSession.messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                    {/* AI avatar */}
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600/20 border border-indigo-500/20 text-slate-200 rounded-br-sm"
                          : "text-slate-300 rounded-bl-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-xs text-slate-600 px-1">{msg.time}</span>
                    </div>

                    {/* User avatar */}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-slate-300">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Yükleniyor */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="loading-dots"><span /><span /><span /></div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-slate-800/60 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-indigo-500/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bir soru sor veya konu anlat... (Enter ile gönder)"
                rows={1}
                className="flex-1 bg-transparent text-slate-200 text-sm outline-none resize-none placeholder-slate-600 leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 hover:bg-indigo-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-700 mt-2">Shift+Enter ile satır atla · Enter ile gönder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
