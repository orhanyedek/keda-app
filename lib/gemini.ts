/**
 * KEDA - AI Entegrasyonu (Groq)
 * Groq API ile llama-3.3-70b-versatile modeli kullanılıyor
 */

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

async function ask(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content || "";
}

// ==================== FLASHCARD ÜRETİMİ ====================
export async function generateFlashcards(text: string, count: number = 10) {
  const prompt = `Aşağıdaki metinden ${count} adet soru-cevap flashcard oluştur.

Metin:
${text.substring(0, 4000)}

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "flashcards": [
    { "soru": "Soru metni?", "cevap": "Cevap metni.", "zorluk": 3 },
    { "soru": "Soru metni?", "cevap": "Cevap metni.", "zorluk": 2 }
  ]
}

Zorluk 1-5 arası olsun. Sorular net ve öğretici olsun. Türkçe yaz.`;

  const response = await ask(prompt);
  const clean = response.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ==================== ÇALIŞMA PLANI ====================
export async function generateStudyPlan(params: {
  topics: string[];
  grades: { [key: string]: number };
  targetDays: number;
  unavailableDays: number[];
}) {
  const topicList = params.topics
    .map(t => `- ${t} (not: ${params.grades[t] || 0}/100)`)
    .join("\n");

  const prompt = `Aşağıdaki konular için ${params.targetDays} günlük çalışma planı oluştur.
Müsait olmayan günler (0=Pazar, 6=Cumartesi): ${params.unavailableDays.join(", ")}

Konular ve mevcut notlar:
${topicList}

Düşük notlu konulara daha fazla zaman ayır. Zorluk 4-5 olan konuları haftanın başına koy.

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "ozet": "Planın kısa özeti",
  "plan": [
    { "gun": 1, "konular": ["Konu adı"], "tahmini_sure_dk": 60, "zorluk_ortalama": 3 }
  ]
}`;

  const response = await ask(prompt);
  const clean = response.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ==================== PODCAST DIYALOGU ====================
export async function generatePodcastDialogue(text: string) {
  const prompt = `Aşağıdaki metni iki konuşmacının (A ve B) eğitim podcast diyaloğuna çevir.
A = Öğretmen (açıklayan), B = Öğrenci (soru soran).

Metin:
${text.substring(0, 3000)}

Kurallar:
- 10-15 konuşma satırı
- Doğal ve öğretici olsun
- Türkçe

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "baslik": "Podcast başlığı",
  "dialogue": [
    { "speaker": "A", "text": "Merhaba, bugün..." },
    { "speaker": "B", "text": "Hocam, şunu merak ediyorum..." }
  ]
}`;

  const response = await ask(prompt);
  const clean = response.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ==================== KONU ANALİZİ ====================
export async function analyzeTopics(text: string) {
  const prompt = `Aşağıdaki metinden çalışma konularını çıkar ve zorluklarını belirle.

Metin:
${text.substring(0, 3000)}

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "konular": [
    { "baslik": "Konu adı", "zorluk": 3 }
  ]
}

Zorluk 1-5 arası. Türkçe yaz.`;

  const response = await ask(prompt);
  const clean = response.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
