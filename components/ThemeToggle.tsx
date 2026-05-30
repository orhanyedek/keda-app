"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("keda_theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("light-theme", !isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light-theme", !next);
    localStorage.setItem("keda_theme", next ? "dark" : "light");
  };

  return (
    <button onClick={toggle}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all"
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}>
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
