/**
 * KEDA - Kayit Sayfasi
 * 
 * Yeni kullanici kaydı.
 * Sifre kurallari: min 8 karakter, buyuk/kucuk harf, rakam (3.14 dokuman gereksinimleri).
 * Basarili kayit sonrasi dashboard a yonlendirilir.
 * 
 * Sorumlu: Orhan Pala (M-04)
 * Katki: Serdar Durgut
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signUp, signInWithOAuth } from "@/lib/supabase";
import toast from "react-hot-toast";

// Sifre gucunu hesaplar - kullaniciya geri bildirim saglar
function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Cok Zayif", "Zayif", "Orta", "Iyi", "Cok Iyi"];
const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const passwordStrength = getPasswordStrength(password);

  // Form dogrulama - sifre kurallari kontrolu
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = "Ad Soyad en az 2 karakter olmali";
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Gecerli bir e-posta adresi girin";
    }
    
    // Dokumandaki sifre kurallari (M-04 3.14 bolumu)
    if (password.length < 8) {
      newErrors.password = "Sifre en az 8 karakter olmali";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "En az bir buyuk harf olmali";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "En az bir kucuk harf olmali";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "En az bir rakam olmali";
    }
    
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Sifreler uyusmuyor";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, fullName);
      
      if (error) {
        if (error.message.includes("already registered")) {
          setErrors({ email: "Bu e-posta zaten kullaniliyor" });
        } else {
          toast.error("Kayit basarisiz: " + error.message);
        }
        return;
      }
      
      if (data.user) {
        // Email confirmation açıksa kullanıcı hemen giriş yapamaz
        if (data.session) {
          toast.success("Hesabınız oluşturuldu! Hoş geldiniz.");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.success("Hesabınız oluşturuldu! E-postanızı doğrulayın, ardından giriş yapın.", { duration: 6000 });
          router.push("/auth/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />
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
          <h1 className="text-2xl font-bold text-white">Hesap Olustur</h1>
          <p className="text-slate-400 text-sm mt-2">Ucretsiz kayit ol, ogrenmeye basla</p>
        </div>

        <div className="keda-card p-8">
          {/* OAuth butonları */}
          <div className="space-y-3 mb-6">
            <button type="button" onClick={async () => { const { error } = await signInWithOAuth("google"); if (error) toast.error("Google ile giriş başarısız"); }}
              className="w-full flex items-center justify-center gap-3 glass px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium border border-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google ile Kayıt Ol
            </button>
            <button type="button" onClick={async () => { const { error } = await signInWithOAuth("github"); if (error) toast.error("GitHub ile giriş başarısız"); }}
              className="w-full flex items-center justify-center gap-3 glass px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium border border-white/10">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub ile Kayıt Ol
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-600 text-xs">ya da e-posta ile</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad Soyad */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adiniz Soyadiniz"
                className={`keda-input ${errors.fullName ? "border-red-500/50" : ""}`}
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className={`keda-input ${errors.email ? "border-red-500/50" : ""}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Sifre */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  className={`keda-input pr-12 ${errors.password ? "border-red-500/50" : ""}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Sifre guc gostergesi */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-slate-700"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Sifre Gucu: <span className="text-slate-300">{strengthLabels[passwordStrength]}</span></p>
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Sifre tekrar */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sifre Tekrar</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Sifrenizi tekrar girin"
                className={`keda-input ${errors.passwordConfirm ? "border-red-500/50" : ""}`}
              />
              {errors.passwordConfirm && <p className="text-red-400 text-xs mt-1">{errors.passwordConfirm}</p>}
            </div>

            {/* Sifre kurallari ipucu */}
            <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-500 mb-2">Sifre gereksinimleri:</p>
              {[
                { label: "En az 8 karakter", check: password.length >= 8 },
                { label: "Buyuk harf (A-Z)", check: /[A-Z]/.test(password) },
                { label: "Kucuk harf (a-z)", check: /[a-z]/.test(password) },
                { label: "Rakam (0-9)", check: /[0-9]/.test(password) },
              ].map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-xs mt-1">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${rule.check ? "bg-emerald-500" : "bg-slate-700"}`}>
                    {rule.check && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={rule.check ? "text-emerald-400" : "text-slate-500"}>{rule.label}</span>
                </div>
              ))}
            </div>

            {/* Kayit butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-dots flex justify-center"><span /><span /><span /></div>
              ) : "Hesap Olustur"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Zaten hesabiniz var mi?{" "}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Giris Yap</Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          <Link href="/" className="hover:text-slate-400 transition-colors">Anasayfa ya don</Link>
        </p>
      </motion.div>
    </div>
  );
}
