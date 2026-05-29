/**
 * KEDA - Dashboard Ana Sayfası
 * Gerçek Supabase verileriyle istatistikler
 * Sorumlu: Orhan Pala (M-04) · Katkı: Serdar Durgut
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/lib/db";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function getMotivation(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Gece çalışması, başarıya giden yolun en sessiz saatidir.";
  if (hour < 12) return "Günaydın! Yeni bir gün, yeni bir başarı fırsatı.";
  if (hour < 17) return "Odaklan, her konu seni hedefe yaklaştırıyor.";
  if (hour < 21) return "Akşam tekrarları, bilgiyi kalıcı hale getirir.";
  return "Günün son çalışmasıyla kendin için yatırım yapıyorsun.";
}

function StatCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <motion.div variants={fadeUp} className={`keda-card p-5 border ${color}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </motion.div>
  );
}

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

interface DashboardStats {
  toplam_flashcard: number;
  bugun_tekrar_edilecek: number;
  aktif_plan: {
    baslik: string;
    hedef_gun_sayisi: number;
    created_at: string;
    topics: { tamamlandi_mi: boolean; baslik: string; hedef_gun: number }[];
  } | null;
  son_podcast: { baslik: string; created_at: string } | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      getDashboardStats(user.id).then((data) => {
        setStats(data);
        setLoadingStats(false);
      });
    }
  }, [user]);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";
  const today = currentTime.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Aktif planın kalan gün hesabı
  const getKalanGun = () => {
    if (!stats?.aktif_plan) return null;
    const baslangic = new Date(stats.aktif_plan.created_at);
    const bitis = new Date(baslangic);
    bitis.setDate(bitis.getDate() + stats.aktif_plan.hedef_gun_sayisi);
    const kalan = Math.ceil((bitis.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return kalan > 0 ? kalan : 0;
  };

  // Yaklaşan konular - aktif plandan bugün ve yarın
  const yaklasanKonular = stats?.aktif_plan?.topics
    ?.filter(t => !t.tamamlandi_mi)
    ?.slice(0, 3) || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">

      {/* Hoşgeldin kartı */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="keda-card p-6 mb-8 border border-indigo-500/15 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">{today}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Merhaba, <span className="gradient-text">{userName}</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-md">{getMotivation()}</p>
          </div>
          {stats?.bugun_tekrar_edilecek > 0 && (
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-amber-500/20">
              <span className="text-amber-400 text-xl">⏰</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{stats.bugun_tekrar_edilecek}</div>
                <div className="text-slate-500 text-xs">Kart Bekliyor</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* İstatistik kartları */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🃏" label="Toplam Flashcard" value={loadingStats ? "..." : stats?.toplam_flashcard || 0} color="border-indigo-500/20" sub="Gemini ile üretildi" />
        <StatCard icon="⏰" label="Bugün Tekrar" value={loadingStats ? "..." : stats?.bugun_tekrar_edilecek || 0} color="border-purple-500/20" sub="Kart bekliyor" />
        <StatCard icon="📅" label="Aktif Plan" value={loadingStats ? "..." : stats?.aktif_plan ? getKalanGun() + " gün" : "—"} color="border-blue-500/20" sub={stats?.aktif_plan?.baslik || "Plan yok"} />
        <StatCard icon="🎙" label="Son Podcast" value={loadingStats ? "..." : stats?.son_podcast ? "✓" : "—"} color="border-pink-500/20" sub={stats?.son_podcast?.baslik || "Henüz yok"} />
      </motion.div>

      {/* Modüller */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Modüller</h2>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard href="/dashboard/agenda" icon="📅" title="Ajanda & Plan" desc="Çalışma programın oluştur, notlarını gir, hedef tarihi belirle." color="from-blue-500/10 to-indigo-500/10" borderColor="border-blue-500/20" module="M-01 · Sezin Nisa Ataseven" />
          <ModuleCard href="/dashboard/podcast" icon="🎙" title="PDF Podcast" desc="Ders notlarını iki sesli podcast'e dönüştür ve her yerde dinle." color="from-purple-500/10 to-pink-500/10" borderColor="border-purple-500/20" module="M-02 · Kerem Mert Duru" />
          <ModuleCard href="/dashboard/flashcards" icon="🃏" title="Flashcard" desc="Spaced Repetition ile akıllı tekrar. Zayıf konulara odaklan." color="from-emerald-500/10 to-teal-500/10" borderColor="border-emerald-500/20" module="M-03 · Mustafa Çakmak" />
        </motion.div>
      </div>

      {/* Alt bölüm */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Yaklaşan görevler */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="keda-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Yaklaşan Görevler</h3>
            <Link href="/dashboard/agenda" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Tümünü gör</Link>
          </div>
          {loadingStats ? (
            <div className="text-center py-6 text-slate-600 text-sm">Yükleniyor...</div>
          ) : yaklasanKonular.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-600 text-sm mb-3">Aktif plan yok</p>
              <Link href="/dashboard/agenda" className="text-indigo-400 text-sm hover:text-indigo-300">Plan oluştur →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {yaklasanKonular.map((topic, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-green-400"}`} />
                  <p className="text-sm text-white flex-1 truncate">{topic.baslik}</p>
                  <span className="text-xs text-slate-500">{i === 0 ? "Bugün" : i === 1 ? "Yarın" : `${topic.hedef_gun}. gün`}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/agenda" className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yeni Plan Oluştur
          </Link>
        </motion.div>

        {/* Flashcard & Son Podcast */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="keda-card p-6 border border-emerald-500/15">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">Flashcard Durumu</h3>
              <Link href="/dashboard/flashcards" className="text-xs text-emerald-400 hover:text-emerald-300">Başlat</Link>
            </div>
            {loadingStats ? (
              <div className="text-center py-4 text-slate-600 text-sm">Yükleniyor...</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-black text-amber-400">{stats?.toplam_flashcard || 0}</div>
                  <div className="text-xs text-slate-500">Toplam Kart</div>
                </div>
                <div className="flex-1">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    {stats?.bugun_tekrar_edilecek > 0
                      ? <span className="text-emerald-400 text-sm font-medium">{stats.bugun_tekrar_edilecek} kart bugün sizi bekliyor</span>
                      : <span className="text-slate-500 text-sm">Bugün tekrar edilecek kart yok 🎉</span>
                    }
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="keda-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Son Podcast</h3>
              <Link href="/dashboard/podcast" className="text-xs text-purple-400 hover:text-purple-300">Tümü</Link>
            </div>
            {loadingStats ? (
              <div className="text-center py-4 text-slate-600 text-sm">Yükleniyor...</div>
            ) : stats?.son_podcast ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{stats.son_podcast.baslik}</p>
                  <p className="text-xs text-slate-500">{new Date(stats.son_podcast.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600 text-sm mb-3">Henüz podcast yok</p>
                <Link href="/dashboard/podcast" className="text-purple-400 text-sm hover:text-purple-300">Podcast oluştur →</Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Takım bilgisi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
        <p className="text-slate-700 text-xs font-mono">
          KEDA v1.0 · Sezin Nisa Ataseven · Kerem Mert Duru · Mustafa Çakmak · Orhan Pala · Serdar Durgut
        </p>
      </motion.div>
    </div>
  );
}
