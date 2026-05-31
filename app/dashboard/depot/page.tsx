"use client";

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getPdfDocuments, renamePdfDocument, deletePdfDocument } from "@/lib/db";
import { FileText, Trash2, Pencil, Check, X, Search, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface PdfDoc {
  id: string;
  dosya_adi: string;
  cikarilan_metin: string;
  durum: string;
  sayfa_sayisi: number | null;
  created_at: string;
}

export default function DepotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [docs, setDocs] = useState<PdfDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [previewDoc, setPreviewDoc] = useState<PdfDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    getPdfDocuments(user.id).then(({ data }) => {
      setDocs((data as PdfDoc[]) || []);
      setLoading(false);
    });
  }, [user]);

  const filtered = docs.filter(d =>
    d.dosya_adi.toLowerCase().includes(search.toLowerCase())
  );

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await renamePdfDocument(id, editName.trim());
    if (!error) {
      setDocs(prev => prev.map(d => d.id === id ? { ...d, dosya_adi: editName.trim() } : d));
      toast.success("İsim güncellendi");
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu PDF'i silmek istediğinize emin misiniz?")) return;
    const { error } = await deletePdfDocument(id);
    if (!error) {
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success("PDF silindi");
      if (previewDoc?.id === id) setPreviewDoc(null);
    }
  };

  const totalChars = docs.reduce((s, d) => s + (d.cikarilan_metin?.length || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-[hsl(var(--foreground))]" style={{ color: "hsl(var(--muted-foreground))" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Geri
      </button>
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>PDF Deposu</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Sisteme yüklenen tüm PDF'ler burada saklanır</p>
      </motion.div>

      {/* İstatistikler */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Toplam PDF", value: docs.length },
          { label: "Toplam Karakter", value: totalChars.toLocaleString("tr-TR") },
          { label: "Tamamlanan", value: docs.filter(d => d.durum === "tamamlandi").length },
        ].map(({ label, value }) => (
          <div key={label} className="keda-card p-4 text-center">
            <div className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Arama */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="PDF ara..." className="keda-input pl-9" />
      </div>

      {/* PDF listesi + önizleme */}
      <div className="flex gap-4">
        {/* Liste */}
        <div className={`flex-1 min-w-0 space-y-2 ${previewDoc ? "max-w-sm" : ""}`}>
          {loading ? (
            <div className="text-center py-16" style={{ color: "hsl(var(--muted-foreground))" }}>
              <div className="loading-dots justify-center mb-3"><span/><span/><span/></div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="keda-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                <FileText className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>
                {search ? "Sonuç bulunamadı" : "Henüz PDF yok"}
              </p>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {search ? "Farklı bir arama dene" : "Flashcard, Ajanda veya Podcast modülünden PDF yükle"}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map((doc) => (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  className={`keda-card p-4 cursor-pointer transition-all ${previewDoc?.id === doc.id ? "border-[hsl(var(--primary)/0.4)]" : ""}`}
                  onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                >
                  <div className="flex items-start gap-3">
                    {/* İkon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}>
                      <FileText className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                    </div>

                    {/* İsim ve meta */}
                    <div className="flex-1 min-w-0">
                      {editingId === doc.id ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input value={editName} onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleRename(doc.id); if (e.key === "Escape") setEditingId(null); }}
                            className="keda-input text-sm py-1 px-2 flex-1" autoFocus />
                          <button onClick={() => handleRename(doc.id)} className="p-1.5 rounded-lg" style={{ color: "hsl(142 72% 55%)" }}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{doc.dosya_adi}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                        </span>
                        {doc.sayfa_sayisi && (
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>· {doc.sayfa_sayisi} sayfa</span>
                        )}
                        {doc.cikarilan_metin && (
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>· {doc.cikarilan_metin.length.toLocaleString("tr-TR")} karakter</span>
                        )}
                        <span className={`badge text-[10px] ${doc.durum === "tamamlandi" ? "badge-success" : "badge-warning"}`}>
                          {doc.durum === "tamamlandi" ? "Hazır" : "İşleniyor"}
                        </span>
                      </div>
                    </div>

                    {/* Butonlar */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                        className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                        style={{ color: "hsl(var(--muted-foreground))" }} title="Önizle">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingId(doc.id); setEditName(doc.dosya_adi); }}
                        className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                        style={{ color: "hsl(var(--muted-foreground))" }} title="Yeniden adlandır">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-red-400" title="Sil">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Önizleme paneli */}
        <AnimatePresence>
          {previewDoc && (
            <motion.div initial={{ opacity: 0, x: 20, width: 0 }} animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 20, width: 0 }} transition={{ duration: 0.25 }}
              className="flex-1 min-w-0 overflow-hidden">
              <div className="keda-card h-full flex flex-col" style={{ maxHeight: "70vh" }}>
                <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{previewDoc.dosya_adi}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {previewDoc.cikarilan_metin?.length.toLocaleString("tr-TR")} karakter
                    </p>
                  </div>
                  <button onClick={() => setPreviewDoc(null)} className="ml-3 p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {previewDoc.cikarilan_metin ? (
                    <p className="text-xs leading-relaxed font-mono whitespace-pre-wrap" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {previewDoc.cikarilan_metin}
                    </p>
                  ) : (
                    <p className="text-sm text-center py-8" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Metin içeriği yok
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
