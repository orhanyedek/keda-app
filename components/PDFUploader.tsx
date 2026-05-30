"use client";

import { useState, useRef } from "react";
import { extractTextFromPDF } from "@/lib/pdf-extract";
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
          dragging ? "border-indigo-400 bg-indigo-500/10"
          : fileName ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
        } ${loading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="loading-dots"><span /><span /><span /></div>
            <p className="text-slate-400 text-sm">PDF okunuyor...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <p className="text-emerald-400 text-sm font-medium truncate">{fileName}</p>
              <p className="text-slate-600 text-xs">Değiştirmek için tıkla</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-slate-300 text-sm font-medium">{label}</p>
              <p className="text-slate-600 text-xs">Sürükle bırak veya tıkla · Maks 20MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Metin önizleme */}
      {preview && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Çıkarılan metin önizlemesi</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed font-mono line-clamp-3">{preview}...</p>
        </div>
      )}
    </div>
  );
}
