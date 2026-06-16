"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserPlus, Check, X, UserMinus, Users, MessageCircle,
  Send, Activity, Mic, MicOff, Trash2, Plus, Hash, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  removeFriend, getFriends, getPendingRequests, getFriendStats, updatePublicStats,
  getMessages, sendMessage as sendDM, markMessagesRead, getFriendActivities,
  getGroupChats, createGroupChat, getGroupMessages, sendGroupMessage,
  deleteGroupMessage, getGroupMembers, deleteMessageForAll, deleteMessageForSender,
  getUnreadMessages, sendStudyInvite
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

interface UserStat {
  user_id: string; display_name: string; email: string;
  streak: number; weekly_cards: number; total_cards: number; last_active: string;
}
interface Friendship { id: string; requester_id: string; receiver_id: string; status: string; }
interface Message {
  id: string; sender_id: string; receiver_id: string; content: string;
  read: boolean; created_at: string; message_type?: string; audio_url?: string;
  deleted_for_all?: boolean; deleted_for_sender?: boolean;
}
interface GroupMessage {
  id: string; group_id: string; sender_id: string; content: string;
  message_type?: string; audio_url?: string; deleted_for_all?: boolean; created_at: string;
}
interface GroupChat { id: string; name: string; created_by: string; created_at: string; }
interface ActivityItem { id: string; user_id: string; type: string; description: string; created_at: string; meta?: any; }

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

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string; size?: number }) {
  const [from, to] = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div className="rounded-xl flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: `linear-gradient(135deg,${from},${to})`, fontSize: size * 0.38 }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ── Emoji Picker ──
function EmojiPicker({ onSelect }: { onSelect: (e: string) => void }) {
  return (
    <div className="absolute bottom-full right-0 mb-2 p-2 rounded-xl grid grid-cols-5 gap-1 shadow-xl z-50"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      {EMOJI_LIST.map(e => (
        <button key={e} onClick={() => onSelect(e)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(var(--accent))] text-lg transition-colors">
          {e}
        </button>
      ))}
    </div>
  );
}

// ── Chat Input ──
function ChatInput({ onSend, placeholder = "Mesaj yaz..." }: { onSend: (text: string, type: string, audioBlob?: Blob) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), "text");
    setInput("");
    setShowEmoji(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onSend("", "audio", blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { toast.error("Mikrofon izni gerekli"); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="relative flex items-center gap-2 p-3 border-t border-[hsl(var(--border))]">
      {/* Emoji */}
      <div className="relative">
        <button onClick={() => setShowEmoji(!showEmoji)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors text-lg"
          style={{ color: "hsl(var(--muted-foreground))" }}>
          😊
        </button>
        <AnimatePresence>
          {showEmoji && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
              <EmojiPicker onSelect={e => { setInput(prev => prev + e); setShowEmoji(false); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
        placeholder={placeholder} className="flex-1 keda-input py-2 text-sm" />

      {/* Ses mesajı */}
      <button
        onMouseDown={startRecording} onMouseUp={stopRecording}
        onTouchStart={startRecording} onTouchEnd={stopRecording}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${recording ? "bg-red-500/20 text-red-400" : "hover:bg-[hsl(var(--accent))]"}`}
        style={{ color: recording ? undefined : "hsl(var(--muted-foreground))" }}
        title="Ses mesajı (basılı tut)">
        {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <button onClick={handleSend} disabled={!input.trim()}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
        style={{ background: "hsl(var(--foreground))" }}>
        <Send className="w-3.5 h-3.5" style={{ color: "hsl(var(--background))" }} />
      </button>
    </div>
  );
}

// ── Mesaj Balonu ──
function MessageBubble({ msg, isMe, onDelete, senderName }: {
  msg: Message | GroupMessage; isMe: boolean; onDelete?: (id: string, forAll: boolean) => void; senderName?: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  if ((msg as Message).deleted_for_all) return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <p className="text-xs italic px-3 py-2 rounded-xl" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))" }}>
        Mesaj silindi
      </p>
    </div>
  );

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
      <div className="relative max-w-[75%]">
        {!isMe && senderName && (
          <p className="text-[10px] mb-1 px-1" style={{ color: "hsl(var(--muted-foreground))" }}>{senderName}</p>
        )}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={{ background: isMe ? "hsl(var(--foreground))" : "hsl(var(--secondary))", color: isMe ? "hsl(var(--background))" : "hsl(var(--foreground))" }}>
          {(msg as any).message_type === "audio" && (msg as any).audio_url ? (
            <audio src={(msg as any).audio_url} controls className="h-8 max-w-[180px]" />
          ) : (
            <p className="leading-relaxed">{msg.content}</p>
          )}
          <p className="text-[10px] mt-1 opacity-60 text-right">
            {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {/* Sil butonu */}
        {isMe && onDelete && (
          <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="w-6 h-6 rounded-full flex items-center justify-center shadow"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <ChevronDown className="w-3 h-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-7 rounded-xl overflow-hidden shadow-xl z-10 min-w-36"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <button onClick={() => { onDelete(msg.id, false); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[hsl(var(--accent))] transition-colors"
                      style={{ color: "hsl(var(--muted-foreground))" }}>
                      Benden sil
                    </button>
                    <button onClick={() => { onDelete(msg.id, true); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors">
                      Herkes için sil
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DM Chat Modalı ──
function DMChat({ currentUserId, friend, onClose }: { currentUserId: string; friend: UserStat; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markMessagesRead(currentUserId, friend.user_id);
    const ch = supabase.channel("dm-" + [currentUserId, friend.user_id].sort().join("-"))
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new as Message;
        if ((m.sender_id === friend.user_id && m.receiver_id === currentUserId) ||
          (m.sender_id === currentUserId && m.receiver_id === friend.user_id)) {
          setMessages(prev => [...prev, m]);
          if (m.sender_id === friend.user_id) markMessagesRead(currentUserId, friend.user_id);
        }
      })
      .on("postgres_changes" as any, { event: "UPDATE", schema: "public", table: "messages" }, (p: any) => {
        setMessages(prev => prev.map(m => m.id === p.new.id ? { ...m, ...p.new } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await getMessages(currentUserId, friend.user_id);
    if (data) setMessages((data as Message[]).filter(m => !m.deleted_for_all && !(m.deleted_for_sender && m.sender_id === currentUserId)));
  };

  const handleSend = async (text: string, type: string, audioBlob?: Blob) => {
    let audioUrl = "";
    if (audioBlob) {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const { data } = await supabase.storage.from("avatars").upload(`voices/${Date.now()}.webm`, file);
      if (data) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
        audioUrl = urlData.publicUrl;
      }
    }
    await sendDM(currentUserId, friend.user_id, text || "🎤", type as any, audioUrl || undefined);
  };

  const handleDelete = async (id: string, forAll: boolean) => {
    if (forAll) await deleteMessageForAll(id);
    else await deleteMessageForSender(id);
    setMessages(prev => forAll
      ? prev.map(m => m.id === id ? { ...m, deleted_for_all: true } : m)
      : prev.filter(m => m.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()} transition={{ duration: 0.25 }}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", height: "70vh", maxHeight: 520 }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
          <Avatar name={friend.display_name} avatarUrl={friend.avatar_url} size={36} />
          <p className="text-sm font-semibold flex-1" style={{ color: "hsl(var(--foreground))" }}>{friend.display_name}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-center" style={{ color: "hsl(var(--muted-foreground))" }}>İlk mesajı sen gönder!</p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === currentUserId} onDelete={handleDelete} />
          ))}
          <div ref={endRef} />
        </div>
        <ChatInput onSend={handleSend} />
      </motion.div>
    </motion.div>
  );
}

// ── Grup Chat Modalı ──
function GroupChat({ currentUserId, group, friendStats, onClose }: {
  currentUserId: string; group: GroupChat; friendStats: UserStat[]; onClose: () => void;
}) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    getGroupMembers(group.id).then(({ data }) => { if (data) setMembers(data.map((m: any) => m.user_id)); });
    const ch = supabase.channel("group-" + group.id)
      .on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "group_messages",
        filter: `group_id=eq.${group.id}` }, (p: any) => {
        setMessages(prev => [...prev, p.new as GroupMessage]);
      })
      .on("postgres_changes" as any, { event: "DELETE", schema: "public", table: "group_messages" }, (p: any) => {
        setMessages(prev => prev.filter(m => m.id !== p.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await getGroupMessages(group.id);
    if (data) setMessages(data as GroupMessage[]);
  };

  const handleSend = async (text: string, type: string, audioBlob?: Blob) => {
    let audioUrl = "";
    if (audioBlob) {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const { data } = await supabase.storage.from("avatars").upload(`voices/${Date.now()}.webm`, file);
      if (data) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
        audioUrl = urlData.publicUrl;
      }
    }
    await sendGroupMessage(group.id, currentUserId, text || "🎤", type, audioUrl || undefined);
  };

  const handleDelete = async (id: string) => {
    await deleteGroupMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUserId) return "Sen";
    return friendStats.find(s => s.user_id === senderId)?.display_name || "Kullanıcı";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()} transition={{ duration: 0.25 }}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", height: "70vh", maxHeight: 520 }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--secondary))" }}>
            <Hash className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{group.name}</p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{members.length} üye</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
            style={{ color: "hsl(var(--muted-foreground))" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-center" style={{ color: "hsl(var(--muted-foreground))" }}>Grup sohbeti başlıyor!</p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg as any} isMe={msg.sender_id === currentUserId}
              senderName={getSenderName(msg.sender_id)}
              onDelete={msg.sender_id === currentUserId ? (id) => handleDelete(id) : undefined} />
          ))}
          <div ref={endRef} />
        </div>
        <ChatInput onSend={handleSend} />
      </motion.div>
    </motion.div>
  );
}

// ── Grup Oluştur Modalı ──
function CreateGroupModal({ friends, friendStats, currentUserId, onClose, onCreate }: {
  friends: Friendship[]; friendStats: UserStat[]; currentUserId: string;
  onClose: () => void; onCreate: (group: GroupChat) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const getFId = (f: Friendship) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id;

  const handleCreate = async () => {
    if (!name.trim() || selected.size === 0) { toast.error("Grup adı ve en az 1 üye seç"); return; }
    setLoading(true);
    const { data, error } = await createGroupChat(currentUserId, name.trim(), [...selected]);
    if (error || !data) { toast.error("Grup oluşturulamadı"); setLoading(false); return; }
    toast.success("Grup oluşturuldu!");
    onCreate(data as GroupChat);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>Grup Oluştur</h3>
        </div>
        <div className="p-5 space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Grup adı..." className="keda-input" />
          <div>
            <p className="text-xs mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Üye Ekle</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.map(f => {
                const fid = getFId(f);
                const stat = friendStats.find(s => s.user_id === fid);
                if (!stat) return null;
                const sel = selected.has(fid);
                return (
                  <div key={f.id} onClick={() => setSelected(prev => { const n = new Set(prev); sel ? n.delete(fid) : n.add(fid); return n; })}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                    style={{ background: sel ? "hsl(var(--foreground)/0.08)" : "hsl(var(--secondary))" }}>
                    <Avatar name={stat.display_name} size={32} />
                    <p className="text-sm flex-1" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</p>
                    {sel && <Check className="w-4 h-4" style={{ color: "hsl(var(--foreground))" }} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50">
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </button>
            <button onClick={onClose} className="btn-secondary px-4 py-2.5 text-sm">İptal</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ana Sayfa ──
export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"friends" | "groups" | "feed" | "search" | "requests">("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStats, setFriendStats] = useState<UserStat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserStat[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [chatFriend, setChatFriend] = useState<UserStat | null>(null);
  const [chatGroup, setChatGroup] = useState<GroupChat | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";

  useEffect(() => {
    if (!user) return;
    updatePublicStats(user.id, userName, user.email || "", user.user_metadata?.avatar_url || "");
    loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: fData }, { data: gData }] = await Promise.all([
      getFriends(user.id), getGroupChats(user.id)
    ]);
    if (fData) {
      setFriends(fData as Friendship[]);
      const ids = (fData as Friendship[]).map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id);
      if (ids.length > 0) {
        const { data: stats } = await getFriendStats(ids);
        if (stats) setFriendStats(stats as UserStat[]);
        const { data: acts } = await getFriendActivities(ids);
        if (acts) setActivities(acts as ActivityItem[]);
      }
    }
    if (gData) setGroupChats(gData as GroupChat[]);

    // Okunmamış mesajlar
    const { data: unread } = await getUnreadMessages(user.id);
    if (unread) {
      const map: Record<string, number> = {};
      (unread as any[]).forEach(m => { map[m.sender_id] = (map[m.sender_id] || 0) + 1; });
      setUnreadMap(map);
    }

    await loadPendingRequests();
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
    toast.success("İstek gönderildi!");
    const toStat = searchResults.find(s => s.user_id === toUserId);
    if (toStat?.email) {
      fetch("/api/send-friend-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName: userName, receiverEmail: toStat.email, receiverName: toStat.display_name }),
      }).catch(() => {});
    }
  };

  const handleStudyInvite = async (friendId: string, friendName: string) => {
    if (!user) return;
    await sendStudyInvite(user.id, friendId, userName);
    toast.success(`${friendName}'a çalışma daveti gönderildi!`);
  };

  const getFriendId = (f: Friendship) => f.requester_id === user?.id ? f.receiver_id : f.requester_id;
  const getFriendStat = (id: string) => friendStats.find(s => s.user_id === id);

  const activityIcon: Record<string, string> = {
    flashcard_session: "📇", podcast_created: "🎙", plan_created: "📅",
    quiz_completed: "✅", study_invite: "📣",
  };

  const TABS = [
    { key: "friends", label: `Arkadaşlar${friends.length > 0 ? ` (${friends.length})` : ""}` },
    { key: "groups", label: `Gruplar${groupChats.length > 0 ? ` (${groupChats.length})` : ""}` },
    { key: "feed", label: "Aktiviteler" },
    { key: "search", label: "Ara" },
    { key: "requests", label: `İstekler${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}` },
  ];

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
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlarınla çalış, mesajlaş, takip et</p>
      </motion.div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${tab === t.key
              ? "bg-[hsl(var(--foreground)/0.08)] border border-[hsl(var(--foreground)/0.15)] text-[hsl(var(--foreground))]"
              : "glass text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ARKADAŞLAR ── */}
      {tab === "friends" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {loading ? <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>Yükleniyor...</div>
          : friends.length === 0 ? (
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
            const unread = unreadMap[fid] || 0;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-center gap-3">
                <div className="relative cursor-pointer" onClick={() => setChatFriend(stat)}>
                  <Avatar name={stat.display_name} avatarUrl={stat.avatar_url} size={44} />
                  {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
                    style={{ borderColor: "hsl(var(--card))" }} />}
                  {unread > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{unread}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{stat.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {isOnline ? "Çevrimiçi" : timeAgo(stat.last_active)}
                    {" · "}{stat.weekly_cards || 0} kart bu hafta
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleStudyInvite(fid, stat.display_name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors text-sm"
                    style={{ color: "hsl(var(--muted-foreground))" }} title="Çalışma daveti gönder">
                    📚
                  </button>
                  <button onClick={() => setChatFriend(stat)}
                    className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button onClick={async () => { await removeFriend(f.id); setFriends(prev => prev.filter(x => x.id !== f.id)); toast.success("Çıkarıldı"); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-colors">
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── GRUPLAR ── */}
      {tab === "groups" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <button onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center gap-2 p-3.5 rounded-xl border border-dashed transition-all hover:border-[hsl(var(--foreground)/0.3)] text-sm"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            <Plus className="w-4 h-4" />
            Yeni Grup Oluştur
          </button>
          {groupChats.length === 0 ? (
            <div className="keda-card p-6 text-center">
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Henüz grup sohbeti yok</p>
            </div>
          ) : groupChats.map(g => (
            <div key={g.id} onClick={() => setChatGroup(g)}
              className="keda-card p-4 flex items-center gap-3 cursor-pointer hover:border-[hsl(var(--foreground)/0.15)] transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--secondary))" }}>
                <Hash className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{g.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {new Date(g.created_at).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
          ))}
        </motion.div>
      )}

      {/* ── AKTİVİTE ── */}
      {tab === "feed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {activities.length === 0 ? (
            <div className="keda-card p-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Henüz aktivite yok</p>
            </div>
          ) : activities.map(act => {
            const stat = friendStats.find(s => s.user_id === act.user_id);
            const name = stat?.display_name || "Kullanıcı";
            const isStudyInvite = act.type === "study_invite" && act.meta?.to_user === user?.id;
            return (
              <motion.div key={act.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="keda-card p-4 flex items-start gap-3">
                <Avatar name={name} avatarUrl={stat?.avatar_url} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    <span className="font-semibold">{name}</span>{" "}
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>{act.description}</span>
                  </p>
                  <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground)/0.5)" }}>{timeAgo(act.created_at)}</p>
                  {isStudyInvite && (
                    <button onClick={() => router.push("/dashboard")}
                      className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-all btn-primary">
                      Çalışmaya Başla
                    </button>
                  )}
                </div>
                <span className="text-lg flex-shrink-0">{activityIcon[act.type] || "📌"}</span>
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
                <Avatar name={u.display_name} avatarUrl={u.avatar_url} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{u.display_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {u.total_cards} kart · {timeAgo(u.last_active)}
                  </p>
                </div>
                {sentRequests.has(u.user_id) || friends.some(f => getFriendId(f) === u.user_id) ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
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
              <Avatar name={req.requester_name} avatarUrl={req.requester_avatar} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{req.requester_name}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Arkadaşlık isteği</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { await acceptFriendRequest(req.id); toast.success("Kabul edildi!"); loadAll(); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={async () => { await rejectFriendRequest(req.id); setPendingRequests(prev => prev.filter(r => r.id !== req.id)); }}
                  className="w-9 h-9 rounded-xl keda-card flex items-center justify-center hover:bg-red-500/10 text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modallar */}
      <AnimatePresence>
        {chatFriend && <DMChat currentUserId={user?.id || ""} friend={chatFriend} onClose={() => { setChatFriend(null); setUnreadMap(prev => ({ ...prev, [chatFriend.user_id]: 0 })); }} />}
        {chatGroup && <GroupChat currentUserId={user?.id || ""} group={chatGroup} friendStats={friendStats} onClose={() => setChatGroup(null)} />}
        {showCreateGroup && (
          <CreateGroupModal friends={friends} friendStats={friendStats} currentUserId={user?.id || ""}
            onClose={() => setShowCreateGroup(false)}
            onCreate={g => setGroupChats(prev => [g, ...prev])} />
        )}
      </AnimatePresence>
    </div>
  );
}
