"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDetailedStats } from "@/lib/db";
import { Layers, Mic, CalendarDays, CheckCircle2, TrendingUp, BarChart2 } from "lucide-react";

const leitnerColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];
const leitnerLabels = ["Her Oturum", "1 Gün", "3 Gün", "7 Gün", "14 Gün"];

interface Stats {
  toplam_flashcard: number;
  toplam_set: number;
  toplam_plan: number;
  toplam_podcast: number;
  dogru_sayisi: number;
  yanlis_sayisi: number;
  basari_orani: number;
  kutu_dagilimi: { box: number; count: number }[];
  haftalik_aktivite: { label: string; flashcards: number }[];
  tamamlanan_konu: number;
  toplam_konu: number;
}

export default function StatsPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "İstatistik | KEDA"; }, []);

  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDetailedStats(user.id).then(data => {
      setStats(data);
      setLoading(false);
    });
  }, [user]);

  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
  const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

  if (loading) return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded-xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  const maxActivity = Math.max(...(stats?.haftalik_aktivite.map(d => d.flashcards) || [1]), 1);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">İstatistikler</h1>
        <p className="text-slate-400 text-sm">Çalışma performansın ve ilerleme özeti</p>
      </motion.div>

      {/* Özet kartlar */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Layers, label: "Flashcard", value: stats?.toplam_flashcard || 0, sub: `${stats?.toplam_set || 0} set` },
          { icon: CalendarDays, label: "Çalışma Planı", value: stats?.toplam_plan || 0, sub: `${stats?.tamamlanan_konu || 0}/${stats?.toplam_konu || 0} konu` },
          { icon: Mic, label: "Podcast", value: stats?.toplam_podcast || 0, sub: "oluşturuldu" },
          { icon: TrendingUp, label: "Başarı Oranı", value: `${stats?.basari_orani || 0}%`, sub: `${stats?.dogru_sayisi || 0} doğru` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <motion.div key={label} variants={fadeUp} className="keda-card p-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Haftalık aktivite */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="keda-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-semibold text-sm">Haftalık Aktivite</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {stats?.haftalik_aktivite.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full relative flex items-end justify-center" style={{ height: "96px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${maxActivity > 0 ? (day.flashcards / maxActivity) * 96 : 4}px` }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                    className="w-full rounded-t-lg bg-indigo-600/40 border border-indigo-500/30 min-h-1"
                  />
                  {day.flashcards > 0 && (
                    <span className="absolute -top-5 text-[10px] text-indigo-400 font-mono">{day.flashcards}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-600">{day.label}</span>
              </div>
            ))}
          </div>
          {stats?.haftalik_aktivite.every(d => d.flashcards === 0) && (
            <p className="text-slate-600 text-xs text-center mt-2">Bu hafta henüz aktivite yok</p>
          )}
        </motion.div>

        {/* Leitner kutu dağılımı */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="keda-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-semibold text-sm">Leitner Kutu Dağılımı</h3>
          </div>
          <div className="space-y-3">
            {stats?.kutu_dagilimi.map(({ box, count }) => {
              const pct = stats.toplam_flashcard > 0 ? Math.round((count / stats.toplam_flashcard) * 100) : 0;
              return (
                <div key={box} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${leitnerColors[box - 1]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{box}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{leitnerLabels[box - 1]}</span>
                      <span className="text-slate-500">{count} kart</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.1 * box, duration: 0.5 }}
                        className={`h-full rounded-full ${leitnerColors[box - 1]}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {stats?.toplam_flashcard === 0 && (
            <p className="text-slate-600 text-xs text-center mt-4">Henüz flashcard yok</p>
          )}
        </motion.div>

        {/* Doğru/Yanlış */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="keda-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-semibold text-sm">Doğru / Yanlış Oranı</h3>
          </div>
          {(stats?.dogru_sayisi || 0) + (stats?.yanlis_sayisi || 0) === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">Henüz cevaplanan kart yok</p>
          ) : (
            <>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-3xl font-bold text-emerald-400">{stats?.dogru_sayisi}</div>
                  <div className="text-xs text-slate-500 mt-1">Doğru</div>
                </div>
                <div className="text-slate-700 text-2xl mb-1">/</div>
                <div>
                  <div className="text-3xl font-bold text-red-400">{stats?.yanlis_sayisi}</div>
                  <div className="text-xs text-slate-500 mt-1">Yanlış</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-bold text-indigo-400">{stats?.basari_orani}%</div>
                  <div className="text-xs text-slate-500 mt-1">Başarı</div>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.basari_orani}%` }} transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
              </div>
            </>
          )}
        </motion.div>

        {/* Konu tamamlama */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="keda-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-semibold text-sm">Konu Tamamlama</h3>
          </div>
          {stats?.toplam_konu === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">Henüz çalışma planı yok</p>
          ) : (
            <>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-4xl font-bold text-white">{stats?.tamamlanan_konu}</div>
                <div className="text-slate-500 text-sm mb-1">/ {stats?.toplam_konu} konu</div>
                <div className="ml-auto text-indigo-400 font-bold">
                  {stats && stats.toplam_konu > 0 ? Math.round((stats.tamamlanan_konu / stats.toplam_konu) * 100) : 0}%
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }}
                  animate={{ width: stats && stats.toplam_konu > 0 ? `${Math.round((stats.tamamlanan_konu / stats.toplam_konu) * 100)}%` : "0%" }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              </div>
              <p className="text-xs text-slate-600 mt-3">Tüm planlardaki konu tamamlama oranı</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
