/**
 * Supabase Client Konfigürasyonu
 * 
 * Bu dosya Supabase bağlantısını ve temel auth işlemlerini yönetir.
 * Proje: KEDA - Akıllı Çalışma Asistanı
 * 
 * Sorumlu: Orhan Pala (M-04 Kullanıcı Deneyimi & Arayüz)
 * Katkı: Serdar Durgut
 */

import { createClient } from "@supabase/supabase-js";

// Supabase bağlantı değerleri .env.local dosyasından alınır
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase istemcisi - tüm API çağrıları bu istemci üzerinden yapılır
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ==================== İNAKTİVİTE KONTROLÜ ====================
const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 saat (ms)
const LAST_ACTIVE_KEY = "keda_last_active";

export function updateLastActive() {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export async function checkInactivityAndLogout() {
  try {
    if (typeof window === "undefined") return;
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActive) {
      updateLastActive();
      return;
    }
    const elapsed = Date.now() - parseInt(lastActive);
    if (elapsed > INACTIVITY_LIMIT) {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      await supabase.auth.signOut();
      window.location.href = "/auth/login?reason=inactivity";
    }
  } catch { /* ignore */ }
}


// ==================== AUTH FONKSİYONLARI ====================

/**
 * Kullanıcı Kaydı
 * Yeni kullanıcı oluşturur ve profil bilgilerini kaydeder
 */
export async function signUp(email: string, password: string, fullName: string, username?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username || fullName,
      },
    },
  });
  return { data, error };
}

/**
 * Kullanıcı Girişi
 * E-posta ve şifre ile oturum açar
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Kullanıcı Çıkışı
 * Aktif oturumu sonlandırır ve token'ları temizler
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Mevcut Oturumu Getir
 * Sayfa yenilenmesinde oturum bilgisini kontrol eder
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * Mevcut Kullanıcıyı Getir
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

// OAuth ile giriş (Google, GitHub)
export async function signInWithOAuth(provider: "google" | "github") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}
