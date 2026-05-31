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
import ThemeToggle from "@/components/ThemeToggle";
import Notifications from "@/components/Notifications";
import Search from "@/components/Search";
import UserAvatar from "@/components/UserAvatar";
import { registerServiceWorker, scheduleDailyReminder } from "@/lib/notifications";
import toast from "react-hot-toast";

// Ayarlar alt menüsü
function SettingsMenu({ userName, onSignOut }: { userName: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const settingsItems = [
    {
      href: "/dashboard/profile",
      label: "Profil",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      href: "/dashboard/stats",
      label: "İstatistik",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
  ];

  return (
    <div className="relative">
      {/* Ayarlar açılır menü - yukarı açılır */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl z-50"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="p-2 space-y-0.5">
              {settingsItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    pathname.startsWith(item.href) ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                  }`}>
                  <span className={pathname.startsWith(item.href) ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground)/0.6)]"}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-[hsl(var(--border))] p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Tema</span>
                <ThemeToggle />
              </div>
              <button onClick={onSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayarlar butonu */}
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          open ? "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
        }`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="flex-1 text-left">Ayarlar</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </motion.svg>
      </button>
    </div>
  );
}

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
    href: "/dashboard/ai",
    label: "KEDA AI",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/pomodoro",
    label: "Pomodoro",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/notes",
    label: "Not Defteri",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/exams",
    label: "Sınav Takvimi",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/summarize",
    label: "Özetleme",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/quiz",
    label: "Quiz",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/depot",
    label: "Depo",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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

  // Service Worker kaydet ve günlük hatırlatıcı kur
  useEffect(() => {
    if (!user) return;
    registerServiceWorker();
    // Bildirim izni varsa günlük hatırlatıcı kur
    if ("Notification" in window && Notification.permission === "granted") {
      scheduleDailyReminder();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Çıkış yapıldı");
    router.push("/");
    router.refresh();
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
      <aside className="hidden lg:flex flex-col w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg)" opacity="0.82"/></svg>
              <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>KEDA</span>
            </Link>
            {user && <Notifications userId={user.id} />}
          </div>
        </div>

        {/* Kullanici bilgisi */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted))] mb-3">
            <UserAvatar userId={user.id} userName={userName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{userName}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
            </div>
          </div>
          <Search />
        </div>

        {/* Navigasyon linkleri */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive(item.href, item.exact)
                  ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-indigo-500/20"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              }`}
            >
              <span className={`${isActive(item.href, item.exact) ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"} transition-colors`}>
                {item.icon}
              </span>
              {item.label}
              {item.module && (
                <span className="ml-auto text-xs text-[hsl(var(--muted-foreground)/0.5)] font-mono">{item.module}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Ayarlar & Çıkış */}
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <SettingsMenu userName={userName} onSignOut={handleSignOut} />
        </div>
      </aside>

      {/* ====== MOBİL HEADER ====== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-[hsl(var(--border))] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="kg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg2)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg2)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg2)" opacity="0.82"/></svg>
          <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>KEDA</span>
        </Link>
        <div className="flex items-center gap-2">
          <Search />
          {user && <Notifications userId={user.id} />}
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
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
              className="fixed left-0 top-0 bottom-0 w-64 bg-dark-800 border-r border-[hsl(var(--border))] z-50 lg:hidden flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <svg width="26" height="26" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="kgd" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7"/><stop offset="55%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgd)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgd)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgd)" opacity="0.82"/></svg>
                  <span className="text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>KEDA</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-[hsl(var(--muted-foreground))]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href, item.exact) ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-[hsl(var(--border))]">
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))] hover:text-red-400">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-[hsl(var(--border))] px-2 py-2 flex justify-around z-40">
        {navItems.filter(item => ["/dashboard", "/dashboard/agenda", "/dashboard/flashcards", "/dashboard/ai", "/dashboard/profile"].includes(item.href)).map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              isActive(item.href, item.exact) ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            }`}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
