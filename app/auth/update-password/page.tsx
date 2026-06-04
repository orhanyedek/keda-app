"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Şifreler uyuşmuyor"); return; }
    if (password.length < 8) { toast.error("Şifre en az 8 karakter olmalı"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Şifren güncellendi!");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Güncellenemedi: " + (err instanceof Error ? err.message : "Hata"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 px-6" style={{ background: "var(--bg-primary)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md px-4 sm:px-0">
        <div className="text-center mb-8">
          <svg width="44" height="44" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="kg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs>
              <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg2)"/>
              <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg2)" opacity="0.95"/>
              <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg2)" opacity="0.82"/>
            </svg>
          <h1 className="text-2xl font-bold text-white mb-1">Yeni Şifre Belirle</h1>
        </div>
        <div className="keda-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Yeni Şifre</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 8 karakter" required className="keda-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şifre Tekrar</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Şifreni tekrar gir" required className="keda-input" />
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">
              {loading ? <div className="loading-dots flex justify-center"><span /><span /><span /></div> : "Şifremi Güncelle"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
