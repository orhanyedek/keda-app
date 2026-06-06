import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { senderName, receiverEmail, receiverName } = await req.json();

    if (!receiverEmail || !senderName) {
      return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "KEDA <onboarding@resend.dev>",
      to: receiverEmail,
      subject: `${senderName} seni KEDA'da takip etmek istiyor`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background:#09090b;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
            
            <!-- Header -->
            <div style="padding:32px 32px 24px;border-bottom:1px solid #27272a;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:0;">
                <div style="width:32px;height:32px;background:#fafafa;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-weight:800;font-size:16px;color:#09090b;">K</span>
                </div>
                <span style="font-weight:700;font-size:16px;color:#fafafa;">KEDA</span>
              </div>
            </div>

            <!-- Content -->
            <div style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#fafafa;">
                Yeni Arkadaşlık İsteği
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Merhaba ${receiverName || ""},<br><br>
                <strong style="color:#fafafa;">${senderName}</strong> seni KEDA'da takip etmek istiyor.
              </p>

              <!-- Sender card -->
              <div style="background:#09090b;border:1px solid #27272a;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#fff;flex-shrink:0;">
                  ${senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style="margin:0;font-weight:600;font-size:15px;color:#fafafa;">${senderName}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#71717a;">KEDA Kullanıcısı</p>
                </div>
              </div>

              <!-- CTA -->
              <a href="https://keda-app-five.vercel.app/dashboard/friends" 
                style="display:block;background:#fafafa;color:#09090b;text-align:center;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;margin-bottom:16px;">
                İsteği Görüntüle
              </a>
              
              <p style="margin:0;font-size:12px;color:#52525b;text-align:center;line-height:1.6;">
                Bu isteği reddedebilir veya kabul edebilirsin.<br>
                KEDA — Akıllı Çalışma Asistanı
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Mail gönderilemedi" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
