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
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-primary)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold mx-auto mb-4">K</div>
          <h1 className="text-2xl font-bold text-white mb-1">Yeni Şifre Belirle</h1>
        </div>
        <div className="keda-card p-8">
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
