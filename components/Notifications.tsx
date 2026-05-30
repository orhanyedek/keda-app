"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Clock, CalendarDays, Layers } from "lucide-react";
import { getDashboardStats } from "@/lib/db";

interface Notification {
  id: string;
  type: "flashcard" | "plan" | "info";
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  read: boolean;
}

export default function Notifications({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    getDashboardStats(userId).then(stats => {
      const items: Notification[] = [];
      if (stats.bugun_tekrar_edilecek > 0) {
        items.push({
          id: "flashcard-due",
          type: "flashcard",
          title: "Tekrar Zamanı",
          desc: `${stats.bugun_tekrar_edilecek} flashcard bugün seni bekliyor.`,
          icon: Clock,
          color: "text-amber-400",
          read: false,
        });
      }
      if (stats.aktif_plan) {
        const pending = stats.aktif_plan.topics?.filter((t: { tamamlandi_mi: boolean }) => !t.tamamlandi_mi).length || 0;
        if (pending > 0) {
          items.push({
            id: "plan-pending",
            type: "plan",
            title: "Çalışma Planı",
            desc: `${stats.aktif_plan.baslik} — ${pending} konu bekliyor.`,
            icon: CalendarDays,
            color: "text-indigo-400",
            read: false,
          });
        }
      }
      if (stats.toplam_flashcard === 0) {
        items.push({
          id: "welcome",
          type: "info",
          title: "Başlamaya Hazır mısın?",
          desc: "İlk flashcard setini oluşturmak için Flashcard modülüne git.",
          icon: Layers,
          color: "text-emerald-400",
          read: false,
        });
      }
      // Okunmuş bildirimleri localStorage'dan kontrol et
      const readIds: string[] = JSON.parse(localStorage.getItem("keda_read_notifs") || "[]");
      setNotifications(items.map(n => ({ ...n, read: readIds.includes(n.id) })));
    });
  }, [userId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const readIds: string[] = JSON.parse(localStorage.getItem("keda_read_notifs") || "[]");
    if (!readIds.includes(id)) {
      localStorage.setItem("keda_read_notifs", JSON.stringify([...readIds, id]));
    }
  };

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    localStorage.setItem("keda_read_notifs", JSON.stringify(ids));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 w-80 keda-card border border-white/10 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-white text-sm font-semibold">Bildirimler</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Tümünü oku
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-600 text-sm">Bildirim yok</div>
              ) : notifications.map(n => {
                const Icon = n.icon;
                return (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${n.read ? "opacity-50" : ""}`}>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${n.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
