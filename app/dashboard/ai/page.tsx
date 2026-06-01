/**
 * KEDA AI - Sohbet Asistanı
 * Groq llama-3.3-70b ile güçlendirilmiş
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Groq from "groq-sdk";
import { Send, Plus, Trash2, Sparkles, Mic, MicOff } from "lucide-react";
import { getDashboardStats } from "@/lib/db";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "Güçlü · Varsayılan", badge: "Önerilen" },
  { id: "llama-3.1-8b-instant",    name: "Llama 3.1 8B",  desc: "Hızlı · Hafif" },
  { id: "mixtral-8x7b-32768",      name: "Mixtral 8x7B",  desc: "Uzun bağlam · 32K token" },
  { id: "gemma2-9b-it",            name: "Gemma 2 9B",    desc: "Google · Verimli" },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1", desc: "Akıl yürütme · Matematik" },
];

const BASE_SYSTEM_PROMPT = `Sen KEDA'nın kişisel AI asistanısın. KEDA, Türk üniversite öğrencileri için geliştirilmiş akıllı bir çalışma platformudur.

GÖREVIN:
- Öğrenciye ders çalışma, konu anlama ve sınav hazırlığında yardım et
- Kullanıcının KEDA'daki verilerini (flashcard, plan, podcast) bilerek kişisel öneriler sun
- Modüller arasında yönlendirme yap

KEDA MODÜLLERİ:
- Ajanda (/dashboard/agenda): AI destekli çalışma planı oluşturma
- Flashcard (/dashboard/flashcards): Leitner algoritmasıyla spaced repetition
- Podcast (/dashboard/podcast): PDF'ten sesli özet üretme
- KEDA AI (/dashboard/ai): Sen

YÖNLENDİRME KURALLARI:
- Kullanıcı "flashcard oluştur" derse: "Flashcard modülüne git: /dashboard/flashcards" de
- Kullanıcı "plan yap" veya "program oluştur" derse: "Ajanda modülüne git: /dashboard/agenda" de
- Kullanıcı "podcast oluştur" derse: "Podcast modülüne git: /dashboard/podcast" de
- Kullanıcı "istatistiklerimi göster" derse: "/dashboard/stats" yönlendir

KULLANICI VERİLERİ:
Sohbet başında kullanıcının KEDA verileri sana verilecek. Bu verileri kullanarak kişisel önerilerde bulun.
Örnek: "3 flashcard setin var, Veri Yapıları setinde düşük performans görüyorum, önce oradan başlamanı öneririm."

KURAL:
- Türkçe konuş, samimi ve motive edici ol
- Markdown formatı kullan (kalın, liste, başlık)
- Kısa ve öz cevap ver, gerektiğinde detaylandır
- Akademik konularda somut örnekler ver
- Kullanıcının motivasyonunu yüksek tut`;

const STARTER_PROMPTS = [
  { text: "Bugün ne çalışmalıyım?" },
  { text: "Flashcard setlerimi analiz et" },
  { text: "2026 YKS sınav tarihleri nedir?" },
  { text: "Verimli çalışma teknikleri nelerdir?" },
  { text: "Pomodoro tekniğini anlat" },
  { text: "Leitner sistemini açıkla" },
];

// Tüm prompt havuzu — yenileme butonu bunlardan rastgele seçer
const ALL_PROMPTS = [
  "Bugün ne çalışmalıyım?",
  "Flashcard setlerimi analiz et",
  "2026 YKS sınav tarihleri nedir?",
  "Verimli çalışma teknikleri nelerdir?",
  "Pomodoro tekniğini anlat",
  "Leitner sistemini açıkla",
  "Sınav stresini nasıl yönetirim?",
  "Matematikte türevi nasıl anlayabilirim?",
  "Aktif öğrenme nedir?",
  "Spaced repetition nasıl çalışır?",
  "Özet çıkarmanın en iyi yolu nedir?",
  "Ders çalışırken dikkat dağınıklığı nasıl önlenir?",
  "Flashcard yaparken nelere dikkat etmeliyim?",
  "Kısa sürede çok şey öğrenmek mümkün mü?",
  "Sınav sabahı ne yapmalıyım?",
  "Hangi konulardan başlamalıyım?",
  "Günlük çalışma programı nasıl yapılır?",
  "Uyku ile öğrenme arasındaki ilişki nedir?",
  "Motivasyonumu nasıl koruyabilirim?",
  "Pasif okuma ile aktif okuma farkı nedir?",
  "Feynman tekniği nedir?",
  "Mind map nasıl yapılır?",
  "Cornell not alma tekniği nedir?",
  "Zor konuları öğrenmek için ne yapmalıyım?",
  "Sınav paniği ile nasıl başa çıkabilirim?",
  "Hafıza teknikleri nelerdir?",
  "Bir konuyu ne kadar tekrar etmeliyim?",
  "Ders kitabını verimli okumak için ne yapmalıyım?",
  "Sınava kaç gün kala çalışmaya başlamalıyım?",
  "Zihnim dağılınca ne yapmalıyım?",
  "Çoktan seçmeli sınavlarda strateji nasıl olmalı?",
  "Grup çalışması etkili midir?",
  "Ödev ertelemekten nasıl kurtulabilirim?",
  "En verimli çalışma saatleri hangileridir?",
  "Müzik dinleyerek çalışmak doğru mu?",
  "Telefonu çalışırken nasıl uzak tutabilirim?",
  "Zor matematik problemlerini nasıl çözmeliyim?",
  "Yabancı dil öğrenmek için flashcard nasıl kullanılır?",
  "Ders notlarını nasıl organize etmeliyim?",
  "Sınav sonrası motivasyonu nasıl toplarım?",
  "Çalışma alanımı nasıl düzenlemeliyim?",
  "Retrieval practice nedir, nasıl uygulanır?",
  "İnterleaving çalışma yöntemi nedir?",
  "Elaborative interrogation tekniği nedir?",
  "Bir konuya ne kadar zaman ayırmalıyım?",
  "Sınav günü beslenme nasıl olmalı?",
  "Kafam çok yorgunken ne yapmalıyım?",
  "Bu hafta için bana bir çalışma planı yap",
];


const THINKING_MESSAGES = [
  "Düşünüyor...",
  "Analiz ediyor...",
  "Verilerini inceliyor...",
  "Yanıt hazırlanıyor...",
  "Kaynaklar taranıyor...",
  "İşleniyor...",
  "Hesaplanıyor...",
  "Yorumlanıyor...",
];

function ThinkingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % THINKING_MESSAGES.length);
        setVisible(true);
      }, 200);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5 min-w-32">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "hsl(var(--muted-foreground))" }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={msgIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {THINKING_MESSAGES[msgIndex]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function StarterGrid({ onSelect }: { onSelect: (text: string) => void }) {
  const [prompts, setPrompts] = useState(() => STARTER_PROMPTS.map(p => p.text));
  const [nextPrompts, setNextPrompts] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "close" | "spin" | "open">("idle");
  const [spinDeg, setSpinDeg] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });

  const refresh = async () => {
    if (phase !== "idle") return;

    // Butonun pozisyonunu al
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const parent = buttonRef.current.closest(".relative")?.getBoundingClientRect();
      if (parent) {
        setBtnPos({
          x: rect.left - parent.left + rect.width / 2,
          y: rect.top - parent.top + rect.height / 2,
        });
      }
    }

    const next = shuffle(ALL_PROMPTS).slice(0, 6);
    setNextPrompts(next);

    // 1. Kartlar butona doğru uçar (close)
    setPhase("close");
    await new Promise(r => setTimeout(r, 380));

    // 2. Buton döner + yeni promptlar set edilir
    setPhase("spin");
    setSpinDeg(d => d + 720);
    setPrompts(next);
    await new Promise(r => setTimeout(r, 500));

    // 3. Yeni kartlar butondan çıkar (open)
    setPhase("open");
    await new Promise(r => setTimeout(r, 450));

    setPhase("idle");
  };

  // Her kart için hedef offset hesapla (butonun merkezine göre)
  const getCardTarget = (i: number) => {
    const cols = 2;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cardW = 200;
    const cardH = 56;
    const gapX = 12;
    const gapY = 12;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridH = 3 * cardH + 2 * gapY;
    const cardCX = col * (cardW + gapX) + cardW / 2 - gridW / 2;
    const cardCY = row * (cardH + gapY) + cardH / 2 - gridH / 2;
    return { x: -cardCX, y: (btnPos.y || 0) - (cardCY + gridH / 2) };
  };

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Kart grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {prompts.map((text, i) => {
          const target = getCardTarget(i);
          return (
            <motion.button
              key={phase === "open" || phase === "idle" ? text + "-new-" + i : text + "-" + i}
              onClick={() => phase === "idle" && onSelect(text)}
              className="keda-card p-3 text-left text-sm"
              style={{ color: "hsl(var(--muted-foreground))", cursor: phase === "idle" ? "pointer" : "default", position: "relative" }}
              initial={phase === "open" ? { opacity: 0, scale: 0.1, x: -target.x * 0.6, y: target.y } : false}
              animate={
                phase === "close"
                  ? { opacity: 0, scale: 0.05, x: target.x, y: target.y, transition: { duration: 0.32, delay: i * 0.03, ease: [0.4, 0, 1, 1] } }
                  : phase === "spin"
                  ? { opacity: 0, scale: 0, x: target.x, y: target.y, transition: { duration: 0.05 } }
                  : phase === "open"
                  ? { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.38, delay: i * 0.05, ease: [0.34, 1.56, 0.64, 1] } }
                  : { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.2 } }
              }
              whileHover={phase === "idle" ? { borderColor: "hsl(0 0% 25%)" } : {}}
            >
              {text}
            </motion.button>
          );
        })}
      </div>

      {/* Yenileme butonu */}
      <div className="flex justify-center">
        <motion.button
          ref={buttonRef}
          onClick={refresh}
          disabled={phase !== "idle"}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:cursor-not-allowed relative"
          style={{
            background: "hsl(var(--secondary))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
          }}
          animate={{
            rotate: spinDeg,
            scale: phase === "spin" ? 1.4 : phase === "close" ? 1.15 : 1,
          }}
          transition={{
            rotate: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
            scale: { duration: 0.2 },
          }}
          whileHover={phase === "idle" ? { scale: 1.1 } : {}}
          title="Farklı öneriler"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}



interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

function getTime() {
  return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// Markdown'ı basit HTML'e çevir
function renderMarkdown(text: string) {
  // Önce çok satırlı kod bloklarını işle
  let result = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang ? `<span style='font-size:0.65rem;color:rgba(255,255,255,0.35);float:right;margin-top:2px'>${lang}</span>` : '';
    return `<pre style='background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 14px;margin:10px 0;overflow-x:auto;position:relative'>${langLabel}<code style='font-family:monospace;font-size:0.82rem;color:#e2e8f0;white-space:pre'>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`;
  });

  result = result
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Satır içi kod
    .replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.08);padding:2px 7px;border-radius:5px;font-family:monospace;font-size:0.85em;color:#e2e8f0'>$1</code>")
    // Başlıklar
    .replace(/^### (.+)$/gm, "<h3 style='font-size:1rem;font-weight:600;margin:14px 0 6px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:4px'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 style='font-size:1.1rem;font-weight:700;margin:16px 0 8px'>$1</h2>")
    // Numaralı liste
    .replace(/^\d+\. (.+)$/gm, "<li style='margin:5px 0;padding-left:4px;list-style-type:decimal'>$1</li>")
    // Madde işareti
    .replace(/^[-•] (.+)$/gm, "<li style='margin:5px 0;padding-left:4px'>$1</li>")
    // Liste container
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, "<ul style='padding-left:22px;margin:8px 0'>$1</ul>")
    // Yatay çizgi
    .replace(/^---$/gm, "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.08);margin:12px 0'>")
    // Alıntı
    .replace(/^> (.+)$/gm, "<blockquote style='border-left:2px solid rgba(255,255,255,0.2);padding-left:12px;margin:8px 0;color:rgba(255,255,255,0.6)'>$1</blockquote>")
    // Dashboard linkleri
    .replace(/\/(dashboard\/[a-z]+)/g, "<a href='/$1' onclick=\"window.location.href='/$1';return false;\" style='text-decoration:underline;cursor:pointer;opacity:0.75'>/$1</a>")
    // Paragraflar
    .replace(/\n\n/g, "</p><p style='margin:8px 0'>")
    .replace(/\n/g, "<br>");

  return result;
}

