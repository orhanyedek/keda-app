"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, X, UserMinus, Users, MessageCircle, Send, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  searchUsers, sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend, getFriends,
  getPendingRequests, getFriendStats, updatePublicStats,
  getMessages, sendMessage, markMessagesRead, getFriendActivities
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface UserStat {
  user_id: string; display_name: string; email: string;
  streak: number; weekly_cards: number; total_cards: number; last_active: string;
}
interface Friendship { id: string; requester_id: string; receiver_id: string; status: string; }
interface Message { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string; }
interface Activity { id: string; user_id: string; type: string; description: string; created_at: string; }

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  if (h < 24) return `${h} saat önce`;
  if (d < 7) return `${d} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

const COLORS = [["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#10b981","#047857"],["#f59e0b","#b45309"],["#ef4444","#b91c1c"]];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const [from, to] = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div className="rounded-xl flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Profil Modalı ──
function ProfileModal({ stat, friendship, onClose, onMessage, currentUserId }: {
  stat: UserStat; friendship: Friendship; onClose: () => void;
  onMessage: () => void; currentUserId: string;
}) {
  const isOnline = stat.last_active && (Date.now() - new Date(stat.last_active).getTime()) < 10 * 60 * 1000;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        {/* Header */}
        <div className="p-6 text-center border-b border-[hsl(var(--border))]">
          <div className="relative inline-block mb-3">
            <Avatar name={stat.display_name} size={72} />
            {isOnline && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: "hsl(var(--card))" }} />}
          </div>
          <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</h2>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isOnline ? "Çevrimiçi" : `Son görülme: ${timeAgo(stat.last_active)}`}
          </p>
        </div>
        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-px" style={{ background: "hsl(var(--border))" }}>
          {[
            { label: "Bu Hafta", value: stat.weekly_cards || 0, unit: "kart" },
            { label: "Toplam", value: stat.total_cards || 0, unit: "kart" },
            { label: "Streak", value: stat.streak || 0, unit: "gün" },
          ].map(s => (
            <div key={s.label} className="p-4 text-center" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
            </div>
          ))}
        </div>
        {/* Butonlar */}
        <div className="p-4 flex gap-2">
          <button onClick={onMessage}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
            <MessageCircle className="w-4 h-4" />
            Mesaj Gönder
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
            Kapat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mesajlaşma Modalı ──
function ChatModal({ currentUserId, friend, onClose }: {
  currentUserId: string; friend: UserStat; onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markMessagesRead(currentUserId, friend.user_id);

    // Realtime
    const channel = supabase.channel("chat-" + friend.user_id)
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const msg = payload.new as Message;
          if ((msg.sender_id === friend.user_id && msg.receiver_id === currentUserId) ||
            (msg.sender_id === currentUserId && msg.receiver_id === friend.user_id)) {
            setMessages(prev => [...prev, msg]);
            if (msg.sender_id === friend.user_id) markMessagesRead(currentUserId, friend.user_id);
          }
        }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await getMessages(currentUserId, friend.user_id);
    if (data) setMessages(data as Message[]);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const { error } = await sendMessage(currentUserId, friend.user_id, input.trim());
    if (!error) setInput("");
    else toast.error("Mesaj gönderilemedi");
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", height: "70vh", maxHeight: 520 }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
          <Avatar name={friend.display_name} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{friend.display_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                Henüz mesaj yok.<br />İlk mesajı sen gönder!
              </p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe ? "rounded-br-sm" : "rounded-bl-sm"
                }`} style={{
                  background: isMe ? "hsl(var(--foreground))" : "hsl(var(--secondary))",
                  color: isMe ? "hsl(var(--background))" : "hsl(var(--foreground))",
                }}>
                  {msg.content}
                  <div className={`text-[10px] mt-1 ${isMe ? "text-right" : ""}`}
                    style={{ opacity: 0.6 }}>
                    {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[hsl(var(--border))] flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Mesaj yaz..." className="flex-1 keda-input py-2 text-sm" />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "hsl(var(--foreground))" }}>
            <Send className="w-4 h-4" style={{ color: "hsl(var(--background))" }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ana Sayfa ──
export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends" | "feed" | "search" | "requests">("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStats, setFriendStats] = useState<UserStat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserStat[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<{ stat: UserStat; friendship: Friendship } | null>(null);
  const [chatFriend, setChatFriend] = useState<UserStat | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";

  useEffect(() => {
    if (!user) return;
    updatePublicStats(user.id, userName, user.email || "");
    loadFriends();
    loadPendingRequests();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getFriends(user.id);
    if (data) {
      setFriends(data as Friendship[]);
      const ids = (data as Friendship[]).map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      if (ids.length > 0) {
        const { data: stats } = await getFriendStats(ids);
        if (stats) {
          setFriendStats(stats as UserStat[]);
          const { data: acts } = await getFriendActivities(ids);
          if (acts) setActivities(acts as Activity[]);
        }
      }
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    const { data } = await getPendingRequests(user.id);
    if (data) {
      const withNames = await Promise.all((data as Friendship[]).map(async req => {
        const { data: stats } = await getFriendStats([req.requester_id]);
        return { ...req, requester_name: stats?.[0]?.display_name || "Kullanıcı" };
      }));
      setPendingRequests(withNames);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await searchUsers(searchQuery, user.id);
    setSearchResults((data as UserStat[]) || []);
    setSearching(false);
  };

  const handleSendRequest = async (toUserId: string, toName: string) => {
    if (!user) return;
    const { error } = await sendFriendRequest(user.id, toUserId);
    if (error) { toast.error("İstek gönderilemedi"); return; }
    setSentRequests(prev => new Set([...prev, toUserId]));
    toast.success("Arkadaşlık isteği gönderildi!");

    // Mail gönder
    const toStat = searchResults.find(s => s.user_id === toUserId);
    if (toStat?.email) {
      fetch("/api/send-friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName: userName, receiverEmail: toStat.email, receiverName: toStat.display_name }),
      }).catch(() => {});
    }
  };

  const getFriendId = (f: Friendship) => f.requester_id === user?.id ? f.receiver_id : f.requester_id;
  const getFriendStat = (id: string) => friendStats.find(s => s.user_id === id);

  const activityIcon = (type: string) => {
    if (type === "flashcard_session") return "🃏";
    if (type === "podcast_created") return "🎙";
    if (type === "plan_created") return "📅";
    if (type === "quiz_completed") return "✅";
    return "📌";
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-24 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: "hsl(var(--muted-foreground))" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </button>
        <h1 className="text-xl lg:text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Arkadaşlar</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlarının çalışma istatistiklerini takip et</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: "friends", label: `Arkadaşlar${friends.length > 0 ? ` (${friends.length})` : ""}` },
          { key: "feed", label: "Aktiviteler" },
          { key: "search", label: "Ara" },
          { key: "requests", label: `İstekler${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${tab === t.key
              ? "bg-[hsl(var(--foreground)/0.08)] border border-[hsl(var(--foreground)/0.15)] text-[hsl(var(--foreground))]"
              : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ARKADAŞLAR ── */}
      {tab === "friends" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {loading ? (
            <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>Yükleniyor...</div>
          ) : friends.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>Henüz arkadaşın yok</p>
              <button onClick={() => setTab("search")} className="btn-primary px-4 py-2 text-sm">Arkadaş Ara</button>
            </div>
          ) : friends.map(f => {
            const fid = getFriendId(f);
            const stat = getFriendStat(fid);
            if (!stat) return null;
            const isOnline = stat.last_active && (Date.now() - new Date(stat.last_active).getTime()) < 10 * 60 * 1000;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-center gap-3">
                {/* Avatar + online */}
                <div className="relative cursor-pointer" onClick={() => setSelectedProfile({ stat, friendship: f })}>
                  <Avatar name={stat.display_name} size={44} />
                  {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
                    style={{ borderColor: "hsl(var(--card))" }} />}
                </div>

                {/* Bilgi */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedProfile({ stat, friendship: f })}>
                  <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {isOnline ? "Çevrimiçi" : timeAgo(stat.last_active)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-center">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{stat.weekly_cards || 0}</p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>bu hafta</p>
                  </div>
                </div>

                {/* Aksiyon butonları */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setChatFriend(stat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => { removeFriend(f.id); setFriends(prev => prev.filter(x => x.id !== f.id)); toast.success("Arkadaşlıktan çıkarıldı"); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-colors">
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── AKTİVİTE AKIŞI ── */}
      {tab === "feed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {activities.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Henüz aktivite yok. Arkadaşların bir şeyler yapınca burada görünecek.
              </p>
            </div>
          ) : activities.map(act => {
            const stat = friendStats.find(s => s.user_id === act.user_id);
            const name = stat?.display_name || "Kullanıcı";
            return (
              <motion.div key={act.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-start gap-3">
                <Avatar name={name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    <span className="font-semibold">{name}</span>{" "}
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{act.description}</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground)/0.6)" }}>{timeAgo(act.created_at)}</p>
                </div>
                <span className="text-lg flex-shrink-0">{activityIcon(act.type)}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── ARAMA ── */}
      {tab === "search" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Kullanıcı adı veya e-posta..." className="keda-input pl-9" />
            </div>
            <button onClick={handleSearch} disabled={searching} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
              {searching ? "Arıyor..." : "Ara"}
            </button>
          </div>
          <div className="space-y-3">
            {searchResults.length === 0 && searchQuery && !searching && (
              <div className="keda-card p-6 text-center">
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Kullanıcı bulunamadı</p>
              </div>
            )}
            {searchResults.map(u => (
              <motion.div key={u.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-center gap-3">
                <Avatar name={u.display_name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{u.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {u.total_cards} kart · {timeAgo(u.last_active)}
                  </p>
                </div>
                {sentRequests.has(u.user_id) || friends.some(f => getFriendId(f) === u.user_id) ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                    {friends.some(f => getFriendId(f) === u.user_id) ? "Arkadaş" : "İstek gönderildi"}
                  </span>
                ) : (
                  <button onClick={() => handleSendRequest(u.user_id, u.display_name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                    <UserPlus className="w-3.5 h-3.5" />
                    Ekle
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── İSTEKLER ── */}
      {tab === "requests" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Bekleyen istek yok</p>
            </div>
          ) : pendingRequests.map(req => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="keda-card p-4 flex items-center gap-3">
              <Avatar name={req.requester_name} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{req.requester_name}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlık isteği gönderdi</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { await acceptFriendRequest(req.id); toast.success("Kabul edildi!"); loadFriends(); loadPendingRequests(); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={async () => { await rejectFriendRequest(req.id); setPendingRequests(prev => prev.filter(r => r.id !== req.id)); toast.success("Reddedildi"); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center keda-card hover:bg-red-500/10 text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Profil Modalı */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileModal
            stat={selectedProfile.stat}
            friendship={selectedProfile.friendship}
            currentUserId={user?.id || ""}
            onClose={() => setSelectedProfile(null)}
            onMessage={() => { setChatFriend(selectedProfile.stat); setSelectedProfile(null); }}
          />
        )}
      </AnimatePresence>

      {/* Chat Modalı */}
      <AnimatePresence>
        {chatFriend && (
          <ChatModal
            currentUserId={user?.id || ""}
            friend={chatFriend}
            onClose={() => setChatFriend(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
