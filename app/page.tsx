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
          <svg width="26" height="26" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgnav" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgnav)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgnav)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgnav)" opacity="0.82"/></svg>
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
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(0 0% 100% / 0.03)" }} />
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
    <section id="ozellikler" className="py-16 lg:py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView?"show":"hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-14">
            <span className="section-label">Özellikler</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color:"hsl(var(--foreground))", letterSpacing:"-0.01em" }}>Her öğrenme ihtiyacınız için</h2>
            <p className="text-sm mt-2 max-w-md" style={{ color:"hsl(var(--muted-foreground))" }}>4 modül birbirleriyle entegre çalışarak bütünsel bir öğrenme deneyimi sunar.</p>
          </motion.div>

          {/* Masonry-style stagger grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  style={{ background:"hsl(0 0% 100% / 0.04)", border:"1px solid hsl(0 0% 100% / 0.07)" }}>
                  <f.icon className="w-5 h-5" style={{ color:"hsl(var(--primary))" }} />
                  {/* Pulse ring on hover */}
                  <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.3, 1], opacity: [0, 0.15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ background:"hsl(var(--primary))" }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 group-hover:text-[hsl(var(--foreground))] transition-colors" style={{ color:"hsl(var(--foreground))" }}>{f.title}</h3>
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

/* ─── KEDA AI SHOWCASE ─── */
function AIShowcase() {
  const { ref, inView } = useSection();
  return (
    <section className="py-16 lg:py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">Yapay Zeka</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
              KEDA AI — Kişisel akademik asistanın
            </h2>
            <p className="text-sm mt-2 max-w-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
              Flashcard verilerini analiz eder, çalışma planını bilir, güncel bilgilere erişir. Sadece sohbet et.
            </p>
          </motion.div>

          <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Sol: özellik listesi */}
            <div className="space-y-5 order-2 lg:order-1">
              {[
                { title: "Kişisel veri bağlamı", desc: "Flashcard setlerin, aktif planın, podcast geçmişin — AI her şeyi biliyor ve ona göre öneri yapıyor." },
                { title: "5 farklı AI modeli", desc: "Llama 3.3 70B'den DeepSeek R1'e kadar. Matematik için farklı, hızlı cevap için farklı model seç." },
                { title: "Güncel web araması", desc: "YKS tarihleri, burs programları, güncel haberler — AI bilmediği şeyleri web'den buluyor." },
                { title: "Modül yönlendirmesi", desc: "\"Flashcard oluştur\" dersen direkt flashcard sayfasına yönlendirir, işi halleder." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { delay: i * 0.08, duration: 0.4 } } }}
                  className="flex gap-4"
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "hsl(var(--foreground)/0.3)" }} />
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
              <motion.div variants={fade} className="pt-2">
                <Link href="/auth/register" className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                  Dene <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Sağ: ekran görüntüsü */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25,0.1,0.25,1] } } }}
              className="relative order-1 lg:order-2 lg:-mt-16"
            >
              <div className="absolute inset-0 rounded-2xl blur-3xl opacity-10 pointer-events-none"
                style={{ background: "hsl(var(--foreground))", transform: "scale(0.9) translateY(16px)" }} />
              <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border))]"
                style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.4)", transform: "scale(1.06)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/screen-ai.png" alt="KEDA AI" className="w-full block" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


