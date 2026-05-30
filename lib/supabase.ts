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
    // Oturum bilgilerini localStorage'da saklar (tarayıcı yenilenmesinde oturum kaybolmaz)
    persistSession: true,
    // Otomatik token yenileme - 15 dk access token, 7 gün refresh token
    autoRefreshToken: true,
  },
});

// ==================== AUTH FONKSİYONLARI ====================

/**
 * Kullanıcı Kaydı
 * Yeni kullanıcı oluşturur ve profil bilgilerini kaydeder
 */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
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
