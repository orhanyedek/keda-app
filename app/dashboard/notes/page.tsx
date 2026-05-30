"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, Save, FileText } from "lucide-react";
import Groq from "groq-sdk";
import toast from "react-hot-toast";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiMode, setAiMode] = useState<"summary" | "flashcard" | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  const activeNote = notes.find(n => n.id === activeId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("keda_notes");
      if (saved) {
        const parsed: Note[] = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) { setActiveId(parsed[0].id); setTitle(parsed[0].title); setContent(parsed[0].content); }
      }
    } catch { /* ignore */ }
  }, []);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    try { localStorage.setItem("keda_notes", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const newNote = () => {
    const note: Note = { id: Date.now().toString(), title: "Yeni Not", content: "", updatedAt: new Date().toLocaleString("tr-TR") };
    const updated = [note, ...notes];
    saveNotes(updated);
    setActiveId(note.id);
    setTitle(note.title);
    setContent("");
    setAiResult("");
    setUnsaved(false);
  };

  const saveNote = () => {
    if (!activeId) return;
    const updated = notes.map(n => n.id === activeId ? { ...n, title: title || "Adsız Not", content, updatedAt: new Date().toLocaleString("tr-TR") } : n);
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
      setActiveId(next?.id || null);
      setTitle(next?.title || "");
      setContent(next?.content || "");
    }
  };

  const selectNote = (note: Note) => {
    if (unsaved && !confirm("Kaydedilmemiş değişiklikler var. Devam et?")) return;
    setActiveId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setAiResult("");
    setUnsaved(false);
  };

  const handleAI = async (mode: "summary" | "flashcard") => {
    if (!content.trim()) { toast.error("Not içeriği boş"); return; }
    setAiLoading(true);
    setAiMode(mode);
    setAiResult("");
    try {
      const prompt = mode === "summary"
        ? `Aşağıdaki notu kısa ve öz bir şekilde özetle (3-5 cümle, Türkçe):\n\n${content}`
        : `Aşağıdaki nottan 5 adet soru-cevap flashcard oluştur (Türkçe, düz metin liste formatında):\n\n${content}`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      });
      setAiResult(completion.choices[0]?.message?.content || "");
    } catch { toast.error("AI isteği başarısız"); }
    finally { setAiLoading(false); }
  };

  // Ctrl+S ile kaydet
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNote(); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeId, title, content]);

  return (
    <div className="flex h-screen overflow-hidden pb-16 lg:pb-0" style={{ background: "var(--bg-primary)" }}>
      {/* Not listesi sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-white/5 p-3" style={{ background: "var(--bg-secondary)" }}>
        <button onClick={newNote} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm mb-3">
          <Plus className="w-4 h-4" />Yeni Not
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {notes.length === 0 && <p className="text-slate-600 text-xs text-center py-6">Not yok</p>}
          {notes.map(n => (
            <div key={n.id} onClick={() => selectNote(n)}
              className={`group flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all ${activeId === n.id ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{n.content.slice(0, 30) || "Boş"}</p>
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
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-slate-500 text-sm">Bir not seç veya yeni oluştur</p>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
              <input value={title} onChange={e => { setTitle(e.target.value); setUnsaved(true); }}
                placeholder="Not başlığı..." className="text-lg font-semibold text-white bg-transparent outline-none flex-1 mr-4" />
              <div className="flex items-center gap-2">
                {unsaved && <span className="text-xs text-amber-500">Kaydedilmedi</span>}
                <button onClick={() => handleAI("summary")} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-slate-400 hover:text-indigo-300 text-xs transition-all disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" />Özetle
                </button>
                <button onClick={() => handleAI("flashcard")} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-slate-400 hover:text-indigo-300 text-xs transition-all disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" />Flashcard
                </button>
                <button onClick={saveNote} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-600/30 transition-all">
                  <Save className="w-3.5 h-3.5" />Kaydet
                </button>
              </div>
            </div>

            {/* Editör alanı */}
            <div className="flex-1 flex overflow-hidden">
              <textarea value={content} onChange={e => { setContent(e.target.value); setUnsaved(true); }}
                placeholder="Notlarını buraya yaz..."
                className="flex-1 p-6 bg-transparent text-slate-200 text-sm leading-relaxed outline-none resize-none font-mono" />

              {/* AI sonucu */}
              <AnimatePresence>
                {(aiLoading || aiResult) && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "320px", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    className="border-l border-white/5 overflow-hidden flex-shrink-0">
                    <div className="p-4 h-full overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-white text-sm font-medium">{aiMode === "summary" ? "AI Özeti" : "Flashcardlar"}</span>
                        <button onClick={() => setAiResult("")} className="ml-auto text-slate-600 hover:text-white transition-colors text-xs">Kapat</button>
                      </div>
                      {aiLoading ? (
                        <div className="loading-dots"><span /><span /><span /></div>
                      ) : (
                        <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-600">{content.length} karakter · {content.split(/\s+/).filter(Boolean).length} kelime</span>
              <span className="text-xs text-slate-600">Ctrl+S ile kaydet · {activeNote?.updatedAt}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
