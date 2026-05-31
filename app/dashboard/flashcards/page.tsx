/**
 * KEDA - Flashcard Modulu (M-03)
 * Leitner 5-kutu Spaced Repetition + Supabase kayıt
 * Sorumlu: Mustafa Cakmak · Katki: Serdar Durgut
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { generateFlashcards } from "@/lib/gemini";
import { getFlashcardSets, createFlashcardSet, saveFlashcards, getDueFlashcards, getFlashcardsBySet, updateFlashcard, deleteFlashcard, deleteFlashcardSet } from "@/lib/db";
import PDFUploader from "@/components/PDFUploader";
import { CheckCircle2, XCircle, Clock, Layers, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";

const leitnerBoxes = [
  { no: 1, label: "Her Oturum", color: "bg-[hsl(var(--primary)/0.7)]", textColor: "text-[hsl(var(--primary))]" },
  { no: 2, label: "1 Gün", color: "bg-orange-500", textColor: "text-orange-400" },
  { no: 3, label: "3 Gün", color: "bg-[hsl(var(--primary)/0.85)]", textColor: "text-[hsl(var(--primary))]" },
  { no: 4, label: "7 Gün", color: "bg-[hsl(var(--primary))]", textColor: "text-[hsl(var(--primary))]" },
  { no: 5, label: "14 Gün", color: "bg-[hsl(var(--primary))]", textColor: "text-[hsl(var(--primary))]" },
];

interface FlashcardData {
  id: string;
  soru: string;
  cevap: string;
  kutu_no: number;
  zorluk: number;
}

interface SetData {
  id: string;
  baslik: string;
  created_at: string;
  flashcards: { count: number }[];
}

function CardFlip({ card, onKnow, onDontKnow }: {
  card: FlashcardData;
  onKnow: () => void;
  onDontKnow: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="max-w-lg mx-auto">
      <div className="flashcard-container" style={{ height: 280 }}>
        <div className={`flashcard-inner ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
          <div className="flashcard-front keda-card border border-[hsl(var(--border))] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[hsl(var(--border))] transition-colors" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-[hsl(var(--primary))] font-mono mb-4 uppercase tracking-wider">Soru</div>
            <p className="text-[hsl(var(--foreground))] text-xl font-medium text-center leading-relaxed">{card.soru}</p>
            <div className="mt-6 text-[hsl(var(--muted-foreground)/0.6)] text-xs">Cevabı görmek için tıkla</div>
          </div>
          <div className="flashcard-back keda-card border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-transparent p-8 flex flex-col items-center justify-center" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-emerald-400 font-mono mb-4 uppercase tracking-wider">Cevap</div>
            <p className="text-[hsl(var(--foreground))] text-xl font-medium text-center leading-relaxed">{card.cevap}</p>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-4 mt-6">
            <button onClick={() => { onDontKnow(); setFlipped(false); }} className="flex-1 py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-all">Bilmedim</button>
            <button onClick={() => { onKnow(); setFlipped(false); }} className="flex-1 py-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-all">Bildim</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionSummary({ correct, wrong, total, onRestart }: { correct: number; wrong: number; total: number; onRestart: () => void }) {
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
      <div className="keda-card p-8 border border-[hsl(var(--border))]">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4 bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))]">
          {rate >= 80 ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : rate >= 50 ? <CheckCircle2 className="w-6 h-6 text-[hsl(var(--primary))]" /> : <XCircle className="w-6 h-6 text-amber-400" />}
        </div>
        <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1 text-center">Oturum Tamamlandı</h3>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6 text-center">{rate >= 80 ? "Harika bir performans." : rate >= 50 ? "İyi gidiyorsun, devam et." : "Tekrar çalışarak gelişebilirsin."}</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"><div className="text-3xl font-bold text-emerald-400">{correct}</div><div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Doğru</div></div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><div className="text-3xl font-bold text-red-400">{wrong}</div><div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Yanlış</div></div>
          <div className="bg-indigo-500/10 border border-[hsl(var(--border))] rounded-xl p-4"><div className="text-3xl font-bold text-[hsl(var(--primary))]">{rate}%</div><div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Oran</div></div>
        </div>
        <div className="progress-bar mb-6"><div className="progress-bar-fill" style={{ width: `${rate}%` }} /></div>
        <button onClick={onRestart} className="btn-primary w-full py-3">Yeni Oturum</button>
      </div>
    </motion.div>
  );
}

export default function FlashcardsPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "Flashcard | KEDA"; }, []);

  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "sets" | "due" | "history">("new");
  const [inputText, setInputText] = useState("");
  const [setTitle, setSetTitle] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionState, setSessionState] = useState<"idle" | "active" | "finished">("idle");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [boxStats, setBoxStats] = useState([0, 0, 0, 0, 0]);
  const [sets, setSets] = useState<SetData[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState<{ id: string; baslik: string } | null>(null);
  const [detailCards, setDetailCards] = useState<FlashcardData[]>([]);
  const [loadingSetCards, setLoadingSetCards] = useState(false);
  const [editingCard, setEditingCard] = useState<{ id: string; soru: string; cevap: string } | null>(null);

  // Oturum geçmişi - localStorage'da sakla
  interface SessionRecord { date: string; total: number; correct: number; wrong: number; rate: number; }
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("keda_session_history");
      if (saved) setSessionHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveSessionRecord = (c: number, w: number, t: number) => {
    const record: SessionRecord = {
      date: new Date().toLocaleString("tr-TR"),
      total: t, correct: c, wrong: w,
      rate: t > 0 ? Math.round((c / t) * 100) : 0,
    };
    const updated = [record, ...sessionHistory].slice(0, 20); // max 20 kayıt
    setSessionHistory(updated);
    try { localStorage.setItem("keda_session_history", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (user && tab === "sets") loadSets();
    if (user && tab === "due") loadDueCards();
  }, [user, tab]);

  const loadSets = async () => {
    if (!user) return;
    setLoadingSets(true);
    const { data } = await getFlashcardSets(user.id);
    if (data) setSets(data as SetData[]);
    setLoadingSets(false);
  };

  const openSet = async (set: { id: string; baslik: string }) => {
    setSelectedSet(set);
    setLoadingSetCards(true);
    const { data } = await getFlashcardsBySet(set.id);
    if (data) setDetailCards(data as FlashcardData[]);
    setLoadingSetCards(false);
  };

  const loadDueCards = async () => {
    if (!user) return;
    const { data } = await getDueFlashcards(user.id);
    if (data && data.length > 0) {
      setCards(data as FlashcardData[]);
      setSessionState("active");
      setCurrentIndex(0);
      toast.success(`${data.length} kart tekrar zamanı geldi!`);
    } else {
      toast("Bugün tekrar edilecek kart yok.");
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) { toast.error("Lütfen metin girin"); return; }
    setGenerating(true);
    try {
      const result = await generateFlashcards(inputText, cardCount);
      const newCards = result.flashcards.map((c: { soru: string; cevap: string; zorluk: number }, i: number) => ({
        id: `temp-${i}`,
        soru: c.soru,
        cevap: c.cevap,
        kutu_no: 1,
        zorluk: c.zorluk || 3,
      }));
      setCards(newCards);
      setSessionState("active");
      setCurrentIndex(0);
      setCorrect(0);
      setWrong(0);
      toast.success(`${newCards.length} flashcard oluşturuldu!`);

      // Supabase'e kaydet
      if (user) {
        setSaving(true);
        const title = setTitle.trim() || `Set ${new Date().toLocaleDateString("tr-TR")}`;
        const { data: setData } = await createFlashcardSet(user.id, title);
        if (setData) {
          await saveFlashcards(user.id, setData.id, result.flashcards);
          toast.success("Kartlar kaydedildi ");
        }
        setSaving(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Flashcard hatası:", msg);
      toast.error("Flashcard üretimi başarısız: " + msg.slice(0, 80));
    } finally {
      setGenerating(false);
    }
  };

  const handleKnow = () => {
    const card = cards[currentIndex];
    const newBoxNo = Math.min(card.kutu_no + 1, 5);
    const newBoxStats = [...boxStats];
    newBoxStats[newBoxNo - 1]++;
    setBoxStats(newBoxStats);
    setCorrect(prev => prev + 1);
    nextCard(true);
  };

  const handleDontKnow = () => {
    const newBoxStats = [...boxStats];
    newBoxStats[0]++;
    setBoxStats(newBoxStats);
    setWrong(prev => prev + 1);
    nextCard(false);
  };

  const nextCard = (isCorrect?: boolean) => {
    if (currentIndex >= cards.length - 1) {
      const finalCorrect = correct + (isCorrect ? 1 : 0);
      const finalWrong = wrong + (!isCorrect ? 1 : 0);
      saveSessionRecord(finalCorrect, finalWrong, cards.length);
      setSessionState("finished");
    }
    else setCurrentIndex(prev => prev + 1);
  };

  const handleRestart = () => {
    setSessionState("idle");
    setCards([]);
    setInputText("");
    setSetTitle("");
    setCorrect(0);
    setWrong(0);
    setBoxStats([0, 0, 0, 0, 0]);
    setTab("new");
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">Flashcard Oturumu</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">M-03 · Sorumlu: Mustafa Çakmak · Leitner Spaced Repetition</p>
      </motion.div>

      {/* Leitner kutu göstergesi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="keda-card p-4 mb-6">
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 font-mono uppercase tracking-wider">Leitner Kutuları</p>
        <div className="flex gap-2">
          {leitnerBoxes.map((box, i) => (
            <div key={box.no} className="flex-1 text-center">
              <div className={`${box.color} w-8 h-8 rounded-xl mx-auto flex items-center justify-center text-[hsl(var(--foreground))] text-xs font-bold mb-1`}>{box.no}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground)/0.6)]">{box.label}</div>
              {boxStats[i] > 0 && <div className={`text-xs font-bold ${box.textColor} mt-1`}>{boxStats[i]}</div>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sekmeler */}
      {sessionState === "idle" && (
        <>
          <div className="flex gap-2 mb-6">
            {[{ key: "new", label: "Yeni Oluştur" }, { key: "sets", label: "Setlerim" }, { key: "due", label: "Tekrar Zamanı" }, { key: "history", label: "Geçmiş" }].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as "new" | "sets" | "due")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-indigo-600/30 border border-[hsl(var(--border))] text-[hsl(var(--primary)/0.85)]" : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "new" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="keda-card p-6">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Yeni Kart Seti Oluştur</h2>
                <div className="mb-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">Set Adı (isteğe bağlı)</label>
                  <input value={setTitle} onChange={(e) => setSetTitle(e.target.value)} placeholder="Örn: Veri Yapıları Final" className="keda-input" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">PDF Yükle (opsiyonel)</label>
                  <PDFUploader
                    label="PDF'ten otomatik metin çıkar"
                    onTextExtracted={(text) => {
                      setInputText(text);
                      toast.success("PDF metni yüklendi, flashcard oluşturabilirsiniz!");
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">Ders Metni</label>
                  <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                    placeholder="Flashcard oluşturmak istediğiniz metni buraya yapıştırın ya da yukarıdan PDF yükleyin..." rows={6} className="keda-input resize-none font-mono text-sm" />
                  <div className="text-xs text-[hsl(var(--muted-foreground)/0.6)] mt-1 text-right">{inputText.length} karakter</div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm text-[hsl(var(--muted-foreground))]">Kart sayısı:</label>
                  {[5, 10, 15, 20].map((count) => (
                    <button key={count} onClick={() => setCardCount(count)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cardCount === count ? "bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] text-[hsl(var(--primary)/0.85)]" : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                      {count}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerate} disabled={generating || saving || !inputText.trim()} className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                  {generating ? (<div className="flex items-center justify-center gap-2"><div className="loading-dots"><span /><span /><span /></div><span>Gemini AI Çalışıyor...</span></div>)
                    : saving ? "Kaydediliyor..." : `${cardCount} Flashcard Oluştur`}
                </button>
              </div>
            </motion.div>
          )}

          {tab === "sets" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {loadingSets ? (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Yükleniyor...</div>
              ) : sets.length === 0 ? (
                <div className="keda-card p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">Henüz kart seti yok. Yeni oluştur sekmesinden başla.</p>
              </div>
              ) : sets.map((set) => (
                <div key={set.id} onClick={() => openSet(set)} className="keda-card p-5 flex items-center justify-between cursor-pointer hover:border-[hsl(var(--border))] transition-colors">
                  <div>
                    <h3 className="text-[hsl(var(--foreground))] font-medium">{set.baslik}</h3>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{set.flashcards?.[0]?.count || 0} kart · {new Date(set.created_at).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[hsl(var(--primary))]" />
                  </div>
                </div>
              ))}

              {/* Set Detay Modalı */}
              <AnimatePresence>
                {selectedSet && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedSet(null)}>
                    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                      onClick={e => e.stopPropagation()}
                      className="keda-card w-full max-w-lg max-h-[80vh] flex flex-col">
                      <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
                        <div>
                          <h3 className="text-[hsl(var(--foreground))] font-semibold">{selectedSet.baslik}</h3>
                          <p className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5">{detailCards.length} kart</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={async () => {
                            if (!confirm("Bu seti ve tüm kartları silmek istediğinize emin misiniz?")) return;
                            await deleteFlashcardSet(selectedSet.id, user!.id);
                            setSets(prev => prev.filter(s => s.id !== selectedSet.id));
                            setSelectedSet(null);
                            toast.success("Set silindi");
                          }} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setSelectedSet(null)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" style={{color:"hsl(var(--muted-foreground))"}}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="overflow-y-auto p-5 space-y-3">
                        {loadingSetCards ? (
                          <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">Yükleniyor...</div>
                        ) : detailCards.map((card, i) => (
                          <div key={card.id} className="p-4 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
                            {editingCard?.id === card.id ? (
                              // Düzenleme modu
                              <div className="space-y-2">
                                <textarea value={editingCard.soru} onChange={e => setEditingCard({ ...editingCard, soru: e.target.value })}
                                  className="keda-input text-sm resize-none" rows={2} />
                                <textarea value={editingCard.cevap} onChange={e => setEditingCard({ ...editingCard, cevap: e.target.value })}
                                  className="keda-input text-sm resize-none" rows={2} />
                                <div className="flex gap-2">
                                  <button onClick={async () => {
                                    await updateFlashcard(card.id, editingCard.soru, editingCard.cevap);
                                    setDetailCards(prev => prev.map(c => c.id === card.id ? { ...c, soru: editingCard.soru, cevap: editingCard.cevap } : c));
                                    setEditingCard(null);
                                    toast.success("Kart güncellendi");
                                  }} className="btn-primary text-xs px-3 py-1.5">Kaydet</button>
                                  <button onClick={() => setEditingCard(null)} className="btn-secondary text-xs px-3 py-1.5">İptal</button>
                                </div>
                              </div>
                            ) : (
                              // Normal görünüm
                              <>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <span className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>#{i + 1}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {[1,2,3,4,5].map(n => (
                                        <div key={n} className={`w-1.5 h-1.5 rounded-full ${n <= card.zorluk ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"}`} />
                                      ))}
                                    </div>
                                    <button onClick={() => setEditingCard({ id: card.id, soru: card.soru, cevap: card.cevap })}
                                      className="p-1 rounded hover:bg-[hsl(var(--accent))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={async () => {
                                      await deleteFlashcard(card.id);
                                      setDetailCards(prev => prev.filter(c => c.id !== card.id));
                                      toast.success("Kart silindi");
                                    }} className="p-1 rounded hover:bg-red-500/10 transition-colors text-red-400">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm font-medium mb-2" style={{ color: "hsl(var(--foreground))" }}>{card.soru}</p>
                                <p className="text-sm border-t border-[hsl(var(--border))] pt-2" style={{ color: "hsl(var(--muted-foreground))" }}>{card.cevap}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {tab === "due" && (
            <div className="keda-card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
              </div>
              <p className="text-[hsl(var(--foreground))] font-medium mb-1 text-sm">Tekrar Zamanı Gelen Kartlar</p>
              <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">Leitner algoritmasına göre bugün tekrar etmen gereken kartlar yükleniyor.</p>
              <button onClick={loadDueCards} className="btn-primary px-8 py-2.5 text-sm">Kartları Yükle</button>
            </div>
          )}

          {tab === "history" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {sessionHistory.length === 0 ? (
                <div className="keda-card p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-5 h-5 text-[hsl(var(--primary))]" />
                  </div>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm">Henüz tamamlanmış oturum yok.</p>
                </div>
              ) : sessionHistory.map((s, i) => (
                <div key={i} className="keda-card p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${s.rate >= 80 ? "bg-emerald-500/20 text-emerald-400" : s.rate >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                    {s.rate}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[hsl(var(--foreground))] text-sm font-medium">{s.total} kart çalışıldı</p>
                    <p className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5">{s.correct} doğru · {s.wrong} yanlış · {s.date}</p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.rate >= 80 ? "bg-emerald-500" : s.rate >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${s.rate}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {sessionState === "active" && cards.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))] mb-2">
              <span>Kart {currentIndex + 1} / {cards.length}</span>
              <span>{Math.round((currentIndex / cards.length) * 100)}% tamamlandı</span>
            </div>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(currentIndex / cards.length) * 100}%` }} /></div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
              <CardFlip card={cards[currentIndex]} onKnow={handleKnow} onDontKnow={handleDontKnow} />
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <span className="text-emerald-400">{correct} doğru</span>
            <span className="text-[hsl(var(--muted-foreground)/0.6)]">•</span>
            <span className="text-red-400">{wrong} yanlış</span>
          </div>
        </motion.div>
      )}

      {sessionState === "finished" && (
        <SessionSummary correct={correct} wrong={wrong} total={cards.length} onRestart={handleRestart} />
      )}
    </div>
  );
}
