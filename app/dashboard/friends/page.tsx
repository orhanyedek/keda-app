"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, X, UserMinus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  searchUsers, sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend, getFriends,
  getPendingRequests, getFriendStats, updatePublicStats
} from "@/lib/db";
import toast from "react-hot-toast";

interface UserStat {
  user_id: string;
  display_name: string;
  streak: number;
  weekly_cards: number;
  total_cards: number;
  last_active: string;
}

interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "az önce";
  if (h < 24) return `${h} saat önce`;
  if (d < 7) return `${d} gün önce`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = [["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#10b981","#047857"],["#f59e0b","#b45309"],["#ef4444","#b91c1c"]];
  const [from, to] = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="rounded-xl flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.38 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends" | "search" | "requests">("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStats, setFriendStats] = useState<UserStat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship & { requester_name?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserStat[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

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
      const ids = data.map((f: any) => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      if (ids.length > 0) {
        const { data: stats } = await getFriendStats(ids);
        if (stats) setFriendStats(stats as UserStat[]);
      }
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    const { data } = await getPendingRequests(user.id);
    if (data) {
      const withNames = await Promise.all((data as Friendship[]).map(async (req) => {
        const { data: stats } = await getFriendStats([req.requester_id]);
        return { ...req, requester_name: stats?.[0]?.display_name || "Kullanıcı" };
      }));
      setPendingRequests(withNames as any);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await searchUsers(searchQuery, user.id);
    setSearchResults((data as UserStat[]) || []);
    setSearching(false);
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!user) return;
    const { error } = await sendFriendRequest(user.id, toUserId);
    if (error) { toast.error("İstek gönderilemedi"); return; }
    setSentRequests(prev => new Set([...prev, toUserId]));
    toast.success("Arkadaşlık isteği gönderildi!");
  };

  const handleAccept = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId);
    toast.success("Arkadaşlık kabul edildi!");
    loadFriends();
    loadPendingRequests();
  };

  const handleReject = async (friendshipId: string) => {
    await rejectFriendRequest(friendshipId);
    setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));
    toast.success("İstek reddedildi");
  };

  const handleRemove = async (friendshipId: string) => {
    await removeFriend(friendshipId);
    setFriends(prev => prev.filter(f => f.id !== friendshipId));
    toast.success("Arkadaşlıktan çıkarıldı");
  };

  const getFriendId = (f: Friendship) =>
    f.requester_id === user?.id ? f.receiver_id : f.requester_id;

  const getFriendStat = (friendId: string) =>
    friendStats.find(s => s.user_id === friendId);

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
        <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--foreground))" }}>Arkadaşlar</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Arkadaşlarının çalışma istatistiklerini takip et
        </p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "friends", label: `Arkadaşlar${friends.length > 0 ? ` (${friends.length})` : ""}` },
          { key: "search", label: "Ara" },
          { key: "requests", label: `İstekler${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "hsl(var(--secondary))" }}>
                <Users className="w-6 h-6" style={{ color: "hsl(var(--muted-foreground))" }} />
              </div>
              <p className="text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>Henüz arkadaşın yok</p>
              <button onClick={() => setTab("search")} className="btn-primary px-4 py-2 text-sm">
                Arkadaş Ara
              </button>
            </div>
          ) : friends.map(f => {
            const friendId = getFriendId(f);
            const stat = getFriendStat(friendId);
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-center gap-4">
                <Avatar name={stat?.display_name || "?"} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    {stat?.display_name || "Kullanıcı"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {stat?.last_active ? timeAgo(stat.last_active) : ""}
                  </p>
                </div>
                {/* İstatistikler */}
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {stat?.weekly_cards || 0}
                    </p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>bu hafta</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                      {stat?.total_cards || 0}
                    </p>
                    <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>toplam kart</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(f.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Arkadaşlıktan çıkar">
                  <UserMinus className="w-4 h-4" />
                </button>
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
                placeholder="İsim veya kullanıcı adı ara..." className="keda-input pl-9" />
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
                className="keda-card p-4 flex items-center gap-4">
                <Avatar name={u.display_name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{u.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {u.total_cards} toplam kart · {timeAgo(u.last_active)}
                  </p>
                </div>
                {sentRequests.has(u.user_id) ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                    İstek gönderildi
                  </span>
                ) : friends.some(f => getFriendId(f) === u.user_id) ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                    Arkadaş
                  </span>
                ) : (
                  <button onClick={() => handleSendRequest(u.user_id)}
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
          ) : pendingRequests.map((req: any) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="keda-card p-4 flex items-center gap-4">
              <Avatar name={req.requester_name || "?"} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{req.requester_name}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlık isteği gönderdi</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleAccept(req.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => handleReject(req.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-colors keda-card">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
