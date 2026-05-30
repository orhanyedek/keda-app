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
    <section className="min-h-screen flex items-center px-6 pt-20 pb-12 relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 30% 50%, black 30%, transparent 100%)",
        opacity: 0.3,
      }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none" style={{ background: "hsl(var(--primary)/0.07)" }} />

      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative">
        {/* Sol: Metin */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fade} className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Yapay Zeka Destekli Akademik Asistan
          </motion.div>

          <motion.h1 variants={fade} className="text-4xl md:text-5xl font-bold leading-tight mb-5" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
            Akıllı çalışmanın<br />
            <span className="gradient-text">tek adresi.</span>
          </motion.h1>

          <motion.p variants={fade} className="text-base md:text-lg mb-8 leading-relaxed max-w-md" style={{ color: "hsl(var(--muted-foreground))" }}>
            PDF yükle — AI konuları analiz etsin, flashcard üretsin, podcast oluştursun, kişisel çalışma planı hazırlasın.
          </motion.p>

          <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/auth/register" className="btn-primary px-6 py-2.5 flex items-center gap-2">
              Ücretsiz Başla <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#ozellikler" className="btn-secondary px-6 py-2.5">Özelliklere Bak</a>
          </motion.div>

          <motion.div variants={fade} className="flex items-center gap-6 pt-6 border-t border-[hsl(var(--border))]">
            {[["PDF → Flashcard", "Saniyeler içinde"], ["PDF → Podcast", "2 sesli diyalog"], ["Leitner SR", "Akıllı tekrar"]].map(([title, sub]) => (
              <div key={title}>
                <div className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{title}</div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Sağ: Mockup görseli */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative hidden lg:block"
        >
          {/* Glow arkası */}
          <div className="absolute inset-0 rounded-2xl blur-3xl opacity-20 pointer-events-none" style={{ background: "hsl(var(--primary))", transform: "scale(0.85) translateY(20px)" }} />

          {/* Görsel çerçeve */}
          <div className="relative rounded-2xl overflow-hidden border border-[hsl(var(--border))]" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--border))" }}>
            {/* Üst bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))" }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <div className="flex-1 mx-3 h-5 rounded-md text-xs flex items-center justify-center" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                keda-app-five.vercel.app
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-mockup.png"
              alt="KEDA Dashboard"
              className="w-full block"
              style={{ display: "block" }}
            />
          </div>
        </motion.div>

        {/* Mobil görsel (küçük ekran) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:hidden"
        >
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
  const [activePage, setActivePage] = useState(0);
  const [flipping, setFlipping] = useState(false);

  const pages = [
    {
      num: "01",
      title: "PDF Yükle",
      desc: "Ders notlarını veya ders kitabı bölümlerini sisteme yükle. Sürükle bırak veya tıkla.",
      icon: "📄",
      lines: [
        "——————————————————",
        "Veri Yapıları - Ağaçlar",
        "——————————————————",
        "Binary search tree, AVL tree,",
        "Red-Black tree yapıları...",
        "",
        "Zaman karmaşıklığı analizi",
        "O(log n) arama, ekleme...",
      ],
      color: "#6366f1",
    },
    {
      num: "02",
      title: "AI Analiz Eder",
      desc: "Groq AI metni analiz eder, konuları çıkarır, önem sırasına göre sıralar.",
      icon: "🤖",
      lines: [
        "✓ Konu Analizi Tamamlandı",
        "——————————————————",
        "• Binary Search Tree   ████",
        "• AVL Tree Dengesi     ███",
        "• Rotasyon İşlemleri   ██",
        "• Karmaşıklık Analizi  ████",
        "",
        "12 flashcard · 1 podcast hazır",
      ],
      color: "#8b5cf6",
    },
    {
      num: "03",
      title: "Materyaller Hazır",
      desc: "Flashcard, podcast diyalogu ve çalışma planı otomatik oluşturulur.",
      icon: "✨",
      lines: [
        "S: AVL ağaçta denge şartı?",
        "——————————————————",
        "C: Her düğüm için sol ve sağ",
        "   alt ağaç yükseklik farkı",
        "   en fazla 1 olabilir.",
        "",
        "[ Bildim ]     [ Bilmedim ]",
      ],
      color: "#a855f7",
    },
    {
      num: "04",
      title: "Takip Et",
      desc: "Dashboard'dan ilerlemenizi takip edin, Leitner algoritmasıyla tekrar yapın.",
      icon: "📊",
      lines: [
        "Bu Hafta",
        "——————————————————",
        "Pzt ████████████ 45dk",
        "Sal ██████ 20dk",
        "Çar ██████████ 35dk",
        "",
        "Streak: 🔥 7 gün",
        "Başarı: %84",
      ],
      color: "#7c3aed",
    },
  ];

  const goNext = () => {
    if (flipping || activePage >= pages.length - 1) return;
    setFlipping(true);
    setTimeout(() => { setActivePage(p => p + 1); setFlipping(false); }, 400);
  };

  const goPrev = () => {
    if (flipping || activePage <= 0) return;
    setFlipping(true);
    setTimeout(() => { setActivePage(p => p - 1); setFlipping(false); }, 400);
  };

  const current = pages[activePage];

  return (
    <section id="moduller" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}>
          <motion.div variants={fade} className="mb-14 text-center">
            <span className="section-label">Nasıl Çalışır</span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
              4 adımda başla
            </h2>
          </motion.div>

          <motion.div variants={fade} className="flex flex-col lg:flex-row items-center gap-12">

            {/* ── DEFTER ── */}
            <div className="relative flex-shrink-0" style={{ width: 300, height: 380 }}>
              {/* Arka sayfa gölgeleri */}
              {[3, 2, 1].map(i => (
                <div key={i} className="absolute rounded-r-xl" style={{
                  width: 294, height: 370,
                  top: i * 3, left: i * 3,
                  background: `hsl(${240 + i * 5} 10% ${8 + i * 2}%)`,
                  border: "1px solid hsl(var(--border))",
                  zIndex: i,
                }} />
              ))}

              {/* Ana sayfa */}
              <motion.div
                key={activePage}
                initial={{ rotateY: flipping ? -90 : 0, opacity: flipping ? 0 : 1 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute rounded-r-xl overflow-hidden"
                style={{
                  width: 294, height: 370,
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  zIndex: 10,
                  transformOrigin: "left center",
                  perspective: 1000,
                }}
              >
                {/* Spiral delik */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around items-center py-4"
                  style={{ background: "hsl(var(--muted))", borderRight: "1px solid hsl(var(--border))" }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  ))}
                </div>

                {/* İçerik */}
                <div className="ml-10 p-4 h-full flex flex-col">
                  {/* Başlık satırı */}
                  <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "2px solid hsl(var(--border))" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: `${current.color}22`, border: `1px solid ${current.color}44` }}>
                      {current.icon}
                    </div>
                    <div>
                      <div className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>{current.num}</div>
                      <div className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{current.title}</div>
                    </div>
                  </div>

                  {/* Çizgiler */}
                  <div className="flex-1 font-mono text-xs leading-relaxed space-y-1.5">
                    {current.lines.map((line, i) => (
                      <motion.div
                        key={`${activePage}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i + 0.1, duration: 0.2 }}
                        style={{ color: line.startsWith("✓") ? "#34d399" : line.startsWith("S:") || line.startsWith("C:") ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", whiteSpace: "pre" }}
                      >
                        {line || "\u00A0"}
                      </motion.div>
                    ))}
                  </div>

                  {/* Sayfa numarası */}
                  <div className="text-xs text-center mt-2" style={{ color: "hsl(var(--muted-foreground)/0.4)" }}>
                    {activePage + 1} / {pages.length}
                  </div>
                </div>

                {/* Renk aksanı — sağ kenar */}
                <div className="absolute right-0 top-0 bottom-0 w-0.5" style={{ background: current.color, opacity: 0.5 }} />
              </motion.div>

              {/* Sayfa çevirme butonları */}
              <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-4">
                <button onClick={goPrev} disabled={activePage === 0 || flipping}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex gap-1.5">
                  {pages.map((_, i) => (
                    <button key={i} onClick={() => { if (!flipping) { setFlipping(true); setTimeout(() => { setActivePage(i); setFlipping(false); }, 300); } }}
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: i === activePage ? 20 : 6, background: i === activePage ? current.color : "hsl(var(--border))" }} />
                  ))}
                </div>

                <button onClick={goNext} disabled={activePage === pages.length - 1 || flipping}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── AÇIKLAMA ── */}
            <div className="flex-1 lg:pl-8">
              {/* Adım listesi */}
              <div className="space-y-3">
                {pages.map((p, i) => (
                  <motion.button
                    key={p.num}
                    onClick={() => {
                      if (!flipping && i !== activePage) {
                        setFlipping(true);
                        setTimeout(() => { setActivePage(i); setFlipping(false); }, 300);
                      }
                    }}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{
                      background: i === activePage ? `${p.color}11` : "transparent",
                      border: `1px solid ${i === activePage ? p.color + "44" : "hsl(var(--border))"}`,
                    }}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                        style={{
                          background: i === activePage ? p.color : "hsl(var(--secondary))",
                          color: i === activePage ? "white" : "hsl(var(--muted-foreground))",
                        }}>
                        {i === activePage ? p.icon : p.num}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: i === activePage ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                          {p.title}
                        </div>
                        {i === activePage && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs mt-1 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {p.desc}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
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
