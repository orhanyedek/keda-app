/**
 * useAuth - Kimlik Doğrulama Hook'u
 * 
 * Bu hook kullanıcı oturumunu yönetir.
 * Tüm bileşenler bu hook üzerinden kullanıcı bilgisine erişir.
 * 
 * Sorumlu: Orhan Pala (M-04 Kullanıcı Deneyimi & Arayüz)
 */

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa ilk yüklendiğinde mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Oturum değişikliklerini dinle (giriş/çıkış olayları)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup - bileşen unmount olunca listener'ı kaldır
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
