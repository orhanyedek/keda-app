"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Mic, MicOff, Hash, Plus, X, Check, Users, MessageCircle, ChevronDown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getFriends, getFriendStats, getGroupChats, createGroupChat,
  getGroupMembers, getMessages, sendMessage as sendDM,
  markMessagesRead, getUnreadMessages,
  getGroupMessages, sendGroupMessage, deleteGroupMessage,
  deleteMessageForAll, deleteMessageForSender
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface UserStat { user_id: string; display_name: string; email: string; avatar_url?: string; weekly_cards: number; total_cards: number; last_active: string; }
interface Friendship { id: string; requester_id: string; receiver_id: string; status: string; }
interface Message { id: string; sender_id: string; receiver_id?: string; group_id?: string; content: string; read?: boolean; created_at: string; message_type?: string; audio_url?: string; deleted_for_all?: boolean; deleted_for_sender?: boolean; }
interface GroupChat { id: string; name: string; created_by: string; created_at: string; }

const EMOJI_LIST = ["😀","😂","😍","🥰","😎","🤔","👍","👏","🙏","🎉","🔥","💯","📚","✅","❤️","😅","🤣","😊","🎯","💪"];
const COLORS = [["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#10b981","#047857"],["#f59e0b","#b45309"],["#ef4444","#b91c1c"]];

