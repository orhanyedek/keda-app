/**
 * KEDA - Push Notification Yönetimi
 * Service Worker + Browser Push API
 */

// Service Worker kaydet
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (err) {
    console.error("SW kayıt hatası:", err);
    return null;
  }
}

// Bildirim izni iste
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  const permission = await Notification.requestPermission();
  return permission;
}

// Anlık lokal bildirim gönder (Service Worker üzerinden)
export async function sendLocalNotification(
  title: string,
  body: string,
  url: string = "/dashboard",
  tag: string = "keda"
) {
  if (!("serviceWorker" in navigator)) return;
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return;

  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag,
    data: { url },
    renotify: true,
  });
}

// Flashcard tekrar hatırlatıcısı zamanla
export async function scheduleFlashcardReminder(dueCount: number) {
  if (dueCount <= 0) return;
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return;

  // 5 dakika sonra hatırlat (sayfa açıkken)
  setTimeout(() => {
    sendLocalNotification(
      "Flashcard Tekrar Zamanı 🃏",
      `${dueCount} kart seni bekliyor. Şimdi çalış!`,
      "/dashboard/flashcards",
      "flashcard-reminder"
    );
  }, 5 * 60 * 1000);
}

// Pomodoro bitti bildirimi
export async function sendPomodoroNotification(mode: "work" | "short" | "long") {
  const messages = {
    work: { title: "Pomodoro Tamamlandı! ✅", body: "Harika iş! Mola zamanı." },
    short: { title: "Kısa Mola Bitti ☕", body: "Çalışmaya devam edelim!" },
    long: { title: "Uzun Mola Bitti 🎯", body: "Yeni bir pomodoro başlatalım!" },
  };
  const { title, body } = messages[mode];
  await sendLocalNotification(title, body, "/dashboard/pomodoro", "pomodoro");
}

// Günlük hatırlatıcı kur (her gün saat 10:00)
export async function scheduleDailyReminder() {
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return;

  const now = new Date();
  const target = new Date();
  target.setHours(10, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    sendLocalNotification(
      "Günlük Çalışma Zamanı 📚",
      "Bugün çalışma hedefini tamamladın mı?",
      "/dashboard",
      "daily-reminder"
    );
    // Her 24 saatte tekrar et
    setInterval(() => {
      sendLocalNotification(
        "Günlük Çalışma Zamanı 📚",
        "Bugün çalışma hedefini tamamladın mı?",
        "/dashboard",
        "daily-reminder"
      );
    }, 24 * 60 * 60 * 1000);
  }, delay);
}
