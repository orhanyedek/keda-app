"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  angle: number;
  radius: number;
}

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Parçacıkları oluştur
    const pts: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 50, y: 50,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 1.2,
      angle: (i / 24) * Math.PI * 2,
      radius: 60 + Math.random() * 50,
    }));
    setParticles(pts);

    // Canvas animasyonu
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Dönen aurora halkaları
      for (let ring = 0; ring < 4; ring++) {
        const r = 80 + ring * 35;
        const offset = (t * (0.3 + ring * 0.15)) + ring * 0.8;
        const segments = 120;

        for (let s = 0; s < segments; s++) {
          const a = (s / segments) * Math.PI * 2;
          const wave = Math.sin(a * 3 + offset) * 8;
          const rx = cx + (r + wave) * Math.cos(a);
          const ry = cy + (r + wave) * Math.sin(a);

          const hue = 260 + ring * 15 + Math.sin(a + t) * 20;
          const alpha = (0.03 + Math.sin(a * 2 + offset) * 0.015) * (1 - ring * 0.18);
          ctx.beginPath();
          ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
          ctx.fill();
        }
      }

      // Orta merkez parlama
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      grd.addColorStop(0, `hsla(260, 80%, 60%, ${0.06 + Math.sin(t * 1.5) * 0.03})`);
      grd.addColorStop(0.5, `hsla(240, 70%, 50%, ${0.03 + Math.sin(t) * 0.015})`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();

      // Işın çizgileri
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        const len = 40 + Math.sin(t * 2 + i) * 15;
        const x1 = cx + 30 * Math.cos(a);
        const y1 = cy + 30 * Math.sin(a);
        const x2 = cx + (30 + len) * Math.cos(a);
        const y2 = cy + (30 + len) * Math.sin(a);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `hsla(265, 80%, 65%, 0.3)`);
        grad.addColorStop(1, `hsla(200, 80%, 65%, 0)`);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      t += 0.018;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Phase geçişleri
    const p1 = setTimeout(() => setPhase(1), 300);
    const p2 = setTimeout(() => setPhase(2), 900);
    const p3 = setTimeout(() => setPhase(3), 1600);
    const hide = setTimeout(() => setVisible(false), 2600);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(p1); clearTimeout(p2); clearTimeout(p3); clearTimeout(hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "#09090b" }}
        >
          {/* Canvas aurora */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Arka plan ızgara */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

          {/* Merkez içerik */}
          <div className="relative flex flex-col items-center">

            {/* Dış dönen halka */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute"
              style={{ width: 140, height: 140 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-full h-full rounded-full"
                style={{
                  border: "1px solid transparent",
                  background: "linear-gradient(#09090b, #09090b) padding-box, linear-gradient(135deg, rgba(168,85,247,0.6), rgba(96,165,250,0.1), rgba(168,85,247,0.6)) border-box",
                }}
              />
            </motion.div>

            {/* İç dönen halka */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute"
              style={{ width: 112, height: 112 }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-full h-full rounded-full"
                style={{
                  border: "1px solid transparent",
                  background: "linear-gradient(#09090b, #09090b) padding-box, linear-gradient(135deg, rgba(96,165,250,0.4), rgba(168,85,247,0.1), rgba(96,165,250,0.4)) border-box",
                }}
              />
            </motion.div>

            {/* Orbital parçacıklar */}
            {phase >= 1 && particles.slice(0, 12).map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.id % 3 === 0 ? "#a855f7" : p.id % 3 === 1 ? "#818cf8" : "#60a5fa",
                  boxShadow: `0 0 ${p.size * 3}px ${p.id % 3 === 0 ? "#a855f7" : p.id % 3 === 1 ? "#818cf8" : "#60a5fa"}`,
                }}
                animate={{
                  x: [
                    Math.cos(p.angle) * 62,
                    Math.cos(p.angle + Math.PI / 2) * 62,
                    Math.cos(p.angle + Math.PI) * 62,
                    Math.cos(p.angle + Math.PI * 1.5) * 62,
                    Math.cos(p.angle + Math.PI * 2) * 62,
                  ],
                  y: [
                    Math.sin(p.angle) * 62,
                    Math.sin(p.angle + Math.PI / 2) * 62,
                    Math.sin(p.angle + Math.PI) * 62,
                    Math.sin(p.angle + Math.PI * 1.5) * 62,
                    Math.sin(p.angle + Math.PI * 2) * 62,
                  ],
                  opacity: [0.4, 1, 0.4, 1, 0.4],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: p.delay,
                }}
              />
            ))}

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -30 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ position: "relative", zIndex: 10 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    "drop-shadow(0 0 8px rgba(168,85,247,0.4))",
                    "drop-shadow(0 0 20px rgba(168,85,247,0.8))",
                    "drop-shadow(0 0 8px rgba(168,85,247,0.4))",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="52" height="52" viewBox="0 0 60 60" fill="none">
                  <defs>
                    <linearGradient id="lg-load" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="55%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#lg-load)" />
                  <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#lg-load)" opacity="0.95" />
                  <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#lg-load)" opacity="0.82" />
                </svg>
              </motion.div>
            </motion.div>

            {/* KEDA yazısı */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 text-center"
              style={{ position: "relative", zIndex: 10 }}
            >
              <div className="flex items-center gap-1">
                {"KEDA".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    className="text-2xl font-bold tracking-widest"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      background: "linear-gradient(135deg, #a5b4fc, #818cf8, #6366f1)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.3 }}
              className="mt-5 relative"
              style={{ position: "relative", zIndex: 10 }}
            >
              <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={phase >= 3 ? { x: "0%" } : {}}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #60a5fa)" }}
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