function timeAgo(date: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk`;
  if (h < 24) return `${h} sa`;
  if (d < 7) return `${d} gün`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ name, avatarUrl, size = 40, online = false }: { name: string; avatarUrl?: string; size?: number; online?: boolean }) {
  const [from, to] = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="rounded-full object-cover w-full h-full" />
      ) : (
        <div className="rounded-full w-full h-full flex items-center justify-center font-semibold text-white"
          style={{ background: `linear-gradient(135deg,${from},${to})`, fontSize: size * 0.38 }}>
          {(name || "?").charAt(0).toUpperCase()}
        </div>
      )}
      {online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2" style={{ borderColor: "hsl(var(--background))" }} />}
    </div>
  );
}

function GroupAvatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
      <Hash className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
    </div>
  );
}

// ── Mesaj Balonu ──
function Bubble({ msg, isMe, senderName, onDelete }: {
  msg: Message; isMe: boolean; senderName?: string;
  onDelete?: (id: string, forAll: boolean) => void;
}) {
  const [menu, setMenu] = useState(false);
  if (msg.deleted_for_all) return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <span className="text-xs italic px-3 py-1.5 rounded-2xl" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))" }}>Mesaj silindi</span>
    </div>
  );
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group`}>
      <div className="relative max-w-[72%]">
        {!isMe && senderName && <p className="text-[10px] mb-0.5 ml-1 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{senderName}</p>}
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={{ background: isMe ? "hsl(var(--foreground))" : "hsl(var(--secondary))", color: isMe ? "hsl(var(--background))" : "hsl(var(--foreground))" }}>
          {msg.message_type === "audio" && msg.audio_url ? (
            <audio src={msg.audio_url} controls className="h-8 max-w-[200px]" />
          ) : msg.content}
          <span className={`text-[10px] ml-2 opacity-50 float-right mt-1`}>
            {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {isMe && onDelete && (
          <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setMenu(!menu)}
              className="w-5 h-5 rounded-full flex items-center justify-center shadow"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <ChevronDown className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-6 rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <button onClick={() => { onDelete(msg.id, false); setMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>Benden sil</button>
                  <button onClick={() => { onDelete(msg.id, true); setMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Herkes için sil</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chat Input ──
function ChatInput({ onSend }: { onSend: (text: string, type: string, blob?: Blob) => void }) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim(), "text");
    setInput("");
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        onSend("", "audio", new Blob(chunksRef.current, { type: "audio/webm" }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { toast.error("Mikrofon izni gerekli"); }
  };

  const stopRec = () => { mediaRef.current?.stop(); setRecording(false); };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-[hsl(var(--border))]"
      style={{ background: "hsl(var(--background))" }}>
      <div className="relative">
        <button onClick={() => setShowEmoji(!showEmoji)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors text-lg">😊</button>
        <AnimatePresence>
          {showEmoji && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-10 left-0 p-2 rounded-xl grid grid-cols-5 gap-1 shadow-xl z-50"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              {EMOJI_LIST.map(e => (
                <button key={e} onClick={() => setInput(p => p + e)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(var(--accent))] text-lg transition-colors">{e}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
        placeholder="Mesaj yaz..." className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
        style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }} />
      <button onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${recording ? "bg-red-500/20 text-red-400" : "hover:bg-[hsl(var(--accent))]"}`}
        style={{ color: recording ? undefined : "hsl(var(--muted-foreground))" }}>
        {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
      <button onClick={send} disabled={!input.trim()}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
        style={{ background: "hsl(var(--foreground))" }}>
        <Send className="w-3.5 h-3.5" style={{ color: "hsl(var(--background))" }} />
      </button>
    </div>
  );
}

// ── Grup Oluştur Modal ──
function CreateGroupModal({ friends, friendStats, currentUserId, onClose, onCreate }: {
  friends: Friendship[]; friendStats: UserStat[]; currentUserId: string;
  onClose: () => void; onCreate: (g: GroupChat) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const getFId = (f: Friendship) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Grup adı gir"); return; }
    if (selected.size === 0) { toast.error("En az 1 üye seç"); return; }
    setLoading(true);
    const { data, error } = await createGroupChat(currentUserId, name.trim(), [...selected]);
    if (error || !data) { toast.error("Grup oluşturulamadı: " + JSON.stringify(error)); setLoading(false); return; }
    toast.success("Grup oluşturuldu!");
    onCreate(data as GroupChat);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>Yeni Grup</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[hsl(var(--accent))]" style={{ color: "hsl(var(--muted-foreground))" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Grup adı..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} />
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Üye ekle</p>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {friends.map(f => {
              const fid = getFId(f);
              const stat = friendStats.find(s => s.user_id === fid);
              if (!stat) return null;
              const sel = selected.has(fid);
              return (
                <div key={f.id} onClick={() => setSelected(prev => { const n = new Set(prev); sel ? n.delete(fid) : n.add(fid); return n; })}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: sel ? "hsl(var(--foreground)/0.08)" : "transparent" }}>
                  <Avatar name={stat.display_name} avatarUrl={stat.avatar_url} size={32} />
                  <p className="text-sm flex-1" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</p>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${sel ? "border-[hsl(var(--foreground))]" : "border-[hsl(var(--border))]"}`}
                    style={{ background: sel ? "hsl(var(--foreground))" : "transparent" }}>
                    {sel && <Check className="w-3 h-3" style={{ color: "hsl(var(--background))" }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
            {loading ? "Oluşturuluyor..." : "Grup Oluştur"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Sohbet listesi
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStats, setFriendStats] = useState<UserStat[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  // Aktif sohbet
  const [activeDM, setActiveDM] = useState<UserStat | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";

  useEffect(() => { if (user) loadAll(); }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadAll = async () => {
    if (!user) return;
    const [{ data: fData }, { data: gData }, { data: unread }] = await Promise.all([
      getFriends(user.id), getGroupChats(user.id), getUnreadMessages(user.id)
    ]);
    if (fData) {
      setFriends(fData as Friendship[]);
      const ids = (fData as Friendship[]).map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      if (ids.length) {
        const { data: stats } = await getFriendStats(ids);
        if (stats) setFriendStats(stats as UserStat[]);
      }
    }
    if (gData) setGroupChats(gData as GroupChat[]);
    if (unread) {
      const map: Record<string, number> = {};
      (unread as any[]).forEach(m => { map[m.sender_id] = (map[m.sender_id] || 0) + 1; });
      setUnreadMap(map);
    }
  };

  const openDM = async (stat: UserStat) => {
    if (!user) return;
    setActiveDM(stat); setActiveGroup(null); setLoadingMsgs(true);
    setShowSidebar(false);
    const { data } = await getMessages(user.id, stat.user_id);
    if (data) setMessages((data as Message[]).filter(m => !m.deleted_for_all && !(m.deleted_for_sender && m.sender_id === user.id)));
    await markMessagesRead(user.id, stat.user_id);
    setUnreadMap(prev => ({ ...prev, [stat.user_id]: 0 }));
    setLoadingMsgs(false);
  };

  const openGroup = async (group: GroupChat) => {
    if (!user) return;
    setActiveGroup(group); setActiveDM(null); setLoadingMsgs(true);
    setShowSidebar(false);
    const [{ data: msgs }, { data: members }] = await Promise.all([
      getGroupMessages(group.id), getGroupMembers(group.id)
    ]);
    if (msgs) setMessages(msgs as Message[]);
    if (members) setGroupMembers(members.map((m: any) => m.user_id));
    setLoadingMsgs(false);
  };

  // Realtime için ref'ler — closure sorununu önler
  const activeDMRef = useRef<UserStat | null>(null);
  const activeGroupRef = useRef<GroupChat | null>(null);
  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);

  // Realtime subscription — sadece karşı taraftan gelen mesajları dinler
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("messages-page-" + user.id)
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Message;
        // Sadece karşıdan gelen (benim göndermediğim) mesajları ekle
        if (m.sender_id === user.id) return;
        const dm = activeDMRef.current;
        if (dm && m.sender_id === dm.user_id && m.receiver_id === user.id) {
          setMessages(prev => {
            if (prev.find(x => x.id === m.id)) return prev;
            return [...prev, m];
          });
          markMessagesRead(user.id, dm.user_id);
        } else if (m.receiver_id === user.id) {
          setUnreadMap(prev => ({ ...prev, [m.sender_id]: (prev[m.sender_id] || 0) + 1 }));
        }
      })
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "group_messages" }, (p: any) => {
        const m = p.new as Message;
        if (m.sender_id === user.id) return; // kendi mesajımızı zaten handleSend'de ekledik
        const grp = activeGroupRef.current;
        if (grp && m.group_id === grp.id) {
          setMessages(prev => {
            if (prev.find(x => x.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      })
      .on("postgres_changes" as any, { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
        setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, ...p.new } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]); // user dışında bağımlılık yok — ref'ler üzerinden erişiyoruz

  const handleSend = async (text: string, type: string, blob?: Blob) => {
    if (!user) return;
    let audioUrl = "";
    if (blob) {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const { data } = await supabase.storage.from("avatars").upload(`voices/${Date.now()}.webm`, file);
      if (data) { const { data: u } = supabase.storage.from("avatars").getPublicUrl(data.path); audioUrl = u.publicUrl; }
    }

    if (activeDM) {
      const { data: newMsg } = await sendDM(user.id, activeDM.user_id, text || "🎤", type as any, audioUrl || undefined);
      if (newMsg) setMessages(prev => [...prev, newMsg as Message]);
    }
    if (activeGroup) {
      const { data: newMsg } = await sendGroupMessage(activeGroup.id, user.id, text || "🎤", type, audioUrl || undefined);
      if (newMsg) setMessages(prev => [...prev, newMsg as Message]);
    }
  };

  const handleDelete = async (id: string, forAll: boolean) => {
    if (activeDM) {
      if (forAll) await deleteMessageForAll(id);
      else await deleteMessageForSender(id);
      setMessages(prev => forAll ? prev.map(m => m.id === id ? { ...m, deleted_for_all: true } : m) : prev.filter(m => m.id !== id));
    } else if (activeGroup) {
      await deleteGroupMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return "Sen";
    return friendStats.find(s => s.user_id === senderId)?.display_name || "Kullanıcı";
  };

  const getFriendId = (f: Friendship) => f.requester_id === user?.id ? f.receiver_id : f.requester_id;
  const getFriendStat = (id: string) => friendStats.find(s => s.user_id === id);

  const filteredFriends = friends.filter(f => {
    const stat = getFriendStat(getFriendId(f));
    return stat?.display_name.toLowerCase().includes(search.toLowerCase());
  });
  const filteredGroups = groupChats.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const activeChat = activeDM || activeGroup;
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(var(--background))" }}>

      {/* ── Sol Panel: Sohbet Listesi ── */}
      <div className={`${showSidebar ? "flex" : "hidden"} lg:flex flex-col border-r border-[hsl(var(--border))] w-full lg:w-80 xl:w-96 flex-shrink-0`}
        style={{ background: "hsl(var(--background))" }}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] lg:hidden"
                style={{ color: "hsl(var(--muted-foreground))" }}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-bold" style={{ color: "hsl(var(--foreground))" }}>
                Mesajlar
                {totalUnread > 0 && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{totalUnread}</span>}
              </h1>
            </div>
            <button onClick={() => setShowCreateGroup(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }} title="Yeni grup">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ara..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }} />
          </div>
        </div>

        {/* Sohbet Listesi */}
        <div className="flex-1 overflow-y-auto">
          {/* Gruplar */}
          {filteredGroups.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Gruplar</p>
              {filteredGroups.map(g => (
                <button key={g.id} onClick={() => openGroup(g)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[hsl(var(--accent))]"
                  style={{ background: activeGroup?.id === g.id ? "hsl(var(--accent))" : "transparent" }}>
                  <GroupAvatar name={g.name} size={44} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{g.name}</p>
                    <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>Grup sohbeti</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* DM'ler */}
          {filteredFriends.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlar</p>
              {filteredFriends.map(f => {
                const fid = getFriendId(f);
                const stat = getFriendStat(fid);
                if (!stat) return null;
                const isOnline = stat.last_active && (Date.now() - new Date(stat.last_active).getTime()) < 10 * 60 * 1000;
                const unread = unreadMap[fid] || 0;
                return (
                  <button key={f.id} onClick={() => openDM(stat)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[hsl(var(--accent))]"
                    style={{ background: activeDM?.user_id === fid ? "hsl(var(--accent))" : "transparent" }}>
                    <Avatar name={stat.display_name} avatarUrl={stat.avatar_url} size={44} online={!!isOnline} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</p>
                        {unread > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{unread}</span>}
                      </div>
                      <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {isOnline ? "Çevrimiçi" : timeAgo(stat.last_active)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {filteredFriends.length === 0 && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <MessageCircle className="w-8 h-8" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaş bulunamadı</p>
              <button onClick={() => router.push("/dashboard/friends")}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                Arkadaş Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Sağ Panel: Aktif Chat ── */}
      <div className={`${!showSidebar || activeChat ? "flex" : "hidden"} lg:flex flex-1 flex-col min-w-0`}>
        {!activeChat ? (
          /* Boş durum */
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--secondary))" }}>
              <MessageCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>Bir sohbet seç</p>
            <p className="text-xs">Sol taraftan arkadaşını veya grubu seç</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]"
              style={{ background: "hsl(var(--background))" }}>
              <button onClick={() => { setShowSidebar(true); setActiveDM(null); setActiveGroup(null); }}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] lg:hidden"
                style={{ color: "hsl(var(--muted-foreground))" }}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              {activeDM ? (
                <>
                  <Avatar name={activeDM.display_name} avatarUrl={activeDM.avatar_url} size={38}
                    online={(Date.now() - new Date(activeDM.last_active).getTime()) < 10 * 60 * 1000} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{activeDM.display_name}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {(Date.now() - new Date(activeDM.last_active).getTime()) < 10 * 60 * 1000 ? "Çevrimiçi" : `Son görülme: ${timeAgo(activeDM.last_active)}`}
                    </p>
                  </div>
                </>
              ) : activeGroup && (
                <>
                  <GroupAvatar name={activeGroup.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{activeGroup.name}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{groupMembers.length} üye</p>
                  </div>
                </>
              )}
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
              style={{ background: "hsl(var(--background))" }}>
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--muted-foreground))" }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>İlk mesajı sen gönder! 👋</p>
                </div>
              ) : (
                messages.map(msg => (
                  <Bubble key={msg.id} msg={msg}
                    isMe={msg.sender_id === user?.id}
                    senderName={activeGroup ? getSenderName(msg.sender_id) : undefined}
                    onDelete={msg.sender_id === user?.id ? handleDelete : undefined} />
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <ChatInput onSend={handleSend} />
          </>
        )}
      </div>

      {/* Grup Oluştur Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupModal friends={friends} friendStats={friendStats} currentUserId={user?.id || ""}
            onClose={() => setShowCreateGroup(false)}
            onCreate={g => { setGroupChats(prev => [g, ...prev]); openGroup(g); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
