"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Download } from "lucide-react";
import Groq from "groq-sdk";
import PDFUploader from "@/components/PDFUploader";
import toast from "react-hot-toast";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!, dangerouslyAllowBrowser: true });

type SummaryType = "short" | "detailed" | "bullets" | "keywords";

const TYPES: { key: SummaryType; label: string; desc: string }[] = [
  { key: "short", label: "Kısa Özet", desc: "3-5 cümle" },
  { key: "detailed", label: "Detaylı Özet", desc: "Kapsamlı" },
  { key: "bullets", label: "Madde Madde", desc: "Liste formatı" },
  { key: "keywords", label: "Anahtar Kelimeler", desc: "Kavram haritası" },
];

export default function SummarizePage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "Özetleme | KEDA"; }, []);

  const router = useRouter();
  const [input, setInput] = useState("");
  const [type, setType] = useState<SummaryType>("short");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!input.trim()) { toast.error("Metin girin"); return; }
    setLoading(true);
    setResult("");
    try {
      const prompts: Record<SummaryType, string> = {
        short: `Aşağıdaki metni 3-5 cümleyle özetle. Türkçe, sade ve anlaşılır olsun:\n\n${input.slice(0, 6000)}`,
        detailed: `Aşağıdaki metni detaylı özetle. Tüm önemli noktaları kapsasın, paragraf yapısını koru. Türkçe:\n\n${input.slice(0, 6000)}`,
        bullets: `Aşağıdaki metnin ana noktalarını madde madde listele. Her madde tek cümle olsun. Türkçe:\n\n${input.slice(0, 6000)}`,
        keywords: `Aşağıdaki metinden en önemli 10-15 anahtar kelime/kavramı çıkar. Her birini kısaca açıkla. Türkçe:\n\n${input.slice(0, 6000)}`,
      };

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompts[type] }],
        max_tokens: 2048,
      });
      setResult(completion.choices[0]?.message?.content || "");
      toast.success("Özet hazır!");
    } catch { toast.error("Özet oluşturulamadı"); }
    finally { setLoading(false); }
  };

  const copyResult = () => { navigator.clipboard.writeText(result); toast.success("Kopyalandı!"); };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ozet.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-4 lg:p-8 max-w-4xl mx-auto w-full pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">Metin Özetleme</h1>
        <p className="text-slate-400 text-sm">PDF veya metin yapıştır, AI ile özetle</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Giriş */}
        <div className="space-y-4">
          <PDFUploader label="PDF yükle ve özetle" onTextExtracted={(text) => { setInput(text); toast.success("PDF yüklendi!"); }} />

          <div>
            <label className="block text-sm text-slate-400 mb-2">Ya da metin yapıştır</label>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              placeholder="Özetlemek istediğin metni buraya yapıştır..." rows={10}
              className="keda-input resize-none text-sm font-mono" />
            <p className="text-xs text-slate-600 mt-1 text-right">{input.length} karakter</p>
          </div>

          {/* Özet tipi */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Özet türü</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`p-3 rounded-xl text-left transition-all ${type === t.key ? "bg-[hsl(var(--foreground))]/20 border border-[hsl(var(--border))]/30 text-[hsl(var(--foreground)/0.8)]" : "glass text-slate-400 hover:text-white"}`}>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs opacity-60 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSummarize} disabled={loading || !input.trim()} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><div className="loading-dots"><span /><span /><span /></div><span>Özetleniyor...</span></>
              : <><Sparkles className="w-4 h-4" />Özetle</>}
          </button>
        </div>

        {/* Çıktı */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Özet</label>
            {result && (
              <div className="flex gap-2">
                <button onClick={copyResult} className="flex items-center gap-1 text-xs text-slate-500 hover:text-[hsl(var(--muted-foreground))] transition-colors">
                  <Copy className="w-3.5 h-3.5" />Kopyala
                </button>
                <button onClick={downloadResult} className="flex items-center gap-1 text-xs text-slate-500 hover:text-[hsl(var(--muted-foreground))] transition-colors">
                  <Download className="w-3.5 h-3.5" />İndir
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="keda-card p-4 lg:p-8 text-center min-h-64 flex flex-col items-center justify-center gap-3">
                <div className="loading-dots"><span /><span /><span /></div>
                <p className="text-slate-500 text-sm">AI özetliyor...</p>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-6 min-h-64 border border-[hsl(var(--border))]/15">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-[hsl(var(--foreground)/0.8)] text-xs font-medium">{TYPES.find(t => t.key === type)?.label}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
              </motion.div>
            ) : (
              <motion.div key="empty" className="keda-card p-4 lg:p-8 min-h-64 flex items-center justify-center">
                <p className="text-slate-600 text-sm">Özet burada görünecek</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