function HowItWorks() {
  const { ref, inView } = useSection();
  const steps = [
    { n:"01", title:"PDF Yükle", desc:"Ders notlarınızı sisteme yükleyin." },
    { n:"02", title:"AI Analiz Eder", desc:"Groq AI metni analiz eder ve konuları çıkarır." },
    { n:"03", title:"Materyaller Hazır", desc:"Flashcard, podcast ve plan otomatik oluşur." },
    { n:"04", title:"Takip Et", desc:"Dashboard'dan ilerlemenizi takip edin." },
  ];
  return (
    <section id="moduller" className="py-16 lg:py-24 px-6">
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
              style={{ background: "linear-gradient(to bottom, hsl(0 0% 100% / 0.25), hsl(0 0% 100% / 0.04))" }}
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
                      style={{ background:"hsl(0 0% 100% / 0.05)", border:"1px solid hsl(0 0% 100% / 0.12)", color:"hsl(var(--primary))" }}
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
    { n:1, label:"Her oturum", color:"hsl(var(--foreground))", bar:"hsl(0 0% 100% / 0.25)" },
    { n:2, label:"1 gün",      color:"hsl(var(--foreground))", bar:"hsl(0 0% 70%)" },
    { n:3, label:"3 gün",      color:"hsl(var(--foreground))", bar:"hsl(var(--primary)/0.8)" },
    { n:4, label:"7 gün",      color:"hsl(var(--foreground))", bar:"hsl(0 0% 85%)" },
    { n:5, label:"14 gün",     color:"hsl(var(--foreground))", bar:"hsl(var(--primary))" },
  ];
  return (
    <section className="py-16 lg:py-24 px-6">
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
                        style={{ background: "hsl(0 0% 50%)" }}
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

/* ─── SCREENSHOTS CAROUSEL ─── */
const screenshots = [
  { src: "/screen-dashboard.png", label: "Dashboard", desc: "Tüm modülleri tek ekrandan yönet" },
  { src: "/screen-flashcard.png", label: "Flashcard", desc: "Leitner algoritmasıyla akıllı tekrar" },
  { src: "/screen-podcast.png",   label: "Podcast",   desc: "PDF'ten sesli özet, Spotify tarzı dinle" },
  { src: "/screen-agenda.png",    label: "Ajanda",    desc: "AI destekli kişisel çalışma planı" },
];

function Screenshots() {
  const { ref, inView } = useSection();
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);

  const goTo = (i: number) => {
    if (i === active) return;
    setDirection(i > active ? 1 : -1);
    setPrev(active);
    setActive(i);
  };

  return (
    <section className="py-16 lg:py-24 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-12">
            <span className="section-label">Ekranlar</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
              Her modül, amacına uygun tasarlandı
            </h2>
          </motion.div>

          {/* Sekme seçici */}
          <motion.div variants={fade} className="flex gap-2 mb-6 flex-wrap">
            {screenshots.map((s, i) => (
              <button key={s.label} onClick={() => goTo(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active === i ? "hsl(var(--foreground))" : "hsl(var(--secondary))",
                  color: active === i ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}>
                {s.label}
              </button>
            ))}
          </motion.div>

          {/* Görsel */}
          <motion.div variants={fade} className="relative overflow-hidden rounded-xl border border-[hsl(var(--border))]"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            {/* Tarayıcı çubuğu */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[hsl(var(--border))]"
              style={{ background: "hsl(var(--card))" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <div className="flex-1 mx-4 h-5 rounded flex items-center justify-center text-xs"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                keda-app-five.vercel.app/{screenshots[active].label.toLowerCase()}
              </div>
            </div>

            {/* Animasyonlu görsel geçişi */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={screenshots[active].src}
                  alt={screenshots[active].label}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="w-full h-full object-cover object-top block"
                  style={{ display: "block" }}
                />
              </AnimatePresence>
            </div>

            {/* Alt bilgi */}
            <div className="px-5 py-3 border-t border-[hsl(var(--border))] flex items-center justify-between"
              style={{ background: "hsl(var(--card))" }}>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {screenshots[active].desc}
              </p>
              <div className="flex gap-1.5">
                {screenshots.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === active ? 20 : 6,
                      height: 6,
                      background: i === active ? "hsl(var(--foreground))" : "hsl(var(--border))",
                    }} />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FULL WIDTH MOCKUP ─── */
function FullMockup() {
  const { ref, inView } = useSection();
  return (
    <section className="py-16 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
          <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--border))]"
            style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
            {/* Tarayıcı çubuğu */}
            <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-[hsl(var(--border))]"
              style={{ background: "hsl(var(--card))" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 mx-6 h-6 rounded flex items-center justify-center text-xs"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                keda-app-five.vercel.app/dashboard
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/screen-dashboard.png" alt="KEDA Dashboard" className="w-full block" />
            {/* Alt gradient */}
            <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}


const faqs = [
  { q:"KEDA tamamen ücretsiz mi?", a:"Evet, KEDA bir akademik proje olarak geliştirilmiştir ve ücretsiz kullanıma sunulmuştur." },
  { q:"Hangi formatlarda dosya yükleyebilirim?", a:"Şu an için PDF formatı desteklenmektedir. Dijital PDF'lerden metin otomatik çıkarılır." },
  { q:"Flashcard'larım kaybolur mu?", a:"Hayır. Tüm flashcard'larınız ve Spaced Repetition ilerlemeniz Supabase veritabanında saklanır." },
  { q:"Podcast özelliği nasıl çalışır?", a:"PDF metninden Groq AI ile iki konuşmacılı diyalog üretilir. Öğretmen-öğrenci formatında seslendirilir." },
  { q:"Proje kimler tarafından geliştirildi?", a:"KEDA; Sezin Nisa Ataseven (M-01), Kerem Mert Duru (M-02), Mustafa Çakmak (M-03), Orhan Pala (M-04) ve Serdar Durgut tarafından geliştirilmiştir." },
  { q:"Şifremi unutursam ne olur?", a:"Şifre sıfırlama linki e-posta adresinize Supabase Auth aracılığıyla gönderilir." },
];

/* ─── MODÜL EKRANLARI ─── */

const screens = [
  { src: "/screen-dashboard.png", label: "Dashboard", tag: "Genel Bakış", desc: "Tüm modülleri tek ekrandan yönet" },
  { src: "/screen-flashcard.png", label: "Flashcard",  tag: "M-03",        desc: "Leitner algoritmasıyla akıllı tekrar" },
  { src: "/screen-podcast.png",   label: "Podcast",    tag: "M-02",        desc: "PDF'ten sesli özet, dinle ve takip et" },
  { src: "/screen-agenda.png",    label: "Ajanda",     tag: "M-01",        desc: "AI destekli kişisel çalışma planı" },
];

function ModuleScreens() {
  const { ref, inView } = useSection();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [direction, setDirection] = useState(1);

  const goTo = (i: number) => {
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  return (
    <section className="py-16 lg:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} variants={stagger}>
          <motion.div variants={fade} className="mb-10">
            <span className="section-label">Ekranlar</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
              Her modül, amacına uygun tasarlandı
            </h2>
          </motion.div>

          {/* Tab seçici */}
          <motion.div variants={fade} className="flex gap-2 mb-6 flex-wrap">
            {screens.map((s, i) => (
              <button key={s.label} onClick={() => goTo(i)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active === i ? "hsl(var(--foreground))" : "hsl(var(--secondary))",
                  color: active === i ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}>
                {s.label}
              </button>
            ))}
          </motion.div>

          {/* Görsel */}
          <motion.div variants={fade}>
            <div className="relative overflow-hidden rounded-xl border border-[hsl(var(--border))] cursor-zoom-in"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
              onClick={() => setLightbox(true)}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={screens[active].src}
                  alt={screens[active].label}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="w-full block"
                />
              </AnimatePresence>
              {/* Zoom hint */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs"
                style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}>
                Buyutmek icin tikla
              </div>
            </div>

            {/* Alt bilgi */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                {screens[active].tag}
              </span>
              <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{screens[active].label}</span>
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>— {screens[active].desc}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
            onClick={() => setLightbox(false)}
          >
            {/* Kapat */}
            <button onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center z-10"
              style={{ background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Önceki */}
            <button onClick={e => { e.stopPropagation(); goTo(Math.max(0, active - 1)); }}
              disabled={active === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-25 z-10"
              style={{ background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Sonraki */}
            <button onClick={e => { e.stopPropagation(); goTo(Math.min(screens.length - 1, active + 1)); }}
              disabled={active === screens.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-25 z-10"
              style={{ background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Görsel */}
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-5xl"
            >
              <img src={screens[active].src} alt={screens[active].label} className="w-full block rounded-xl" // eslint-disable-line
                style={{ border: "1px solid hsl(var(--border))", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} />
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {screens[active].tag}
                </span>
                <span className="text-sm font-medium text-white">{screens[active].label}</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>— {screens[active].desc}</span>
                <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{active + 1} / {screens.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number|null>(null);
  const { ref, inView } = useSection();
  return (
    <section id="sss" className="py-16 lg:py-24 px-6">
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
    <section className="py-16 lg:py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div ref={ref} initial={{ opacity:0, y:30 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.6 }}
          className="keda-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at 50% 0%, hsl(0 0% 100% / 0.03), transparent 70%)" }} />
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
          <svg width="20" height="20" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgf)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgf)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgf)" opacity="0.82"/></svg>
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
      <AIShowcase />
      <HowItWorks />
      <LeitnerSection />
      <ModuleScreens />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
