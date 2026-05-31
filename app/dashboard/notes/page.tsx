"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, Save, FileText, Type } from "lucide-react";
import Groq from "groq-sdk";
import toast from "react-hot-toast";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });

interface Note { id: string; title: string; content: string; color: string; updatedAt: string; }

const TEXT_COLORS = [
  { label: "Varsayılan", value: "hsl(var(--foreground)/0.9)", key: "default" },
  { label: "Mavi", value: "#60a5fa", key: "blue" },
  { label: "Yeşil", value: "#34d399", key: "green" },
  { label: "Mor", value: "#a78bfa", key: "purple" },
  { label: "Sarı", value: "#fbbf24", key: "yellow" },
  { label: "Pembe", value: "#f472b6", key: "pink" },
  { label: "Kırmızı", value: "#f87171", key: "red" },
];

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLORS[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiMode, setAiMode] = useState<"summary" | "flashcard" | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find(n => n.id === activeId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("keda_notes");
      if (saved) {
        const parsed: Note[] = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
          setTitle(parsed[0].title);
          setContent(parsed[0].content);
          setTextColor(parsed[0].color || TEXT_COLORS[0].value);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    try { localStorage.setItem("keda_notes", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const newNote = () => {
    const note: Note = { id: Date.now().toString(), title: "Yeni Not", content: "", color: TEXT_COLORS[0].value, updatedAt: new Date().toLocaleString("tr-TR") };
    saveNotes([note, ...notes]);
    setActiveId(note.id); setTitle(note.title); setContent(""); setTextColor(TEXT_COLORS[0].value); setAiResult(""); setUnsaved(false);
  };

  const saveNote = () => {
    if (!activeId) return;
    const updated = notes.map(n => n.id === activeId ? { ...n, title: title || "Adsız Not", content, color: textColor, updatedAt: new Date().toLocaleString("tr-TR") } : n);
    saveNotes(updated);
    setUnsaved(false);
    toast.success("Not kaydedildi");
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    if (activeId === id) {
      const next = updated[0];
      setActiveId(next?.id || null); setTitle(next?.title || ""); setContent(next?.content || ""); setTextColor(next?.color || TEXT_COLORS[0].value);
    }
  };

  const selectNote = (note: Note) => {
    if (unsaved && !confirm("Kaydedilmemiş değişiklikler var. Devam et?")) return;
    setActiveId(note.id); setTitle(note.title); setContent(note.content); setTextColor(note.color || TEXT_COLORS[0].value); setAiResult(""); setUnsaved(false);
  };

  const handleAI = async (mode: "summary" | "flashcard") => {
    if (!content.trim()) { toast.error("Not içeriği boş"); return; }
    setAiLoading(true); setAiMode(mode); setAiResult("");
    try {
      const prompt = mode === "summary"
        ? `Aşağıdaki notu kısa ve öz bir şekilde özetle (3-5 cümle, Türkçe):\n\n${content}`
        : `Aşağıdaki nottan 5 adet soru-cevap flashcard oluştur (Türkçe, düz metin liste formatında):\n\n${content}`;
      const completion = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 1024 });
      setAiResult(completion.choices[0]?.message?.content || "");
    } catch { toast.error("AI isteği başarısız"); }
    finally { setAiLoading(false); }
  };

  // Ctrl+S kaydet
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNote(); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeId, title, content, textColor]);

  // Satır sayısı hesapla (çizgili defter için)
  const lineHeight = 28;
  const lines = Math.max(20, content.split("\n").length + 5);

  return (
    <div className="flex h-screen overflow-hidden pb-16 lg:pb-0" style={{ background: "hsl(var(--background))" }}>
      {/* Not listesi sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] p-3" style={{ background: "hsl(var(--background))" }}>
        {/* Geri */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs mb-3 transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Geri
        </button>
        <button onClick={newNote} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all text-sm mb-3">
          <Plus className="w-4 h-4" />Yeni Not
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {notes.length === 0 && <p className="text-xs text-center py-6" style={{ color: "hsl(var(--muted-foreground))" }}>Not yok</p>}
          {notes.map(n => (
            <div key={n.id} onClick={() => selectNote(n)}
              className={`group flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${activeId === n.id ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "hover:bg-[hsl(var(--accent))]"}`}
              style={{ color: activeId === n.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs mt-0.5 truncate opacity-60">{n.content.slice(0, 30) || "Boş"}</p>
              </div>
              <button onClick={e => deleteNote(n.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all ml-1 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editör */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Bir not seç veya yeni oluştur</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-[hsl(var(--border))]">
              <input value={title} onChange={e => { setTitle(e.target.value); setUnsaved(true); }}
                placeholder="Not başlığı..." className="text-base font-semibold bg-transparent outline-none flex-1 mr-4"
                style={{ color: "hsl(var(--foreground))" }} />
              <div className="flex items-center gap-2">
                {unsaved && <span className="text-xs" style={{ color: "#fbbf24" }}>Kaydedilmedi</span>}

                {/* Renk seçici */}
                <div className="relative">
                  <button onClick={() => setShowColorPicker(!showColorPicker)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-xs transition-all"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Type className="w-3.5 h-3.5" />
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: textColor }} />
                  </button>
                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-9 z-50 p-2 rounded-xl shadow-xl border border-[hsl(var(--border))]"
                        style={{ background: "hsl(var(--card))" }}>
                        <p className="text-xs mb-2 px-1" style={{ color: "hsl(var(--muted-foreground))" }}>Metin Rengi</p>
                        <div className="flex flex-col gap-1 min-w-32">
                          {TEXT_COLORS.map(c => (
                            <button key={c.key} onClick={() => { setTextColor(c.value); setShowColorPicker(false); setUnsaved(true); }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${textColor === c.value ? "bg-[hsl(var(--accent))]" : "hover:bg-[hsl(var(--accent))]"}`}>
                              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: c.value, border: "1px solid rgba(255,255,255,0.15)" }} />
                              <span style={{ color: c.value }}>{c.label}</span>
                              {textColor === c.value && <span className="ml-auto" style={{ color: "hsl(var(--primary))" }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => handleAI("summary")} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-xs transition-all disabled:opacity-50"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Sparkles className="w-3.5 h-3.5" />Özetle
                </button>
                <button onClick={() => handleAI("flashcard")} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-xs transition-all disabled:opacity-50"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Sparkles className="w-3.5 h-3.5" />Flashcard
                </button>
                <button onClick={saveNote} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  style={{ background: "hsl(var(--primary)/0.15)", border: "1px solid hsl(var(--primary)/0.25)", color: "hsl(var(--primary))" }}>
                  <Save className="w-3.5 h-3.5" />Kaydet
                </button>
              </div>
            </div>

            {/* Editör alanı */}
            <div className="flex-1 flex overflow-hidden" onClick={() => setShowColorPicker(false)}>
              {/* Çizgili defter */}
              <div className="flex-1 overflow-auto relative" style={{ background: "hsl(var(--background))" }}>
                {/* Çizgiler arka plan */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent ${lineHeight - 1}px,
                    hsl(var(--border)/0.65) ${lineHeight - 1}px,
                    hsl(var(--border)/0.65) ${lineHeight}px
                  )`,
                  backgroundPositionY: "52px",
                }} />
                {/* Sol kenar çizgisi */}
                <div className="absolute left-12 top-0 bottom-0 w-px pointer-events-none" style={{ background: "hsl(var(--primary)/0.12)" }} />

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => { setContent(e.target.value); setUnsaved(true); }}
                  placeholder="Notlarını buraya yaz..."
                  className="w-full h-full bg-transparent outline-none resize-none"
                  style={{
                    color: textColor,
                    fontSize: "0.875rem",
                    lineHeight: `${lineHeight}px`,
                    padding: "52px 24px 24px 56px",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    minHeight: `${lines * lineHeight + 80}px`,
                    caretColor: textColor,
                  }}
                />
              </div>

              {/* AI sonucu */}
              <AnimatePresence>
                {(aiLoading || aiResult) && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "300px", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="border-l border-[hsl(var(--border))] overflow-hidden flex-shrink-0">
                    <div className="p-4 h-full overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                        <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{aiMode === "summary" ? "AI Özeti" : "Flashcardlar"}</span>
                        <button onClick={() => setAiResult("")} className="ml-auto text-xs transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>Kapat</button>
                      </div>
                      {aiLoading
                        ? <div className="loading-dots"><span /><span /><span /></div>
                        : <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(var(--muted-foreground))" }}>{aiResult}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-2 border-t border-[hsl(var(--border))] flex items-center justify-between">
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{content.length} karakter · {content.split(/\s+/).filter(Boolean).length} kelime</span>
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>Ctrl+S · {activeNote?.updatedAt}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
