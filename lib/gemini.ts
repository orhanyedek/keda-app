/**
 * KEDA - AI Entegrasyonu (Groq)
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

Düşük notlu konulara daha fazla zaman ayır.

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

// ==================== PODCAST ÖZETİ ====================
export async function generatePodcastSummary(
  text: string,
  style: string = "standard",
  length: string = "medium"
) {
  const lengthMap: Record<string, number> = { short: 4, medium: 7, long: 12 };
  const paraCount = lengthMap[length] || 7;

  const styleDesc: Record<string, string> = {
    standard: "açık, akıcı ve öğretici bir dilde",
    simple: "çok sade, günlük konuşma dilinde, teknik terimlerden kaçınarak",
    detailed: "detaylı, örneklerle zenginleştirilmiş, akademik bir dilde",
    story: "bir hikaye anlatır gibi, ilgi çekici bir anlatımla",
  };

  const prompt = `Aşağıdaki metni ${styleDesc[style] || styleDesc.standard} özetle.

Metin:
${text.substring(0, 5000)}

Kurallar:
- Tam olarak ${paraCount} paragraf yaz
- Her paragraf 2-4 cümle olsun
- Sesli okunmaya uygun, akıcı Türkçe kullan
- Her paragraf tek bir ana fikri işlesin
- Paragraflar birbirini mantıksal olarak takip etsin

SADECE şu JSON formatında yanıt ver:
{
  "baslik": "Özet başlığı",
  "paragraflar": [
    "Birinci paragraf metni...",
    "İkinci paragraf metni...",
    "Üçüncü paragraf metni..."
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
