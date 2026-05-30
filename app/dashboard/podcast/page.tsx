"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePodcastSummary } from "@/lib/gemini";
import { savePodcast, getPodcasts, deletePodcast } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import PDFUploader from "@/components/PDFUploader";
import { Mic, Play, Pause, SkipBack, SkipForward, Trash2, Download, Search, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

interface Podcast {
  id: string;
  baslik: string;
  diyalog_metni: string; // paragraflar \n\n ile ayrılmış
  created_at: string;
}

const STYLES = [
  { key: "standard", label: "Standart", desc: "Akıcı ve öğretici" },
  { key: "simple",   label: "Sade",     desc: "Günlük dil" },
  { key: "detailed", label: "Detaylı",  desc: "Örneklerle zengin" },
  { key: "story",    label: "Hikaye",   desc: "Anlatı formatı" },
];

const LENGTHS = [
  { key: "short",  label: "Kısa",  desc: "4 paragraf" },
  { key: "medium", label: "Orta",  desc: "7 paragraf" },
  { key: "long",   label: "Uzun",  desc: "12 paragraf" },
];

export default function PodcastPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "history">("new");

  // Oluşturma
  const [inputText, setInputText] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [style, setStyle] = useState("standard");
  const [length, setLength] = useState("medium");
  const [generating, setGenerating] = useState(false);

  // Aktif podcast
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState("");

  // Player
  const [playing, setPlaying] = useState(false);
  const [currentPara, setCurrentPara] = useState(-1);
  const [currentWord, setCurrentWord] = useState(-1); // kelime bazlı highlight için
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Geçmiş
  const [history, setHistory] = useState<Podcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [historyCurrentPara, setHistoryCurrentPara] = useState(-1);
  const historyParaRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (user && tab === "history") loadHistory();
  }, [user, tab]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Aktif paragrafa scroll
  useEffect(() => {
    if (currentPara >= 0 && paraRefs.current[currentPara]) {
      paraRefs.current[currentPara]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentPara]);

  useEffect(() => {
    if (historyCurrentPara >= 0 && historyParaRefs.current[historyCurrentPara]) {
      historyParaRefs.current[historyCurrentPara]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [historyCurrentPara]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await getPodcasts(user.id);
    if (data) setHistory(data as Podcast[]);
    setLoadingHistory(false);
  };

  const getVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.startsWith("tr")) || voices[0] || null;
  };

  // Paragrafları sırayla seslendir
  const speakParagraphs = useCallback((paras: string[], onPara: (i: number) => void, onEnd: () => void) => {
    let i = 0;
    const next = () => {
      if (i >= paras.length) { onEnd(); return; }
      onPara(i);
      const utter = new SpeechSynthesisUtterance(paras[i]);
      utter.lang = "tr-TR";
      const voice = getVoice();
      if (voice) utter.voice = voice;
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.onend = () => { i++; next(); };
      utter.onerror = () => { i++; next(); };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = next;
    } else { next(); }
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim()) { toast.error("Lütfen metin girin"); return; }
    setGenerating(true);
    try {
      const result = await generatePodcastSummary(inputText, style, length);
      const paras: string[] = result.paragraflar || [];
      const title = podcastTitle.trim() || result.baslik || `Podcast ${new Date().toLocaleDateString("tr-TR")}`;

      setParagraphs(paras);
      setActiveTitle(title);
      setCurrentPara(-1);
      setPlaying(false);
      window.speechSynthesis.cancel();

      // Oluşturulunca scroll
      setTimeout(() => document.getElementById("player-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      toast.success("Podcast hazır!");

      // Kaydet
      if (user) {
        await savePodcast(user.id, {
          baslik: title,
          diyalog_metni: paras.join("\n\n"),
        });
      }
    } catch {
      toast.error("Podcast oluşturulamadı");
    } finally {
      setGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!paragraphs.length) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const startFrom = currentPara >= 0 ? currentPara : 0;
    const remaining = paragraphs.slice(startFrom);
    speakParagraphs(remaining, i => setCurrentPara(startFrom + i), () => {
      setPlaying(false);
      setCurrentPara(-1);
    });
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setCurrentPara(p => Math.max(0, p - 1));
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setCurrentPara(p => Math.min(paragraphs.length - 1, p + 1));
  };

  const handlePlayHistory = (podcast: Podcast) => {
    if (playingHistoryId === podcast.id) {
      window.speechSynthesis.cancel();
      setPlayingHistoryId(null);
      setHistoryCurrentPara(-1);
      return;
    }
    window.speechSynthesis.cancel();
    const paras = podcast.diyalog_metni.split("\n\n").filter(p => p.trim());
    setPlayingHistoryId(podcast.id);
    setExpandedId(podcast.id);
    speakParagraphs(paras, i => setHistoryCurrentPara(i), () => {
      setPlayingHistoryId(null);
      setHistoryCurrentPara(-1);
    });
  };

  const download = (text: string, title: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${title}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(p =>
    p.baslik.toLowerCase().includes(search.toLowerCase())
  );

  const progress = paragraphs.length > 0 && currentPara >= 0
    ? ((currentPara + 1) / paragraphs.length) * 100
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Podcast Stüdyosu</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>M-02 · PDF'ten sesli özet — dinle ve takip et</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[{ key: "new", label: "Yeni Podcast" }, { key: "history", label: `Geçmiş${history.length > 0 ? ` (${history.length})` : ""}` }].map(t => (
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

          {/* Form */}
          {!paragraphs.length && (
            <div className="keda-card p-6 space-y-5">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Başlık (opsiyonel)</label>
                <input value={podcastTitle} onChange={e => setPodcastTitle(e.target.value)}
                  placeholder="Örn: Veri Yapıları Özeti" className="keda-input" />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>İçerik</label>
                <PDFUploader label="PDF yükle" onTextExtracted={(text, name) => {
                  setInputText(text);
                  if (!podcastTitle) setPodcastTitle(name.replace(".pdf", ""));
                }} />
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>ya da</span>
                  <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
                </div>
                <textarea value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Ders metnini buraya yapıştır..." rows={4} className="keda-input resize-none" />
              </div>

              {/* Anlatım tarzı */}
              <div>
                <label className="block text-sm mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Anlatım Tarzı</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s.key} onClick={() => setStyle(s.key)}
                      className={`p-3 rounded-xl text-left transition-all ${style === s.key
                        ? "bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.3)]"
                        : "keda-card"}`}>
                      <div className="text-sm font-medium" style={{ color: style === s.key ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>{s.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{s.desc}</div>
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all text-center ${length === l.key
                        ? "bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]"
                        : "keda-card text-[hsl(var(--muted-foreground))]"}`}>
                      <div>{l.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={generating || !inputText.trim()}
                className="btn-primary w-full py-3 disabled:opacity-50">
                {generating
                  ? <div className="flex items-center justify-center gap-2"><div className="loading-dots"><span/><span/><span/></div>Özet Hazırlanıyor...</div>
                  : "Podcast Oluştur"}
              </button>
            </div>
          )}

          {/* ── PLAYER ── */}
          {paragraphs.length > 0 && (
            <motion.div id="player-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Sticky player bar */}
              <div className="keda-card p-5 sticky top-2 z-20" style={{ borderColor: "hsl(var(--primary)/0.25)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-4 mb-3">
                  {/* Albüm kapağı */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--primary)/0.15)", border: "1px solid hsl(var(--primary)/0.3)" }}>
                    <Mic className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  {/* Başlık */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{activeTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {currentPara >= 0 ? `${currentPara + 1} / ${paragraphs.length}` : `${paragraphs.length} paragraf`}
                    </p>
                  </div>
                  {/* Download */}
                  <button onClick={() => download(paragraphs.join("\n\n"), activeTitle)}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="progress-bar mb-3 cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  const idx = Math.floor(pct * paragraphs.length);
                  window.speechSynthesis.cancel();
                  setPlaying(false);
                  setCurrentPara(Math.max(0, Math.min(paragraphs.length - 1, idx)));
                }}>
                  <motion.div className="progress-bar-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>

                {/* Kontroller */}
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handlePrev} disabled={currentPara <= 0}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button onClick={handlePlay}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg"
                    style={{ background: "hsl(var(--primary))" }}>
                    {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                  </button>
                  <button onClick={handleNext} disabled={currentPara >= paragraphs.length - 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── LYRİCS / PARAGRAFLAR ── Spotify tarzı */}
              <div className="space-y-2 px-1">
                {paragraphs.map((para, i) => {
                  const isActive = currentPara === i;
                  const isPast = currentPara > i;
                  return (
                    <motion.p
                      key={i}
                      ref={el => { paraRefs.current[i] = el; }}
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setPlaying(false);
                        setCurrentPara(i);
                      }}
                      className="px-4 py-3 rounded-2xl cursor-pointer transition-all leading-relaxed"
                      animate={{
                        scale: isActive ? 1.01 : 1,
                        opacity: isPast ? 0.35 : isActive ? 1 : 0.65,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        fontSize: isActive ? "1.05rem" : "0.9rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                        background: isActive ? "hsl(var(--primary)/0.08)" : "transparent",
                        border: isActive ? "1px solid hsl(var(--primary)/0.2)" : "1px solid transparent",
                        lineHeight: "1.8",
                      }}
                    >
                      {para}
                    </motion.p>
                  );
                })}
              </div>

              <button onClick={() => {
                window.speechSynthesis.cancel();
                setPlaying(false);
                setParagraphs([]);
                setCurrentPara(-1);
                setInputText("");
                setPodcastTitle("");
                paraRefs.current = [];
              }} className="w-full btn-secondary py-2.5 text-sm mt-4">
                Yeni Podcast Oluştur
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── GEÇMİŞ ── */}
      {tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Podcast ara..." className="keda-input pl-9" />
          </div>

          {loadingHistory ? (
            <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>Yükleniyor...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "hsl(var(--primary)/0.08)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                <Mic className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {search ? "Sonuç bulunamadı" : "Henüz podcast yok"}
              </p>
            </div>
          ) : filteredHistory.map(podcast => {
            const paras = podcast.diyalog_metni.split("\n\n").filter(p => p.trim());
            const isPlaying = playingHistoryId === podcast.id;
            const isExpanded = expandedId === podcast.id;
            const histProg = isPlaying && paras.length > 0 && historyCurrentPara >= 0
              ? ((historyCurrentPara + 1) / paras.length) * 100 : 0;

            return (
              <div key={podcast.id} className="keda-card overflow-hidden">
                <div className="flex items-center p-4 gap-3">
                  {/* Play */}
                  <button onClick={() => handlePlayHistory(podcast)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isPlaying
                      ? "bg-red-500/15 border border-red-500/25"
                      : "bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)]"}`}>
                    {isPlaying ? <Pause className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4 ml-0.5" style={{ color: "hsl(var(--primary))" }} />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : podcast.id)}>
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{podcast.baslik}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(podcast.created_at).toLocaleDateString("tr-TR")} · {paras.length} paragraf
                    </p>
                  </div>

                  {/* Butonlar */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => download(podcast.diyalog_metni, podcast.baslik)}
                      className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async () => {
                      await deletePodcast(podcast.id);
                      setHistory(prev => prev.filter(p => p.id !== podcast.id));
                      if (playingHistoryId === podcast.id) { window.speechSynthesis.cancel(); setPlayingHistoryId(null); }
                      toast.success("Silindi");
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

                {/* Progress */}
                {isPlaying && (
                  <div className="px-4 pb-2">
                    <div className="progress-bar">
                      <motion.div className="progress-bar-fill" animate={{ width: `${histProg}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </div>
                )}

                {/* Paragraflar — Spotify tarzı */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-[hsl(var(--border))] px-4 py-4 space-y-2">
                        {paras.map((para, i) => {
                          const isActive = isPlaying && historyCurrentPara === i;
                          const isPast = isPlaying && historyCurrentPara > i;
                          return (
                            <motion.p
                              key={i}
                              ref={el => { historyParaRefs.current[i] = el; }}
                              animate={{ opacity: isPast ? 0.3 : isActive ? 1 : 0.6, scale: isActive ? 1.01 : 1 }}
                              transition={{ duration: 0.3 }}
                              className="px-3 py-2 rounded-xl leading-relaxed transition-all"
                              style={{
                                fontSize: isActive ? "0.95rem" : "0.875rem",
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                                background: isActive ? "hsl(var(--primary)/0.08)" : "transparent",
                                lineHeight: "1.8",
                              }}
                            >
                              {para}
                            </motion.p>
                          );
                        })}
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
