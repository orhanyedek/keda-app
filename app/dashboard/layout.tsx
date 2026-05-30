/**
 * KEDA - Dashboard Layout
 * 
 * Tum dashboard sayfalarini saran layout.
 * Sol tarafta sidebar navigasyon vardir (masaustu).
 * Mobilede alt navigasyon cubugu gosterilir (M-04 gereksinim 3.16).
 * JWT kontrolu yapilir - yetkisiz erisimde login a yonlendirilir (KT-09).
 * 
 * Sorumlu: Orhan Pala (M-04 Kullanici Deneyimi & Arayuz)
 * Katki: Serdar Durgut
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase";
import toast from "react-hot-toast";

// Navigasyon menusu - her modul bir menü öğesi
const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 10a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H5a2 2 0 01-2-2v0zm10-10a2 2 0 012-2h4a2 2 0 012 2v10a2 2 0 01-2 2h-4a2 2 0 01-2-2V7z" />
      </svg>
    ),
    exact: true,
  },
  {
    href: "/dashboard/agenda",
    label: "Ajanda",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    module: "M-01",
  },
  {
    href: "/dashboard/podcast",
    label: "Podcast",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    module: "M-02",
  },
  {
    href: "/dashboard/flashcards",
    label: "Flashcard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    module: "M-03",
  },
  {
    href: "/dashboard/profile",
    label: "Profil",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/ai",
    label: "KEDA AI",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Yetkisiz erisim kontrolu (KT-09)
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Cikis yapildi");
    router.push("/");
  };

  // Yuklenme ekrani
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots flex gap-2">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Kullanici";

  return (
    <div className="min-h-screen flex">
      {/* ====== SIDEBAR (Masaustu) ====== */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-dark-900/50 backdrop-blur-xl fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="text-xl font-bold gradient-text">KEDA</span>
          </Link>
        </div>

        {/* Kullanici bilgisi */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center text-indigo-300 font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigasyon linkleri */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive(item.href, item.exact)
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={`${isActive(item.href, item.exact) ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                {item.icon}
              </span>
              {item.label}
              {item.module && (
                <span className="ml-auto text-xs text-slate-600 font-mono">{item.module}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Cikis butonu */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cikis Yap
          </button>
        </div>
      </aside>

      {/* ====== MOBİL HEADER ====== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">K</div>
          <span className="text-lg font-bold gradient-text">KEDA</span>
        </Link>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobil Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <span className="text-lg font-bold gradient-text">KEDA</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href, item.exact) ? "bg-indigo-600/20 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-white/5">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:text-red-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cikis Yap
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== ANA ICERIK ALANI ====== */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>

      {/* ====== MOBİL ALT NAVİGASYON (< 768px) ====== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-4 py-2 flex justify-around z-40">
        {navItems.slice(0, 4).map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              isActive(item.href, item.exact) ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
