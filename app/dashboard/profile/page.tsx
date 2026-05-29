/**
 * KEDA - Profil Sayfasi
 * 
 * Kullanicinin hesap bilgilerini goruntule ve duzenle.
 * 
 * Sorumlu: Orhan Pala (M-04)
 * Katki: Serdar Durgut
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (error) throw error;
      toast.success("Profil guncellendi!");
    } catch {
      toast.error("Guncelleme basarisiz");
    } finally {
      setSaving(false);
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanici";
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Profil</h1>
        <p className="text-slate-400 text-sm">Hesap bilgilerinizi yonetin</p>
      </motion.div>

      {/* Profil karti */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="keda-card p-8 mb-6 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-glow-md">
          {userName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{userName}</h2>
        <p className="text-slate-400 text-sm">{user?.email}</p>
        {joinDate && <p className="text-slate-600 text-xs mt-2">{joinDate} tarihinde katildi</p>}
      </motion.div>

      {/* Duzenle formu */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="keda-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Bilgileri Duzenle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Ad Soyad</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="keda-input" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">E-posta</label>
            <input type="email" value={user?.email || ""} disabled className="keda-input opacity-50 cursor-not-allowed" />
            <p className="text-xs text-slate-600 mt-1">E-posta adresi degistirilemez</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 disabled:opacity-50">
            {saving ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
          </button>
        </div>
      </motion.div>

      {/* Proje bilgisi */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="keda-card p-6 mt-6 border border-indigo-500/10">
        <h3 className="text-base font-semibold text-white mb-3">Proje Ekibi</h3>
        <div className="space-y-2 text-sm">
          {[
            { name: "Sezin Nisa Ataseven", role: "M-01 Backend · Ajanda & Planlama" },
            { name: "Kerem Mert Duru", role: "M-02 Backend · Podcast & Ses" },
            { name: "Mustafa Cakmak", role: "M-03 Backend+UI · Flashcard" },
            { name: "Orhan Pala", role: "M-04 Frontend · Kullanici Deneyimi" },
            { name: "Serdar Durgut", role: "Proje Katkilari" },
          ].map((member) => (
            <div key={member.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm">{member.name}</p>
                <p className="text-slate-500 text-xs">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-700 text-xs mt-4 font-mono">KEDA v1.0 · Yazilim Muhendisligi Dersi · Nisan 2026</p>
      </motion.div>
    </div>
  );
}
