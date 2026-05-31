"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";

export default function SezinAssistant() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 2 saniye sonra çık
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  // Açılınca input'a focuslan
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleDismiss = () => {
    setVisible(false);
    setOpen(false);
    setDismissed(true);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const message = input.trim();
    // localStorage'a kaydet — AI sayfası okuyacak
    localStorage.setItem("keda_ai_initial_message", message);
    router.push("/dashboard/ai");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
          style={{ maxWidth: 320 }}
        >
          {/* Chat balonu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="mb-3 w-80 rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl"
                style={{ background: "hsl(var(--card))" }}
              >
                {/* Başlık */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Sezin Nisa Ataseven</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>M-01 · Ajanda Modülü</p>
                  </div>
                  <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mesaj */}
                <div className="px-4 py-4">
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[hsl(var(--border))]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/sezin.png" alt="Sezin" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 text-sm leading-relaxed rounded-2xl rounded-tl-none px-3 py-2.5"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}>
                      Bu modülü ben tasarladım. Bana danışman gereken bir şey var mı?
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Bir şey sor..."
                      className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                      style={{
                        background: "hsl(var(--secondary))",
                        border: "1px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                      style={{ background: "hsl(var(--foreground))" }}
                    >
                      <Send className="w-4 h-4" style={{ color: "hsl(var(--background))" }} />
                    </button>
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                    KEDA AI'a yonlendirileceksin
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sezin figuru + toggle butonu */}
          <div className="flex items-end gap-2">
            {/* Kapatma butonu (balonun dışında) */}
            {!open && (
              <button onClick={handleDismiss}
                className="mb-1 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                <X className="w-3 h-3" />
              </button>
            )}

            <button onClick={() => setOpen(!open)} className="relative focus:outline-none group">
              {/* Konuşma balonu (kapalıyken küçük ipucu) */}
              {!open && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute bottom-full right-0 mb-2 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs shadow-lg"
                  style={{ background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
                >
                  Bana danisabilirsin, buradayim.
                  <div className="absolute bottom-0 right-4 translate-y-full w-0 h-0"
                    style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid hsl(var(--border))" }} />
                </motion.div>
              )}

              {/* Sezin görseli */}
              <div className="relative">
                <motion.img
                  src="/sezin.png"
                  alt="Sezin"
                  className="block"
                  style={{
                    height: 180,
                    width: "auto",
                    objectFit: "contain",
                    filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.3))",
                    mixBlendMode: "screen",
                  }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.05 }}
                />
                {/* Online dot */}
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 bg-emerald-400"
                  style={{ borderColor: "hsl(var(--background))" }} />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
