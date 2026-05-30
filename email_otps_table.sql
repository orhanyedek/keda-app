-- Email OTP doğrulama tablosu
CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS kapat (sadece service role erişecek)
ALTER TABLE public.email_otps DISABLE ROW LEVEL SECURITY;

-- 10 dakika sonra otomatik temizle (opsiyonel)
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON public.email_otps(expires_at);
