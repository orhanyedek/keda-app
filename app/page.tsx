/**
 * KEDA - Ana Sayfa (Landing Page)
 * Sorumlu: Orhan Pala (M-04), Katkı: Serdar Durgut
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 glass">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">K</div>
          <span className="text-xl font-bold gradient-text">KEDA</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {["Ozellikler", "Moduller", "SSS"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-400 hover:text-white text-sm font-medium transition-colors">{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-xl hover:bg-white/5">Giris Yap</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Kayit Ol</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="relative max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-indigo-300 mb-8 border border-indigo-500/20">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Yapay Zeka Destekli Akademik Asistan
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          <span className="text-white">Smarter</span>{" "}<span className="gradient-text">Calis,</span>
          <br />
          <span className="text-white">Daha Fazla</span>{" "}<span className="gradient-text">Oren</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          KEDA, ders notlarini sesli podcast e ceviri, akilli flashcard lar olusturur
          ve sinav takvimini otomatik planlar. Tek platform, sonsuz verimlilik.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-4 rounded-2xl inline-block">Hemen Basla - Ucretsiz</Link>
          <a href="#ozellikler" className="inline-flex items-center justify-center gap-2 glass glass-hover px-8 py-4 rounded-2xl text-slate-300 font-semibold text-base transition-all hover:text-white">
            Nasil Calisir?
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </a>
        </motion.div>
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-6 mt-16 pt-16 border-t border-white/5 max-w-lg mx-auto">
          {[{ value: "4", label: "Akilli Modul" }, { value: "AI", label: "Gemini Destekli" }, { value: "100%", label: "Ucretsiz" }].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

const features = [
  { icon: "📅", title: "Akilli Calisma Plani", desc: "Sinav tarihine ve not ortalamaniza gore konu bazli, kisisellestirilmis calisma programi.", color: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/20", module: "M-01 · Sezin Nisa Ataseven" },
  { icon: "🎙", title: "PDF'ten Podcast", desc: "Ders notlarinizi iki sesli interaktif podcast e cevirin. Yolda, sporda, her yerde orenin.", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/20", module: "M-02 · Kerem Mert Duru" },
  { icon: "🃏", title: "Spaced Repetition", desc: "Leitner algoritmasi ile akilli tekrar sistemi. Zayif oldugunuz konulara otomatik daha fazla zaman ayirir.", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", module: "M-03 · Mustafa Cakmak" },
  { icon: "🎨", title: "Modern Dashboard", desc: "Tum modulleri tek ekrandan yonetin. Responsive tasarim, dark tema, purussuz animasyonlar.", color: "from-orange-500/20 to-amber-500/20", border: "border-orange-500/20", module: "M-04 · Orhan Pala & Serdar Durgut" },
];

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="ozellikler" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Neler Yapabilirsiniz</span>
            <h2 className="text-4xl font-bold text-white mt-3">Her <span className="gradient-text">Ogrenme Ihtiyaciniz</span> Icin</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">KEDA nin 4 modulu birbirleriyle entegre calisarak butunsel bir ogrenme deneyimi sunar.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className={`keda-card p-6 ${f.border} bg-gradient-to-br ${f.color}`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
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
    { num: "01", title: "PDF Yukle", desc: "Ders notlarinizi veya ders kitabi bolumlerini sisteme yukleyin." },
    { num: "02", title: "AI Analiz Eder", desc: "Gemini AI metni analiz eder, konulari cikarir ve icerigi anlar." },
    { num: "03", title: "Materyaller Hazir", desc: "Flashcard, podcast ve calisma plani otomatik olusturulur." },
    { num: "04", title: "Calis ve Takip Et", desc: "Dashboard dan ilerlemenizi takip edin, zamaninda tekrar yapin." },
  ];
  return (
    <section id="moduller" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Surec</span>
            <h2 className="text-4xl font-bold text-white mt-3">4 Adimda <span className="gradient-text">Basla</span></h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <motion.div key={step.num} variants={fadeUp} className="keda-card p-6 text-center">
                <div className="text-5xl font-black gradient-text mb-4 opacity-40">{step.num}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
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
    { no: 2, interval: "1 gun sonra", color: "bg-orange-500" },
    { no: 3, interval: "3 gun sonra", color: "bg-yellow-500" },
    { no: 4, interval: "7 gun sonra", color: "bg-green-500" },
    { no: 5, interval: "14 gun sonra", color: "bg-emerald-500" },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Bilim Destekli</span>
            <h2 className="text-4xl font-bold text-white mt-3">Leitner <span className="gradient-text">Spaced Repetition</span></h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">Yanlis bildigin kartlar Kutu 1 e donerwhile, dogru bildiklerin ilerler. Minimum caba, maksimum ogrenme.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="keda-card p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {boxes.map((box, i) => (
                <div key={box.no} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="text-center">
                    <div className={`${box.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>{box.no}</div>
                    <div className="text-xs text-slate-500 mt-2 whitespace-nowrap">{box.interval}</div>
                  </div>
                  {i < boxes.length - 1 && <div className="text-slate-600 text-xl rotate-90 sm:rotate-0">›</div>}
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mt-6">Dogru cevap: bir ust kutu | Yanlis cevap: Kutu 1 e geri</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "KEDA tamamen ucretsiz mi?", a: "Evet, KEDA bir akademik proje olarak gelistirilmistir ve ucretsiz kullanima sunulmustur." },
  { q: "Hangi formatlarda dosya yukleyebilirim?", a: "Su an icin PDF formati desteklenmektedir. Hem dijital hem de taranmis PDF ler OCR ile islenebilir." },
  { q: "Flashcard larim kaybolur mu?", a: "Hayir. Tum flashcard lariniz ve Spaced Repetition ilerlemeniz Supabase veritabaninda guvenle saklanir." },
  { q: "Podcast ozelligi nasil calisir?", a: "PDF metninden Gemini AI ile iki konusmacili diyalog uretilir. Ders notlariniz Ogretmen-Ogrenci formatinda sunulur." },
  { q: "Proje kimler tarafindan gelistirildi?", a: "KEDA; Sezin Nisa Ataseven (M-01), Kerem Mert Duru (M-02), Mustafa Cakmak (M-03), Orhan Pala (M-04) ve Serdar Durgut tarafindan Yazilim Muhendisligi dersi projesi olarak gelistirilmistir." },
  { q: "Sifremi unutursam ne olur?", a: "Sifre sifirlama linki e-posta adresinize Supabase Auth araciligiyla gonderilir." },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="sss" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-sm font-medium text-indigo-400 tracking-wider uppercase">Merak Edilenler</span>
            <h2 className="text-4xl font-bold text-white mt-3">Sikca Sorulan <span className="gradient-text">Sorular</span></h2>
          </motion.div>
          <motion.div variants={stagger} className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full keda-card glass-hover p-5 text-left flex items-center justify-between gap-4">
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <motion.div animate={{ rotate: openIndex === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-indigo-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 py-4 text-slate-400 text-sm leading-relaxed border-x border-b border-white/5 rounded-b-2xl bg-slate-900/50">{faq.a}</div>
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
      <div className="max-w-3xl mx-auto">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="keda-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-white mb-4">Hazir misin? <span className="gradient-text">Basla.</span></h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Ucretsiz kayit ol, PDF lerini yukle, yapay zeka ile ogrenmeyi hizlandir.</p>
            <Link href="/auth/register" className="btn-primary text-base px-10 py-4 rounded-2xl inline-block">Hesap Olustur</Link>
          </div>
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="text-slate-400 text-sm">KEDA 2026</span>
        </div>
        <p className="text-slate-600 text-xs text-center">Yazilim Muhendisligi Dersi Projesi - Sezin, Kerem, Mustafa, Orhan, Serdar</p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-slate-500 hover:text-white text-sm transition-colors">Giris Yap</Link>
          <Link href="/auth/register" className="text-slate-500 hover:text-white text-sm transition-colors">Kayit Ol</Link>
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
