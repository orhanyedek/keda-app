"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UserAvatarProps {
  userId: string;
  userName: string;
  size?: number;
  className?: string;
}

// Avatarı cache'le
const avatarCache: Record<string, string | null> = {};

export default function UserAvatar({ userId, userName, size = 36, className = "" }: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (avatarCache[userId] !== undefined) {
      setAvatarUrl(avatarCache[userId]);
      return;
    }
    loadAvatar();
  }, [userId]);

  const loadAvatar = async () => {
    try {
      const { data } = await supabase.storage.from("avatars").list(userId);
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(`${userId}/avatar`);
        const url = urlData.publicUrl + "?t=" + Date.now();
        avatarCache[userId] = url;
        setAvatarUrl(url);
      } else {
        avatarCache[userId] = null;
      }
    } catch { avatarCache[userId] = null; }
  };

  // Gradient arka plan rengi — kullanıcı adından deterministik
  const colors = [
    ["hsl(0 0% 70%)", "hsl(0 0% 70%)"],
    ["#2563eb", "hsl(0 0% 65%)"],
    ["#059669", "#34d399"],
    ["#d97706", "#fbbf24"],
    ["#dc2626", "#f87171"],
    ["hsl(0 0% 70%)", "hsl(0 0% 65%)"],
  ];
  const colorIndex = userName.charCodeAt(0) % colors.length;
  const [from, to] = colors[colorIndex];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={userName}
        width={size}
        height={size}
        className={`rounded-xl object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => { avatarCache[userId] = null; setAvatarUrl(null); }}
      />
    );
  }

  // Fotoğraf yoksa: gradient + emoji/ikon
  const emojis = ["", "", "", "", "", ""];
  const emoji = emojis[userName.charCodeAt(0) % emojis.length];

  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: size * 0.38,
      }}
    >
      {emoji}
    </div>
  );
}
