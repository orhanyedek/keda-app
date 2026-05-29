/**
 * KEDA - Flashcard Modulu (M-03)
 * 
 * Spaced Repetition destekli flashcard sistemi.
 * Leitner 5-kutu algoritmasi ile kartlar yonetilir.
 * Kart cevirme animasyonu: CSS 3D transform (CardFlip bileseni).
 * 
 * Ozellikler:
 * - PDF'ten Gemini AI ile otomatik kart uretimi
 * - 5 kutulu Leitner sistemi (her oturum → 14 gun sonra)
 * - Oturum sonu performans ozeti (SessionSummary)
 * - Dogru/Yanlis istatistikleri
 * 
 * Sorumlu: Mustafa Cakmak (M-03 Flash Notlar / Flashcard)
 * Katki: Serdar Durgut
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { generateFlashcards } from "@/lib/gemini";
import toast from "react-hot-toast";

// Leitner sistemi kutu renkleri ve araliklari
const leitnerBoxes = [
  { no: 1, label: "Her Oturum", color: "bg-red-500", textColor: "text-red-400" },
  { no: 2, label: "1 Gun", color: "bg-orange-500", textColor: "text-orange-400" },
  { no: 3, label: "3 Gun", color: "bg-yellow-500", textColor: "text-yellow-400" },
  { no: 4, label: "7 Gun", color: "bg-green-500", textColor: "text-green-400" },
  { no: 5, label: "14 Gun", color: "bg-emerald-500", textColor: "text-emerald-400" },
];

// Flashcard tipi - veritabanindan gelen kart yapisi
interface FlashcardData {
  id: string;
  soru: string;
  cevap: string;
  kutu_no: number;
  zorluk: number;
}

// ====== KART CEVİRME BİLEŞENİ (CardFlip) ======
function CardFlip({ card, onKnow, onDontKnow }: {
  card: FlashcardData;
  onKnow: () => void;
  onDontKnow: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="max-w-lg mx-auto">
      {/* 3D Kart Cevirme Animasyonu - FR-F02 gereksinimi */}
      <div className="flashcard-container" style={{ height: 280 }}>
        <div className={`flashcard-inner ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)}>
          {/* On yuz - Soru */}
          <div className="flashcard-front keda-card border border-indigo-500/20 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/40 transition-colors" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-indigo-400 font-mono mb-4 uppercase tracking-wider">Soru</div>
            <p className="text-white text-xl font-medium text-center leading-relaxed">{card.soru}</p>
            <div className="mt-6 text-slate-600 text-xs">Cevabi gormek icin tikla</div>
          </div>
          
          {/* Arka yuz - Cevap */}
          <div className="flashcard-back keda-card border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-transparent p-8 flex flex-col items-center justify-center" style={{ height: 280, borderRadius: 16 }}>
            <div className="text-xs text-emerald-400 font-mono mb-4 uppercase tracking-wider">Cevap</div>
            <p className="text-white text-xl font-medium text-center leading-relaxed">{card.cevap}</p>
          </div>
        </div>
      </div>

      {/* Cevap sonrasi butonlar - sadece kart cevrilmisse goster */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-4 mt-6"
          >
            {/* Yanlis - kart Kutu 1'e duser (IK-A04, Leitner kurali) */}
            <button
              onClick={() => { onDontKnow(); setFlipped(false); }}
              className="flex-1 py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/30 transition-all"
            >
              Bilmedim
            </button>
            {/* Dogru - kart bir ust kutuya gecer */}
            <button
              onClick={() => { onKnow(); setFlipped(false); }}
              className="flex-1 py-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-all"
            >
              Bildim
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ====== OTURUM OZETI (SessionSummary) ======
function SessionSummary({ correct, wrong, total, onRestart }: {
  correct: number; wrong: number; total: number; onRestart: () => void;
}) {
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
      <div className="keda-card p-8 border border-indigo-500/20">
        <div className="text-5xl mb-4">{rate >= 80 ? "🎉" : rate >= 50 ? "👍" : "💪"}</div>
        <h3 className="text-2xl font-bold text-white mb-2">Oturum Tamamlandi</h3>
        <p className="text-slate-400 text-sm mb-6">
          {rate >= 80 ? "Muhtesem! Harika bir performans." : rate >= 50 ? "Iyi gidiyorsun! Devam et." : "Tekrar calisarak gelisebilirsin."}
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-400">{correct}</div>
            <div className="text-xs text-slate-500 mt-1">Dogru</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-400">{wrong}</div>
            <div className="text-xs text-slate-500 mt-1">Yanlis</div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="text-3xl font-bold text-indigo-400">{rate}%</div>
            <div className="text-xs text-slate-500 mt-1">Oran</div>
          </div>
        </div>
        
        <div className="progress-bar mb-6">
          <div className="progress-bar-fill" style={{ width: `${rate}%` }} />
        </div>
        
        <button onClick={onRestart} className="btn-primary w-full py-3">Tekrar Calis</button>
      </div>
    </motion.div>
  );
}

// ====== ANA FLASHCARD SAYFASI ======
export default function FlashcardsPage() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sessionState, setSessionState] = useState<"idle" | "active" | "finished">("idle");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  // Kutu bazli istatistikler - Leitner algoritmasinin ciktisi
  const [boxStats, setBoxStats] = useState([0, 0, 0, 0, 0]);

  // Gemini ile flashcard uretimi (FR-F01)
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Lutfen metin girin");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateFlashcards(inputText, cardCount);
      const newCards = result.flashcards.map((c: { soru: string; cevap: string; zorluk: number }, i: number) => ({
        id: `card-${i}`,
        soru: c.soru,
        cevap: c.cevap,
        kutu_no: 1, // Yeni kartlar her zaman Kutu 1'den baslar
        zorluk: c.zorluk || 3,
      }));
      setCards(newCards);
      setSessionState("active");
      setCurrentIndex(0);
      setCorrect(0);
      setWrong(0);
      toast.success(`${newCards.length} flashcard olusturuldu!`);
    } catch {
      toast.error("Flashcard uretimi basarisiz. API anahtarini kontrol edin.");
    } finally {
      setGenerating(false);
    }
  };

  // Dogru cevap - kart bir ust kutuya gecer (Leitner kurali FR-F03, FR-F04)
  const handleKnow = () => {
    const card = cards[currentIndex];
    const newBoxNo = Math.min(card.kutu_no + 1, 5);
    const newBoxStats = [...boxStats];
    newBoxStats[newBoxNo - 1]++;
    setBoxStats(newBoxStats);
    setCorrect(prev => prev + 1);
    nextCard();
  };

  // Yanlis cevap - kart Kutu 1'e duser (Leitner kurali)
  const handleDontKnow = () => {
    const newBoxStats = [...boxStats];
    newBoxStats[0]++; // Her zaman Kutu 1
    setBoxStats(newBoxStats);
    setWrong(prev => prev + 1);
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex >= cards.length - 1) {
      setSessionState("finished");
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    setSessionState("idle");
    setCards([]);
    setInputText("");
    setCorrect(0);
    setWrong(0);
    setBoxStats([0, 0, 0, 0, 0]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Baslik */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Flashcard Oturumu</h1>
        <p className="text-slate-400 text-sm">M-03 · Sorumlu: Mustafa Cakmak · Leitner Spaced Repetition</p>
      </motion.div>

      {/* Leitner kutu gostergesi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="keda-card p-4 mb-6">
        <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">Leitner Kutulari</p>
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

      {/* ====== IDLE: Kart uretim formu ====== */}
      {sessionState === "idle" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="keda-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Yeni Kart Seti Olustur</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Ders Metni (PDF kopyala-yapistir veya yaz)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Flashcard olusturmak istediginiz metni buraya yapistirin... Gemini AI bu metni analiz ederek soru-cevap kartlari olusturacak."
                rows={8}
                className="keda-input resize-none font-mono text-sm"
              />
              <div className="text-xs text-slate-600 mt-1 text-right">{inputText.length} karakter</div>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm text-slate-400">Kart sayisi:</label>
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setCardCount(count)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cardCount === count ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}
                >
                  {count}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={generating || !inputText.trim()}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-dots"><span /><span /><span /></div>
                  <span>Gemini AI Calisıyor...</span>
                </div>
              ) : `${cardCount} Flashcard Olustur`}
            </button>
          </div>

          {/* Yardim bilgisi */}
          <div className="keda-card p-4 border border-indigo-500/15">
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-indigo-400 font-medium">Nasil kullanilir:</span> Ders notlarinizi veya ders kitabindan bir bolumu metin kutusuna yapiştirin. 
              Gemini AI metni analiz ederek {cardCount} adet soru-cevap karti olusturacak. 
              Kartlari cevirip Bildim/Bilmedim secenegiyle degerlendirin.
              Leitner algoritması, zayif oldugunuz konulari daha sık tekrar ettirir.
            </p>
          </div>
        </motion.div>
      )}

      {/* ====== ACTIVE: Oturum ekrani ====== */}
      {sessionState === "active" && cards.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Ilerleme cubugu (ProgressBar - FR-F05 gereksinimi) */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Kart {currentIndex + 1} / {cards.length}</span>
              <span>{Math.round(((currentIndex) / cards.length) * 100)}% tamamlandi</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(currentIndex / cards.length) * 100}%` }} />
            </div>
          </div>

          {/* Kart bileseni */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <CardFlip
                card={cards[currentIndex]}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
              />
            </motion.div>
          </AnimatePresence>

          {/* Mini istatistik */}
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <span className="text-emerald-400">{correct} dogru</span>
            <span className="text-slate-600">•</span>
            <span className="text-red-400">{wrong} yanlis</span>
          </div>
        </motion.div>
      )}

      {/* ====== FINISHED: Oturum ozeti (SessionSummary) ====== */}
      {sessionState === "finished" && (
        <SessionSummary
          correct={correct}
          wrong={wrong}
          total={cards.length}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
