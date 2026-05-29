/**
 * KEDA - PDF Yükleme Componenti
 * Drag & drop veya tıklama ile PDF yükle, metni çıkar
 */

"use client";

import { useState, useRef } from "react";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import toast from "react-hot-toast";

interface PDFUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  label?: string;
}

export default function PDFUploader({ onTextExtracted, label = "PDF Yükle" }: PDFUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
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
    try {
      toast.loading("PDF okunuyor...", { id: "pdf-extract" });
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 50) {
        toast.error("PDF'ten metin çıkarılamadı. Taranmış görsel PDF olabilir.", { id: "pdf-extract" });
        return;
      }
      toast.success(`${file.name} okundu (${text.length} karakter)`, { id: "pdf-extract" });
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
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
        dragging
          ? "border-indigo-400 bg-indigo-500/10"
          : "border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5"
      } ${loading ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="loading-dots"><span /><span /><span /></div>
          <p className="text-slate-400 text-sm">PDF okunuyor: {fileName}</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">✅</span>
          <p className="text-emerald-400 text-sm font-medium">{fileName}</p>
          <p className="text-slate-500 text-xs">Farklı PDF için tıkla veya sürükle</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📄</span>
          <div>
            <p className="text-white font-medium text-sm">{label}</p>
            <p className="text-slate-500 text-xs mt-1">Sürükle bırak veya tıkla · Maks 20MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
