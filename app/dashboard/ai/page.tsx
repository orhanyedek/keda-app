/**
 * KEDA AI - Sohbet Asistanı
 * Groq llama-3.3-70b ile güçlendirilmiş
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Groq from "groq-sdk";
import { Send, Plus, Trash2, Sparkles, Mic, MicOff } from "lucide-react";
import { getDashboardStats } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const BASE_SYSTEM_PROMPT = `Sen KEDA'nın AI asistanısın. KEDA, öğrencilere yardımcı olan akıllı bir çalışma platformudur.
Kullanıcılara ders çalışma, konu anlama, sınav hazırlığı ve akademik sorularda yardım ediyorsun.
Türkçe konuş. Açık, anlaşılır ve öğretici ol. Gerektiğinde örnekler ver. Markdown formatını kullan.`;

const STARTER_PROMPTS = [
  { icon: "", text: "Türev konusunu basitçe anlat" },
  { icon: "", text: "Etkili çalışma teknikleri nelerdir?" },
  { icon: "", text: "Sınav stresini nasıl yönetebilirim?" },
  { icon: "", text: "Newton'un hareket yasalarını özetle" },
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
  // Sayfa başlığı
  useEffect(() => { document.title = "KEDA AI"; }, []);

  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Tarayıcınız ses tanımayı desteklemiyor"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + transcript : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  // Kullanıcının gerçek verilerini yükle (bağlam için)
  useEffect(() => {
    if (!user) return;
    getDashboardStats(user.id).then(stats => {
      const parts = [];
      if (stats.toplam_flashcard > 0) parts.push(`${stats.toplam_flashcard} flashcard'ı var`);
      if (stats.bugun_tekrar_edilecek > 0) parts.push(`bugün ${stats.bugun_tekrar_edilecek} kart tekrar zamanı`);
      if (stats.aktif_plan) parts.push(`aktif çalışma planı: "${stats.aktif_plan.baslik}"`);
      if (stats.son_podcast) parts.push(`son podcast: "${stats.son_podcast.baslik}"`);
      if (parts.length > 0) setUserContext(`\n\nKullanıcı bilgileri: ${parts.join(", ")}.`);
    });
  }, [user]);

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

    // Ajanda asistanından gelen mesaj
    const initialMsg = localStorage.getItem("keda_ai_initial_message");
    if (initialMsg) {
      localStorage.removeItem("keda_ai_initial_message");
      // Kısa gecikme sonra gönder (sayfa yüklendikten sonra)
      setTimeout(() => {
        setInput(initialMsg);
        // Otomatik gönder
        setTimeout(() => {
          const btn = document.getElementById("ai-send-btn");
          btn?.click();
        }, 100);
      }, 500);
    }
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
          { role: "system", content: BASE_SYSTEM_PROMPT + userContext },
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
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] p-4" style={{ background: "var(--bg-secondary)" }}>
        <button onClick={newSession}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground)/0.85)] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all text-sm font-medium mb-4">
          <Plus className="w-4 h-4" />
          Yeni Sohbet
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.length === 0 && (
            <p className="text-[hsl(var(--muted-foreground)/0.6)] text-xs text-center py-6">Henüz sohbet yok</p>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveId(s.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${activeId === s.id ? "bg-[hsl(var(--foreground)/0.06)] text-[hsl(0 0% 80%)]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"}`}>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
            </div>
            <span className="text-[hsl(var(--foreground))] font-semibold text-sm">KEDA AI</span>
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground)/0.6)] bg-[hsl(var(--muted))] px-3 py-1 rounded-full">Llama 3.3 · Groq</span>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Boş ekran */}
            {!activeSession || activeSession.messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-12">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai2)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai2)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai2)" opacity="0.82"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Merhaba, {userName}</h2>
                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-10">Sana nasıl yardımcı olabilirim?</p>
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {STARTER_PROMPTS.map((p) => (
                    <button key={p.text} onClick={() => sendMessage(p.text)}
                      className="keda-card p-4 text-left hover:border-[hsl(var(--border))] transition-colors group">
                      <span className="text-lg mb-2 block">{p.icon}</span>
                      <span className="text-[hsl(var(--foreground)/0.85)] text-sm group-hover:text-[hsl(var(--foreground))] transition-colors">{p.text}</span>
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
                      <div className="w-8 h-8 rounded-xl bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0 mt-1">
                        <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-br-sm"
                          : "text-[hsl(var(--foreground)/0.85)] rounded-bl-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground)/0.6)] px-1">{msg.time}</span>
                    </div>

                    {/* User avatar */}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-[hsl(var(--foreground)/0.85)]">
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
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
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
            <div className="flex items-end gap-3 bg-[hsl(var(--secondary))]/60 border border-[hsl(var(--border))] rounded-2xl px-4 py-3 focus-within:border-[hsl(var(--border))] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bir soru sor veya konu anlat... (Enter ile gönder)"
                rows={1}
                className="flex-1 bg-transparent text-[hsl(var(--foreground))] text-sm outline-none resize-none placeholder-slate-600 leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button onClick={listening ? stopListening : startListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${listening ? "bg-red-500/20 border border-red-500/30 animate-pulse" : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                {listening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
              </button>
              <button id="ai-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[hsl(var(--foreground))] flex items-center justify-center flex-shrink-0 hover:bg-[hsl(var(--foreground))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-4 h-4 text-[hsl(var(--foreground))]" />
              </button>
            </div>
            <p className="text-center text-xs text-[hsl(var(--muted-foreground)/0.4)] mt-2">Shift+Enter ile satır atla · Enter ile gönder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
