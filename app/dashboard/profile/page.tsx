"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { getDetailedStats } from "@/lib/db";
import { Layers, Mic, CalendarDays, TrendingUp, Eye, EyeOff, Trash2, Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationPermission from "@/components/NotificationPermission";
import toast from "react-hot-toast";

interface Stats { toplam_flashcard: number; toplam_plan: number; toplam_podcast: number; basari_orani: number; }

const NOTIF_KEYS = [
  { key: "flashcard_reminder", label: "Flashcard hatırlatıcısı", desc: "Tekrar zamanı gelen kartlar için bildirim" },
  { key: "plan_reminder", label: "Plan hatırlatıcısı", desc: "Günlük çalışma planı hatırlatması" },
  { key: "weekly_report", label: "Haftalık rapor", desc: "Her hafta çalışma özeti" },
  { key: "streak_alert", label: "Streak uyarısı", desc: "Streak kırılmak üzereyken uyar" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Hesap silme
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Bildirim tercihleri
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ [key: string]: boolean }>({
    flashcard_reminder: true,
    plan_reminder: true,
    weekly_report: false,
    streak_alert: true,
  });

  useEffect(() => {
    if (!user) return;
    getDetailedStats(user.id).then(s => setStats(s));
    // localStorage'dan bildirim tercihlerini yükle
    try {
      const saved = localStorage.getItem("keda_notif_prefs");
      if (saved) setNotifs(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      toast.success("Profil güncellendi!");
    } catch { toast.error("Güncelleme başarısız"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Yeni şifre en az 8 karakter olmalı"); return; }
    if (newPassword !== confirmPassword) { toast.error("Şifreler uyuşmuyor"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Şifre güncellendi!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch { toast.error("Şifre değiştirilemedi"); }
    finally { setChangingPassword(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "hesabımı sil") { toast.error('Lütfen "hesabımı sil" yazın'); return; }
    setDeleting(true);
    try {
      // Tüm kullanıcı verilerini sil
      await Promise.all([
        supabase.from("flashcards").delete().eq("kullanici_id", user!.id),
        supabase.from("flashcard_sets").delete().eq("kullanici_id", user!.id),
        supabase.from("study_plans").delete().eq("kullanici_id", user!.id),
        supabase.from("podcasts").delete().eq("kullanici_id", user!.id),
      ]);
      await supabase.auth.signOut();
      toast.success("Hesabınız silindi.");
      router.push("/");
    } catch { toast.error("Hesap silinemedi"); setDeleting(false); }
  };

  const toggleNotif = (key: string) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem("keda_notif_prefs", JSON.stringify(updated));
    toast.success(updated[key] ? "Bildirim açıldı" : "Bildirim kapatıldı");
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Profil</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Hesap bilgilerinizi yönetin</p>
      </motion.div>

      {/* Profil kartı */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="keda-card p-8 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
          style={{ background: "hsl(var(--primary)/0.2)", border: "1px solid hsl(var(--primary)/0.3)", color: "hsl(var(--primary))" }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>{userName}</h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{user?.email}</p>
        {joinDate && <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{joinDate} tarihinde katıldı</p>}
      </motion.div>

      {/* İstatistikler */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
          {[
            { icon: Layers, label: "Flashcard", value: stats.toplam_flashcard },
            { icon: CalendarDays, label: "Plan", value: stats.toplam_plan },
            { icon: Mic, label: "Podcast", value: stats.toplam_podcast },
            { icon: TrendingUp, label: "Başarı Oranı", value: `${stats.basari_orani}%` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="keda-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                <Icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>{value}</div>
                <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Profil düzenle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="keda-card p-6">
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "hsl(var(--foreground))" }}>Bilgileri Düzenle</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Ad Soyad</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ad Soyad" className="keda-input" />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>E-posta</label>
            <input value={user?.email || ""} disabled className="keda-input opacity-40 cursor-not-allowed" />
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full py-2.5 disabled:opacity-50">
            {saving ? <div className="loading-dots"><span/><span/><span/></div> : "Kaydet"}
          </button>
        </div>
      </motion.div>

      {/* Şifre değiştirme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="keda-card p-6">
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "hsl(var(--foreground))" }}>Şifre Değiştir</h3>
        <div className="space-y-3">
          <div className="relative">
            <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Yeni Şifre</label>
            <div className="relative">
              <input type={showPasswords ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="En az 8 karakter" className="keda-input pr-10" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Şifre Tekrar</label>
            <input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Şifreyi tekrar gir" className="keda-input" />
          </div>
          <button onClick={handleChangePassword} disabled={changingPassword || !newPassword || !confirmPassword}
            className="btn-secondary w-full py-2.5 disabled:opacity-50">
            {changingPassword ? <div className="loading-dots"><span/><span/><span/></div> : "Şifreyi Güncelle"}
          </button>
        </div>
      </motion.div>

      {/* Bildirim tercihleri */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="keda-card overflow-hidden">
        <button onClick={() => setNotifOpen(!notifOpen)}
          className="w-full flex items-center justify-between p-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
              <Bell className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Bildirim Tercihleri</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {Object.values(notifs).filter(Boolean).length} bildirim aktif
              </p>
            </div>
          </div>
          <motion.div animate={{ rotate: notifOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </motion.div>
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 space-y-4 border-t border-[hsl(var(--border))] pt-4">
                {/* Push bildirim izni */}
                <NotificationPermission />

                {/* Bildirim toggle'ları */}
                <div className="space-y-3">
                  {NOTIF_KEYS.map(n => (
                    <div key={n.key} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>{n.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{n.desc}</p>
                      </div>
                      <button onClick={() => toggleNotif(n.key)}
                        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${notifs[n.key] ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${notifs[n.key] ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hesap silme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="keda-card p-6 border border-red-500/20">
        <h3 className="font-semibold mb-1 text-sm text-red-400">Tehlikeli Bölge</h3>
        <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
          Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
        </p>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-4 h-4" /> Hesabı Sil
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400">Onaylamak için <strong>"hesabımı sil"</strong> yazın:</p>
            <input value={deleteText} onChange={e => setDeleteText(e.target.value)}
              placeholder="hesabımı sil" className="keda-input border-red-500/30 focus:border-red-500/60" />
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleting || deleteText !== "hesabımı sil"}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {deleting ? <div className="loading-dots justify-center"><span/><span/><span/></div> : "Hesabı Kalıcı Olarak Sil"}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                className="btn-secondary px-4 py-2.5">İptal</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
