"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CalendarDays, Mic, Layers, X, ArrowRight, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    title: "KEDA'ya Hoş Geldin!",
    desc: "Yapay zeka destekli çalışma asistanın hazır. 3 adımda nasıl kullanacağını gösterelim.",
    color: "text-[hsl(var(--foreground))]",
    bg: "bg-[hsl(var(--foreground)/0.05)] border-[hsl(var(--border))]",
  },
  {
    icon: Layers,
    title: "Flashcard Oluştur",
    desc: "Ders notunu yapıştır veya PDF yükle. Groq AI otomatik soru-cevap kartları üretsin. Leitner algoritması zayıf konularını daha sık tekrar ettirir.",
    color: "text-emerald-400",
    bg: "bg-emerald-600/15 border-emerald-500/20",
    link: "/dashboard/flashcards",
    linkText: "Flashcard'a Git",
  },
  {
    icon: CalendarDays,
    title: "Çalışma Planı Yap",
    desc: "Sınav tarihini ve not ortalamanı gir. AI sana özel günlük çalışma programı hazırlasın.",
    color: "text-blue-400",
    bg: "bg-blue-600/15 border-blue-500/20",
    link: "/dashboard/agenda",
    linkText: "Ajandaya Git",
  },
  {
    icon: Mic,
    title: "Podcast Oluştur",
    desc: "Ders notlarını iki sesli podcast diyaloğuna çevir. Yolda, sporda, her yerde öğren.",
    color: "text-purple-400",
    bg: "bg-purple-600/15 border-purple-500/20",
    link: "/dashboard/podcast",
    linkText: "Podcast'e Git",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("keda_onboarding_done");
    if (!done) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem("keda_onboarding_done", "1");
    setShow(false);
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
            className="keda-card w-full max-w-md p-8 relative">

            {/* Kapat */}
            <button onClick={finish} className="absolute top-4 right-4 text-[hsl(var(--muted-foreground)/0.6)] hover:text-[hsl(var(--foreground))] transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* İkon */}
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 ${current.bg}`}>
              <Icon className={`w-7 h-7 ${current.color}`} />
            </div>

            {/* İçerik */}
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-3">{current.title}</h2>
              <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-6">{current.desc}</p>
            </motion.div>

            {/* Adım noktaları */}
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-indigo-400" : "w-1.5 bg-[hsl(var(--secondary))]"}`} />
              ))}
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  Devam <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link href={current.link || "/dashboard"} onClick={finish}
                  className="btn-primary flex-1 py-2.5 text-sm text-center">
                  {current.linkText || "Başla"}
                </Link>
              )}
              <button onClick={finish} className="glass px-4 py-2.5 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm transition-colors">
                Atla
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
