/**
 * KEDA - Podcast Modülü (M-02)
 * Gemini AI diyalog üretimi + Supabase kayıt + Tarayıcı TTS
 * Sorumlu: Kerem Mert Duru · Katkı: Serdar Durgut
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePodcastDialogue } from "@/lib/gemini";
import { savePodcast, getPodcasts } from "@/lib/db";
import { useAuth } from "@/hooks/useAuth";
import PDFUploader from "@/components/PDFUploader";
import toast from "react-hot-toast";

interface DialogueLine {
  speaker: string;
  text: string;
}

interface SavedPodcast {
  id: string;
  baslik: string;
  diyalog_metni: string;
  created_at: string;
}

export default function PodcastPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [inputText, setInputText] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (user && tab === "history") loadHistory();
  }, [user, tab]);

  // Sayfa unmount olduğunda sesi durdur
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

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
      const result = await generatePodcastDialogue(inputText);
      setDialogue(result.dialogue || []);
      toast.success("Podcast diyaloğu oluşturuldu!");

      // Supabase'e kaydet
      if (user) {
        setSaving(true);
        const title = podcastTitle.trim() || `Podcast ${new Date().toLocaleDateString("tr-TR")}`;
        const diyalogMetni = (result.dialogue || []).map((l: DialogueLine) => `${l.speaker}: ${l.text}`).join("\n");
        const { error } = await savePodcast(user.id, { baslik: title, diyalog_metni: diyalogMetni });
        if (!error) toast.success("Podcast kaydedildi ✓");
        setSaving(false);
      }
    } catch {
      toast.error("Podcast oluşturma başarısız");
    } finally {
      setGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!dialogue.length) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setCurrentLine(-1);
      return;
    }

    setPlaying(true);

    // Mevcut sesleri al, Türkçe sesleri önceliklendir
    const getVoice = (preferFemale: boolean) => {
      const voices = window.speechSynthesis.getVoices();
      const trVoices = voices.filter(v => v.lang.startsWith("tr"));
      if (trVoices.length >= 2) {
        const femaleVoice = trVoices.find(v => /female|kadın|woman/i.test(v.name)) || trVoices[0];
        const maleVoice = trVoices.find(v => /male|erkek|man/i.test(v.name) && v !== femaleVoice) || trVoices[1] || trVoices[0];
        return preferFemale ? femaleVoice : maleVoice;
      }
      // Türkçe ses yoksa genel sesleri kullan
      return voices.find(v => v.lang.startsWith("tr")) || voices[0] || null;
    };

    const speakLine = (i: number) => {
      if (i >= dialogue.length) {
        setPlaying(false);
        setCurrentLine(-1);
        return;
      }
      setCurrentLine(i);
      const utter = new SpeechSynthesisUtterance(dialogue[i].text);
      utter.lang = "tr-TR";

      // A konuşmacı: dişi/yüksek ses, B konuşmacı: erkek/düşük ses
      const isSpeakerA = dialogue[i].speaker === "A";
      const voice = getVoice(isSpeakerA);
      if (voice) utter.voice = voice;
      utter.pitch = isSpeakerA ? 1.2 : 0.8;
      utter.rate = isSpeakerA ? 1.0 : 0.95;
      utter.volume = 1;

      utter.onend = () => speakLine(i + 1);
      utter.onerror = () => speakLine(i + 1); // Hata olursa sonraki satıra geç
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    // Sesler yüklenmemişse bekle
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakLine(0);
    } else {
      speakLine(0);
    }
  };

  const parseDialogue = (text: string): DialogueLine[] => {
    return text.split("\n").filter(l => l.trim()).map(l => {
      const match = l.match(/^([^:]+):\s*(.+)$/);
      return match ? { speaker: match[1].trim(), text: match[2].trim() } : { speaker: "?", text: l };
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Podcast Stüdyosu</h1>
        <p className="text-slate-400 text-sm">M-02 · Sorumlu: Kerem Mert Duru · Gemini AI ile ders podcasti</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[{ key: "new", label: "Yeni Podcast" }, { key: "history", label: "Geçmiş" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as "new" | "history")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300" : "glass text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "new" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Giriş formu */}
          {!dialogue.length && (
            <div className="keda-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Ders Metnini Gir</h2>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Podcast Başlığı (isteğe bağlı)</label>
                <input value={podcastTitle} onChange={(e) => setPodcastTitle(e.target.value)} placeholder="Örn: Veri Yapıları - Ağaçlar" className="keda-input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">PDF Yükle (opsiyonel)</label>
                <PDFUploader
                  label="PDF'i podcast'e dönüştür"
                  onTextExtracted={(text, name) => {
                    setInputText(text);
                    if (!podcastTitle) setPodcastTitle(name.replace(".pdf", ""));
                    toast.success("PDF metni yüklendi!");
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Ya da metni manuel gir</label>
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder="Podcast'e dönüştürmek istediğiniz ders metnini buraya yapıştırın..."
                  rows={5} className="keda-input resize-none" />
              </div>
              <button onClick={handleGenerate} disabled={generating || !inputText.trim()} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {generating ? (<div className="flex items-center justify-center gap-2"><div className="loading-dots"><span /><span /><span /></div><span>Diyalog Oluşturuluyor...</span></div>)
                  : saving ? "Kaydediliyor..." : "🎙️ Podcast Oluştur"}
              </button>
            </div>
          )}

          {/* Diyalog gösterimi */}
          {dialogue.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Player */}
              <div className="keda-card p-6 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{podcastTitle || "Podcast"}</h3>
                    <p className="text-slate-500 text-xs">{dialogue.length} satır diyalog</p>
                  </div>
                  <button onClick={handlePlay}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${playing ? "bg-red-500/20 border border-red-500/40" : "bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30"}`}>
                    {playing ? "⏹" : "▶️"}
                  </button>
                </div>
                {playing && (
                  <div className="progress-bar"><div className="progress-bar-fill animate-pulse" style={{ width: `${((currentLine + 1) / dialogue.length) * 100}%` }} /></div>
                )}
              </div>

              {/* Diyalog listesi */}
              <div className="space-y-3">
                <AnimatePresence>
                  {dialogue.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={`flex gap-4 p-4 rounded-2xl transition-all ${currentLine === i ? "bg-indigo-600/20 border border-indigo-500/40" : "keda-card"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${line.speaker === "A" ? "bg-indigo-600/30 text-indigo-300" : "bg-purple-600/30 text-purple-300"}`}>
                        {line.speaker}
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed pt-1">{line.text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button onClick={() => { setDialogue([]); setInputText(""); setPodcastTitle(""); setPlaying(false); window.speechSynthesis?.cancel(); }}
                className="w-full glass py-3 rounded-2xl text-slate-400 hover:text-white transition-colors">
                Yeni Podcast Oluştur
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {loadingHistory ? (
            <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
          ) : savedPodcasts.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <div className="text-4xl mb-3">🎙️</div>
              <p className="text-slate-400">Henüz podcast yok. Yeni Podcast sekmesinden başla!</p>
            </div>
          ) : savedPodcasts.map((podcast) => (
            <div key={podcast.id} className="keda-card p-5">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === podcast.id ? null : podcast.id)}>
                <div>
                  <h3 className="text-white font-medium">{podcast.baslik}</h3>
                  <p className="text-slate-500 text-xs mt-1">{new Date(podcast.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
                <span className="text-slate-500 text-sm">{expandedId === podcast.id ? "▲" : "▼"}</span>
              </div>
              {expandedId === podcast.id && podcast.diyalog_metni && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-2">
                  {parseDialogue(podcast.diyalog_metni).map((line, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${line.speaker === "A" ? "bg-indigo-600/30 text-indigo-300" : "bg-purple-600/30 text-purple-300"}`}>{line.speaker}</div>
                      <p className="text-slate-400 text-sm pt-1">{line.text}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
