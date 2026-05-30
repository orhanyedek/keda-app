"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { CalendarDays, Mic, Layers, LayoutDashboard, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

function useSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, inView };
}

/* ─── NAV ─── */
function Nav() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[hsl(var(--border))]" style={{ background: "hsl(var(--background)/0.85)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs>
              <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg)"/>
              <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg)" opacity="0.95"/>
              <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg)" opacity="0.82"/>
            </svg>
          <span className="font-semibold text-[hsl(var(--foreground))] text-sm">KEDA</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {[["Özellikler","#ozellikler"],["Modüller","#moduller"],["SSS","#sss"]].map(([l,h])=>(
            <a key={l} href={h} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm px-4 py-2">Giriş Yap</Link>
              <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">Başla</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        opacity: 0.4,
      }} />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ background: "hsl(var(--primary)/0.08)" }} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-3xl mx-auto">
        <motion.div variants={fade} className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Yapay Zeka Destekli Akademik Asistan
        </motion.div>

        <motion.h1 variants={fade} className="text-4xl md:text-6xl font-bold leading-tight mb-5" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
          Ders notların,<br />
          <span className="gradient-text">senin için çalışsın.</span>
        </motion.h1>

        <motion.p variants={fade} className="text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          PDF yükle, Groq AI konuları analiz etsin. Flashcard, podcast ve kişisel çalışma planı otomatik oluşturulsun.
        </motion.p>

        <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register" className="btn-primary px-6 py-2.5">
            Ücretsiz Başla <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#ozellikler" className="btn-secondary px-6 py-2.5">Nasıl çalışır?</a>
        </motion.div>

        <motion.div variants={fade} className="mt-16 pt-8 border-t border-[hsl(var(--border))] grid grid-cols-3 gap-8 max-w-xs mx-auto">
          {[["4","Modül"],["Groq","AI Motoru"],["Ücretsiz","Erişim"]].map(([v,l])=>(
            <div key={l} className="text-center">
              <div className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>{v}</div>
              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── FEATURES ─── */
const features = [
  { icon: CalendarDays, title: "Çalışma Planı", desc: "Sınav tarihine ve not ortalamanıza göre konu bazlı, kişiselleştirilmiş çalışma programı.", module: "M-01 · Sezin Nisa Ataseven" },
  { icon: Mic, title: "PDF'ten Podcast", desc: "Ders notlarınızı iki sesli diyaloğa çevirin. Öğretmen-öğrenci formatında dinleyin.", module: "M-02 · Kerem Mert Duru" },
  { icon: Layers, title: "Spaced Repetition", desc: "Leitner algoritması ile akıllı tekrar sistemi. Zayıf konulara otomatik daha fazla zaman ayırır.", module: "M-03 · Mustafa Çakmak" },
  { icon: LayoutDashboard, title: "Merkezi Dashboard", desc: "Tüm modülleri tek ekrandan yönetin. İlerlemenizi takip edin, zamanında tekrar yapın.", module: "M-04 · Orhan Pala & Serdar Durgut" },
];

function Features() {
  const { ref, inView } = useSection();
  return (
    <section id="ozellikler" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView?"show":"hidden"}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">Özellikler</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Her öğrenme ihtiyacınız için</h2>
            <p className="text-sm mt-2 max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>4 modül birbirleriyle entegre çalışarak bütünsel bir öğrenme deneyimi sunar.</p>
          </motion.div>
          <motion.div variants={stagger} className="grid md:grid-cols-2 gap-3">
            {features.map(f => (
              <motion.div key={f.title} variants={fade} className="keda-card p-5 group">
                <div className="w-9 h-9 rounded-lg mb-4 flex items-center justify-center" style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                  <f.icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
                <span className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{f.module}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const { ref, inView } = useSection();
  const steps = [
    { n:"01", title:"PDF Yükle", desc:"Ders notlarınızı sisteme yükleyin." },
    { n:"02", title:"AI Analiz Eder", desc:"Groq AI metni analiz eder ve konuları çıkarır." },
    { n:"03", title:"Materyaller Hazır", desc:"Flashcard, podcast ve plan otomatik oluşur." },
    { n:"04", title:"Takip Et", desc:"Dashboard'dan ilerlemenizi takip edin." },
  ];
  return (
    <section id="moduller" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView?"show":"hidden"}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">Nasıl Çalışır</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>4 adımda başla</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-3">
            {steps.map((s,i) => (
              <motion.div key={s.n} variants={fade} className="keda-card p-5">
                <div className="text-2xl font-black mb-4 font-mono" style={{ color: "hsl(var(--border))" }}>{s.n}</div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── LEITNER ─── */
function LeitnerSection() {
  const { ref, inView } = useSection();
  const boxes = [
    { n:1, label:"Her oturum", color:"#ef4444" },
    { n:2, label:"1 gün",      color:"#f97316" },
    { n:3, label:"3 gün",      color:"#eab308" },
    { n:4, label:"7 gün",      color:"#22c55e" },
    { n:5, label:"14 gün",     color:"#10b981" },
  ];
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView?"show":"hidden"}>
          <motion.div variants={fade} className="mb-10">
            <span className="section-label">Bilim Destekli</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Leitner Spaced Repetition</h2>
            <p className="text-sm mt-2 max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>Yanlış bildiğin kartlar Kutu 1'e döner, doğru bildiklerin ilerler. Minimum çaba, maksimum öğrenme.</p>
          </motion.div>
          <motion.div variants={fade} className="keda-card p-8">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {boxes.map((b,i) => (
                <div key={b.n} className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto" style={{ background: b.color }}>{b.n}</div>
                    <div className="text-xs mt-1.5 whitespace-nowrap" style={{ color: "hsl(var(--muted-foreground))" }}>{b.label}</div>
                  </div>
                  {i < boxes.length - 1 && <div className="text-lg rotate-90 sm:rotate-0" style={{ color: "hsl(var(--border))" }}>›</div>}
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-6" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>Doğru cevap: bir üst kutu · Yanlış cevap: Kutu 1'e geri</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  { q:"KEDA tamamen ücretsiz mi?", a:"Evet, KEDA bir akademik proje olarak geliştirilmiştir ve ücretsiz kullanıma sunulmuştur." },
  { q:"Hangi formatlarda dosya yükleyebilirim?", a:"Şu an için PDF formatı desteklenmektedir. Dijital PDF'lerden metin otomatik çıkarılır." },
  { q:"Flashcard'larım kaybolur mu?", a:"Hayır. Tüm flashcard'larınız ve Spaced Repetition ilerlemeniz Supabase veritabanında saklanır." },
  { q:"Podcast özelliği nasıl çalışır?", a:"PDF metninden Groq AI ile iki konuşmacılı diyalog üretilir. Öğretmen-öğrenci formatında seslendirilir." },
  { q:"Proje kimler tarafından geliştirildi?", a:"KEDA; Sezin Nisa Ataseven, Kerem Mert Duru, Mustafa Çakmak, Orhan Pala ve Serdar Durgut tarafından geliştirilmiştir." },
];

function FAQ() {
  const [open, setOpen] = useState<number|null>(null);
  const { ref, inView } = useSection();
  return (
    <section id="sss" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView?"show":"hidden"}>
          <motion.div variants={fade} className="mb-10">
            <span className="section-label">SSS</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Sıkça sorulan sorular</h2>
          </motion.div>
          <motion.div variants={stagger} className="space-y-1.5">
            {faqs.map((f,i) => (
              <motion.div key={i} variants={fade}>
                <button onClick={()=>setOpen(open===i?null:i)}
                  className="w-full keda-card px-5 py-4 text-left flex items-center justify-between gap-4 text-sm"
                  style={{ color: "hsl(var(--foreground))" }}>
                  <span>{f.q}</span>
                  <motion.div animate={{ rotate: open===i ? 45 : 0 }} transition={{ duration: 0.2 }} style={{ color: "hsl(var(--muted-foreground))", flexShrink: 0 }}>
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open===i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden">
                      <div className="px-5 py-4 text-sm leading-relaxed rounded-b-xl border-x border-b border-[hsl(var(--border))]" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted))" }}>
                        {f.a}
                      </div>
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

/* ─── CTA ─── */
function CTA() {
  const { ref, inView } = useSection();
  return (
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}}  transition={{ duration:0.5 }}
          className="keda-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary)/0.06), transparent 70%)" }} />
          <h2 className="text-2xl font-bold mb-2 relative" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Hemen başla</h2>
          <p className="text-sm mb-6 relative" style={{ color: "hsl(var(--muted-foreground))" }}>Ücretsiz kayıt ol, PDF'lerini yükle, çalışmayı hızlandır.</p>
          <Link href="/auth/register" className="btn-primary px-8 py-2.5 relative">Hesap Oluştur</Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs>
              <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg)"/>
              <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg)" opacity="0.95"/>
              <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg)" opacity="0.82"/>
            </svg>
          <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>KEDA 2026</span>
        </div>
        <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground)/0.5)" }}>
          Yazılım Mühendisliği Dersi Projesi — Sezin, Kerem, Mustafa, Orhan, Serdar
        </p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-xs hover:text-[hsl(var(--foreground))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>Giriş Yap</Link>
          <Link href="/auth/register" className="text-xs hover:text-[hsl(var(--foreground))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>Kayıt Ol</Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main style={{ background: "hsl(var(--background))" }}>
      <Nav />
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
