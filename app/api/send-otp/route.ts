import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// OTP'yi geçici olarak sakla (Supabase'de otp_codes tablosu)
export async function POST(req: NextRequest) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
    }

    // 6 haneli OTP üret
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    // OTP'yi Supabase'e kaydet (önce varsa sil)
    await supabase.from("email_otps").delete().eq("email", email);
    const { error: insertError } = await supabase.from("email_otps").insert({
      email,
      otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP kayıt hatası:", insertError);
      return NextResponse.json({ error: "OTP oluşturulamadı" }, { status: 500 });
    }

    // Resend ile mail gönder
    const { error: emailError } = await resend.emails.send({
      from: "KEDA <onboarding@resend.dev>",
      to: email,
      subject: "KEDA - E-posta Doğrulama Kodunuz",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#09090b;font-family:Inter,system-ui,sans-serif">
          <div style="max-width:480px;margin:40px auto;background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden">
            <!-- Header -->
            <div style="padding:32px 40px 24px;border-bottom:1px solid #27272a;text-align:center">
              <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:4px">
                <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="55%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#60a5fa"/></linearGradient></defs>
                  <rect x="4" y="4" width="12" height="52" rx="6" fill="url(#kg)"/>
                  <path d="M16 30 L44 8 Q51 3 54 10 L26 30Z" fill="url(#kg)" opacity="0.95"/>
                  <path d="M16 30 L44 52 Q51 57 54 50 L26 30Z" fill="url(#kg)" opacity="0.82"/>
                </svg>
                <span style="font-size:18px;font-weight:600;color:#fafafa">KEDA</span>
              </div>
            </div>
            <!-- Body -->
            <div style="padding:40px">
              <h1 style="color:#fafafa;font-size:20px;font-weight:600;margin:0 0 8px;letter-spacing:-0.01em">
                Merhaba${fullName ? ", " + fullName : ""}!
              </h1>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 32px">
                KEDA hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın. Bu kod <strong style="color:#fafafa">10 dakika</strong> geçerlidir.
              </p>
              <!-- OTP Kodu -->
              <div style="background:#1c1c1e;border:1px solid #3f3f46;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px">
                <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#fafafa;font-family:monospace">
                  ${otp}
                </div>
              </div>
              <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0">
                Bu kodu siz istemediyseniz bu e-postayı görmezden gelebilirsiniz. Hesabınız güvende.
              </p>
            </div>
            <!-- Footer -->
            <div style="padding:20px 40px;border-top:1px solid #27272a;text-align:center">
              <p style="color:#52525b;font-size:12px;margin:0">KEDA · Yapay Zeka Destekli Çalışma Asistanı</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Email gönderme hatası:", emailError);
      return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
