"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { getDetailedStats } from "@/lib/db";
import { Layers, Mic, CalendarDays, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface Stats { toplam_flashcard: number; toplam_plan: number; toplam_podcast: number; basari_orani: number; }

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    getDetailedStats(user.id).then(s => setStats(s));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      toast.success("Profil güncellendi!");
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setSaving(false); }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Profil</h1>
        <p className="text-slate-400 text-sm">Hesap bilgilerinizi yönetin</p>
      </motion.div>

      {/* Profil kartı */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="keda-card p-8 mb-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
          {userName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{userName}</h2>
        <p className="text-slate-400 text-sm">{user?.email}</p>
        {joinDate && <p className="text-slate-600 text-xs mt-2">{joinDate} tarihinde katıldı</p>}
      </motion.div>

      {/* İstatistikler */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Layers, label: "Flashcard", value: stats.toplam_flashcard },
            { icon: CalendarDays, label: "Plan", value: stats.toplam_plan },
            { icon: Mic, label: "Podcast", value: stats.toplam_podcast },
            { icon: TrendingUp, label: "Başarı Oranı", value: `${stats.basari_orani}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="keda-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Düzenleme formu */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="keda-card p-6">
        <h3 className="text-white font-semibold mb-4 text-sm">Bilgileri Düzenle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Ad Soyad</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ad Soyad" className="keda-input" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">E-posta</label>
            <input value={user?.email || ""} disabled className="keda-input opacity-50 cursor-not-allowed" />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
            {saving ? <div className="loading-dots flex justify-center"><span /><span /><span /></div> : "Kaydet"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