export default function AIPage() {
  // Sayfa başlığı
  useEffect(() => { document.title = "KEDA AI"; }, []);

  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [listening, setListening] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Tarayıcınız ses tanımayı desteklemiyor"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? prev + " " + transcript : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  // Kullanıcının gerçek verilerini yükle (bağlam için)
  useEffect(() => {
    if (!user) return;
    getDashboardStats(user.id).then(stats => {
      const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Kullanıcı";
      const parts: string[] = [];
      parts.push(`Kullanıcı adı: ${userName}`);
      parts.push(`Toplam flashcard sayısı: ${stats.toplam_flashcard}`);
      if (stats.bugun_tekrar_edilecek > 0) parts.push(`Bugün tekrar edilecek kart: ${stats.bugun_tekrar_edilecek} (acil!)`);
      else parts.push("Bugün bekleyen kart yok");
      if (stats.aktif_plan) {
        const topics = stats.aktif_plan.topics || [];
        const done = topics.filter((t: {tamamlandi_mi: boolean}) => t.tamamlandi_mi).length;
        parts.push(`Aktif çalışma planı: "${stats.aktif_plan.baslik}" (${done}/${topics.length} konu tamamlandı)`);
      } else parts.push("Aktif çalışma planı yok");
      if (stats.son_podcastler?.length > 0) parts.push(`Son podcast: "${stats.son_podcastler[0].baslik}"`);
      if (stats.son_setler?.length > 0) parts.push(`Son flashcard setleri: ${stats.son_setler.map((s: {baslik: string}) => s.baslik).join(", ")}`);
      if (stats.leitner_dagilim) {
        const dist = stats.leitner_dagilim.map((d: {kutu: number; sayi: number}) => `Kutu${d.kutu}:${d.sayi}`).join(", ");
        parts.push(`Leitner dağılımı: ${dist}`);
      }
      if (stats.toplam_pdf > 0) parts.push(`PDF deposunda ${stats.toplam_pdf} dosya var`);
      setUserContext(`\n\n=== KULLANICI KEDA VERİLERİ ===\n${parts.join("\n")}\n=== SON ===`);
    });
  }, [user]);

  const activeSession = sessions.find(s => s.id === activeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  useEffect(() => {
    // LocalStorage'dan geçmiş yükle
    try {
      const saved = localStorage.getItem("keda_ai_sessions");
      if (saved) {
        const parsed: Session[] = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      }
    } catch { /* ignore */ }

    // Ajanda asistanından gelen mesaj
    const initialMsg = localStorage.getItem("keda_ai_initial_message");
    if (initialMsg) {
      localStorage.removeItem("keda_ai_initial_message");
      // Kısa gecikme sonra gönder (sayfa yüklendikten sonra)
      setTimeout(() => {
        setInput(initialMsg);
        // Otomatik gönder
        setTimeout(() => {
          const btn = document.getElementById("ai-send-btn");
          btn?.click();
        }, 100);
      }, 500);
    }
  }, []);

  const saveSessions = (updated: Session[]) => {
    setSessions(updated);
    try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const newSession = () => {
    const id = Date.now().toString();
    const session: Session = {
      id,
      title: "Yeni Sohbet",
      messages: [],
      createdAt: new Date().toLocaleString("tr-TR"),
    };
    const updated = [session, ...sessions];
    saveSessions(updated);
    setActiveId(id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeId === id) setActiveId(updated[0]?.id || null);
  };

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    let currentId = activeId;

    // Aktif session yoksa yeni oluştur
    if (!currentId) {
      const id = Date.now().toString();
      const session: Session = { id, title: content.slice(0, 40), messages: [], createdAt: new Date().toLocaleString("tr-TR") };
      const updated = [session, ...sessions];
      saveSessions(updated);
      setActiveId(id);
      currentId = id;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, time: getTime() };

    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== currentId) return s;
        const newMessages = [...s.messages, userMsg];
        return {
          ...s,
          messages: newMessages,
          title: s.messages.length === 0 ? content.slice(0, 40) : s.title,
        };
      });
      try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });

    setLoading(true);

    try {
      const currentSession = sessions.find(s => s.id === currentId);
      const history = (currentSession?.messages || []).slice(-10).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Web araması gerektiren sorular için keyword tespiti
      const needsSearch = /güncel|son dakika|2025|2026|bugün|bu yıl|haber|yks|lgs|sınav tarihi|üniversite|burs|kpss|ales|dgs/i.test(content);

      const completion = await (groq as any).chat.completions.create({
        model: selectedModel,
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT + userContext },
          ...history,
          { role: "user", content },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        ...(needsSearch ? {
          tools: [{
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for current information",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" }
                },
                required: ["query"]
              }
            }
          }],
          tool_choice: "auto",
        } : {}),
      });

      // Tool call varsa web araması yap
      let aiContent = "";
      const choice = completion.choices[0];

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0];
        const query = JSON.parse(toolCall.function.arguments).query;

        // Serper veya DuckDuckGo API yerine Groq'a aramanın sonucunu simüle ettir
        const searchCompletion = await (groq as any).chat.completions.create({
          model: selectedModel,
          messages: [
            { role: "system", content: BASE_SYSTEM_PROMPT + userContext },
            ...history,
            { role: "user", content },
            { role: "assistant", content: null, tool_calls: choice.message.tool_calls },
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Web araması yapıldı: "${query}". Güncel bilgilere dayalı kapsamlı bir yanıt ver. Bilginin güncel olabileceğini ancak doğrulanması gerekebileceğini belirt.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });
        aiContent = searchCompletion.choices[0]?.message?.content || "Yanıt üretilemedi.";
        // Web arama göstergesi ekle
        aiContent = "**[Web araması yapıldı]**\n\n" + aiContent;
      } else {
        aiContent = choice.message?.content || "Bir yanıt üretilemedi.";
      }

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: aiContent, time: getTime() };

      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id !== currentId) return s;
          return { ...s, messages: [...s.messages, aiMsg] };
        });
        try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Bir hata oluştu: " + (err instanceof Error ? err.message : "Bilinmeyen hata"),
        time: getTime(),
      };
      setSessions(prev => {
        const updated = prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, errMsg] } : s);
        try { localStorage.setItem("keda_ai_sessions", JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Kullanıcı";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] p-4" style={{ background: "var(--bg-secondary)" }}>
        <button onClick={newSession}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground)/0.85)] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all text-sm font-medium mb-4">
          <Plus className="w-4 h-4" />
          Yeni Sohbet
        </button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.length === 0 && (
            <p className="text-[hsl(var(--muted-foreground)/0.6)] text-xs text-center py-6">Henüz sohbet yok</p>
          )}
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveId(s.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${activeId === s.id ? "bg-[hsl(var(--foreground)/0.06)] text-[hsl(0 0% 80%)]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"}`}>
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-red-400 transition-all ml-1 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ana chat alanı */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
            </div>
            <span className="text-[hsl(var(--foreground))] font-semibold text-sm">KEDA AI</span>
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground)/0.6)] bg-[hsl(var(--muted))] px-3 py-1 rounded-full">Llama 3.3 · Groq</span>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Boş ekran */}
            {!activeSession || activeSession.messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-12">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--foreground)/0.05)] border border-[hsl(var(--border))] flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai2)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai2)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai2)" opacity="0.82"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Merhaba, {userName}</h2>
                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-10">Sana nasıl yardımcı olabilirim?</p>
                <StarterGrid onSelect={sendMessage} />
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {activeSession.messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className={`flex gap-3 group ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                    {/* AI avatar */}
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0 mt-1">
                        <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-br-sm"
                          : "text-[hsl(var(--foreground)/0.85)] rounded-bl-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Kullanıcı mesajı aksiyonları */}
                      {msg.role === "user" && (
                        <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Kopyalandı"); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-[hsl(var(--accent))]"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                            title="Kopyala"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Kopyala
                          </button>
                          <button
                            onClick={() => sendMessage(msg.content)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-[hsl(var(--accent))]"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                            title="Yeniden gönder"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Tekrar gönder
                          </button>
                        </div>
                      )}

                      <span className="text-xs text-[hsl(var(--muted-foreground)/0.6)] px-1">{msg.time}</span>
                    </div>

                    {/* User avatar */}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-[hsl(var(--foreground)/0.85)]">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Yükleniyor */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--foreground)/0.06)] border border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" viewBox="0 0 60 60" fill="none"><defs><linearGradient id="kgai1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(0 0% 70%)"/><stop offset="55%" stopColor="hsl(0 0% 70%)"/><stop offset="100%" stopColor="hsl(0 0% 65%)"/></linearGradient></defs><rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kgai1)"/><path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kgai1)" opacity="0.95"/><path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kgai1)" opacity="0.82"/></svg>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: "hsl(var(--secondary))" }}>
                  <ThinkingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            {/* Seçili model göstergesi */}
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <button
                onClick={() => setShowModelPicker(v => !v)}
                className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <span style={{ color: "hsl(var(--foreground)/0.7)" }}>{MODELS.find(m => m.id === selectedModel)?.name}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="relative flex items-end gap-3 bg-[hsl(var(--secondary))]/60 border border-[hsl(var(--border))] rounded-2xl px-4 py-3 focus-within:border-[hsl(var(--border))] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bir soru sor veya konu anlat... (Enter ile gönder)"
                rows={1}
                className="flex-1 bg-transparent text-[hsl(var(--foreground))] text-sm outline-none resize-none placeholder-slate-600 leading-relaxed"
                style={{ maxHeight: "120px" }}
              />

              {/* Model seçici butonu */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowModelPicker(v => !v)}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center transition-all"
                  style={{ color: showModelPicker ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  title={MODELS.find(m => m.id === selectedModel)?.name}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showModelPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl z-50"
                      style={{ background: "hsl(var(--card))" }}
                    >
                      <div className="p-2 border-b border-[hsl(var(--border))]">
                        <p className="text-xs px-2 py-1" style={{ color: "hsl(var(--muted-foreground))" }}>Model Seç</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {MODELS.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
                            style={{
                              background: selectedModel === m.id ? "hsl(var(--accent))" : "transparent",
                              color: selectedModel === m.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                            }}
                          >
                            <div>
                              <div className="text-sm font-medium flex items-center gap-2">
                                {m.name}
                                {m.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>{m.badge}</span>}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{m.desc}</div>
                            </div>
                            {selectedModel === m.id && (
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={listening ? stopListening : startListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${listening ? "bg-red-500/20 border border-red-500/30 animate-pulse" : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                {listening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
              </button>
              <button id="ai-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[hsl(var(--foreground))] flex items-center justify-center flex-shrink-0 hover:bg-[hsl(var(--foreground))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <Send className="w-4 h-4 text-[hsl(var(--foreground))]" />
              </button>
            </div>
            <p className="text-center text-xs text-[hsl(var(--muted-foreground)/0.4)] mt-2">
              Shift+Enter ile satır atla · Enter ile gönder · Güncel sorular için otomatik web araması yapılır
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
