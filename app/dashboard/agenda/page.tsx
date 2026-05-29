/**
 * KEDA - Ajanda & Çalışma Planı Modülü (M-01)
 * Gemini AI ile konu bazlı planlama + Supabase kayıt
 * Sorumlu: Sezin Nisa Ataseven · Katkı: Serdar Durgut
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateStudyPlan, analyzeTopics } from "@/lib/gemini";
import { saveStudyPlan, getStudyPlans, markTopicDone } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const daysOfWeek = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

interface PlanDay {
  gun: number;
  konular: string[];
  tahmini_sure_dk: number;
  zorluk_ortalama: number;
}

interface Topic {
  baslik: string;
  zorluk: number;
}

interface SavedPlan {
  id: string;
  baslik: string;
  hedef_gun_sayisi: number;
  created_at: string;
  topics: { id: string; baslik: string; tamamlandi_mi: boolean; hedef_gun: number; zorluk_seviyesi: number }[];
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "saved">("new");
  const [step, setStep] = useState(1);
  const [inputText, setInputText] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [targetDays, setTargetDays] = useState(14);
  const [unavailableDays, setUnavailableDays] = useState<number[]>([0]);
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [planSummary, setPlanSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<{ baslik: string; zorluk_seviyesi: number; hedef_gun: number; tahmini_sure_dk: number }[]>([]);

  useEffect(() => {
    if (user && tab === "saved") loadPlans();
  }, [user, tab]);

  const loadPlans = async () => {
    if (!user) return;
    setLoadingPlans(true);
    const { data } = await getStudyPlans(user.id);
    if (data) setSavedPlans(data as SavedPlan[]);
    setLoadingPlans(false);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) { toast.error("Lütfen metin girin"); return; }
    setAnalyzingTopics(true);
    try {
      const result = await analyzeTopics(inputText);
      setTopics(result.konular || []);
      const initialGrades: { [key: string]: string } = {};
      result.konular?.forEach((t: Topic) => { initialGrades[t.baslik] = ""; });
      setGrades(initialGrades);
      setStep(2);
      toast.success(`${result.konular?.length || 0} konu bulundu!`);
    } catch {
      toast.error("Konu analizi başarısız");
    } finally {
      setAnalyzingTopics(false);
    }
  };

  const toggleDay = (day: number) => {
    setUnavailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const gradesMap: { [key: string]: number } = {};
      topics.forEach(t => {
        const g = parseInt(grades[t.baslik] || "0");
        gradesMap[t.baslik] = isNaN(g) ? 0 : g;
      });

      const result = await generateStudyPlan({ topics: topics.map(t => t.baslik), grades: gradesMap, targetDays, unavailableDays });
      setPlan(result.plan || []);
      setPlanSummary(result.ozet || "");

      // Gemini'den gelen konuları kaydetmek için format
      const topicsForDB = topics.map((t, i) => ({
        baslik: t.baslik,
        zorluk_seviyesi: t.zorluk,
        hedef_gun: Math.min(i + 1, targetDays),
        tahmini_sure_dk: 45,
      }));
      setGeneratedTopics(topicsForDB);
      setStep(3);
      toast.success("Çalışma planı hazır!");
    } catch {
      toast.error("Plan oluşturma başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await saveStudyPlan(user.id, {
        baslik: `${targetDays} Günlük Plan - ${new Date().toLocaleDateString("tr-TR")}`,
        hedef_gun_sayisi: targetDays,
        musait_olmayan_gunler: unavailableDays,
        topics: generatedTopics,
      });
      if (error) throw error;
      toast.success("Plan kaydedildi! ✓");
      if (data) loadPlans();
    } catch {
      toast.error("Plan kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTopic = async (topicId: string, current: boolean) => {
    const { error } = await markTopicDone(topicId, !current);
    if (!error) {
      setSavedPlans(prev => prev.map(p => ({
        ...p,
        topics: p.topics.map(t => t.id === topicId ? { ...t, tamamlandi_mi: !current } : t)
      })));
    }
  };

  const getDifficultyColor = (d: number) => {
    if (d <= 1.5) return "text-emerald-400";
    if (d <= 2.5) return "text-green-400";
    if (d <= 3.5) return "text-yellow-400";
    if (d <= 4.5) return "text-orange-400";
    return "text-red-400";
  };

  const getDifficultyLabel = (d: number) => {
    const labels = ["", "Çok Kolay", "Kolay", "Orta", "Zor", "Çok Zor"];
    return labels[Math.round(d)] || "Orta";
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Akıllı Ajanda & Çalışma Planı</h1>
        <p className="text-slate-400 text-sm">M-01 · Sorumlu: Sezin Nisa Ataseven · Gemini AI ile konu bazlı planlama</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[{ key: "new", label: "Yeni Plan" }, { key: "saved", label: "Planlarım" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as "new" | "saved")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "new" && (
        <>
          {/* Adım göstergesi */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-500"}`}>{s}</div>
                {s < 3 && <div className={`w-12 h-px ${step > s ? "bg-indigo-500" : "bg-slate-700"}`} />}
              </div>
            ))}
            <span className="text-sm text-slate-400 ml-2">{step === 1 ? "Metin Gir" : step === 2 ? "Notları Gir & Ayarla" : "Plan Hazır"}</span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="keda-card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Ders İçeriğini Gir</h2>
                  <label className="block text-sm text-slate-400 mb-2">Ders notu veya konu listesi</label>
                  <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                    placeholder="Örnek: Bu dönemde Matematik dersinden Türevler, İntegraller; Fizik'ten Newton Yasaları çalışacağım..."
                    rows={8} className="keda-input resize-none" />
                  <button onClick={handleAnalyze} disabled={analyzingTopics || !inputText.trim()} className="btn-primary w-full mt-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {analyzingTopics ? (<div className="flex items-center justify-center gap-2"><div className="loading-dots"><span /><span /><span /></div><span>Konular Analiz Ediliyor...</span></div>) : "Konuları Analiz Et"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="keda-card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Konu Notlarını Girin (0-100)</h2>
                  <p className="text-slate-500 text-xs mb-4">Düşük notu olan konulara plan içinde daha fazla zaman ayrılacak.</p>
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <div key={topic.baslik} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-white">{topic.baslik}</p>
                          <p className="text-xs text-slate-500">Zorluk: {topic.zorluk}/5</p>
                        </div>
                        <input type="number" min="0" max="100" value={grades[topic.baslik] || ""} onChange={(e) => setGrades(prev => ({ ...prev, [topic.baslik]: e.target.value }))}
                          placeholder="Not" className="keda-input w-24 text-center" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="keda-card p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Çalışma Süresi</h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    {[7, 14, 21, 30].map((days) => (
                      <button key={days} onClick={() => setTargetDays(days)}
                        className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${targetDays === days ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
                        {days} Gün
                      </button>
                    ))}
                  </div>
                </div>

                <div className="keda-card p-6">
                  <h2 className="text-lg font-semibold text-white mb-2">Müsait Olmayan Günler</h2>
                  <p className="text-slate-500 text-xs mb-4">Seçilen günler plandan çıkarılır.</p>
                  <div className="flex gap-2 flex-wrap">
                    {daysOfWeek.map((day, i) => (
                      <button key={day} onClick={() => toggleDay(i)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${unavailableDays.includes(i) ? "bg-red-500/20 border border-red-500/40 text-red-300" : "glass text-slate-400 hover:text-white"}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 glass py-3 rounded-2xl text-slate-400 hover:text-white transition-colors">Geri</button>
                  <button onClick={handleGeneratePlan} disabled={loading} className="flex-2 btn-primary py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (<div className="flex items-center gap-2"><div className="loading-dots"><span /><span /><span /></div>Plan Hazırlanıyor</div>) : "Çalışma Planı Oluştur"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && plan.length > 0 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {planSummary && (
                  <div className="keda-card p-5 border border-indigo-500/20 bg-indigo-600/5">
                    <p className="text-slate-300 text-sm">{planSummary}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {plan.map((day) => (
                    <motion.div key={day.gun} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: day.gun * 0.03 }} className="keda-card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-indigo-400 font-bold text-sm">Gün {day.gun}</span>
                          <span className="text-slate-600 text-xs ml-2">~{day.tahmini_sure_dk} dk</span>
                        </div>
                        <span className={`text-xs font-medium ${getDifficultyColor(day.zorluk_ortalama)}`}>{getDifficultyLabel(day.zorluk_ortalama)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {day.konular.map((konu) => (<span key={konu} className="px-3 py-1 bg-white/5 rounded-lg text-sm text-slate-300">{konu}</span>))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setStep(1); setInputText(""); }} className="flex-1 glass py-3 rounded-2xl text-slate-400 hover:text-white transition-colors">Yeni Plan</button>
                  <button onClick={handleSavePlan} disabled={saving} className="flex-1 btn-primary py-3 disabled:opacity-50">
                    {saving ? "Kaydediliyor..." : "Planı Kaydet ✓"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {tab === "saved" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {loadingPlans ? (
            <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
          ) : savedPlans.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-slate-400">Henüz kayıtlı plan yok. Yeni Plan sekmesinden oluştur!</p>
            </div>
          ) : savedPlans.map((plan) => {
            const done = plan.topics?.filter(t => t.tamamlandi_mi).length || 0;
            const total = plan.topics?.length || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={plan.id} className="keda-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{plan.baslik}</h3>
                    <p className="text-slate-500 text-xs mt-1">{new Date(plan.created_at).toLocaleDateString("tr-TR")} · {plan.hedef_gun_sayisi} gün</p>
                  </div>
                  <span className="text-indigo-400 font-bold text-sm">{pct}%</span>
                </div>
                <div className="progress-bar mb-4"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
                <div className="space-y-2">
                  {plan.topics?.map((topic) => (
                    <div key={topic.id} className="flex items-center gap-3 cursor-pointer" onClick={() => handleToggleTopic(topic.id, topic.tamamlandi_mi)}>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${topic.tamamlandi_mi ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                        {topic.tamamlandi_mi && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm transition-all ${topic.tamamlandi_mi ? "text-slate-600 line-through" : "text-slate-300"}`}>{topic.baslik}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
