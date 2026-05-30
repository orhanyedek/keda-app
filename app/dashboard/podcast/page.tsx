"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePodcastDialogue } from "@/lib/gemini";
import { savePodcast, getPodcasts, deletePodcast } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import PDFUploader from "@/components/PDFUploader";
import { Mic, Play, Square, Trash2, Download, Search, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface DialogueLine { speaker: string; text: string; }
interface SavedPodcast { id: string; baslik: string; diyalog_metni: string; created_at: string; }

const TONES = [
  { key: "academic", label: "Akademik", desc: "Teknik, detaylı, öğretici" },
  { key: "simple", label: "Sade", desc: "Anlaşılır, günlük dil" },
  { key: "qa", label: "Soru-Cevap", desc: "Öğrenci sorar, öğretmen açıklar" },
  { key: "story", label: "Hikaye", desc: "Anlatı formatında" },
];

const LENGTHS = [
  { key: "short", label: "Kısa", lines: 8, desc: "~2 dk" },
  { key: "medium", label: "Orta", lines: 14, desc: "~4 dk" },
  { key: "long", label: "Uzun", lines: 22, desc: "~6 dk" },
];

export default function PodcastPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [inputText, setInputText] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [tone, setTone] = useState("academic");
  const [length, setLength] = useState("medium");
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [historyCurrentLine, setHistoryCurrentLine] = useState(-1);
  const [search, setSearch] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const dialogueRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (user && tab === "history") loadHistory();
  }, [user, tab]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Aktif satıra scroll
  useEffect(() => {
    if (currentLine >= 0 && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLine]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await getPodcasts(user.id);
    if (data) setSavedPodcasts(data as SavedPodcast[]);
    setLoadingHistory(false);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) { toast.error("Lütfen metin girin"); return; }
    setGenerating(true);
    try {
      const lineCount = LENGTHS.find(l => l.key === length)?.lines || 14;
      const result = await generatePodcastDialogue(inputText, tone, lineCount);
      const rawDialogue = result.dialogue || result.diyalog || [];
      const normalized: DialogueLine[] = rawDialogue.map((l: { speaker?: string; konusmaci?: string; text?: string; metin?: string }, i: number) => ({
        speaker: l.speaker || (l.konusmaci === "Öğretmen" || l.konusmaci === "A" ? "A" : "B") || (i % 2 === 0 ? "A" : "B"),
        text: l.text || l.metin || "",
      }));
      setDialogue(normalized);

      // Podcast oluştuktan sonra scroll
      setTimeout(() => dialogueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      toast.success("Podcast oluşturuldu!");

      if (user) {
        setSaving(true);
        const title = podcastTitle.trim() || `Podcast ${new Date().toLocaleDateString("tr-TR")}`;
        const diyalogMetni = normalized.map(l => `${l.speaker}: ${l.text}`).join("\n");
        await savePodcast(user.id, { baslik: title, diyalog_metni: diyalogMetni });
        setSaving(false);
        toast.success("Kaydedildi ✓");
      }
    } catch {
      toast.error("Podcast oluşturma başarısız");
    } finally {
      setGenerating(false);
    }
  };

  const getVoice = (preferFemale: boolean) => {
    const voices = window.speechSynthesis.getVoices();
    const trVoices = voices.filter(v => v.lang.startsWith("tr"));
    if (trVoices.length >= 2) {
      const femaleVoice = trVoices.find(v => /female|kadın|woman/i.test(v.name)) || trVoices[0];
      const maleVoice = trVoices.find(v => v !== femaleVoice) || trVoices[0];
      return preferFemale ? femaleVoice : maleVoice;
    }
    return voices.find(v => v.lang.startsWith("tr")) || voices[0] || null;
  };

  const speakLines = (lines: DialogueLine[], onLine: (i: number) => void, onEnd: () => void) => {
    let i = 0;
    const next = () => {
      if (i >= lines.length) { onEnd(); return; }
      onLine(i);
      const utter = new SpeechSynthesisUtterance(lines[i].text);
      utter.lang = "tr-TR";
      const isSpeakerA = lines[i].speaker === "A";
      const voice = getVoice(isSpeakerA);
      if (voice) utter.voice = voice;
      utter.pitch = isSpeakerA ? 1.2 : 0.8;
      utter.rate = 0.95;
      utter.onend = () => { i++; next(); };
      utter.onerror = () => { i++; next(); };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = next;
    } else { next(); }
  };

  // Aktif podcast oynat/durdur
  const handlePlay = () => {
    if (!dialogue.length) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setCurrentLine(-1);
      return;
    }
    setPlaying(true);
    speakLines(dialogue, i => setCurrentLine(i), () => { setPlaying(false); setCurrentLine(-1); });
  };

  // Geçmişten oynat/durdur
  const handlePlayHistory = (podcast: SavedPodcast) => {
    if (playingHistoryId === podcast.id) {
      window.speechSynthesis.cancel();
      setPlayingHistoryId(null);
      setHistoryCurrentLine(-1);
      return;
    }
    window.speechSynthesis.cancel();
    const lines = parseDialogue(podcast.diyalog_metni);
    setPlayingHistoryId(podcast.id);
    setExpandedId(podcast.id);
    speakLines(lines, i => setHistoryCurrentLine(i), () => { setPlayingHistoryId(null); setHistoryCurrentLine(-1); });
  };

  const parseDialogue = (text: string): DialogueLine[] =>
    text.split("\n").filter(l => l.trim()).map(l => {
      const m = l.match(/^([^:]+):\s*(.+)$/);
      return m ? { speaker: m[1].trim(), text: m[2].trim() } : { speaker: "?", text: l };
    });

  const download = (lines: DialogueLine[], title: string) => {
    const text = lines.map(l => `${l.speaker === "A" ? "Öğretmen" : "Öğrenci"}: ${l.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title || "podcast"}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const copy = (lines: DialogueLine[]) => {
    const text = lines.map(l => `${l.speaker === "A" ? "Öğretmen" : "Öğrenci"}: ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
  };

  const filteredPodcasts = savedPodcasts.filter(p =>
    p.baslik.toLowerCase().includes(search.toLowerCase())
  );

  const SpeakerBadge = ({ speaker }: { speaker: string }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
      speaker === "A"
        ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
        : "bg-[hsl(280_60%_50%/0.15)] text-[hsl(280_60%_70%)]"
    }`}>
      {speaker === "A" ? "Ö" : "S"}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Podcast Stüdyosu</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>M-02 · Sorumlu: Kerem Mert Duru · PDF'ten sesli çalışma içeriği</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[{ key: "new", label: "Yeni Podcast" }, { key: "history", label: "Geçmiş" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as "new" | "history")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key
              ? "bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]"
              : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── YENİ PODCAST ── */}
      {tab === "new" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {!dialogue.length && (
            <div className="keda-card p-6 space-y-5">
              {/* Başlık */}
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Podcast Başlığı</label>
                <input value={podcastTitle} onChange={e => setPodcastTitle(e.target.value)}
                  placeholder="Örn: Veri Yapıları - Ağaçlar" className="keda-input" />
              </div>

              {/* PDF veya metin */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>İçerik</label>
                <PDFUploader label="PDF yükle" onTextExtracted={(text, name) => {
                  setInputText(text);
                  if (!podcastTitle) setPodcastTitle(name.replace(".pdf", ""));
                  toast.success("PDF yüklendi!");
                }} />
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>ya da</span>
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                </div>
                <textarea value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Ders metnini buraya yapıştır..." rows={4} className="keda-input resize-none" />
              </div>

              {/* Ses tonu */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Ses Tonu</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button key={t.key} onClick={() => setTone(t.key)}
                      className={`p-3 rounded-xl text-left transition-all ${tone === t.key
                        ? "bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]"
                        : "keda-card text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs mt-0.5 opacity-70">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Uzunluk */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Uzunluk</label>
                <div className="flex gap-2">
                  {LENGTHS.map(l => (
                    <button key={l.key} onClick={() => setLength(l.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${length === l.key
                        ? "bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]"
                        : "keda-card text-[hsl(var(--muted-foreground))]"}`}>
                      <div>{l.label}</div>
                      <div className="text-xs opacity-60">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={generating || !inputText.trim()}
                className="btn-primary w-full py-3 disabled:opacity-50">
                {generating
                  ? <div className="flex items-center justify-center gap-2"><div className="loading-dots"><span/><span/><span/></div>Oluşturuluyor...</div>
                  : saving ? "Kaydediliyor..." : "Podcast Oluştur"}
              </button>
            </div>
          )}

          {/* Diyalog */}
          {dialogue.length > 0 && (
            <motion.div ref={dialogueRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Player */}
              <div className="keda-card p-5" style={{ borderColor: "hsl(var(--primary)/0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{podcastTitle || "Podcast"}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {dialogue.length} satır · {TONES.find(t => t.key === tone)?.label} · {LENGTHS.find(l => l.key === length)?.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copy(dialogue)} className="w-8 h-8 rounded-lg glass flex items-center justify-center transition-all" style={{ color: "hsl(var(--muted-foreground))" }} title="Kopyala">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                    <button onClick={() => download(dialogue, podcastTitle)} className="w-8 h-8 rounded-lg glass flex items-center justify-center transition-all" style={{ color: "hsl(var(--muted-foreground))" }} title="İndir">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={handlePlay}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${playing
                        ? "bg-red-500/15 border border-red-500/25"
                        : "bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.25)]"}`}>
                      {playing ? <Square className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />}
                    </button>
                  </div>
                </div>
                {playing && (
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${((currentLine + 1) / dialogue.length) * 100}%` }} />
                  </div>
                )}
              </div>

              {/* Konuşmacı etiketleri */}
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <div className="w-5 h-5 rounded bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>Ö</div>
                  Öğretmen
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <div className="w-5 h-5 rounded bg-[hsl(280_60%_50%/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(280_60%_70%)]">S</div>
                  Öğrenci
                </div>
              </div>

              {/* Satırlar */}
              <div className="space-y-2">
                {dialogue.map((line, i) => (
                  <motion.div
                    key={i}
                    ref={el => { lineRefs.current[i] = el; }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex gap-3 p-4 rounded-xl transition-all ${currentLine === i
                      ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.25)]"
                      : "keda-card"}`}
                  >
                    <SpeakerBadge speaker={line.speaker} />
                    <p className="text-sm leading-relaxed pt-1" style={{ color: "hsl(var(--foreground)/0.9)" }}>{line.text}</p>
                  </motion.div>
                ))}
              </div>

              <button onClick={() => { setDialogue([]); setInputText(""); setPodcastTitle(""); setPlaying(false); window.speechSynthesis?.cancel(); lineRefs.current = []; }}
                className="w-full btn-secondary py-2.5 text-sm">
                Yeni Podcast Oluştur
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── GEÇMİŞ ── */}
      {tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Podcast ara..." className="keda-input pl-9" />
          </div>

          {loadingHistory ? (
            <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>Yükleniyor...</div>
          ) : filteredPodcasts.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "hsl(var(--primary)/0.08)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                <Mic className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {search ? "Sonuç bulunamadı" : "Henüz podcast yok"}
              </p>
            </div>
          ) : filteredPodcasts.map(podcast => {
            const lines = parseDialogue(podcast.diyalog_metni);
            const isPlaying = playingHistoryId === podcast.id;
            const isExpanded = expandedId === podcast.id;

            return (
              <div key={podcast.id} className="keda-card overflow-hidden">
                {/* Başlık satırı */}
                <div className="flex items-center p-4 gap-3">
                  {/* Oynat butonu */}
                  <button onClick={() => handlePlayHistory(podcast)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isPlaying
                      ? "bg-red-500/15 border border-red-500/25"
                      : "bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)]"}`}>
                    {isPlaying ? <Square className="w-3.5 h-3.5 text-red-400" /> : <Play className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />}
                  </button>

                  {/* Bilgi */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : podcast.id)}>
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{podcast.baslik}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(podcast.created_at).toLocaleDateString("tr-TR")} · {lines.length} satır
                    </p>
                  </div>

                  {/* Aksiyon butonları */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => copy(lines)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }} title="Kopyala">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                    <button onClick={() => download(lines, podcast.baslik)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }} title="İndir">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async () => {
                      await deletePodcast(podcast.id);
                      setSavedPodcasts(prev => prev.filter(p => p.id !== podcast.id));
                      if (playingHistoryId === podcast.id) { window.speechSynthesis.cancel(); setPlayingHistoryId(null); }
                      toast.success("Podcast silindi");
                    }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : podcast.id)}
                      className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>
                  </div>
                </div>

                {/* Progress bar (oynarken) */}
                {isPlaying && (
                  <div className="px-4 pb-2">
                    <div className="progress-bar">
                      <div className="progress-bar-fill animate-pulse"
                        style={{ width: `${lines.length > 0 ? ((historyCurrentLine + 1) / lines.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}

                {/* Diyalog içeriği */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2 border-t border-[hsl(var(--border))] pt-3">
                        {lines.map((line, i) => (
                          <div key={i}
                            className={`flex gap-3 p-3 rounded-xl transition-all ${isPlaying && historyCurrentLine === i
                              ? "bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.25)]"
                              : "bg-[hsl(var(--muted))]"}`}>
                            <SpeakerBadge speaker={line.speaker} />
                            <p className="text-sm leading-relaxed pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{line.text}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
