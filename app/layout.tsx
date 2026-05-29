/**
 * KEDA - Root Layout
 * 
 * Tüm sayfaları saran ana layout bileşeni.
 * Dark tema ve metadata burada tanımlanır.
 * 
 * Sorumlu: Orhan Pala (M-04)
 */

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "KEDA - Akıllı Çalışma Asistanı",
  description: "Yapay zeka destekli kişisel çalışma asistanı. Flashcard, Podcast ve Akıllı Ajanda ile öğrenmeni hızlandır.",
  keywords: ["eğitim", "flashcard", "spaced repetition", "podcast", "çalışma planı", "yapay zeka"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {/* Arka plan mesh animasyonu - tüm sayfalarda görünür */}
        <div className="mesh-bg" />
        
        {children}
        
        {/* Toast bildirimleri - sağ üstte gösterilir */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
