"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Layers, CalendarDays, Mic } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface Result {
  id: string;
  type: "flashcard" | "plan" | "podcast";
  title: string;
  sub: string;
  href: string;
}

export default function Search() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Klavye kısayolu: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || !user) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const q = query.toLowerCase();
      const [setsRes, plansRes, podcastsRes] = await Promise.all([
        supabase.from("flashcard_sets").select("id, baslik").eq("kullanici_id", user.id).ilike("baslik", `%${q}%`).limit(3),
        supabase.from("study_plans").select("id, baslik").eq("kullanici_id", user.id).ilike("baslik", `%${q}%`).limit(3),
        supabase.from("podcasts").select("id, baslik").eq("kullanici_id", user.id).ilike("baslik", `%${q}%`).limit(3),
      ]);
      const items: Result[] = [
        ...(setsRes.data || []).map(s => ({ id: s.id, type: "flashcard" as const, title: s.baslik, sub: "Flashcard Seti", href: "/dashboard/flashcards" })),
        ...(plansRes.data || []).map(p => ({ id: p.id, type: "plan" as const, title: p.baslik, sub: "Çalışma Planı", href: "/dashboard/agenda" })),
        ...(podcastsRes.data || []).map(p => ({ id: p.id, type: "podcast" as const, title: p.baslik, sub: "Podcast", href: "/dashboard/podcast" })),
      ];
      setResults(items);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, user]);

  const icons = { flashcard: Layers, plan: CalendarDays, podcast: Mic };
  const colors = { flashcard: "text-indigo-400", plan: "text-blue-400", podcast: "text-purple-400" };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs transition-all hover:bg-white/5">
        <SearchIcon className="w-3.5 h-3.5" />
        <span>Ara</span>
        <span className="text-slate-700 font-mono text-[10px]">⌘K</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 keda-card border border-white/10 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <SearchIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Flashcard, plan, podcast ara..."
                className="flex-1 bg-transparent text-slate-200 text-sm outline-none placeholder-slate-600" />
              {query && (
                <button onClick={() => setQuery("")} className="text-slate-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {searching ? (
                <div className="px-4 py-6 text-center text-slate-600 text-sm">Aranıyor...</div>
              ) : query && results.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-600 text-sm">Sonuç bulunamadı</div>
              ) : results.length > 0 ? results.map(r => {
                const Icon = icons[r.type];
                return (
                  <Link key={r.id} href={r.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${colors[r.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-600">{r.sub}</p>
                    </div>
                  </Link>
                );
              }) : (
                <div className="px-4 py-6 text-center text-slate-600 text-sm">Aramak için yazmaya başla</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
