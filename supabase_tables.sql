-- ============================================================
-- KEDA - Supabase Veritabanı Tabloları
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştır
-- ============================================================

-- UUID extension (genellikle zaten aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== KULLANICI PROFİLİ ====================
-- Supabase Auth'un users tablosunu genişletir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yeni kullanıcı kaydında otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== PDF DÖKÜMANLAR ====================
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dosya_adi TEXT NOT NULL,
  dosya_yolu TEXT NOT NULL,
  cikarilan_metin TEXT,
  durum TEXT DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'tamamlandi', 'hata')),
  sayfa_sayisi INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== FLASHCARD SETLERİ ====================
CREATE TABLE IF NOT EXISTS public.flashcard_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baslik TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== FLASHCARDLAR ====================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  set_id UUID REFERENCES public.flashcard_sets(id) ON DELETE CASCADE,
  pdf_id UUID REFERENCES public.pdf_documents(id) ON DELETE SET NULL,
  soru TEXT NOT NULL,
  cevap TEXT NOT NULL,
  kutu_no INTEGER DEFAULT 1 CHECK (kutu_no BETWEEN 1 AND 5),
  sonraki_gosterim TIMESTAMPTZ DEFAULT NOW(),
  dogru_sayisi INTEGER DEFAULT 0,
  yanlis_sayisi INTEGER DEFAULT 0,
  zorluk INTEGER DEFAULT 3 CHECK (zorluk BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ÇALIŞMA PLANLARI ====================
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baslik TEXT,
  baslangic_tarihi DATE DEFAULT CURRENT_DATE,
  hedef_gun_sayisi INTEGER DEFAULT 7,
  musait_olmayan_gunler INTEGER[] DEFAULT '{}',
  durum TEXT DEFAULT 'aktif' CHECK (durum IN ('aktif', 'tamamlandi', 'iptal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== KONULAR ====================
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES public.study_plans(id) ON DELETE CASCADE NOT NULL,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baslik TEXT NOT NULL,
  zorluk_seviyesi INTEGER DEFAULT 3 CHECK (zorluk_seviyesi BETWEEN 1 AND 5),
  tamamlandi_mi BOOLEAN DEFAULT FALSE,
  hedef_gun INTEGER DEFAULT 1,
  tahmini_sure_dk INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PODCASTLER ====================
CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_id UUID REFERENCES public.pdf_documents(id) ON DELETE SET NULL,
  baslik TEXT NOT NULL,
  diyalog_metni TEXT,
  ses_dosyasi_url TEXT,
  sure_saniye INTEGER,
  durum TEXT DEFAULT 'hazirlanıyor' CHECK (durum IN ('hazirlanıyor', 'hazır', 'hata')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ROW LEVEL SECURITY ====================
-- Her kullanıcı sadece kendi verisini görsün

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Kullanici kendi profilini gorebilir" ON public.profiles FOR ALL USING (auth.uid() = id);

-- PDF Documents
CREATE POLICY "Kullanici kendi PDF lerini gorebilir" ON public.pdf_documents FOR ALL USING (auth.uid() = kullanici_id);

-- Flashcard Sets
CREATE POLICY "Kullanici kendi setlerini gorebilir" ON public.flashcard_sets FOR ALL USING (auth.uid() = kullanici_id);

-- Flashcards
CREATE POLICY "Kullanici kendi flashcardlarini gorebilir" ON public.flashcards FOR ALL USING (auth.uid() = kullanici_id);

-- Study Plans
CREATE POLICY "Kullanici kendi planlarini gorebilir" ON public.study_plans FOR ALL USING (auth.uid() = kullanici_id);

-- Topics
CREATE POLICY "Kullanici kendi konularini gorebilir" ON public.topics FOR ALL USING (auth.uid() = kullanici_id);

-- Podcasts
CREATE POLICY "Kullanici kendi podcastlerini gorebilir" ON public.podcasts FOR ALL USING (auth.uid() = kullanici_id);

-- ==================== İNDEKSLER (Performans) ====================
CREATE INDEX IF NOT EXISTS idx_flashcards_kullanici ON public.flashcards(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_sonraki_gosterim ON public.flashcards(sonraki_gosterim);
CREATE INDEX IF NOT EXISTS idx_flashcards_kutu_no ON public.flashcards(kutu_no);
CREATE INDEX IF NOT EXISTS idx_topics_plan ON public.topics(plan_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_kullanici ON public.podcasts(kullanici_id);

-- ==================== TAMAMLANDI ====================
SELECT 'KEDA tabloları başarıyla oluşturuldu!' AS mesaj;
