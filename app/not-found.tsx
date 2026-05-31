import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "hsl(var(--background))" }}>
      <div className="text-center max-w-md">
        <div className="text-8xl font-black mb-4 font-mono" style={{ color: "hsl(var(--border))" }}>404</div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>Sayfa bulunamadı</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Aradığın sayfa mevcut değil ya da taşınmış olabilir.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary px-6 py-2.5 text-sm">Dashboard'a Git</Link>
          <Link href="/" className="btn-secondary px-6 py-2.5 text-sm">Ana Sayfa</Link>
        </div>
      </div>
    </div>
  );
}
