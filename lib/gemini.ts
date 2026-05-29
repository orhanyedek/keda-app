/**
 * Google Gemini API Konfigürasyonu
 * 
 * Bu dosya Gemini AI entegrasyonunu yönetir.
 * KEDA'nın tüm yapay zeka özellikleri (konu analizi, flashcard üretimi,
 * podcast diyalogu, çalışma planı) bu modül üzerinden çalışır.
 * 
 * Sorumlu: Sezin Nisa Ataseven (M-01), Kerem Mert Duru (M-02), Mustafa Çakmak (M-03)
 * Katkı: Serdar Durgut
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API istemcisi başlatılır
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Gemini 2.0 Flash modeli - hızlı ve verimli
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// ==================== FLASHCARD ÜRETİMİ (M-03) ====================

/**
 * PDF metninden Flashcard Üretimi
 * 
 * Mustafa Çakmak - M-03 Flash Notlar Modülü
 * Gemini API ile verilen metinden soru-cevap çiftleri oluşturur.
 * Leitner Spaced Repetition algoritması ile birlikte çalışır.
 */
export async function generateFlashcards(text: string, count: number = 10) {
  // Gemini'ye gönderilecek prompt - JSON formatında yanıt istenir
  const prompt = `Sen bir eğitim asistanısın. Aşağıdaki metinden ${count} adet flashcard (soru-cevap kartı) oluştur.
  
Metin:
${text}

Lütfen SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey ekleme:
{
  "flashcards": [
    {
      "soru": "Soru buraya yazılır",
      "cevap": "Cevap buraya yazılır",
      "zorluk": 3
    }
  ]
}

Zorluk seviyesi 1 (çok kolay) ile 5 (çok zor) arasında olmalıdır.
Sorular net ve anlaşılır olsun. Cevaplar kısa ve öz olsun.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    
    // JSON yanıtını temizle ve parse et
    const cleanedResponse = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Flashcard üretim hatası:", error);
    throw error;
  }
}

// ==================== ÇALIŞMA PLANI (M-01) ====================

/**
 * Çalışma Planı Oluşturma
 * 
 * Sezin Nisa Ataseven - M-01 Akıllı Eğitim & Ajanda Modülü
 * Girilen konular ve süreye göre kişiselleştirilmiş çalışma planı oluşturur.
 * Zorluk seviyesine göre konuları günlere dağıtır (IK-A04 iş kuralı).
 */
export async function generateStudyPlan(params: {
  topics: string[];
  grades: { [topic: string]: number };
  targetDays: number;
  unavailableDays: number[];
}) {
  const daysOfWeek = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const unavailableNames = params.unavailableDays.map(d => daysOfWeek[d]).join(", ");

  const prompt = `Sen bir akademik planlama asistanısın. Aşağıdaki bilgilere göre konu odaklı (task-based) çalışma planı oluştur.

Konular ve Notlar:
${params.topics.map(t => `- ${t}: ${params.grades[t] || "not girilmedi"}/100`).join("\n")}

Toplam süre: ${params.targetDays} gün
Müsait olmayan günler: ${unavailableNames || "Yok"}

Kurallar:
- Düşük not alan konular (50 altı) daha fazla zaman almalı
- Zorluk 4-5 konular haftanın başına, 1-2 konular sonuna dağıtılmalı
- Her güne maksimum 3 konu ata

SADECE şu JSON formatında yanıt ver:
{
  "plan": [
    {
      "gun": 1,
      "tarih_offset": 0,
      "konular": ["Konu 1", "Konu 2"],
      "tahmini_sure_dk": 120,
      "zorluk_ortalama": 3
    }
  ],
  "ozet": "Genel plan özeti buraya"
}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const cleanedResponse = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Çalışma planı üretim hatası:", error);
    throw error;
  }
}

// ==================== PODCAST DİYALOGU (M-02) ====================

/**
 * PDF Metninden Podcast Diyalogu Üretimi
 * 
 * Kerem Mert Duru - M-02 Podcast & Ses Üretimi Modülü
 * Verilen metni iki konuşmacılı (Öğrenci-Öğretmen) diyalog formatına çevirir.
 * Bu metin daha sonra TTS ile seslendirilir.
 */
export async function generatePodcastDialogue(text: string) {
  const prompt = `Sen bir eğitim podcast senaryosu yazarısın. Aşağıdaki metni iki konuşmacının (A ve B) diyaloğuna çevir.
A = Öğretmen (açıklayan), B = Öğrenci (soru soran).

Metin:
${text.substring(0, 3000)}

Kurallar:
- Diyalog doğal, akıcı ve öğretici olsun
- 10-15 konuşma satırı olsun
- Türkçe olsun

SADECE şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "baslik": "Podcast başlığı",
  "dialogue": [
    { "speaker": "A", "text": "Merhaba! Bugün..." },
    { "speaker": "B", "text": "Hocam, şunu merak ediyorum..." }
  ]
}`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const cleanedResponse = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Podcast diyalogu üretim hatası:", error);
    throw error;
  }
}

// ==================== KONU ANALİZİ ====================

/**
 * Metin Konu Analizi
 * Yüklenen PDF metninden konu başlıklarını çıkarır
 */
export async function analyzeTopics(text: string) {
  const prompt = `Aşağıdaki akademik metinden ana konu başlıklarını çıkar.

Metin:
${text.substring(0, 5000)}

SADECE şu JSON formatında yanıt ver:
{
  "konular": [
    {
      "baslik": "Konu başlığı",
      "zorluk": 3,
      "aciklama": "Kısa açıklama"
    }
  ]
}

Zorluk 1-5 arasında, 5 en zor.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const cleanedResponse = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Konu analiz hatası:", error);
    throw error;
  }
}
