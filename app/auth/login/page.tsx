/**
 * KEDA - Giriş Sayfası
 * 
 * Kullanıcı kimlik doğrulama ekranı.
 * Başarılı girişte /dashboard'a yönlendirilir.
 * 5 başarısız denemede hesap 15 dk kilitlenir (KT-08).
 * 
 * Sorumlu: Orhan Pala (M-04 Kullanıcı Deneyimi & Arayüz)
 * Katkı: Serdar Durgut
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Başarısız giriş sayacı - 5 denemede hesap kilitlenir (IK gereği)
  const [failCount, setFailCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 5 başarısız deneme kontrolü
    if (failCount >= 5) {
      toast.error("Hesabınız 15 dakika kilitlendi. Lütfen daha sonra deneyin.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setFailCount(prev => prev + 1);
        if (failCount >= 4) {
          toast.error("Hesabınız 15 dakika kilitlendi.");
        } else {
          toast.error(`Hatalı e-posta veya şifre. (${failCount + 1}/5)`);
        }
        return;
      }

      if (data.session) {
        toast.success("Hoş geldiniz!");
        // Dashboard'a yönlendir (KT-09 routing)
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      {/* Arka plan efekti */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">K</div>
            <span className="text-2xl font-bold gradient-text">KEDA</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Tekrar Hosgeldiniz</h1>
          <p className="text-slate-400 text-sm mt-2">Hesabınıza giris yapın</p>
        </div>

        {/* Form Kartı */}
        <div className="keda-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-posta alanı */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="keda-input"
              />
            </div>

            {/* Şifre alanı */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">Sifre</label>
                <Link href="/auth/reset-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Şifremi unuttum</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sifrenizi girin"
                  required
                  className="keda-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Başarısız deneme uyarısı */}
            {failCount > 0 && failCount < 5 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded-xl p-3"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {5 - failCount} deneme hakkınız kaldı
              </motion.div>
            )}

            {/* Giriş butonu */}
            <button
              type="submit"
              disabled={loading || failCount >= 5}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {loading ? (
                <div className="loading-dots flex justify-center">
                  <span /><span /><span />
                </div>
              ) : "Giris Yap"}
            </button>
          </form>

          {/* Kayıt ol linki */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Kayit Ol
            </Link>
          </p>
        </div>

        {/* Anasayfa linki */}
        <p className="text-center text-slate-600 text-xs mt-4">
          <Link href="/" className="hover:text-slate-400 transition-colors">Anasayfa a don</Link>
        </p>
      </motion.div>
    </div>
  );
}
