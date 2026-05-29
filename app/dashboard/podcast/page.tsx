/**
 * KEDA - Podcast & Ses Uretimi Modulu (M-02)
 * 
 * PDF metninden iki konusmacili (Ogretmen-Ogrenci) podcast diyalogu uretir.
 * Gemini AI diyalog formatina ceviri yapar.
 * TTS entegrasyonu gelistirme asamasindadir (dokuman Sprint 4).
 * 
 * Dokumandaki gereksinimler:
 * - FR-P01: Gemini ile iki konusmacili diyalog
 * - FR-P03: Ses secenekleri
 * - FR-P04: Podcast gecmisi
 * - IK-P02: Onbellek - daha once islenmis metin tekrar islenmez
 * 
 * Sorumlu: Kerem Mert Duru (M-02 Podcast & Ses Uretimi)
 * Katki: Serdar Durgut
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePodcastDialogue } from "@/lib/gemini";
import toast from "react-hot-toast";

// Diyalog satirı tipi
interface DialogueLine {
  konusmaci: "Ogretmen" | "Ogrenci";
  metin: string;
}

interface PodcastResult {
  baslik: string;
  diyalog: DialogueLine[];
}

// Onceki podcast tipi (gecmis listesi icin)
interface PodcastHistory {
  id: string;
  baslik: string;
  sure: string;
  tarih: string;
}

// Ornek gecmis podcasts (gercek veriler Supabase'den gelecek)
const exampleHistory: PodcastHistory[] = [
  { id: "1", baslik: "Matematik - Limit ve Sureklilik", sure: "12 dk", tarih: "3 gun once" },
  { id: "2", baslik: "Fizik - Newton'un Hareket Yasalari", sure: "9 dk", tarih: "5 gun once" },
  { id: "3", baslik: "Kimya - Periyodik Tablo", sure: "14 dk", tarih: "1 hafta once" },
];

export default function PodcastPage() {
  const [inputText, setInputText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [podcast, setPodcast] = useState<PodcastResult | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  // Oynatilmakta olan satir (simule edilmis oynatici)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Gemini ile podcast diyalogu uret (FR-P01)
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error("Lutfen metin girin");
      return;
    }
    setGenerating(true);
    try {
      const result = await generatePodcastDialogue(inputText);
      setPodcast(result);
      toast.success("Podcast diyalogu olusturuldu!");
    } catch {
      toast.error("Podcast uretimi basarisiz. API anahtarini kontrol edin.");
    } finally {
      setGenerating(false);
    }
  };

  // Diyalog satirini oynat (simule edilmis TTS - gercek ses Sprint 4)
  const handlePlayLine = (index: number) => {
    setPlayingIndex(playingIndex === index ? null : index);
    // Gercek TTS entegrasyonu burada yapilacak (Sprint 4 - gTTS / Google TTS)
    if ("speechSynthesis" in window && playingIndex !== index) {
      const line = podcast?.diyalog[index];
      if (line) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(line.metin);
        utterance.lang = "tr-TR";
        utterance.onend = () => setPlayingIndex(null);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      window.speechSynthesis?.cancel();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Baslik */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">PDF'ten Podcast</h1>
        <p className="text-slate-400 text-sm">M-02 · Sorumlu: Kerem Mert Duru · Gemini AI ile iki sesli diyalog uretimi</p>
      </motion.div>

      {/* Tab secimi */}
      <div className="flex gap-2 mb-6 glass p-1 rounded-2xl w-fit">
        {[
          { key: "create", label: "Yeni Podcast" },
          { key: "history", label: "Gecmis" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "create" | "history")}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* OLUSTUR SEKMESI */}
        {activeTab === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Metin girisi */}
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Ders Metnini Gir</h2>
              <p className="text-slate-500 text-xs mb-3">Gemini AI bu metni Ogretmen-Ogrenci diyaloguna cevire.</p>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="PDF'ten kopyaladiginiz ders notunu buraya yapistirin... Gemini AI iki sesli, interaktif bir podcast diyalogu olusturacak."
                rows={7}
                className="keda-input resize-none"
              />
              
              <button
                onClick={handleGenerate}
                disabled={generating || !inputText.trim()}
                className="btn-primary w-full mt-4 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="loading-dots"><span /><span /><span /></div>
                    <span>Diyalog Hazirlaniyor...</span>
                  </div>
                ) : "Podcast Olustur"}
              </button>
            </div>

            {/* Diyalog sonucu */}
            {podcast && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="keda-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{podcast.baslik}</h3>
                  <span className="text-xs text-slate-600 font-mono">{podcast.diyalog.length} satir</span>
                </div>
                
                {/* Not: Gercek ses ozelligi Sprint 4 te TTS entegrasyonu ile eklenecek */}
                <div className="glass p-3 rounded-xl border border-amber-500/20 mb-4 text-xs text-amber-400">
                  TTS ses dosyasi uretimi Sprint 4 kapsamindadir. Su an tarayici seslendirme kullaniliyor.
                </div>

                {/* Diyalog listesi */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {podcast.diyalog.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex gap-3 ${line.konusmaci === "Ogrenci" ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                        line.konusmaci === "Ogretmen" ? "bg-indigo-600/30 text-indigo-300" : "bg-purple-600/30 text-purple-300"
                      }`}>
                        {line.konusmaci === "Ogretmen" ? "O" : "S"}
                      </div>
                      
                      {/* Metin baloncugu */}
                      <div className={`flex-1 max-w-xs ${line.konusmaci === "Ogrenci" ? "text-right" : ""}`}>
                        <span className={`text-xs font-medium ${line.konusmaci === "Ogretmen" ? "text-indigo-400" : "text-purple-400"}`}>
                          {line.konusmaci}
                        </span>
                        <div className={`mt-1 p-3 rounded-2xl text-sm text-slate-300 inline-block text-left ${
                          line.konusmaci === "Ogretmen" ? "bg-indigo-600/10 border border-indigo-500/20" : "bg-purple-600/10 border border-purple-500/20"
                        }`}>
                          {line.metin}
                        </div>
                        
                        {/* Seslendirme butonu */}
                        <button
                          onClick={() => handlePlayLine(i)}
                          className={`mt-1 text-xs transition-colors ${playingIndex === i ? "text-indigo-400" : "text-slate-600 hover:text-slate-400"}`}
                        >
                          {playingIndex === i ? "Duraksati" : "Seslendir"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* GECMiS SEKMESi */}
        {activeTab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {exampleHistory.map((item) => (
              <div key={item.id} className="keda-card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{item.baslik}</p>
                  <p className="text-slate-500 text-xs">{item.tarih} · {item.sure}</p>
                </div>
                <button className="text-slate-600 hover:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
            ))}
            <p className="text-center text-slate-600 text-xs mt-4">Gercek podcast gecmisi Supabase entegrasyonu tamamlandiginda gosterilecek.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
