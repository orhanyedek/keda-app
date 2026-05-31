"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Şifre sıfırlama e-postası gönderildi!");
    } catch (err) {
      toast.error("Gönderilemedi: " + (err instanceof Error ? err.message : "Hata"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-primary)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <svg width="44" height="44" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="kg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs>
              <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg2)"/>
              <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg2)" opacity="0.95"/>
              <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg2)" opacity="0.82"/>
            </svg>
          <h1 className="text-2xl font-bold text-white mb-1">Şifreni Sıfırla</h1>
          <p className="text-slate-400 text-sm">E-posta adresine sıfırlama linki göndereceğiz</p>
        </div>

        <div className="keda-card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-white font-semibold mb-2">E-posta Gönderildi</h3>
              <p className="text-slate-400 text-sm mb-6">{email} adresine sıfırlama linki gönderildi. Spam klasörünü de kontrol et.</p>
              <Link href="/auth/login" className="btn-primary px-6 py-2.5 text-sm inline-block">Giriş Sayfasına Dön</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">E-posta Adresi</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com" required className="keda-input" />
              </div>
              <button type="submit" disabled={loading || !email.trim()} className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <div className="loading-dots flex justify-center"><span /><span /><span /></div> : "Sıfırlama Linki Gönder"}
              </button>
              <p className="text-center text-slate-500 text-sm">
                <Link href="/auth/login" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground)/0.8)] transition-colors">Giriş sayfasına dön</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
