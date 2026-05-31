"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Settings, Maximize2, Minimize2 } from "lucide-react";
import { sendPomodoroNotification, requestNotificationPermission } from "@/lib/notifications";
import toast from "react-hot-toast";

type Mode = "work" | "short" | "long";

const DEFAULTS = { work: 25, short: 5, long: 15 };
const MODE_LABELS: Record<Mode, string> = { work: "Çalışma", short: "Kısa Mola", long: "Uzun Mola" };
const MODE_COLORS: Record<Mode, string> = {
  work: "text-indigo-400",
  short: "text-emerald-400",
  long: "text-blue-400",
};
const MODE_BG: Record<Mode, string> = {
  work: "from-indigo-600/20 to-purple-600/10",
  short: "from-emerald-600/20 to-teal-600/10",
  long: "from-blue-600/20 to-cyan-600/10",
};

interface Session { mode: Mode; duration: number; date: string; }

export default function PomodoroPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("work");
  const [minutes, setMinutes] = useState(DEFAULTS.work);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [durations, setDurations] = useState(DEFAULTS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const total = durations[mode] * 60;
  const elapsed = total - (minutes * 60 + seconds);
  const progress = total > 0 ? elapsed / total : 0;

  // Geçmişi yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("keda_pomodoro_history");
      if (saved) setSessions(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveSession = useCallback((m: Mode, dur: number) => {
    const s: Session = { mode: m, duration: dur, date: new Date().toLocaleString("tr-TR") };
    setSessions(prev => {
      const updated = [s, ...prev].slice(0, 50);
      try { localStorage.setItem("keda_pomodoro_history", JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const switchMode = useCallback((m: Mode) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setMode(m);
    setMinutes(durations[m]);
    setSeconds(0);
  }, [durations]);

  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    saveSession(mode, durations[mode]);

    // Push notification gönder
    sendPomodoroNotification(mode);

    if (mode === "work") {
      const next = cycle % 4 === 0 ? "long" : "short";
      toast.success(`🎉 ${durations[mode]} dk tamamlandı! ${next === "long" ? "Uzun mola zamanı." : "Kısa mola zamanı."}`, { duration: 5000 });
      setCycle(c => c + 1);
      switchMode(next);
    } else {
      toast.success("Mola bitti! Çalışmaya devam edelim.", { duration: 4000 });
      switchMode("work");
    }

    // Ses bildirimi
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch { /* ignore */ }
  }, [mode, cycle, durations, saveSession, switchMode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s === 0) {
          setMinutes(m => {
            if (m === 0) { finish(); return 0; }
            return m - 1;
          });
          return 59;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, finish]);

  const toggle = () => setRunning(r => !r);
  const reset = () => { if (intervalRef.current) clearInterval(intervalRef.current); setRunning(false); setMinutes(durations[mode]); setSeconds(0); };
  const skip = () => finish();

  const todayWork = sessions.filter(s => s.mode === "work" && s.date.startsWith(new Date().toLocaleDateString("tr-TR"))).length;
  const totalMinutes = sessions.filter(s => s.mode === "work").reduce((acc, s) => acc + s.duration, 0);

  // SVG progress ring
  const R = 90;
  const circ = 2 * Math.PI * R;
  const dash = circ * (1 - progress);

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Pomodoro</h1>
          <p className="text-slate-400 text-sm">Odaklanma zamanlayıcısı · {cycle}. tur</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFullscreen(true)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-colors" title="Tam ekran">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* TAM EKRAN OVERLAY */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "hsl(var(--background))" }}
          >
            {/* Mod etiketi */}
            <p className="text-sm font-medium mb-8 tracking-widest uppercase" style={{ color: MODE_COLORS[mode].replace("text-", "") === "indigo-400" ? "#818cf8" : mode === "short" ? "#34d399" : "#60a5fa" }}>
              {MODE_LABELS[mode]}
            </p>

            {/* Büyük timer ring */}
            <div className="relative" style={{ width: "min(70vw, 420px)", height: "min(70vw, 420px)" }}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={R} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <motion.circle cx="100" cy="100" r={R} fill="none"
                  stroke={mode === "work" ? "#6366f1" : mode === "short" ? "#10b981" : "#3b82f6"}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={dash}
                  transition={{ duration: 0.5 }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-bold font-mono tabular-nums" style={{ fontSize: "clamp(3rem, 12vw, 6rem)", color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                <div className="text-sm mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>{cycle}. tur</div>
              </div>
            </div>

            {/* Kontroller */}
            <div className="flex items-center gap-6 mt-12">
              <button onClick={reset} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={toggle} className="w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-lg" style={{ background: "hsl(var(--primary))" }}>
                {running ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
              </button>
              <button onClick={skip} className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Mod geçişleri */}
            <div className="flex gap-2 mt-10">
              {(["work", "short", "long"] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: mode === m ? "hsl(var(--primary)/0.15)" : "hsl(var(--secondary))",
                    color: mode === m ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    border: mode === m ? "1px solid hsl(var(--primary)/0.3)" : "1px solid hsl(var(--border))",
                  }}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Kapat butonu */}
            <button onClick={() => setFullscreen(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
              <Minimize2 className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayarlar */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="keda-card p-5">
              <h3 className="text-white font-medium text-sm mb-4">Süreleri Ayarla (dakika)</h3>
              <div className="grid grid-cols-3 gap-4">
                {(["work", "short", "long"] as Mode[]).map(m => (
                  <div key={m}>
                    <label className="text-xs text-slate-500 mb-1 block">{MODE_LABELS[m]}</label>
                    <input type="number" min="1" max="60" value={durations[m]}
                      onChange={e => { const v = parseInt(e.target.value) || 1; setDurations(d => ({ ...d, [m]: v })); if (mode === m && !running) { setMinutes(v); setSeconds(0); } }}
                      className="keda-input text-center text-sm py-2" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mod seçici */}
      <div className="flex gap-2 mb-8">
        {(["work", "short", "long"] as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === m ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300" : "glass text-slate-500 hover:text-white"}`}>
            {m === "work" ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Ana zamanlayıcı */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`keda-card p-10 mb-6 text-center bg-gradient-to-br ${MODE_BG[mode]}`}>
        <div className="relative w-52 h-52 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle cx="100" cy="100" r={R} fill="none"
              stroke={mode === "work" ? "#6366f1" : mode === "short" ? "#10b981" : "#3b82f6"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash}
              transition={{ duration: 0.5 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-white font-mono tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div className={`text-sm mt-2 font-medium ${MODE_COLORS[mode]}`}>{MODE_LABELS[mode]}</div>
          </div>
        </div>

        {/* Kontroller */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="w-11 h-11 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={toggle}
            className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30">
            {running ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
          </button>
          <button onClick={skip} className="w-11 h-11 rounded-xl glass flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Bugünkü istatistik */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Bugün", value: `${todayWork} oturum` },
          { label: "Toplam", value: `${totalMinutes} dk` },
          { label: "Tur", value: `${cycle}. tur` },
        ].map(({ label, value }) => (
          <div key={label} className="keda-card p-4 text-center">
            <div className="text-white font-bold">{value}</div>
            <div className="text-slate-500 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Geçmiş */}
      {sessions.length > 0 && (
        <div className="keda-card p-5">
          <h3 className="text-white font-medium text-sm mb-4">Son Oturumlar</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  {s.mode === "work" ? <Brain className="w-3.5 h-3.5 text-indigo-400" /> : <Coffee className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="text-slate-300 text-sm">{MODE_LABELS[s.mode]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">{s.duration} dk</span>
                  <span className="text-slate-600 text-xs">{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
