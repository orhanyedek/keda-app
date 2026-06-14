"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Clock, CalendarDays, Layers, UserPlus } from "lucide-react";
import { getDashboardStats } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "flashcard" | "plan" | "info" | "friend_request";
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  read: boolean;
  action?: string;
}

export default function Notifications({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    loadNotifications();

    // Realtime: yeni arkadaşlık isteği
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("friend-requests-" + userId)
        .on("postgres_changes" as any, {
          event: "INSERT",
          schema: "public",
          table: "friendships",
        }, async (payload: any) => {
          // Sadece bu kullanıcıya gelen istekleri işle
          if (payload.new.receiver_id !== userId) return;
          try {
            const { data: senderStats } = await supabase
              .from("user_stats_public")
              .select("display_name")
              .eq("user_id", payload.new.requester_id)
              .single();

            const senderName = senderStats?.display_name || "Bir kullanıcı";
            const notif: Notification = {
              id: `friend-req-${payload.new.id}`,
              type: "friend_request",
              title: "Arkadaşlık İsteği",
              desc: `${senderName} seni takip etmek istiyor.`,
              icon: UserPlus,
              color: "text-[hsl(var(--foreground))]",
              read: false,
              action: "/dashboard/friends",
            };
            setNotifications(prev => [notif, ...prev]);

            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("KEDA — Yeni Arkadaşlık İsteği", {
                body: `${senderName} seni takip etmek istiyor.`,
                icon: "/favicon.svg",
              });
            }
          } catch { /* ignore */ }
        })
        .subscribe();
    } catch { /* Realtime desteklenmiyorsa sessizce geç */ }

    return () => { if (channel) try { supabase.removeChannel(channel); } catch { /* ignore */ } };
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;
    getDashboardStats(userId).then(stats => {
      const items: Notification[] = [];
      if (stats.bugun_tekrar_edilecek > 0) {
        items.push({ id: "flashcard-due", type: "flashcard", title: "Tekrar Zamanı",
          desc: `${stats.bugun_tekrar_edilecek} flashcard bugün seni bekliyor.`,
          icon: Clock, color: "text-amber-400", read: false });
      }
      if (stats.aktif_plan) {
        const pending = stats.aktif_plan.topics?.filter((t: { tamamlandi_mi: boolean }) => !t.tamamlandi_mi).length || 0;
        if (pending > 0) {
          items.push({ id: "plan-pending", type: "plan", title: "Çalışma Planı",
            desc: `${stats.aktif_plan.baslik} — ${pending} konu bekliyor.`,
            icon: CalendarDays, color: "text-[hsl(var(--foreground))]", read: false });
        }
      }
      if (stats.toplam_flashcard === 0) {
        items.push({ id: "welcome", type: "info", title: "Başlamaya Hazır mısın?",
          desc: "İlk flashcard setini oluşturmak için Flashcard modülüne git.",
          icon: Layers, color: "text-emerald-400", read: false });
      }
      const readIds: string[] = JSON.parse(localStorage.getItem("keda_read_notifs") || "[]");
      setNotifications(items.map(n => ({ ...n, read: readIds.includes(n.id) })));
    });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id: string) => {
    const readIds: string[] = JSON.parse(localStorage.getItem("keda_read_notifs") || "[]");
    if (!readIds.includes(id)) {
      localStorage.setItem("keda_read_notifs", JSON.stringify([...readIds, id]));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    localStorage.setItem("keda_read_notifs", JSON.stringify(ids));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl glass flex items-center justify-center transition-all"
        style={{ color: "hsl(var(--muted-foreground))" }}>
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 w-80 rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl z-50"
            style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Bildirimler</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Tümünü okundu işaretle
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ color: "hsl(var(--muted-foreground))" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Bildirim yok</p>
                </div>
              ) : notifications.map(n => {
                const Icon = n.icon;
                return (
                  <div key={n.id}
                    onClick={() => {
                      markRead(n.id);
                      if (n.action) { router.push(n.action); setOpen(false); }
                    }}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[hsl(var(--border))] last:border-0 transition-colors ${n.action ? "cursor-pointer hover:bg-[hsl(var(--accent))]" : ""} ${!n.read ? "bg-[hsl(var(--accent)/0.5)]" : ""}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "hsl(var(--secondary))" }}>
                      <Icon className={`w-4 h-4 ${n.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{n.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{n.desc}</p>
                      {n.action && (
                        <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground)/0.5)" }}>
                          Görmek için tıkla
                        </p>
                      )}
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(var(--foreground))" }} />}
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
