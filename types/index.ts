/**
 * KEDA - Tip Tanımlamaları
 * 
 * Bu dosya projenin tüm TypeScript tip tanımlamalarını içerir.
 * Veri modeli dokümandaki tablolar (Bölüm 4) temel alınarak oluşturulmuştur.
 */

// ==================== KULLANICI ====================

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  avatar_url?: string;
}

// ==================== FLASHCARD (M-03 - Mustafa Çakmak) ====================

/**
 * Flashcard - Leitner Spaced Repetition ile birlikte çalışır
 * kutu_no: 1-5 arası (1=en sık, 5=en az tekrar)
 */
export interface Flashcard {
  id: string;
  kullanici_id: string;
  pdf_id?: string;
  soru: string;
  cevap: string;
  kutu_no: number; // Leitner kutusu: 1-5
  sonraki_gosterim: string; // ISO 8601 tarih
  dogru_sayisi: number;
  yanlis_sayisi: number;
  zorluk: number; // 1-5
  created_at: string;
}

export interface FlashcardSet {
  id: string;
  kullanici_id: string;
  baslik: string;
  kart_sayisi: number;
  tamamlanan_kart: number;
  created_at: string;
  flashcards?: Flashcard[];
}

// Spaced Repetition oturum sonucu
export interface SessionSummary {
  toplam_kart: number;
  dogru: number;
  yanlis: number;
  sure_dakika: number;
  en_zor_konular: string[];
}

// ==================== ÇALIŞMA PLANI (M-01 - Sezin Nisa Ataseven) ====================

/**
 * Çalışma Planı - Task-based yaklaşım (saat değil konu bazlı)
 */
export interface StudyPlan {
  id: string;
  kullanici_id: string;
  baslangic_tarihi: string;
  hedef_gun_sayisi: number;
  musait_olmayan_gunler: number[]; // [0=Pazar, 6=Cumartesi]
  durum: "aktif" | "tamamlandi" | "iptal";
  created_at: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  plan_id: string;
  baslik: string;
  zorluk_seviyesi: number; // 1-5
  tamamlandi_mi: boolean;
  hedef_gun: number; // Kaçıncı günde çalışılacak
  tahmini_sure_dk: number;
}

export interface Grade {
  id: string;
  kullanici_id: string;
  konu_id: string;
  puan: number; // 0-100
  tarih: string;
}

// ==================== PODCAST (M-02 - Kerem Mert Duru) ====================

/**
 * Podcast - PDF'ten üretilen iki sesli içerik
 */
export interface Podcast {
  id: string;
  kullanici_id: string;
  pdf_id?: string;
  baslik: string;
  diyalog_metni: string; // JSON formatında diyalog
  ses_dosyasi_url?: string;
  sure_saniye?: number;
  durum: "hazirlanıyor" | "hazır" | "hata";
  created_at: string;
}

// ==================== PDF DÖKÜMAN ====================

/**
 * Yüklenen PDF dökümanları
 * Önbellek mekanizması: durum = 'tamamlandi' ise tekrar OCR yapılmaz (IK-A02, IK-P02)
 */
export interface PdfDocument {
  id: string;
  kullanici_id: string;
  dosya_adi: string;
  dosya_yolu: string;
  cikarilan_metin?: string;
  durum: "beklemede" | "tamamlandi" | "hata";
  sayfa_sayisi?: number;
  created_at: string;
}

// ==================== DASHBOARD ====================

// Dashboard için özet istatistikler
export interface DashboardStats {
  toplam_flashcard: number;
  bugun_tekrar_edilecek: number;
  aktif_plan: StudyPlan | null;
  son_podcast: Podcast | null;
  ardisik_gun: number; // Streak
  tamamlanan_konu: number;
}
