import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import LoadingScreen from "@/components/LoadingScreen";

export const metadata: Metadata = {
  title: "KEDA - Akıllı Çalışma Asistanı",
  description: "Yapay zeka destekli kişisel çalışma asistanı. Flashcard, Podcast ve Akıllı Ajanda ile öğrenmeni hızlandır.",
  keywords: ["eğitim", "flashcard", "spaced repetition", "podcast", "çalışma planı", "yapay zeka"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <LoadingScreen />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(240 10% 6%)",
              color: "#f8fafc",
              border: "1px solid hsl(240 4% 14%)",
              borderRadius: "10px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
