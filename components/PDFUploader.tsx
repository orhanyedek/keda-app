"use client";

import { useState, useRef } from "react";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { supabase } from "@/lib/supabase";
import { savePdfDocument } from "@/lib/db";
import { FileText, Upload, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface PDFUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  label?: string;
}

export default function PDFUploader({ onTextExtracted, label = "PDF Yükle" }: PDFUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Sadece PDF dosyası yükleyebilirsiniz");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Dosya 20MB'dan büyük olamaz");
      return;
    }

    setLoading(true);
    setFileName(file.name);
    setPreview("");
    try {
      toast.loading("PDF okunuyor...", { id: "pdf-extract" });
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 50) {
        toast.error("PDF'ten metin çıkarılamadı.", { id: "pdf-extract" });
        return;
      }
      setPreview(text.slice(0, 200).trim());
      toast.success(`${file.name} okundu · ${text.length} karakter`, { id: "pdf-extract" });
      onTextExtracted(text, file.name);

      // Depoya kaydet
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await savePdfDocument(user.id, file.name, text);
      }
    } catch (err) {
      console.error(err);
      toast.error("PDF okunamadı", { id: "pdf-extract" });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          dragging ? "border-[hsl(var(--primary))] bg-[hsl(0 0% 100% / 0.03)]"
          : fileName ? "border-[hsl(142_72%_29%/0.5)] bg-[hsl(142_72%_29%/0.05)]"
          : "border-[hsl(var(--border))] hover:border-[hsl(0 0% 100% / 0.15)] hover:bg-[hsl(var(--primary)/0.03)]"
        } ${loading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="loading-dots"><span /><span /><span /></div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>PDF okunuyor...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(142 72% 55%)" }} />
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "hsl(142 72% 55%)" }}>{fileName}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Değiştirmek için tıkla</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.07)" }}>
              <Upload className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{label}</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Sürükle bırak veya tıkla · Maks 20MB</p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="p-3 rounded-xl border border-[hsl(var(--border))]" style={{ background: "hsl(var(--muted))" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Önizleme · Depoya kaydedildi</span>
          </div>
          <p className="text-xs leading-relaxed font-mono line-clamp-3" style={{ color: "hsl(var(--muted-foreground))" }}>{preview}...</p>
        </div>
      )}
    </div>
  );
}

interface PDFUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  label?: string;
}
