"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signInWithOAuth } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google"|"github"|null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failCount >= 5) { toast.error("Hesabınız kilitlendi. 15 dakika bekleyin."); return; }
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        setFailCount(p => p + 1);
        toast.error(failCount >= 4 ? "Hesabınız kilitlendi." : `Hatalı bilgi. ${5 - failCount - 1} deneme kaldı.`);
        return;
      }
      if (data.session) { toast.success("Hoş geldiniz!"); router.push("/dashboard"); router.refresh(); }
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: "google"|"github") => {
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);
    if (error) { toast.error(`${provider} ile giriş başarısız`); setOauthLoading(null); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "hsl(var(--background))" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">K</div>
            <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>KEDA</span>
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))", letterSpacing: "-0.01em" }}>Giriş Yap</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Hesabınıza erişin</p>
        </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(var(--foreground))" }}>E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" required className="keda-input" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Şifre</label>
                <Link href="/auth/reset-password" className="text-xs" style={{ color: "hsl(var(--primary))" }}>Unuttum</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="keda-input pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {failCount > 0 && failCount < 5 && (
              <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{5 - failCount} deneme hakkınız kaldı</p>
            )}

            <button type="submit" disabled={loading || failCount >= 5} className="btn-primary w-full py-2.5 disabled:opacity-50">
              {loading ? <div className="loading-dots"><span/><span/><span/></div> : "Giriş Yap"}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Hesabın yok mu?{" "}
            <Link href="/auth/register" style={{ color: "hsl(var(--primary))" }} className="font-medium">Kayıt Ol</Link>
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "hsl(var(--muted-foreground)/0.5)" }}>
          <Link href="/" className="hover:text-[hsl(var(--muted-foreground))] transition-colors">← Ana Sayfa</Link>
        </p>
      </motion.div>
    </div>
  );
}
