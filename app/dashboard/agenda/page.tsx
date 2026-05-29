/**
 * KEDA - Ajanda & Calisma Plani Modulu (M-01)
 * 
 * Konu odakli (task-based) calisma takvimi olusturma.
 * Gemini AI ile kisi bazli plan uretilir.
 * 
 * Dokumandaki gereksinimler:
 * - FR-A01: PDF metin girisi / manuel giris
 * - FR-A02: Gemini API konu cikarimi
 * - FR-A03: Sinav notu girisi (0-100)
 * - FR-A04: Hedef sure ve musait olmayan gunler
 * - FR-A05: Konu bitirme odakli planlama
 * - IK-A04: Zorluk 4-5 konular haftanin basina
 * 
 * Sorumlu: Sezin Nisa Ataseven (M-01 Akilli Egitim & Ajanda)
 * Katki: Serdar Durgut
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateStudyPlan, analyzeTopics } from "@/lib/gemini";
import toast from "react-hot-toast";

const daysOfWeek = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

// Plan gorev tipi
interface PlanDay {
  gun: number;
  konular: string[];
  tahmini_sure_dk: number;
  zorluk_ortalama: number;
}

// Konu tipi
interface Topic {
  baslik: string;
  zorluk: number;
}

export default function AgendaPage() {
  // Form state'leri
  const [step, setStep] = useState(1); // 1: Metin gir, 2: Notlar gir, 3: Plan goster
  const [inputText, setInputText] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [targetDays, setTargetDays] = useState(14);
  const [unavailableDays, setUnavailableDays] = useState<number[]>([0]); // Varsayilan: Pazar
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [planSummary, setPlanSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);

  // Adim 1: Metni analiz et ve konulari cikar (FR-A01, FR-A02)
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error("Lutfen metin girin");
      return;
    }
    setAnalyzingTopics(true);
    try {
      const result = await analyzeTopics(inputText);
      setTopics(result.konular || []);
      // Notlari sifirla
      const initialGrades: { [key: string]: string } = {};
      result.konular?.forEach((t: Topic) => { initialGrades[t.baslik] = ""; });
      setGrades(initialGrades);
      setStep(2);
      toast.success(`${result.konular?.length || 0} konu bulundu!`);
    } catch {
      toast.error("Konu analizi basarisiz");
    } finally {
      setAnalyzingTopics(false);
    }
  };

  // Musait olmayan gun toggle
  const toggleDay = (day: number) => {
    setUnavailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Adim 2: Calisma plani olustur (FR-A04, FR-A05, IK-A04)
  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const gradesMap: { [key: string]: number } = {};
      topics.forEach(t => {
        const g = parseInt(grades[t.baslik] || "0");
        gradesMap[t.baslik] = isNaN(g) ? 0 : g;
      });

      const result = await generateStudyPlan({
        topics: topics.map(t => t.baslik),
        grades: gradesMap,
        targetDays,
        unavailableDays,
      });
      
      setPlan(result.plan || []);
      setPlanSummary(result.ozet || "");
      setStep(3);
      toast.success("Calisma plani hazir!");
    } catch {
      toast.error("Plan olusturma basarisiz");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (d: number) => {
    const labels = ["", "Cok Kolay", "Kolay", "Orta", "Zor", "Cok Zor"];
    return labels[Math.round(d)] || "Orta";
  };
  
  const getDifficultyColor = (d: number) => {
    if (d <= 1.5) return "text-emerald-400";
    if (d <= 2.5) return "text-green-400";
    if (d <= 3.5) return "text-yellow-400";
    if (d <= 4.5) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      {/* Baslik */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Akilli Ajanda & Calisma Plani</h1>
        <p className="text-slate-400 text-sm">M-01 · Sorumlu: Sezin Nisa Ataseven · Gemini AI ile konu bazli planlama</p>
      </motion.div>

      {/* Adim gostergesi */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-500"
            }`}>{s}</div>
            {s < 3 && <div className={`w-12 h-px ${step > s ? "bg-indigo-500" : "bg-slate-700"}`} />}
          </div>
        ))}
        <span className="text-sm text-slate-400 ml-2">
          {step === 1 ? "Metin Gir" : step === 2 ? "Notlari Gir & Ayarla" : "Plan Hazir"}
        </span>
      </div>

      {/* ADIM 1: Metin girisi */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Ders Icerigini Gir</h2>
              <label className="block text-sm text-slate-400 mb-2">Ders notu veya konu listesi (PDF kopyala-yapistir veya yaz)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ornek: Bu donemde Matematik dersinden Turevler, Integraller, Limit konularini; Fizik dersinden Newton Yasalari, Kinetik Enerji konularini calisacagim..."
                rows={8}
                className="keda-input resize-none"
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzingTopics || !inputText.trim()}
                className="btn-primary w-full mt-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzingTopics ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="loading-dots"><span /><span /><span /></div>
                    <span>Konular Analiz Ediliyor...</span>
                  </div>
                ) : "Konulari Analiz Et"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ADIM 2: Notlar ve ayarlar */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {/* Notlar - FR-A03 */}
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Konu Notlarinizi Girin (0-100)</h2>
              <p className="text-slate-500 text-xs mb-4">Dusuk notu olan konulara plan icinde daha fazla zaman ayrilacak.</p>
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div key={topic.baslik} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-white">{topic.baslik}</p>
                      <p className="text-xs text-slate-500">Zorluk: {topic.zorluk}/5</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grades[topic.baslik] || ""}
                      onChange={(e) => setGrades(prev => ({ ...prev, [topic.baslik]: e.target.value }))}
                      placeholder="Not"
                      className="keda-input w-24 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hedef gun sayisi - FR-A04 */}
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Calisma Suresi</h2>
              <div className="flex items-center gap-4 flex-wrap">
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTargetDays(days)}
                    className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${targetDays === days ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}
                  >
                    {days} Gun
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={targetDays}
                    onChange={(e) => setTargetDays(parseInt(e.target.value) || 14)}
                    className="keda-input w-20 text-center"
                  />
                  <span className="text-slate-400 text-sm">gun</span>
                </div>
              </div>
            </div>

            {/* Musait olmayan gunler - FR-A04, IK-A03 */}
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Musait Olmayan Gunler</h2>
              <p className="text-slate-500 text-xs mb-4">Secilen gunler plandan cikarilir. (IK-A03)</p>
              <div className="flex gap-2 flex-wrap">
                {daysOfWeek.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      unavailableDays.includes(i)
                        ? "bg-red-500/20 border border-red-500/40 text-red-300"
                        : "glass text-slate-400 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 glass py-3 rounded-2xl text-slate-400 hover:text-white transition-colors">Geri</button>
              <button onClick={handleGeneratePlan} disabled={loading} className="flex-2 btn-primary py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="loading-dots"><span /><span /><span /></div>
                    Plan Hazirlaniyor
                  </div>
                ) : "Calisma Plani Olustur"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ADIM 3: Plan gosterimi */}
        {step === 3 && plan.length > 0 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {planSummary && (
              <div className="keda-card p-5 border border-indigo-500/20 bg-indigo-600/5">
                <p className="text-slate-300 text-sm">{planSummary}</p>
              </div>
            )}
            
            <div className="space-y-3">
              {plan.map((day) => (
                <motion.div
                  key={day.gun}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: day.gun * 0.05 }}
                  className="keda-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-indigo-400 font-bold text-sm">Gun {day.gun}</span>
                      <span className="text-slate-600 text-xs ml-2">~{day.tahmini_sure_dk} dk</span>
                    </div>
                    <span className={`text-xs font-medium ${getDifficultyColor(day.zorluk_ortalama)}`}>
                      {getDifficultyLabel(day.zorluk_ortalama)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.konular.map((konu) => (
                      <span key={konu} className="px-3 py-1 bg-white/5 rounded-lg text-sm text-slate-300">{konu}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <button onClick={() => setStep(1)} className="w-full glass py-3 rounded-2xl text-slate-400 hover:text-white transition-colors mt-4">Yeni Plan Olustur</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
