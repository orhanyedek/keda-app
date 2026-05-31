"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Sparkles, RotateCcw, ChevronRight } from "lucide-react";
import Groq from "groq-sdk";
import PDFUploader from "@/components/PDFUploader";
import toast from "react-hot-toast";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });

interface Question { question: string; options: string[]; correct: number; explanation: string; }

export default function QuizPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "Quiz | KEDA"; }, []);

  const router = useRouter();
  const [input, setInput] = useState("");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [state, setState] = useState<"input" | "quiz" | "result">("input");
  const [loading, setLoading] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const generateQuiz = async () => {
    if (!input.trim()) { toast.error("Metin girin"); return; }
    setLoading(true);
    try {
      const prompt = `Aşağıdaki metinden ${count} adet çoktan seçmeli soru oluştur. Her soru 4 seçeneğe sahip olsun.

Metin:
${input.slice(0, 5000)}

SADECE şu JSON formatında yanıt ver:
{
  "questions": [
    {
      "question": "Soru metni?",
      "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
      "correct": 0,
      "explanation": "Doğru cevabın kısa açıklaması"
    }
  ]
}

correct = doğru seçeneğin index'i (0-3). Türkçe olsun.`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
      });
      const text = completion.choices[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);
      setQuestions(data.questions);
      setCurrent(0);
      setSelected(null);
      setAnswers([]);
      setState("quiz");
      toast.success(`${data.questions.length} soru hazır!`);
    } catch (err) {
      console.error(err);
      toast.error("Quiz oluşturulamadı");
    } finally { setLoading(false); }
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplain(false);
  };

  const handleNext = () => {
    if (selected === null) return;
    const correct = selected === questions[current].correct;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    if (current >= questions.length - 1) {
      setState("result");
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowExplain(false);
    }
  };

  const restart = () => { setState("input"); setQuestions([]); setInput(""); setAnswers([]); };
  const retry = () => { setState("quiz"); setCurrent(0); setSelected(null); setAnswers([]); setShowExplain(false); };

  const score = answers.filter(Boolean).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q = questions[current];

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Quiz Modu</h1>
        <p className="text-slate-400 text-sm">Metinden çoktan seçmeli sınav oluştur</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {state === "input" && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <PDFUploader label="PDF'ten quiz oluştur" onTextExtracted={text => { setInput(text); toast.success("PDF yüklendi!"); }} />
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ya da metin yapıştır</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Quiz oluşturmak istediğin metni yapıştır..." rows={7} className="keda-input resize-none text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Soru sayısı</label>
              <div className="flex gap-2">
                {[3, 5, 10, 15].map(n => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${count === n ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generateQuiz} disabled={loading || !input.trim()} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><div className="loading-dots"><span /><span /><span /></div>Oluşturuluyor...</> : <><Sparkles className="w-4 h-4" />Quiz Oluştur</>}
            </button>
          </motion.div>
        )}

        {state === "quiz" && q && (
          <motion.div key="quiz" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Soru {current + 1} / {questions.length}</span>
                <span>{answers.filter(Boolean).length} doğru</span>
              </div>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${((current) / questions.length) * 100}%` }} /></div>
            </div>

            <div className="keda-card p-6 mb-4">
              <p className="text-white font-medium text-base leading-relaxed mb-6">{q.question}</p>
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  let cls = "glass text-slate-300 hover:border-indigo-500/40 hover:text-white cursor-pointer";
                  if (selected !== null) {
                    if (i === q.correct) cls = "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 cursor-default";
                    else if (i === selected && selected !== q.correct) cls = "bg-red-500/15 border-red-500/40 text-red-300 cursor-default";
                    else cls = "glass text-slate-600 cursor-default opacity-60";
                  }
                  return (
                    <motion.button key={i} onClick={() => handleSelect(i)} whileHover={selected === null ? { scale: 1.01 } : {}}
                      className={`w-full p-4 rounded-xl border text-left text-sm flex items-center gap-3 transition-all ${cls}`}>
                      <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {selected !== null && i === q.correct && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />}
                      {selected !== null && i === selected && i !== q.correct && <XCircle className="w-4 h-4 text-red-400 ml-auto flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Açıklama */}
              {selected !== null && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden">
                  <button onClick={() => setShowExplain(!showExplain)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mb-2">
                    {showExplain ? "Açıklamayı gizle" : "Açıklamayı göster"}
                  </button>
                  {showExplain && <p className="text-slate-400 text-sm bg-white/5 rounded-xl p-3">{q.explanation}</p>}
                </motion.div>
              )}
            </div>

            <button onClick={handleNext} disabled={selected === null}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-30">
              {current >= questions.length - 1 ? "Sonuçları Gör" : "Sonraki Soru"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {state === "result" && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="keda-card p-10 mb-6">
              <div className={`text-6xl font-black mb-2 ${pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>{pct}%</div>
              <p className="text-white font-semibold text-lg mb-1">{pct >= 80 ? "Harika!" : pct >= 50 ? "İyi gidiyorsun" : "Daha fazla çalış"}</p>
              <p className="text-slate-400 text-sm mb-6">{score} doğru / {questions.length - score} yanlış</p>

              <div className="progress-bar mb-8"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>

              {/* Soru özeti */}
              <div className="space-y-2 text-left mb-6">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                    {answers[i] ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-slate-300 text-sm">{q.question}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={retry} className="flex items-center gap-2 glass px-6 py-2.5 rounded-xl text-slate-300 hover:text-white text-sm transition-colors">
                  <RotateCcw className="w-4 h-4" />Tekrar
                </button>
                <button onClick={restart} className="btn-primary px-6 py-2.5 text-sm">Yeni Quiz</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
