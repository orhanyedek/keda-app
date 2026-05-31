"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { CalendarDays, Mic, Layers, LayoutDashboard, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25,0.1,0.25,1] } } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

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
          <svg width="26" height="26" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgnav" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgnav)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgnav)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgnav)" opacity="0.82"/></svg>
          <span className="font-semibold text-[hsl(var(--foreground))] text-sm">KEDA</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {[["Özellikler","#ozellikler"],["Nasıl Çalışır","#moduller"],["SSS","#sss"]].map(([l,h])=>(
            <a key={l} href={h} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm px-4 py-2 flex items-center gap-2">Dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
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
    <section className="min-h-screen flex items-center px-6 pt-20 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 30% 50%, black 30%, transparent 100%)",
        opacity: 0.3,
      }} />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(var(--primary)/0.07)" }} />
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.h1 variants={fade} className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
            Akıllı çalışmanın<br /><span className="gradient-text">tek adresi.</span>
          </motion.h1>
          <motion.p variants={fade} className="text-base md:text-lg mb-8 leading-relaxed max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>
            PDF yükle — AI konuları analiz etsin, flashcard üretsin, podcast oluştursun, kişisel çalışma planı hazırlasın.
          </motion.p>
          <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/auth/register" className="btn-primary px-6 py-2.5 flex items-center gap-2">Ücretsiz Başla <ArrowRight className="w-4 h-4" /></Link>
            <a href="#ozellikler" className="btn-secondary px-6 py-2.5">Özelliklere Bak</a>
          </motion.div>
          <motion.div variants={fade} className="flex items-center gap-6 pt-6 border-t border-[hsl(var(--border))]">
            {[["PDF → Flashcard","Saniyeler içinde"],["PDF → Podcast","2 sesli diyalog"],["Leitner SR","Akıllı tekrar"]].map(([title,sub])=>(
              <div key={title}>
                <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{title}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity:0, x:40, scale:0.97 }} animate={{ opacity:1, x:0, scale:1 }} transition={{ duration:0.7, delay:0.2, ease:[0.25,0.1,0.25,1] }} className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-2xl blur-3xl opacity-20 pointer-events-none" style={{ background:"hsl(var(--primary))", transform:"scale(0.85) translateY(20px)" }} />
          <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--border))]" style={{ boxShadow:"0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--border))" }}>
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[hsl(var(--border))]" style={{ background:"hsl(var(--card))" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <div className="flex-1 mx-3 h-5 rounded-md text-xs flex items-center justify-center" style={{ background:"hsl(var(--muted))", color:"hsl(var(--muted-foreground))" }}>keda-app-five.vercel.app</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-mockup.png" alt="KEDA Dashboard" className="w-full block" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }} className="lg:hidden">
          <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-mockup.png" alt="KEDA Dashboard" className="w-full block" />
          </div>
        </motion.div>
      </div>
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
    <section id="ozellikler" className="py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView?"show":"hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-14">
            <span className="section-label">Özellikler</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>Her öğrenme ihtiyacınız için</h2>
            <p className="text-sm mt-2 max-w-md" style={{ color:"hsl(var(--muted-foreground))" }}>4 modül birbirleriyle entegre çalışarak bütünsel bir öğrenme deneyimi sunar.</p>
          </motion.div>

          {/* Masonry-style stagger grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={{
                  hidden: { opacity: 0, y: 40, scale: 0.96 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, delay: i * 0.1, ease: [0.25,0.1,0.25,1] } }
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="keda-card p-6 group cursor-default"
              >
                {/* Hover accent line */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(90deg, hsl(var(--primary)), transparent)" }}
                />
                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center relative"
                  style={{ background:"hsl(var(--primary)/0.1)", border:"1px solid hsl(var(--primary)/0.2)" }}>
                  <f.icon className="w-5 h-5" style={{ color:"hsl(var(--primary))" }} />
                  {/* Pulse ring on hover */}
                  <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.3, 1], opacity: [0, 0.15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ background:"hsl(var(--primary))" }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 group-hover:text-[hsl(var(--primary))] transition-colors" style={{ color:"hsl(var(--foreground))" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color:"hsl(var(--muted-foreground))" }}>{f.desc}</p>
                <span className="text-xs font-mono" style={{ color:"hsl(var(--muted-foreground)/0.5)" }}>{f.module}</span>
              </motion.div>
            ))}
          </div>
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
    <section id="moduller" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView?"show":"hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-14">
            <span className="section-label">Nasıl Çalışır</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>4 adımda başla</h2>
          </motion.div>

          {/* Timeline style */}
          <div className="relative">
            {/* Vertical connector line */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.25,0.1,0.25,1] }}
              className="absolute left-5 top-6 bottom-6 w-px origin-top hidden md:block"
              style={{ background: "linear-gradient(to bottom, hsl(var(--primary)/0.6), hsl(var(--primary)/0.1))" }}
            />

            <div className="space-y-4">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  variants={{
                    hidden: { opacity: 0, x: -30 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 + i * 0.12, ease: [0.25,0.1,0.25,1] } }
                  }}
                  className="flex items-start gap-6 group"
                >
                  {/* Step dot */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <motion.div
                      whileInView={{ scale: [0.8, 1.15, 1] }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
                      viewport={{ once: true }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold z-10 relative"
                      style={{ background:"hsl(var(--primary)/0.12)", border:"1px solid hsl(var(--primary)/0.3)", color:"hsl(var(--primary))" }}
                    >
                      {s.n}
                    </motion.div>
                  </div>
                  {/* Content */}
                  <motion.div
                    whileHover={{ x: 6 }}
                    transition={{ duration: 0.15 }}
                    className="keda-card p-5 flex-1"
                  >
                    <h3 className="text-sm font-semibold mb-1" style={{ color:"hsl(var(--foreground))" }}>{s.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color:"hsl(var(--muted-foreground))" }}>{s.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
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
    { n:1, label:"Her oturum", color:"hsl(var(--foreground))", bar:"hsl(var(--primary)/0.6)" },
    { n:2, label:"1 gün",      color:"hsl(var(--foreground))", bar:"hsl(var(--primary)/0.7)" },
    { n:3, label:"3 gün",      color:"hsl(var(--foreground))", bar:"hsl(var(--primary)/0.8)" },
    { n:4, label:"7 gün",      color:"hsl(var(--foreground))", bar:"hsl(var(--primary)/0.9)" },
    { n:5, label:"14 gün",     color:"hsl(var(--foreground))", bar:"hsl(var(--primary))" },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView?"show":"hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">Bilim Destekli</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>Leitner Spaced Repetition</h2>
            <p className="text-sm mt-2 max-w-lg" style={{ color:"hsl(var(--muted-foreground))" }}>Yanlış bildiğin kartlar Kutu 1'e döner, doğru bildiklerin ilerler. Minimum çaba, maksimum öğrenme.</p>
          </motion.div>

          {/* Bar chart animasyonu */}
          <motion.div variants={fade} className="keda-card p-8">
            <div className="space-y-3">
              {boxes.map((box, i) => (
                <div key={box.n} className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.08, type: "spring", stiffness: 200 }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  >
                    {box.n}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color:"hsl(var(--foreground))" }}>Kutu {box.n}</span>
                      <span style={{ color:"hsl(var(--muted-foreground))" }}>{box.label}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:"hsl(var(--border))" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${100 - i * 20}%` } : { width: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.25,0.1,0.25,1] }}
                        className="h-full rounded-full"
                        style={{ background: box.bar }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[hsl(var(--border))] text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>
              <span> Doğru cevap → bir üst kutu</span>
              <span> Yanlış cevap → Kutu 1</span>
            </div>
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
  { q:"Proje kimler tarafından geliştirildi?", a:"KEDA; Sezin Nisa Ataseven (M-01), Kerem Mert Duru (M-02), Mustafa Çakmak (M-03), Orhan Pala (M-04) ve Serdar Durgut tarafından geliştirilmiştir." },
  { q:"Şifremi unutursam ne olur?", a:"Şifre sıfırlama linki e-posta adresinize Supabase Auth aracılığıyla gönderilir." },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number|null>(null);
  const { ref, inView } = useSection();
  return (
    <section id="sss" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView?"show":"hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">SSS</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>Sıkça sorulan sorular</h2>
          </motion.div>
          <motion.div variants={stagger} className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fade}>
                <button onClick={() => setOpenIndex(openIndex===i?null:i)}
                  className="w-full keda-card px-5 py-4 text-left flex items-center justify-between gap-4 text-sm"
                  style={{ color:"hsl(var(--foreground))" }}>
                  <span>{faq.q}</span>
                  <motion.div animate={{ rotate: openIndex===i ? 45 : 0 }} transition={{ duration:0.2 }} style={{ color:"hsl(var(--muted-foreground))", flexShrink:0 }}>
                    <Plus className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex===i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
                      <div className="px-5 py-4 text-sm leading-relaxed rounded-b-xl border-x border-b border-[hsl(var(--border))]" style={{ color:"hsl(var(--muted-foreground))", background:"hsl(var(--muted))" }}>{faq.a}</div>
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
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial={{ opacity:0, y:30 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.6 }}
          className="keda-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 0%, hsl(var(--primary)/0.06), transparent 70%)" }} />
          <h2 className="text-2xl font-bold mb-2 relative" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>Hemen başla</h2>
          <p className="text-sm mb-6 relative" style={{ color:"hsl(var(--muted-foreground))" }}>Ücretsiz kayıt ol, PDF'lerini yükle, çalışmayı hızlandır.</p>
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
          <svg width="20" height="20" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgf)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgf)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgf)" opacity="0.82"/></svg>
          <span className="text-sm" style={{ color:"hsl(var(--muted-foreground))" }}>KEDA 2026</span>
        </div>
        <p className="text-xs text-center" style={{ color:"hsl(var(--muted-foreground)/0.5)" }}>Yazılım Mühendisliği Dersi Projesi — Sezin, Kerem, Mustafa, Orhan, Serdar</p>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-xs hover:text-[hsl(var(--foreground))] transition-colors" style={{ color:"hsl(var(--muted-foreground))" }}>Giriş Yap</Link>
          <Link href="/auth/register" className="text-xs hover:text-[hsl(var(--foreground))] transition-colors" style={{ color:"hsl(var(--muted-foreground))" }}>Kayıt Ol</Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main style={{ background:"hsl(var(--background))" }}>
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
