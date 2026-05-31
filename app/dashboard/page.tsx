/**
 * KEDA - Dashboard Ana Sayfası
 * Gerçek Supabase verileriyle istatistikler
 * Sorumlu: Orhan Pala (M-04) · Katkı: Serdar Durgut
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats } from "@/lib/db";
import { CalendarDays, Mic, Layers, Clock, BookOpen, ArrowRight } from "lucide-react";
import { DashboardSkeleton } from "@/components/Skeleton";
import Onboarding from "@/components/Onboarding";
import Weather from "@/components/Weather";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <motion.div variants={fadeUp} className="keda-card p-5">
      <div className="w-9 h-9 rounded-xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mb-4">
        <Icon className="w-4 h-4 text-[hsl(var(--foreground))]" />
      </div>
      <div className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">{value}</div>
      <div className="text-sm text-[hsl(var(--muted-foreground))]">{label}</div>
      {sub && <div className="text-xs text-[hsl(var(--muted-foreground)/0.6)] mt-1 truncate">{sub}</div>}
    </motion.div>
  );
}

function ModuleCard({ href, icon: Icon, title, desc, module }: {
  href: string; icon: React.ElementType; title: string; desc: string; module: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Link href={href} className="keda-card block p-6 hover:border-[hsl(var(--border))] transition-colors group">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-[hsl(var(--foreground))]" />
        </div>
        <h3 className="text-base font-semibold text-[hsl(var(--foreground))] mb-1 group-hover:text-[hsl(0 0% 80%)] transition-colors">{title}</h3>
        <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-4">{desc}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[hsl(var(--muted-foreground)/0.6)] font-mono">{module}</span>
          <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground)/0.6)] group-hover:text-[hsl(var(--foreground))] transition-colors" />
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
  son_setler: { id: string; baslik: string; created_at: string }[];
  son_podcastler: { id: string; baslik: string; created_at: string }[];
  toplam_pdf: number;
  leitner_dagilim: { kutu: number; sayi: number }[];
}

export default function DashboardPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "Dashboard"; }, []);

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

  if (loadingStats) return <DashboardSkeleton />;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <Onboarding />

      {/* Hoşgeldin */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="keda-card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[hsl(var(--muted-foreground))] text-xs mb-1">{today}</p>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">{userName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Weather />
          {stats?.bugun_tekrar_edilecek > 0 && (
          <Link href="/dashboard/flashcards" className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[hsl(var(--foreground))] font-semibold text-sm leading-none">{stats.bugun_tekrar_edilecek} kart</div>
              <div className="text-[hsl(var(--muted-foreground))] text-xs">tekrar zamanı</div>
            </div>
          </Link>
        )}
        </div>
      </motion.div>

      {/* İstatistik kartları */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Layers} label="Toplam Flashcard" value={loadingStats ? "..." : stats?.toplam_flashcard || 0} sub="Tüm setlerdeki kart sayısı" />
        <StatCard icon={Clock} label="Bugün Tekrar" value={loadingStats ? "..." : stats?.bugun_tekrar_edilecek || 0} sub="Kart seni bekliyor" />
        <StatCard icon={CalendarDays} label="Aktif Plan" value={loadingStats ? "..." : stats?.aktif_plan ? getKalanGun() + " gün" : "—"} sub={stats?.aktif_plan?.baslik || "Plan yok"} />
        <StatCard icon={Mic} label="Toplam Podcast" value={loadingStats ? "..." : stats?.son_podcastler?.length || 0} sub={stats?.son_podcast?.baslik || "Henüz yok"} />
      </motion.div>

      {/* Son aktiviteler + Leitner */}
      {!loadingStats && (stats?.son_setler?.length || stats?.son_podcastler?.length || stats?.leitner_dagilim?.some(d => d.sayi > 0)) && (
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {/* Son flashcard setleri */}
          {(stats?.son_setler?.length || 0) > 0 && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="keda-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color:"hsl(var(--foreground))" }}>Son Flashcard Setleri</h3>
                <Link href="/dashboard/flashcards" className="text-xs" style={{ color:"hsl(var(--primary))" }}>Tümü</Link>
              </div>
              <div className="space-y-2">
                {stats!.son_setler.map(set => (
                  <Link key={set.id} href="/dashboard/flashcards"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background:"hsl(0 0% 100% / 0.04)", border:"1px solid hsl(0 0% 100% / 0.07)" }}>
                      <Layers className="w-3.5 h-3.5" style={{ color:"hsl(var(--primary))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color:"hsl(var(--foreground))" }}>{set.baslik}</p>
                      <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>{new Date(set.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Son podcastler */}
          {(stats?.son_podcastler?.length || 0) > 0 && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="keda-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color:"hsl(var(--foreground))" }}>Son Podcastler</h3>
                <Link href="/dashboard/podcast" className="text-xs" style={{ color:"hsl(var(--primary))" }}>Tümü</Link>
              </div>
              <div className="space-y-2">
                {stats!.son_podcastler.map(p => (
                  <Link key={p.id} href="/dashboard/podcast"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background:"hsl(0 0% 100% / 0.04)", border:"1px solid hsl(0 0% 100% / 0.07)" }}>
                      <Mic className="w-3.5 h-3.5" style={{ color:"hsl(var(--primary))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color:"hsl(var(--foreground))" }}>{p.baslik}</p>
                      <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>{new Date(p.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leitner kutu dağılımı */}
          {stats?.leitner_dagilim?.some(d => d.sayi > 0) && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="keda-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color:"hsl(var(--foreground))" }}>Leitner Dağılımı</h3>
              <div className="space-y-2.5">
                {stats!.leitner_dagilim.map(d => {
                  const total = stats!.toplam_flashcard || 1;
                  const pct = Math.round((d.sayi / total) * 100);
                  return (
                    <div key={d.kutu} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color:"hsl(var(--muted-foreground))" }}>Kutu {d.kutu}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"hsl(var(--border))" }}>
                        <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:"hsl(var(--primary))" }} />
                      </div>
                      <span className="text-xs w-6 text-right" style={{ color:"hsl(var(--muted-foreground))" }}>{d.sayi}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}


      {/* Modüller */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Modüller</h2>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard href="/dashboard/agenda" icon={CalendarDays} title="Ajanda & Plan" desc="Çalışma programın oluştur, notlarını gir, hedef tarihi belirle." module="M-01 · Sezin Nisa Ataseven" />
          <ModuleCard href="/dashboard/podcast" icon={Mic} title="PDF Podcast" desc="Ders notlarını iki sesli podcast'e dönüştür ve her yerde dinle." module="M-02 · Kerem Mert Duru" />
          <ModuleCard href="/dashboard/flashcards" icon={Layers} title="Flashcard" desc="Spaced Repetition ile akıllı tekrar. Zayıf konulara odaklan." module="M-03 · Mustafa Çakmak" />
        </motion.div>
      </div>

      {/* Alt bölüm */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Yaklaşan görevler */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="keda-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">Yaklaşan Görevler</h3>
            <Link href="/dashboard/agenda" className="text-xs text-[hsl(var(--foreground))] hover:text-[hsl(0 0% 80%)] transition-colors">Tümünü gör</Link>
          </div>
          {loadingStats ? (
            <div className="text-center py-6 text-[hsl(var(--muted-foreground)/0.6)] text-sm">Yükleniyor...</div>
          ) : yaklasanKonular.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[hsl(var(--muted-foreground)/0.6)] text-sm mb-3">Aktif plan yok</p>
              <Link href="/dashboard/agenda" className="text-[hsl(var(--foreground))] text-sm hover:text-[hsl(0 0% 80%)]">Plan oluştur →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {yaklasanKonular.map((topic, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))] transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-green-400"}`} />
                  <p className="text-sm text-[hsl(var(--foreground))] flex-1 truncate">{topic.baslik}</p>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{i === 0 ? "Bugün" : i === 1 ? "Yarın" : `${topic.hedef_gun}. gün`}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/agenda" className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-[hsl(var(--foreground))] hover:text-[hsl(0 0% 80%)] border border-[hsl(var(--border))] rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yeni Plan Oluştur
          </Link>
        </motion.div>

        {/* Flashcard & Son Podcast */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="keda-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Flashcard Durumu</h3>
              <Link href="/dashboard/flashcards" className="text-xs text-[hsl(var(--foreground))] hover:text-[hsl(0 0% 80%)] transition-colors">Başlat</Link>
            </div>
            {loadingStats ? (
              <div className="text-center py-4 text-[hsl(var(--muted-foreground)/0.6)] text-sm">Yükleniyor...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats?.toplam_flashcard || 0}</span>
                  <span className="text-[hsl(var(--muted-foreground))] text-sm mb-1">toplam kart</span>
                </div>
                <div className={`p-3 rounded-xl text-sm ${stats?.bugun_tekrar_edilecek > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-[hsl(var(--secondary))]/50 text-[hsl(var(--muted-foreground))]"}`}>
                  {stats?.bugun_tekrar_edilecek > 0
                    ? `${stats.bugun_tekrar_edilecek} kart bugün tekrar zamanı`
                    : "Bugün tekrar edilecek kart yok"}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="keda-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Son Podcast</h3>
              <Link href="/dashboard/podcast" className="text-xs text-[hsl(var(--foreground))] hover:text-[hsl(0 0% 80%)] transition-colors">Tümü</Link>
            </div>
            {loadingStats ? (
              <div className="text-center py-4 text-[hsl(var(--muted-foreground)/0.6)] text-sm">Yükleniyor...</div>
            ) : stats?.son_podcast ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted))]">
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-[hsl(var(--foreground))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))] truncate">{stats.son_podcast.baslik}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(stats.son_podcast.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[hsl(var(--muted-foreground)/0.6)] text-sm mb-2">Henüz podcast yok</p>
                <Link href="/dashboard/podcast" className="text-[hsl(var(--foreground))] text-xs hover:text-[hsl(0 0% 80%)] transition-colors">Oluştur →</Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Takım bilgisi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
        <p className="text-[hsl(var(--muted-foreground)/0.4)] text-xs font-mono">
          KEDA v1.0 · Sezin Nisa Ataseven · Kerem Mert Duru · Mustafa Çakmak · Orhan Pala · Serdar Durgut
        </p>
      </motion.div>
    </div>
  );
}
