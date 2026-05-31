"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CalendarDays, Clock, Trophy } from "lucide-react";
import toast from "react-hot-toast";

interface Exam { id: string; name: string; date: string; subject: string; color: string; }

const COLORS = ["bg-[hsl(var(--foreground))]", "bg-[hsl(var(--secondary))]", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500", "bg-pink-500"];

function getDaysLeft(dateStr: string) {
  const exam = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number) {
  if (days < 0) return "text-slate-600";
  if (days <= 3) return "text-red-400";
  if (days <= 7) return "text-amber-400";
  if (days <= 14) return "text-yellow-400";
  return "text-emerald-400";
}

function getUrgencyBg(days: number) {
  if (days < 0) return "border-slate-700/50";
  if (days <= 3) return "border-red-500/30 bg-red-500/5";
  if (days <= 7) return "border-amber-500/30 bg-amber-500/5";
  if (days <= 14) return "border-yellow-500/30 bg-yellow-500/5";
  return "border-emerald-500/20 bg-emerald-500/5";
}

export default function ExamsPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "Sınav Takvimi | KEDA"; }, []);

  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("keda_exams");
      if (saved) setExams(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveExams = (updated: Exam[]) => {
    setExams(updated);
    try { localStorage.setItem("keda_exams", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const addExam = () => {
    if (!name.trim() || !date) { toast.error("Sınav adı ve tarih gerekli"); return; }
    const exam: Exam = { id: Date.now().toString(), name, subject, date, color };
    saveExams([...exams, exam].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setName(""); setSubject(""); setDate(""); setShowForm(false);
    toast.success("Sınav eklendi!");
  };

  const deleteExam = (id: string) => {
    saveExams(exams.filter(e => e.id !== id));
    toast.success("Sınav silindi");
  };

  const sorted = [...exams].sort((a, b) => getDaysLeft(a.date) - getDaysLeft(b.date));
  const upcoming = sorted.filter(e => getDaysLeft(e.date) >= 0);
  const past = sorted.filter(e => getDaysLeft(e.date) < 0);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Sınav Takvimi</h1>
          <p className="text-slate-400 text-sm">Sınav tarihlerini takip et, hazırlık sürecini yönet</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />Sınav Ekle
        </button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="keda-card p-6">
              <h3 className="text-white font-medium mb-4 text-sm">Yeni Sınav</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Sınav Adı *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Matematik Finali" className="keda-input text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Ders</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Matematik" className="keda-input text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Tarih *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="keda-input text-sm" min={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Renk</label>
                  <div className="flex gap-2 mt-1">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-lg ${c} transition-all ${color === c ? "ring-2 ring-white/30 scale-110" : "opacity-60 hover:opacity-100"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={addExam} className="btn-primary px-6 py-2.5 text-sm">Ekle</button>
                <button onClick={() => setShowForm(false)} className="glass px-6 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm transition-colors">İptal</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yaklaşan sınavlar */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">Yaklaşan Sınavlar</p>
          <div className="space-y-3">
            {upcoming.map(exam => {
              const days = getDaysLeft(exam.date);
              return (
                <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`keda-card p-5 border ${getUrgencyBg(days)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${exam.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                        {days === 0 ? "!" : days <= 3 ? "" : <CalendarDays className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{exam.name}</h3>
                        {exam.subject && <p className="text-slate-500 text-xs mt-0.5">{exam.subject}</p>}
                        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(exam.date).toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-2xl font-bold tabular-nums ${getUrgencyColor(days)}`}>{days === 0 ? "Bugün!" : `${days}`}</div>
                        {days > 0 && <div className="text-slate-600 text-xs">gün kaldı</div>}
                      </div>
                      <button onClick={() => deleteExam(exam.id)} className="p-2 text-slate-700 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* İlerleme çubuğu */}
                  {days > 0 && days <= 30 && (
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${Math.max(5, 100 - (days / 30) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tamamlanan sınavlar */}
      {past.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">Tamamlananlar</p>
          <div className="space-y-2">
            {past.map(exam => (
              <div key={exam.id} className="keda-card p-4 opacity-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-slate-400 text-sm">{exam.name}</p>
                    <p className="text-slate-600 text-xs">{new Date(exam.date).toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>
                <button onClick={() => deleteExam(exam.id)} className="p-1.5 text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {exams.length === 0 && !showForm && (
        <div className="keda-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--foreground))]/15 border border-[hsl(var(--border))]/20 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-white font-medium mb-2">Sınav yok</p>
          <p className="text-slate-500 text-sm mb-6">Yaklaşan sınavlarını ekle, geri sayımı takip et.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-2.5 text-sm">İlk Sınavı Ekle</button>
        </div>
      )}
    </div>
  );
}
