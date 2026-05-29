/**
 * KEDA - Ana Sayfa (Landing Page)
 * Sorumlu: Orhan Pala (M-04), Katkı: Serdar Durgut
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { CalendarDays, Mic, Layers, LayoutDashboard, ChevronDown, Plus } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 glass">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="text-base font-semibold text-white">KEDA</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[["Özellikler", "#ozellikler"], ["Nasıl Çalışır", "#moduller"], ["SSS", "#sss"]].map(([label, href]) => (
            <a key={label} href={href} className="text-slate-400 hover:text-white text-sm transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-slate-300 hover:text-white text-sm transition-colors px-4 py-2 rounded-xl hover:bg-white/5">Giriş Yap</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Kayıt Ol</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
      </div>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="relative max-w-3xl mx-auto">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-indigo-300 mb-8 border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Yapay Zeka Destekli Çalışma Aracı
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-white">
          Ders notların,<br />
          <span className="gradient-text">senin için çalışsın.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
          PDF yükle, Gemini AI konuları analiz etsin. Flashcard, podcast ve kişisel çalışma planı otomatik oluşturulsun.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register" className="btn-primary text-sm px-8 py-3 rounded-xl inline-block">Ücretsiz Başla</Link>
          <a href="#ozellikler" className="inline-flex items-center justify-center gap-2 glass px-8 py-3 rounded-xl text-slate-300 text-sm font-medium transition-all hover:text-white hover:bg-white/5">
            Nasıl çalışır?
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/5 max-w-sm mx-auto">
          {[["4", "Modül"], ["Gemini", "AI Motoru"], ["Ücretsiz", "Erişim"]].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-xl font-semibold text-white">{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

const features = [
  {
    icon: CalendarDays,
    title: "Çalışma Planı",
    desc: "Sınav tarihine ve not ortalamanıza göre konu bazlı, kişiselleştirilmiş çalışma programı.",
    module: "M-01 · Sezin Nisa Ataseven",
  },
  {
    icon: Mic,
    title: "PDF'ten Podcast",
    desc: "Ders notlarınızı iki sesli diyaloğa çevirin. Öğretmen-öğrenci formatında dinleyin.",
    module: "M-02 · Kerem Mert Duru",
  },
  {
    icon: Layers,
    title: "Spaced Repetition",
    desc: "Leitner algoritması ile akıllı tekrar sistemi. Zayıf konulara otomatik daha fazla zaman ayırır.",
    module: "M-03 · Mustafa Çakmak",
  },
  {
    icon: LayoutDashboard,
    title: "Merkezi Dashboard",
    desc: "Tüm modülleri tek ekrandan yönetin. İlerlemenizi takip edin, zamanında tekrar yapın.",
    module: "M-04 · Orhan Pala & Serdar Durgut",
  },
];

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="ozellikler" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="mb-14">
            <span className="text-xs font-medium text-indigo-400 tracking-widest uppercase">Özellikler</span>
            <h2 className="text-3xl font-bold text-white mt-3">Her öğrenme ihtiyacınız için</h2>
            <p className="text-slate-400 mt-3 max-w-lg text-sm">4 modül birbirleriyle entegre çalışarak bütünsel bir öğrenme deneyimi sunar.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-4">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="keda-card p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                <span className="text-xs text-slate-600 font-mono">{f.module}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const steps = [
    { num: "01", title: "PDF Yükle", desc: "Ders notlarınızı veya ders kitabı bölümlerini sisteme yükleyin." },
    { num: "02", title: "AI Analiz Eder", desc: "Gemini AI metni analiz eder, konuları çıkarır ve içeriği anlar." },
    { num: "03", title: "Materyaller Hazır", desc: "Flashcard, podcast ve çalışma planı otomatik oluşturulur." },
    { num: "04", title: "Takip Et", desc: "Dashboard'dan ilerlemenizi takip edin, zamanında tekrar yapın." },
  ];
  return (
    <section id="moduller" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="mb-14">
            <span className="text-xs font-medium text-indigo-400 tracking-widest uppercase">Nasıl Çalışır</span>
            <h2 className="text-3xl font-bold text-white mt-3">4 adımda başla</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeUp} className="keda-card p-6">
                <div className="text-3xl font-bold text-slate-700 mb-4 font-mono">{step.num}</div>
                <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LeitnerSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const boxes = [
    { no: 1, interval: "Her oturum", color: "bg-red-500" },
    { no: 2, interval: "1 gün", color: "bg-orange-500" },
    { no: 3, interval: "3 gün", color: "bg-yellow-500" },
    { no: 4, interval: "7 gün", color: "bg-green-500" },
    { no: 5, interval: "14 gün", color: "bg-emerald-500" },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-12">
            <span className="text-xs font-medium text-indigo-400 tracking-widest uppercase">Bilim Destekli</span>
            <h2 className="text-3xl font-bold text-white mt-3">Leitner Spaced Repetition</h2>
            <p className="text-slate-400 mt-3 text-sm max-w-lg">Yanlış bildiğin kartlar Kutu 1'e döner, doğru bildiklerin ilerler. Minimum çaba, maksimum öğrenme.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="keda-card p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {boxes.map((box, i) => (
                <div key={box.no} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="text-center">
                    <div className={`${box.color} w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg`}>{box.no}</div>
                    <div className="text-xs text-slate-500 mt-2 whitespace-nowrap">{box.interval}</div>
                  </div>
                  {i < boxes.length - 1 && <div className="text-slate-700 text-lg rotate-90 sm:rotate-0">›</div>}
                </div>
              ))}
            </div>
            <p className="text-center text-slate-600 text-xs mt-6">Doğru cevap: bir üst kutu · Yanlış cevap: Kutu 1'e geri</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "KEDA tamamen ücretsiz mi?", a: "Evet, KEDA bir akademik proje olarak geliştirilmiştir ve ücretsiz kullanıma sunulmuştur." },
  { q: "Hangi formatlarda dosya yükleyebilirim?", a: "Şu an için PDF formatı desteklenmektedir. Dijital PDF'lerden metin otomatik çıkarılır." },
  { q: "Flashcard'larım kaybolur mu?", a: "Hayır. Tüm flashcard'larınız ve Spaced Repetition ilerlemeniz Supabase veritabanında saklanır." },
  { q: "Podcast özelliği nasıl çalışır?", a: "PDF metninden Gemini AI ile iki konuşmacılı diyalog üretilir. Öğretmen-öğrenci formatında seslendirilir." },
  { q: "Proje kimler tarafından geliştirildi?", a: "KEDA; Sezin Nisa Ataseven (M-01), Kerem Mert Duru (M-02), Mustafa Çakmak (M-03), Orhan Pala (M-04) ve Serdar Durgut tarafından geliştirilmiştir." },
  { q: "Şifremi unutursam ne olur?", a: "Şifre sıfırlama linki e-posta adresinize Supabase Auth aracılığıyla gönderilir." },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="sss" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-12">
            <span className="text-xs font-medium text-indigo-400 tracking-widest uppercase">SSS</span>
            <h2 className="text-3xl font-bold text-white mt-3">Sıkça sorulan sorular</h2>
          </motion.div>
          <motion.div variants={stagger} className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full keda-card p-4 text-left flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors"
                >
                  <span className="text-slate-200 text-sm">{faq.q}</span>
                  <motion.div animate={{ rotate: openIndex === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-slate-500 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="px-4 py-3 text-slate-400 text-sm leading-relaxed border-x border-b border-white/5 rounded-b-2xl bg-slate-900/40">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="keda-card p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Hemen başla</h2>
          <p className="text-slate-400 mb-8 text-sm max-w-sm mx-auto">Ücretsiz kayıt ol, PDF'lerini yükle, çalışmayı hızlandır.</p>
          <Link href="/auth/register" className="btn-primary text-sm px-8 py-3 rounded-xl inline-block">Hesap Oluştur</Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">K</div>
          <span className="text-slate-500 text-sm">KEDA 2026</span>
        </div>
        <p className="text-slate-700 text-xs text-center">Yazılım Mühendisliği Dersi Projesi — Sezin, Kerem, Mustafa, Orhan, Serdar</p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-slate-600 hover:text-white text-xs transition-colors">Giriş Yap</Link>
          <Link href="/auth/register" className="text-slate-600 hover:text-white text-xs transition-colors">Kayıt Ol</Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LeitnerSection />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
