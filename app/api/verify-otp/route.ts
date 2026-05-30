import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    // OTP'yi kontrol et
    const { data, error } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Hatalı kod" }, { status: 400 });
    }

    // Süre kontrolü
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("email_otps").delete().eq("email", email);
      return NextResponse.json({ error: "Kodun süresi dolmuş" }, { status: 400 });
    }

    // OTP'yi sil (tek kullanımlık)
    await supabase.from("email_otps").delete().eq("email", email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-otp hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
