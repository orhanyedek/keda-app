"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signUp, signInWithOAuth } from "@/lib/supabase";
import toast from "react-hot-toast";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getPasswordStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const strengthColor = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthLabel = ["", "Zayıf", "Orta", "İyi", "Güçlü", "Çok Güçlü"];
  const strength = getPasswordStrength();

  const validateForm = () => {
    const e: { [key: string]: string } = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Ad Soyad en az 2 karakter olmalı";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Geçerli bir e-posta girin";
    if (password.length < 8) e.password = "Şifre en az 8 karakter olmalı";
    else if (!/[A-Z]/.test(password)) e.password = "En az bir büyük harf olmalı";
    else if (!/[a-z]/.test(password)) e.password = "En az bir küçük harf olmalı";
    else if (!/[0-9]/.test(password)) e.password = "En az bir rakam olmalı";
    if (password !== passwordConfirm) e.passwordConfirm = "Şifreler uyuşmuyor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Adım 1: Form gönder → OTP gönder
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      // OTP gönder
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "E-posta gönderilemedi");
        return;
      }
      setStep("otp");
      toast.success(`Doğrulama kodu ${email} adresine gönderildi`);
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  // Adım 2: OTP doğrula → Hesap oluştur
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("6 haneli kodu girin"); return; }
    setLoading(true);
    try {
      // OTP doğrula
      const verifyRes = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Hatalı kod");
        return;
      }

      // Hesabı oluştur
      const { data, error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Bu e-posta zaten kayıtlı");
        } else {
          toast.error("Kayıt başarısız: " + error.message);
        }
        return;
      }
      if (data.user) {
        toast.success("Hesabınız oluşturuldu! Hoş geldiniz.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) { toast.error(`${provider} ile giriş başarısız`); setOauthLoading(null); }
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });
      if (res.ok) toast.success("Yeni kod gönderildi");
      else toast.error("Kod gönderilemedi");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: "hsl(var(--background))" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg width="32" height="32" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgr)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgr)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgr)" opacity="0.82"/></svg>
            <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>KEDA</span>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>
            {step === "form" ? "Hesap Oluştur" : "E-postanı Doğrula"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {step === "form" ? "Ücretsiz başla, hemen çalışmaya başla" : `${email} adresine gönderilen kodu gir`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── ADIM 1: KAYIT FORMU ── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="keda-card p-6 space-y-4">
                {/* OAuth */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
                    className="btn-secondary text-sm py-2.5 gap-2 disabled:opacity-50">
                    {oauthLoading === "google" ? <div className="loading-dots scale-75"><span/><span/><span/></div> : (
                      <><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</>
                    )}
                  </button>
                  <button onClick={() => handleOAuth("github")} disabled={!!oauthLoading}
                    className="btn-secondary text-sm py-2.5 gap-2 disabled:opacity-50">
                    {oauthLoading === "github" ? <div className="loading-dots scale-75"><span/><span/><span/></div> : (
                      <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>GitHub</>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>ya da</span>
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Ad Soyad</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Adın Soyadın" className={`keda-input ${errors.fullName ? "border-red-500/50" : ""}`} />
                    {errors.fullName && <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>E-posta</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" className={`keda-input ${errors.email ? "border-red-500/50" : ""}`} />
                    {errors.email && <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Şifre</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter" className={`keda-input pr-10 ${errors.password ? "border-red-500/50" : ""}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor[strength - 1] : "bg-[hsl(var(--border))]"}`} />
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{strengthLabel[strength]}</p>
                      </div>
                    )}
                    {errors.password && <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>Şifre Tekrar</label>
                    <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Şifreni tekrar gir" className={`keda-input ${errors.passwordConfirm ? "border-red-500/50" : ""}`} />
                    {errors.passwordConfirm && <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>{errors.passwordConfirm}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 disabled:opacity-50">
                    {loading ? <div className="loading-dots"><span/><span/><span/></div> : "Devam Et →"}
                  </button>
                </form>

                <p className="text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Zaten hesabın var mı?{" "}
                  <Link href="/auth/login" style={{ color: "hsl(var(--primary))" }} className="font-medium">Giriş Yap</Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── ADIM 2: OTP DOĞRULAMA ── */}
          {step === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="keda-card p-6">
                <button onClick={() => setStep("form")} className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <ArrowLeft className="w-4 h-4" /> Geri dön
                </button>

                {/* Mail ikonu */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                    <svg className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <span style={{ color: "hsl(var(--foreground))" }} className="font-medium">{email}</span> adresine<br />6 haneli doğrulama kodu gönderildi.
                  </p>
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-center" style={{ color: "hsl(var(--foreground))" }}>Doğrulama Kodu</label>
                    <input
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="keda-input text-center text-2xl font-mono tracking-widest py-4"
                      style={{ letterSpacing: "0.3em" }}
                      autoFocus
                    />
                    <p className="text-xs text-center mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>Kod 10 dakika geçerlidir</p>
                  </div>

                  <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-2.5 disabled:opacity-50">
                    {loading ? <div className="loading-dots"><span/><span/><span/></div> : "Doğrula ve Hesap Oluştur"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Kod gelmedi mi? </span>
                  <button onClick={resendOTP} disabled={loading} className="text-sm font-medium disabled:opacity-50" style={{ color: "hsl(var(--primary))" }}>
                    Tekrar gönder
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs mt-4" style={{ color: "hsl(var(--muted-foreground)/0.5)" }}>
          <Link href="/" className="hover:text-[hsl(var(--muted-foreground))] transition-colors">← Ana Sayfa</Link>
        </p>
      </motion.div>
    </div>
  );
}
