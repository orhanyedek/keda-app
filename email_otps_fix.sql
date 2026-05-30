-- email_otps tablosunu sil ve yeniden oluştur (tam izinli)
DROP TABLE IF EXISTS public.email_otps;

CREATE TABLE public.email_otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS tamamen kapat
ALTER TABLE public.email_otps DISABLE ROW LEVEL SECURITY;

-- Anon role'e tam yetki ver
GRANT ALL ON public.email_otps TO anon;
GRANT ALL ON public.email_otps TO authenticated;
GRANT ALL ON public.email_otps TO service_role;

CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email);

SELECT 'email_otps tablosu hazır' AS mesaj;
