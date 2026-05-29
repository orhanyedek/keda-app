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
import { getFlashcardSets, createFlashcardSet, saveFlashcards, getDueFlashcards } from "@/lib/db";
import PDFUploader from "@/components/PDFUploader";
import { CheckCircle2, XCircle, Clock, Layers } from "lucide-react";
import toast from "react-hot-toast";

const leitnerBoxes = [
  { no: 1, label: "Her Oturum", color: "bg-red-500", textColor: "text-red-400" },
  { no: 2, label: "1 Gün", color: "bg-orange-500", textColor: "text-orange-400" },
  { no: 3, label: "3 Gün", color: "bg-yellow-500", textColor: "text-yellow-400" },
  { no: 4, label: "7 Gün", color: "bg-green-500", textColor: "text-green-400" },
  { no: 5, label: "14 Gün", color: "bg-emerald-500", textColor: "text-emerald-400" },
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
          <div className="flashcard-front keda-card border border-indigo-500/20 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-colors" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-indigo-400 font-mono mb-4 uppercase tracking-wider">Soru</div>
            <p className="text-white text-xl font-medium text-center leading-relaxed">{card.soru}</p>
            <div className="mt-6 text-slate-600 text-xs">Cevabı görmek için tıkla</div>
          </div>
          <div className="flashcard-back keda-card border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-transparent p-8 flex flex-col items-center justify-center" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-emerald-400 font-mono mb-4 uppercase tracking-wider">Cevap</div>
            <p className="text-white text-xl font-medium text-center leading-relaxed">{card.cevap}</p>
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
      <div className="keda-card p-8 border border-indigo-500/20">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4 bg-indigo-600/15 border border-indigo-500/20">
          {rate >= 80 ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : rate >= 50 ? <CheckCircle2 className="w-6 h-6 text-indigo-400" /> : <XCircle className="w-6 h-6 text-amber-400" />}
        </div>
        <h3 className="text-xl font-bold text-white mb-1 text-center">Oturum Tamamlandı</h3>
        <p className="text-slate-400 text-sm mb-6 text-center">{rate >= 80 ? "Harika bir performans." : rate >= 50 ? "İyi gidiyorsun, devam et." : "Tekrar çalışarak gelişebilirsin."}</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"><div className="text-3xl font-bold text-emerald-400">{correct}</div><div className="text-xs text-slate-500 mt-1">Doğru</div></div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><div className="text-3xl font-bold text-red-400">{wrong}</div><div className="text-xs text-slate-500 mt-1">Yanlış</div></div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4"><div className="text-3xl font-bold text-indigo-400">{rate}%</div><div className="text-xs text-slate-500 mt-1">Oran</div></div>
        </div>
        <div className="progress-bar mb-6"><div className="progress-bar-fill" style={{ width: `${rate}%` }} /></div>
        <button onClick={onRestart} className="btn-primary w-full py-3">Yeni Oturum</button>
      </div>
    </motion.div>
  );
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "sets" | "due">("new");
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
          toast.success("Kartlar kaydedildi ✓");
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
    nextCard();
  };

  const handleDontKnow = () => {
    const newBoxStats = [...boxStats];
    newBoxStats[0]++;
    setBoxStats(newBoxStats);
    setWrong(prev => prev + 1);
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex >= cards.length - 1) setSessionState("finished");
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
        <h1 className="text-2xl font-bold text-white mb-1">Flashcard Oturumu</h1>
        <p className="text-slate-400 text-sm">M-03 · Sorumlu: Mustafa Çakmak · Leitner Spaced Repetition</p>
      </motion.div>

      {/* Leitner kutu göstergesi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="keda-card p-4 mb-6">
        <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">Leitner Kutuları</p>
        <div className="flex gap-2">
          {leitnerBoxes.map((box, i) => (
            <div key={box.no} className="flex-1 text-center">
              <div className={`${box.color} w-8 h-8 rounded-xl mx-auto flex items-center justify-center text-white text-xs font-bold mb-1`}>{box.no}</div>
              <div className="text-xs text-slate-600">{box.label}</div>
              {boxStats[i] > 0 && <div className={`text-xs font-bold ${box.textColor} mt-1`}>{boxStats[i]}</div>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sekmeler */}
      {sessionState === "idle" && (
        <>
          <div className="flex gap-2 mb-6">
            {[{ key: "new", label: "Yeni Oluştur" }, { key: "sets", label: "Setlerim" }, { key: "due", label: "Tekrar Zamanı" }].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as "new" | "sets" | "due")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "new" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="keda-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Yeni Kart Seti Oluştur</h2>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Set Adı (isteğe bağlı)</label>
                  <input value={setTitle} onChange={(e) => setSetTitle(e.target.value)} placeholder="Örn: Veri Yapıları Final" className="keda-input" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">PDF Yükle (opsiyonel)</label>
                  <PDFUploader
                    label="PDF'ten otomatik metin çıkar"
                    onTextExtracted={(text) => {
                      setInputText(text);
                      toast.success("PDF metni yüklendi, flashcard oluşturabilirsiniz!");
                    }}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Ders Metni</label>
                  <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                    placeholder="Flashcard oluşturmak istediğiniz metni buraya yapıştırın ya da yukarıdan PDF yükleyin..." rows={6} className="keda-input resize-none font-mono text-sm" />
                  <div className="text-xs text-slate-600 mt-1 text-right">{inputText.length} karakter</div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm text-slate-400">Kart sayısı:</label>
                  {[5, 10, 15, 20].map((count) => (
                    <button key={count} onClick={() => setCardCount(count)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cardCount === count ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
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
                <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
              ) : sets.length === 0 ? (
                <div className="keda-card p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-slate-400 text-sm">Henüz kart seti yok. Yeni oluştur sekmesinden başla.</p>
              </div>
              ) : sets.map((set) => (
                <div key={set.id} className="keda-card p-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{set.baslik}</h3>
                    <p className="text-slate-500 text-sm mt-1">{set.flashcards?.[0]?.count || 0} kart · {new Date(set.created_at).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {tab === "due" && (
            <div className="keda-card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-white font-medium mb-1 text-sm">Tekrar Zamanı Gelen Kartlar</p>
              <p className="text-slate-400 text-sm mb-6">Leitner algoritmasına göre bugün tekrar etmen gereken kartlar yükleniyor.</p>
              <button onClick={loadDueCards} className="btn-primary px-8 py-2.5 text-sm">Kartları Yükle</button>
            </div>
          )}
        </>
      )}

      {sessionState === "active" && cards.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
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
            <span className="text-slate-600">•</span>
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
