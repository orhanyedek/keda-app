# KEDA - Akilli Calisma Asistani

> Yapay zeka destekli akademik platform · Yazilim Muhendisligi Dersi Projesi · Nisan 2026

## Proje Ekibi

| Uye | Modul | Sorumluluk |
|-----|-------|------------|
| Sezin Nisa Ataseven | M-01 Ajanda | OCR, Gemini planlama API, task-based scheduler |
| Kerem Mert Duru | M-02 Podcast | PDF parse, Gemini diyalog, TTS entegrasyonu |
| Mustafa Cakmak | M-03 Flashcard | Flashcard pipeline, Spaced Repetition motoru |
| Orhan Pala | M-04 Arayuz | Dashboard, auth akisi, responsive layout |
| **Serdar Durgut** | **Proje Katkilari** | **Genel katkı ve destek** |

## Ozellikler

- **Akilli Calisma Plani (M-01)**: Sinav tarihine gore konu bazli plan
- **PDF Podcast (M-02)**: Ders notlarindan iki sesli diyalog
- **Flashcard + Spaced Repetition (M-03)**: Leitner 5-kutu algoritmasi
- **Modern Dashboard (M-04)**: Dark tema, responsive, animasyonlu UI

## Teknoloji Yigini

- **Frontend**: Next.js 16 · TypeScript · Tailwind CSS · Framer Motion
- **Backend/DB**: Supabase (PostgreSQL) · Supabase Auth
- **AI**: Google Gemini 2.0 Flash API
- **Auth**: Supabase JWT (Access + Refresh Token)

## Kurulum

```bash
# Bagimliliklari yukle
npm install

# Gelistirme sunucusunu baslat
npm run dev

# http://localhost:3000 adresini ac
```

## Cevre Degiskenleri (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

## Klasor Yapisi

```
keda-app/
├── app/                    # Next.js App Router sayfalar
│   ├── page.tsx            # Ana sayfa (landing)
│   ├── auth/               # Giris/Kayit sayfalar
│   └── dashboard/          # Korumal dashboard sayfalar
├── components/             # Paylasilan UI bilesenleri
├── lib/                    # Supabase & Gemini istemcileri
├── hooks/                  # React custom hook lari
└── types/                  # TypeScript tip tanimlari
```

## Veri Modeli

Dokumandaki tablolar (Bolum 4) temel alinarak Supabase'de olusturulacak:
- `users` - Kullanici profili
- `flashcards` - Leitner kutulariyla kartlar
- `plans` - Calisma planlari
- `topics` - Konu listesi
- `podcasts` - Uretilen podcastler
- `pdf_documents` - Yuklenen PDF ler

---

*KEDA © 2026 · Yazilim Muhendisligi Dersi*
