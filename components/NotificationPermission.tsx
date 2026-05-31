"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { requestNotificationPermission, registerServiceWorker, scheduleDailyReminder } from "@/lib/notifications";
import toast from "react-hot-toast";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const handleEnable = async () => {
    await registerServiceWorker();
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === "granted") {
      scheduleDailyReminder();
      toast.success("Bildirimler açıldı! Günlük hatırlatmalar alacaksın.");
    } else if (perm === "denied") {
      toast.error("Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsin.");
    }
  };

  if (!("Notification" in window)) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))]"
      style={{ background: "hsl(var(--muted))" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.07)" }}>
          {permission === "granted" ? <BellRing className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            : permission === "denied" ? <BellOff className="w-4 h-4 text-red-400" />
            : <Bell className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
            {permission === "granted" ? "Bildirimler Açık" : permission === "denied" ? "Bildirimler Engellendi" : "Bildirimlere İzin Ver"}
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {permission === "granted" ? "Pomodoro ve tekrar hatırlatmaları alıyorsun"
              : permission === "denied" ? "Tarayıcı ayarlarından manuel açabilirsin"
              : "Pomodoro bitişi, flashcard tekrarı için"}
          </p>
        </div>
      </div>
      {permission === "default" && (
        <button onClick={handleEnable} className="btn-primary text-xs px-3 py-2">
          İzin Ver
        </button>
      )}
      {permission === "granted" && (
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(142 72% 29% / 0.15)", color: "hsl(142 72% 55%)", border: "1px solid hsl(142 72% 29% / 0.3)" }}>
           Aktif
        </span>
      )}
    </div>
  );
}
