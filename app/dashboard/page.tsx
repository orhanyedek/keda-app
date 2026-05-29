/**
 * KEDA - Dashboard Ana Sayfasi
 * 
 * Kullanicinin tum modullerini yonetebildigi merkezi kontrol paneli.
 * WelcomeCard, ModuleQuickAccess, istatistikler ve son aktiviteler gosterilir.
 * 
 * Dokumanda belirtilen dashboard bilesenleri (3.17):
 * - WelcomeCard: Kullanici adi, tarih, motivasyon mesaji
 * - ModuleQuickAccess: Ajanda, Podcast, Flashcard hizli erisim
 * - UpcomingEvents: Planli calisma gorevleri
 * - RecentPodcasts: Son olusturulan podcastler
 * - FlashcardStreak: Ardisik gun sayisi ve bugunki kartlar
 * 
 * Sorumlu: Orhan Pala (M-04)
 * Katki: Serdar Durgut
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// Motivasyon mesajlari - gunun saatine gore degisir
function getMotivation(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Gece calismasi, basariya giden yolun en sessiz saatidir.";
  if (hour < 12) return "Gunaydın! Yeni bir gun, yeni bir basari firsati.";
  if (hour < 17) return "Odaklan, her konu seni hedefe yaklastiriyor.";
  if (hour < 21) return "Aksam tekrarlari, bilgiyi kalici hale getirir.";
  return "Gunun son calismasiyla kendin icin yatirim yapiyorsun.";
}

// Dashboard istatistik karti bileseni
function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <motion.div variants={fadeUp} className={`keda-card p-5 border ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </motion.div>
  );
}

// Modul hizli erisim karti
function ModuleCard({ href, icon, title, desc, color, borderColor, module }: {
  href: string; icon: string; title: string; desc: string; color: string; borderColor: string; module: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Link href={href} className={`keda-card block p-6 border ${borderColor} bg-gradient-to-br ${color} hover:scale-[1.02] transition-transform duration-300`}>
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-3">{desc}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 font-mono">{module}</span>
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Saati guncelle
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanici";
  const today = currentTime.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      
      {/* ====== HOSGELDIN KARTI (WelcomeCard) ====== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="keda-card p-6 mb-8 border border-indigo-500/15 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent relative overflow-hidden"
      >
        {/* Arka plan dekorasyon */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">{today}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Merhaba, <span className="gradient-text">{userName}</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-md">{getMotivation()}</p>
            </div>
            {/* Aktif streak gostergesi */}
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-amber-500/20">
              <span className="text-amber-400 text-xl">🔥</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">3</div>
                <div className="text-slate-500 text-xs">Gunluk Seri</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== ISTATISTIK KARTLARI ====== */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🃏" label="Toplam Flashcard" value={42} color="border-indigo-500/20" sub="Gemini ile uretildi" />
        <StatCard icon="⏰" label="Bugun Tekrar" value={8} color="border-purple-500/20" sub="Kart bekliyor" />
        <StatCard icon="📅" label="Aktif Plan" value={1} color="border-blue-500/20" sub="12 gun kaldi" />
        <StatCard icon="🎙" label="Podcast" value={3} color="border-pink-500/20" sub="Olusturuldu" />
      </motion.div>

      {/* ====== MODUL HIZLI ERISIM (ModuleQuickAccess) ====== */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Moduller</h2>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard
            href="/dashboard/agenda"
            icon="📅"
            title="Ajanda & Plan"
            desc="Calisma programin olustur, notlarini gir, hedef tarihi belirle."
            color="from-blue-500/10 to-indigo-500/10"
            borderColor="border-blue-500/20"
            module="M-01 · Sezin Nisa Ataseven"
          />
          <ModuleCard
            href="/dashboard/podcast"
            icon="🎙"
            title="PDF Podcast"
            desc="Ders notlarini iki sesli podcast e donustur ve her yerde dinle."
            color="from-purple-500/10 to-pink-500/10"
            borderColor="border-purple-500/20"
            module="M-02 · Kerem Mert Duru"
          />
          <ModuleCard
            href="/dashboard/flashcards"
            icon="🃏"
            title="Flashcard"
            desc="Spaced Repetition ile akilli tekrar. Zayif konulara odaklan."
            color="from-emerald-500/10 to-teal-500/10"
            borderColor="border-emerald-500/20"
            module="M-03 · Mustafa Cakmak"
          />
        </motion.div>
      </div>

      {/* ====== ALT BOLUM: Son aktiviteler ====== */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Yaklasan Gorevler (UpcomingEvents) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="keda-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Yaklasan Gorevler</h3>
            <Link href="/dashboard/agenda" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Tumunu gor</Link>
          </div>
          
          {/* Ornek gorevler - gercek veri dashboard/agenda modulunden gelecek */}
          <div className="space-y-3">
            {[
              { title: "Matematik - Turevler", day: "Bugun", priority: "high" },
              { title: "Fizik - Kinemat", day: "Yarin", priority: "medium" },
              { title: "Kimya - Asit-Baz", day: "3 gun sonra", priority: "low" },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-amber-400" : "bg-green-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{task.title}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{task.day}</span>
              </div>
            ))}
          </div>
          
          <Link href="/dashboard/agenda" className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Plan Olustur
          </Link>
        </motion.div>

        {/* Flashcard Streak & Son Podcasts */}
        <div className="space-y-4">
          {/* FlashcardStreak bileseni */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="keda-card p-6 border border-emerald-500/15"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Flashcard Serisi</h3>
              <Link href="/dashboard/flashcards" className="text-xs text-emerald-400 hover:text-emerald-300">Baslat</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-black text-amber-400">3</div>
                <div className="text-xs text-slate-500">Gunluk seri</div>
              </div>
              <div className="flex-1">
                <div className="flex gap-1 mb-2">
                  {[true, true, true, false, false, false, false].map((active, i) => (
                    <div key={i} className={`flex-1 h-8 rounded-lg ${active ? "bg-amber-500/80" : "bg-slate-700/50"}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">Bu hafta 3/7 gun aktif</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <span className="text-emerald-400 text-sm font-medium">8 kart bugun sizi bekliyor</span>
            </div>
          </motion.div>

          {/* Son Podcastler (RecentPodcasts) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="keda-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Son Podcastler</h3>
              <Link href="/dashboard/podcast" className="text-xs text-purple-400 hover:text-purple-300">Tumu</Link>
            </div>
            <div className="space-y-3">
              {[
                { title: "Matematik - Limit", dur: "12 dk" },
                { title: "Fizik - Newton Yasalari", dur: "8 dk" },
                { title: "Biyoloji - Hucreler", dur: "15 dk" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.title}</p>
                  </div>
                  <span className="text-xs text-slate-500">{p.dur}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Takim bilgisi */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <p className="text-slate-700 text-xs font-mono">
          KEDA v1.0 · Sezin Nisa Ataseven · Kerem Mert Duru · Mustafa Cakmak · Orhan Pala · Serdar Durgut
        </p>
      </motion.div>
    </div>
  );
}
