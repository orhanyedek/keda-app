"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, Mic, MicOff, Hash, Plus, X, Check,
  MessageCircle, ChevronDown, ArrowLeft, CornerUpLeft,
  Forward, Pin, Copy, Paperclip, Wifi, WifiOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getFriends, getFriendStats, getGroupChats, createGroupChat,
  getGroupMembers, getMessages, sendMessage as sendDM,
  markMessagesRead, getUnreadMessages,
  getGroupMessages, sendGroupMessage, deleteGroupMessage,
  deleteMessageForAll, deleteMessageForSender,
  addReaction, removeReaction, getReactions,
  setUserStatus, forwardMessage
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ── Tipler ──
interface UserStat {
  user_id: string; display_name: string; email: string; avatar_url?: string;
  weekly_cards: number; total_cards: number; last_active: string;
  status?: string; status_emoji?: string;
}
interface Friendship { id: string; requester_id: string; receiver_id: string; status: string; }
interface Message {
  id: string; sender_id: string; receiver_id?: string; group_id?: string;
  content: string; read?: boolean; created_at: string; message_type?: string;
  audio_url?: string; file_url?: string; file_name?: string;
  deleted_for_all?: boolean; deleted_for_sender?: boolean;
  reply_to?: string; reply_content?: string; forwarded?: boolean;
  pinned?: boolean;
}
interface GroupChat { id: string; name: string; created_by: string; created_at: string; }
interface Reaction { id: string; message_id: string; user_id: string; emoji: string; }

const QUICK_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];
const EMOJI_LIST = ["😀","😂","😍","🥰","😎","🤔","👍","👏","🙏","🎉","🔥","💯","📚","✅","❤️","😅","🤣","😊","🎯","💪"];
const COLORS = [["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#10b981","#047857"],["#f59e0b","#b45309"],["#ef4444","#b91c1c"]];
const STATUS_OPTIONS = [
  { emoji: "🟢", label: "Müsait", value: "available" },
  { emoji: "📚", label: "Çalışıyorum", value: "studying" },
  { emoji: "☕", label: "Molada", value: "break" },
  { emoji: "🔕", label: "Rahatsız Etme", value: "dnd" },
  { emoji: "💤", label: "Uzakta", value: "away" },
];

function timeAgo(date: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (m < 1) return "az önce"; if (m < 60) return `${m} dk`;
  if (h < 24) return `${h} sa`; if (d < 7) return `${d} gün`;
  return new Date(date).toLocaleDateString("tr-TR");
}

function Avatar({ name, avatarUrl, size = 40, online = false, statusEmoji }: {
  name: string; avatarUrl?: string; size?: number; online?: boolean; statusEmoji?: string;
}) {
  const [from, to] = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="rounded-full object-cover w-full h-full" />
        : <div className="rounded-full w-full h-full flex items-center justify-center font-semibold text-white"
            style={{ background: `linear-gradient(135deg,${from},${to})`, fontSize: size * 0.38 }}>
            {(name || "?").charAt(0).toUpperCase()}
          </div>}
      {statusEmoji
        ? <div className="absolute bottom-0 right-0 text-xs leading-none" style={{ fontSize: size * 0.3 }}>{statusEmoji}</div>
        : online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2" style={{ borderColor: "hsl(var(--background))" }} />}
    </div>
  );
}

function GroupAvatar({ size = 40 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
      <Hash className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm w-fit"
      style={{ background: "hsl(var(--secondary))" }}>
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--muted-foreground))" }}
          animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }} />
      ))}
    </div>
  );
}

// ── Mesaj Balonu ──
function Bubble({ msg, isMe, senderName, reactions, currentUserId, friends, onDelete, onReact, onReply, onForward, onCopy, onPin }: {
  msg: Message; isMe: boolean; senderName?: string;
  reactions: Reaction[]; currentUserId: string;
  friends: UserStat[];
  onDelete: (id: string, type: "me"|"all"|"incoming") => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onCopy: (text: string) => void;
  onPin: (msg: Message) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [showReact, setShowReact] = useState(false);
  const msgReactions = reactions.filter(r => r.message_id === msg.id);
  const grouped = msgReactions.reduce((acc, r) => { acc[r.emoji] = acc[r.emoji] || []; acc[r.emoji].push(r.user_id); return acc; }, {} as Record<string,string[]>);

  if (msg.deleted_for_all) return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <span className="text-xs italic px-3 py-1.5 rounded-2xl" style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--secondary))" }}>Mesaj silindi</span>
    </div>
  );

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2 group`}>
      <div className="relative max-w-[72%]">
        {!isMe && senderName && <p className="text-[10px] mb-0.5 ml-1 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{senderName}</p>}

        {/* İletildi etiketi */}
        {msg.forwarded && (
          <p className={`text-[10px] mb-0.5 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`} style={{ color: "hsl(var(--muted-foreground))" }}>
            <Forward className="w-2.5 h-2.5" /> İletildi
          </p>
        )}

        {/* Yanıt önizleme */}
        {msg.reply_to && msg.reply_content && (
          <div className={`px-3 py-1.5 rounded-t-xl mb-0.5 text-xs border-l-2 ${isMe ? "border-white/30" : "border-[hsl(var(--foreground)/0.3)]"}`}
            style={{ background: isMe ? "hsl(var(--foreground)/0.15)" : "hsl(var(--secondary)/0.7)", color: "hsl(var(--muted-foreground))" }}>
            <span className="truncate block">{msg.reply_content}</span>
          </div>
        )}

        {/* Balon */}
        <div className={`px-3.5 py-2 text-sm leading-relaxed ${msg.reply_to ? "rounded-b-2xl" : "rounded-2xl"} ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={{ background: isMe ? "hsl(var(--foreground))" : "hsl(var(--secondary))", color: isMe ? "hsl(var(--background))" : "hsl(var(--foreground))" }}>

          {msg.message_type === "audio" && msg.audio_url
            ? <audio src={msg.audio_url} controls className="h-8 max-w-[200px]" />
            : msg.message_type === "file" && msg.file_url
            ? (
              <a href={msg.file_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 underline opacity-90">
                <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{msg.file_name || "Dosya"}</span>
              </a>
            )
            : msg.message_type === "image" && msg.file_url
            ? <img src={msg.file_url} alt="görsel" className="rounded-xl max-w-[220px] max-h-[200px] object-cover block" />
            : msg.content}

          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] opacity-50">{new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            {isMe && <span className="text-[10px]" style={{ color: msg.read ? (isMe ? "rgba(255,255,255,0.8)" : "#3b82f6") : undefined, opacity: msg.read ? 1 : 0.5 }}>
              {msg.read ? "✓✓" : "✓"}
            </span>}
          </div>
        </div>

        {/* Reaksiyonlar */}
        {Object.keys(grouped).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(grouped).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                style={{ background: users.includes(currentUserId) ? "hsl(var(--foreground)/0.15)" : "hsl(var(--secondary))", border: `1px solid ${users.includes(currentUserId) ? "hsl(var(--foreground)/0.3)" : "hsl(var(--border))"}`}}>
                {emoji} <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover aksiyonları */}
        <div className={`absolute ${isMe ? "right-full mr-2" : "left-full ml-2"} top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
          {/* Emoji */}
          <div className="relative">
            <button onClick={() => setShowReact(!showReact)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
              style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>😊</button>
            <AnimatePresence>
              {showReact && (
                <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.9 }}
                  className={`absolute ${isMe ? "right-0" : "left-0"} bottom-8 flex gap-1 p-1.5 rounded-2xl shadow-xl z-20`}
                  style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(msg.id,e); setShowReact(false); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[hsl(var(--accent))] text-lg transition-colors">{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Yanıtla */}
          <button onClick={() => onReply(msg)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ border:"1px solid hsl(var(--border))", background:"hsl(var(--card))", color:"hsl(var(--muted-foreground))" }}>
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
          {/* ... menü */}
          <div className="relative">
            <button onClick={() => setMenu(!menu)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ border:"1px solid hsl(var(--border))", background:"hsl(var(--card))", color:"hsl(var(--muted-foreground))" }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.9 }}
                  className={`absolute ${isMe ? "right-0" : "left-0"} top-8 rounded-xl overflow-hidden shadow-xl z-20 min-w-[170px]`}
                  style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
                  <button onClick={() => { onCopy(msg.content); setMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color:"hsl(var(--muted-foreground))" }}>
                    <Copy className="w-3 h-3" /> Kopyala
                  </button>
                  <button onClick={() => { onForward(msg); setMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color:"hsl(var(--muted-foreground))" }}>
                    <Forward className="w-3 h-3" /> İlet
                  </button>
                  <button onClick={() => { onPin(msg); setMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color:"hsl(var(--muted-foreground))" }}>
                    <Pin className="w-3 h-3" /> {msg.pinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
                  </button>
                  <div style={{ height:1, background:"hsl(var(--border))" }} />
                  {isMe
                    ? <>
                        <button onClick={() => { onDelete(msg.id,"me"); setMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-[hsl(var(--accent))] transition-colors"
                          style={{ color:"hsl(var(--muted-foreground))" }}>Benden sil</button>
                        <button onClick={() => { onDelete(msg.id,"all"); setMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Herkes için sil</button>
                      </>
                    : <button onClick={() => { onDelete(msg.id,"incoming"); setMenu(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">Sil</button>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── İlet Modal ──
function ForwardModal({ msg, friends, currentUserId, onClose, onForward }: {
  msg: Message; friends: UserStat[]; currentUserId: string;
  onClose: () => void; onForward: (toUserId: string, toName: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = friends.filter(f => f.display_name.toLowerCase().includes(search.toLowerCase()));
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.95 }}
        onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-semibold text-sm" style={{ color:"hsl(var(--foreground))" }}>Mesajı İlet</h3>
          <button onClick={onClose} style={{ color:"hsl(var(--muted-foreground))" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3 border-b border-[hsl(var(--border))]">
          <div className="px-2 py-1.5 rounded-lg text-xs truncate" style={{ background:"hsl(var(--secondary))", color:"hsl(var(--muted-foreground))" }}>
            {msg.content || "Medya"}
          </div>
        </div>
        <div className="p-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara..."
            className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
            style={{ background:"hsl(var(--secondary))", border:"1px solid hsl(var(--border))", color:"hsl(var(--foreground))" }} />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filtered.map(f => (
              <button key={f.user_id} onClick={() => onForward(f.user_id, f.display_name)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-all text-left">
                <Avatar name={f.display_name} avatarUrl={f.avatar_url} size={32} />
                <p className="text-sm" style={{ color:"hsl(var(--foreground))" }}>{f.display_name}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Durum Seçici ──
function StatusPicker({ current, onSelect, onClose }: { current: string; onSelect: (s: typeof STATUS_OPTIONS[0]) => void; onClose: () => void; }) {
  return (
    <motion.div initial={{ opacity:0,scale:0.95,y:-8 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.95,y:-8 }}
      className="absolute top-full left-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50 min-w-[180px]"
      style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
      {STATUS_OPTIONS.map(s => (
        <button key={s.value} onClick={() => { onSelect(s); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--accent))] transition-colors text-left"
          style={{ background: current === s.value ? "hsl(var(--accent))" : "transparent" }}>
          <span>{s.emoji}</span>
          <span className="text-sm" style={{ color:"hsl(var(--foreground))" }}>{s.label}</span>
          {current === s.value && <Check className="w-3.5 h-3.5 ml-auto" style={{ color:"hsl(var(--foreground))" }} />}
        </button>
      ))}
    </motion.div>
  );
}

// ── Chat Input ──
function ChatInput({ onSend, replyTo, onCancelReply }: {
  onSend: (text: string, type: string, blob?: Blob, file?: File) => void;
  replyTo: Message | null; onCancelReply: () => void;
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim(), "text");
    setInput(""); setShowEmoji(false);
    inputRef.current?.focus();
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => { onSend("","audio", new Blob(chunksRef.current,{type:"audio/webm"})); stream.getTracks().forEach(t=>t.stop()); };
      mr.start(); mediaRef.current = mr; setRecording(true);
    } catch { toast.error("Mikrofon izni gerekli"); }
  };

  const stopRec = () => { mediaRef.current?.stop(); setRecording(false); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    onSend("", isImage ? "image" : "file", undefined, file);
    e.target.value = "";
  };

  return (
    <div className="border-t border-[hsl(var(--border))]" style={{ background:"hsl(var(--background))" }}>
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}
            className="flex items-center gap-2 px-4 py-2 border-l-2" style={{ borderColor:"hsl(var(--foreground)/0.5)", background:"hsl(var(--secondary)/0.5)" }}>
            <CornerUpLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color:"hsl(var(--muted-foreground))" }} />
            <p className="text-xs flex-1 truncate" style={{ color:"hsl(var(--muted-foreground))" }}>{replyTo.content || "Ses mesajı"}</p>
            <button onClick={onCancelReply} style={{ color:"hsl(var(--muted-foreground))" }}><X className="w-3 h-3" /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="relative">
          <button onClick={() => setShowEmoji(!showEmoji)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors text-lg">😊</button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:4 }}
                className="absolute bottom-10 left-0 p-2 rounded-xl grid grid-cols-5 gap-1 shadow-xl z-50"
                style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => setInput(p=>p+e)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(var(--accent))] text-lg transition-colors">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dosya ekle */}
        <button onClick={() => fileRef.current?.click()}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
          style={{ color:"hsl(var(--muted-foreground))" }}>
          <Paperclip className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx" className="hidden" onChange={handleFile} />

        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="Mesaj yaz..." className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
          style={{ background:"hsl(var(--secondary))", color:"hsl(var(--foreground))", border:"1px solid hsl(var(--border))" }} />

        <button onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${recording?"bg-red-500/20 text-red-400":"hover:bg-[hsl(var(--accent))]"}`}
          style={{ color:recording?undefined:"hsl(var(--muted-foreground))" }}>
          {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button onClick={send} disabled={!input.trim()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background:"hsl(var(--foreground))" }}>
          <Send className="w-3.5 h-3.5" style={{ color:"hsl(var(--background))" }} />
        </button>
      </div>
    </div>
  );
}

// ── Grup Oluştur Modal ──
function CreateGroupModal({ friends, currentUserId, onClose, onCreate }: {
  friends: Friendship[]; currentUserId: string;
  friendStats: UserStat[];
  onClose: () => void; onCreate: (g: GroupChat) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStat[]>([]);

  useEffect(() => {
    const ids = friends.map(f => f.requester_id === currentUserId ? f.receiver_id : f.requester_id);
    getFriendStats(ids).then(({ data }) => { if (data) setStats(data as UserStat[]); });
  }, []);

  const getFId = (f: Friendship) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Grup adı gir"); return; }
    if (selected.size === 0) { toast.error("En az 1 üye seç"); return; }
    setLoading(true);
    const { data, error } = await createGroupChat(currentUserId, name.trim(), [...selected]);
    if (error || !data) { toast.error("Grup oluşturulamadı"); setLoading(false); return; }
    toast.success("Grup oluşturuldu!"); onCreate(data as GroupChat); onClose();
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.95 }}
        onClick={e=>e.stopPropagation()} className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-semibold text-sm" style={{ color:"hsl(var(--foreground))" }}>Yeni Grup</h3>
          <button onClick={onClose} style={{ color:"hsl(var(--muted-foreground))" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Grup adı..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background:"hsl(var(--secondary))", border:"1px solid hsl(var(--border))", color:"hsl(var(--foreground))" }} />
          <p className="text-xs font-medium" style={{ color:"hsl(var(--muted-foreground))" }}>Üye ekle</p>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {friends.map(f => {
              const fid = getFId(f);
              const stat = stats.find(s => s.user_id === fid);
              if (!stat) return null;
              const sel = selected.has(fid);
              return (
                <div key={f.id} onClick={() => setSelected(prev => { const n=new Set(prev); sel?n.delete(fid):n.add(fid); return n; })}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background:sel?"hsl(var(--foreground)/0.08)":"transparent" }}>
                  <Avatar name={stat.display_name} avatarUrl={stat.avatar_url} size={32} />
                  <p className="text-sm flex-1" style={{ color:"hsl(var(--foreground))" }}>{stat.display_name}</p>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor:sel?"hsl(var(--foreground))":"hsl(var(--border))", background:sel?"hsl(var(--foreground))":"transparent" }}>
                    {sel && <Check className="w-3 h-3" style={{ color:"hsl(var(--background))" }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background:"hsl(var(--foreground))", color:"hsl(var(--background))" }}>
            {loading?"Oluşturuluyor...":"Grup Oluştur"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════
// ANA SAYFA
// ══════════════════════════════════════════════
export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendStats, setFriendStats] = useState<UserStat[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string,number>>({});
  const [search, setSearch] = useState("");
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());

  const [activeDM, setActiveDM] = useState<UserStat|null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupChat|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message|null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message|null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Kullanıcı durumu
  const [userStatus, setUserStatusState] = useState(STATUS_OPTIONS[0]);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const [callState, setCallState] = useState<"idle"|"in-call"|"incoming">("idle");
  const [callType, setCallType] = useState<"audio"|"video">("video");
  const [callRoomId, setCallRoomId] = useState("");
  const [incomingCall, setIncomingCall] = useState<{from:string;fromName:string;roomId:string;type:"audio"|"video"}|null>(null);

  const activeDMRef = useRef<UserStat|null>(null);
  const activeGroupRef = useRef<GroupChat|null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout|null>(null);
  const seenCallsRef = useRef<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";

  useEffect(() => { activeDMRef.current = activeDM; }, [activeDM]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);
  useEffect(() => { if (user) loadAll(); }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Çevrimiçi/çevrimdışı banner
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  // Sabitlenen sohbetleri localStorage'dan yükle
  useEffect(() => {
    const saved = localStorage.getItem("keda_pinned_chats");
    if (saved) setPinnedChats(new Set(JSON.parse(saved)));
  }, []);

  const loadAll = async () => {
    if (!user) return;
    const [{ data:fData }, { data:gData }, { data:unread }] = await Promise.all([
      getFriends(user.id), getGroupChats(user.id), getUnreadMessages(user.id)
    ]);
    if (fData) {
      setFriends(fData as Friendship[]);
      const ids = (fData as Friendship[]).map(f => f.requester_id===user.id?f.receiver_id:f.requester_id);
      if (ids.length) { const { data:stats } = await getFriendStats(ids); if (stats) setFriendStats(stats as UserStat[]); }
    }
    if (gData) setGroupChats(gData as GroupChat[]);
    if (unread) {
      const map: Record<string,number> = {};
      (unread as any[]).forEach(m => { map[m.sender_id]=(map[m.sender_id]||0)+1; });
      setUnreadMap(map);
    }
  };

  const loadReactions = async (msgs: Message[]) => {
    const { data } = await getReactions(msgs.map(m=>m.id));
    if (data) setReactions(data as Reaction[]);
  };

  const openDM = async (stat: UserStat) => {
    if (!user) return;
    setActiveDM(stat); setActiveGroup(null); setLoadingMsgs(true); setShowSidebar(false); setReplyTo(null);
    const { data } = await getMessages(user.id, stat.user_id);
    const msgs = ((data as Message[])||[]).filter(m=>!m.deleted_for_all&&!(m.deleted_for_sender&&m.sender_id===user.id));
    setMessages(msgs); await loadReactions(msgs);
    await markMessagesRead(user.id, stat.user_id);
    setUnreadMap(prev => ({...prev,[stat.user_id]:0}));
    setLoadingMsgs(false);
  };

  const openGroup = async (group: GroupChat) => {
    if (!user) return;
    setActiveGroup(group); setActiveDM(null); setLoadingMsgs(true); setShowSidebar(false); setReplyTo(null);
    const [{ data:msgs }, { data:members }] = await Promise.all([getGroupMessages(group.id), getGroupMembers(group.id)]);
    const m = (msgs as Message[])||[];
    setMessages(m); await loadReactions(m);
    if (members) setGroupMembers(members.map((m:any)=>m.user_id));
    setLoadingMsgs(false);
  };

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("msg-rt-"+user.id)
      .on("postgres_changes" as any,{event:"INSERT",schema:"public",table:"messages"},(p:any)=>{
        const m=p.new as Message; if(m.sender_id===user.id) return;
        const dm=activeDMRef.current;
        if(dm&&m.sender_id===dm.user_id&&m.receiver_id===user.id){
          setMessages(prev=>prev.find(x=>x.id===m.id)?prev:[...prev,m]);
          setIsTyping(false); markMessagesRead(user.id,dm.user_id);
        } else if(m.receiver_id===user.id){
          setUnreadMap(prev=>({...prev,[m.sender_id]:(prev[m.sender_id]||0)+1}));
        }
      })
      .on("postgres_changes" as any,{event:"INSERT",schema:"public",table:"group_messages"},(p:any)=>{
        const m=p.new as Message; if(m.sender_id===user.id) return;
        const grp=activeGroupRef.current;
        if(grp&&m.group_id===grp.id) setMessages(prev=>prev.find(x=>x.id===m.id)?prev:[...prev,m]);
      })
      .on("postgres_changes" as any,{event:"UPDATE",schema:"public",table:"messages"},(p:any)=>{
        setMessages(prev=>prev.map(m=>m.id===p.new.id?{...m,...p.new}:m));
      })
      .on("broadcast",{event:"typing"},(p:any)=>{
        const dm=activeDMRef.current;
        if(dm&&p.payload.from===dm.user_id){
          setIsTyping(true);
          if(typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current=setTimeout(()=>setIsTyping(false),3000);
        }
      })
      .subscribe();

    const poll=setInterval(async()=>{
      const since=new Date(Date.now()-5000).toISOString();
      const { data } = await supabase.from("friend_activities").select("*").eq("type","call_invite").eq("meta->>to_user",user.id).gt("created_at",since).order("created_at",{ascending:false}).limit(1);
      if(data&&data.length>0){
        const act=data[0];
        if(!seenCallsRef.current.has(act.id)){
          seenCallsRef.current.add(act.id);
          setIncomingCall({from:act.user_id,fromName:act.meta.from_name,roomId:act.meta.room_id,type:act.meta.call_type||"video"});
          setCallState(prev=>prev==="in-call"?prev:"incoming");
        }
      }
      const { data:ended } = await supabase.from("friend_activities").select("*").eq("type","call_ended").eq("meta->>to_user",user.id).gt("created_at",since).limit(1);
      if(ended&&ended.length>0){ setCallState(prev=>prev==="incoming"?"idle":prev); setIncomingCall(null); }
    },3000);

    return ()=>{ supabase.removeChannel(ch); clearInterval(poll); };
  },[user]);

  const handleSend = async (text: string, type: string, blob?: Blob, file?: File) => {
    if(!user) return;
    let audioUrl="", fileUrl="", fileName="";

    if(blob){
      const f=new File([blob],`voice-${Date.now()}.webm`,{type:"audio/webm"});
      const { data } = await supabase.storage.from("avatars").upload(`voices/${Date.now()}.webm`,f);
      if(data){ const { data:u } = supabase.storage.from("avatars").getPublicUrl(data.path); audioUrl=u.publicUrl; }
    }
    if(file){
      const { data } = await supabase.storage.from("avatars").upload(`files/${Date.now()}-${file.name}`,file);
      if(data){ const { data:u } = supabase.storage.from("avatars").getPublicUrl(data.path); fileUrl=u.publicUrl; fileName=file.name; }
    }

    const replyData = replyTo?{reply_to:replyTo.id,reply_content:replyTo.content||"Ses mesajı"}:{};
    const content = text || (file?fileName:"🎤");

    if(activeDM){
      const { data:newMsg } = await sendDM(user.id,activeDM.user_id,content,type as any,audioUrl||fileUrl||undefined);
      if(newMsg) setMessages(prev=>[...prev,{...(newMsg as Message),...replyData,file_url:fileUrl||undefined,file_name:fileName||undefined}]);
    }
    if(activeGroup){
      const { data:newMsg } = await sendGroupMessage(activeGroup.id,user.id,content,type,audioUrl||fileUrl||undefined);
      if(newMsg) setMessages(prev=>[...prev,{...(newMsg as Message),...replyData,file_url:fileUrl||undefined,file_name:fileName||undefined}]);
    }
    setReplyTo(null);
    supabase.channel("msg-rt-"+user?.id).send({type:"broadcast",event:"typing",payload:{from:user?.id}});
  };

  const handleDelete = async (id: string, type: "me"|"all"|"incoming") => {
    if(type==="all"){ await deleteMessageForAll(id); setMessages(prev=>prev.map(m=>m.id===id?{...m,deleted_for_all:true}:m)); }
    else { await deleteMessageForSender(id); setMessages(prev=>prev.filter(m=>m.id!==id)); }
    if(activeGroup) { await deleteGroupMessage(id); setMessages(prev=>prev.filter(m=>m.id!==id)); }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if(!user) return;
    const existing=reactions.find(r=>r.message_id===msgId&&r.user_id===user.id&&r.emoji===emoji);
    if(existing){ await removeReaction(msgId,user.id,emoji); setReactions(prev=>prev.filter(r=>!(r.message_id===msgId&&r.user_id===user.id&&r.emoji===emoji))); }
    else{ const { data } = await addReaction(msgId,user.id,emoji); if(data) setReactions(prev=>[...prev,data as Reaction]); }
  };

  const handleForward = async (toUserId: string, toName: string) => {
    if(!user||!forwardMsg) return;
    await forwardMessage(user.id, toUserId, forwardMsg.content);
    toast.success(`${toName}'e iletildi`);
    setForwardMsg(null);
  };

  const handlePin = (msg: Message) => {
    setMessages(prev=>prev.map(m=>m.id===msg.id?{...m,pinned:!m.pinned}:m));
    toast.success(msg.pinned?"Sabitleme kaldırıldı":"Mesaj sabitlendi 📌");
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Kopyalandı"); };

  const handleStatusChange = async (s: typeof STATUS_OPTIONS[0]) => {
    setUserStatusState(s);
    if(user) await setUserStatus(user.id, s.value, s.emoji);
  };

  const togglePinChat = (id: string) => {
    setPinnedChats(prev=>{
      const n=new Set(prev);
      n.has(id)?n.delete(id):n.add(id);
      localStorage.setItem("keda_pinned_chats",JSON.stringify([...n]));
      return n;
    });
  };

  const startCall = async (type:"audio"|"video") => {
    if(!activeDM||!user) return;
    const roomId=`keda-${[user.id,activeDM.user_id].sort().join("-")}-${Date.now()}`;
    setCallRoomId(roomId); setCallType(type); setCallState("in-call");
    await supabase.from("friend_activities").insert({user_id:user.id,type:"call_invite",description:`${userName} sizi arıyor...`,meta:{to_user:activeDM.user_id,from_name:userName,room_id:roomId,call_type:type}});
  };

  const endCall = async () => {
    if(activeDM&&user) await supabase.from("friend_activities").insert({user_id:user.id,type:"call_ended",description:"Arama sona erdi",meta:{to_user:activeDM.user_id}});
    setCallState("idle"); setCallRoomId(""); setIncomingCall(null);
  };

  const getFId = (f:Friendship) => f.requester_id===user?.id?f.receiver_id:f.requester_id;
  const getFStat = (id:string) => friendStats.find(s=>s.user_id===id);
  const getSName = (sid:string) => sid===user?.id?"Sen":(friendStats.find(s=>s.user_id===sid)?.display_name||"Kullanıcı");

  // Sabitlenenler üste
  const sortedFriends = [...friends].sort((a,b)=>{
    const ap=pinnedChats.has(getFId(a))?0:1;
    const bp=pinnedChats.has(getFId(b))?0:1;
    return ap-bp;
  });
  const filteredFriends = sortedFriends.filter(f=>getFStat(getFId(f))?.display_name.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groupChats.filter(g=>g.name.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = Object.values(unreadMap).reduce((a,b)=>a+b,0);
  const pinnedMessages = messages.filter(m=>m.pinned);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background:"hsl(var(--background))" }}>

      {/* Çevrimdışı banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ y:-40 }} animate={{ y:0 }} exit={{ y:-40 }}
            className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 py-2 text-sm"
            style={{ background:"#ef4444", color:"white" }}>
            <WifiOff className="w-4 h-4" />
            İnternet bağlantısı kesildi
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sol Panel */}
      <div className={`${showSidebar?"flex":"hidden"} lg:flex flex-col border-r border-[hsl(var(--border))] w-full lg:w-80 xl:w-96 flex-shrink-0`}>
        <div className="px-4 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] lg:hidden" style={{ color:"hsl(var(--muted-foreground))" }}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-bold" style={{ color:"hsl(var(--foreground))" }}>
                Mesajlar
                {totalUnread>0&&<span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background:"hsl(var(--foreground))",color:"hsl(var(--background))" }}>{totalUnread}</span>}
              </h1>
            </div>
            <button onClick={()=>setShowCreateGroup(true)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors" style={{ color:"hsl(var(--muted-foreground))" }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Kullanıcı durumu */}
          <div className="relative mb-3">
            <button onClick={()=>setShowStatusPicker(!showStatusPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background:"hsl(var(--secondary))", color:"hsl(var(--muted-foreground))", border:"1px solid hsl(var(--border))" }}>
              <span>{userStatus.emoji}</span>
              <span>{userStatus.label}</span>
              <ChevronDown className="w-3 h-3 ml-auto" />
            </button>
            <AnimatePresence>
              {showStatusPicker && (
                <StatusPicker current={userStatus.value} onSelect={handleStatusChange} onClose={()=>setShowStatusPicker(false)} />
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:"hsl(var(--muted-foreground))" }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ara..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background:"hsl(var(--secondary))",color:"hsl(var(--foreground))",border:"1px solid hsl(var(--border))" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length>0&&(
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color:"hsl(var(--muted-foreground))" }}>Gruplar</p>
              {filteredGroups.map(g=>(
                <div key={g.id} className="relative group/item">
                  <button onClick={()=>openGroup(g)} className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[hsl(var(--accent))] text-left"
                    style={{ background:activeGroup?.id===g.id?"hsl(var(--accent))":"transparent" }}>
                    <GroupAvatar size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color:"hsl(var(--foreground))" }}>{g.name}</p>
                      <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>Grup sohbeti</p>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {filteredFriends.length>0&&(
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color:"hsl(var(--muted-foreground))" }}>Arkadaşlar</p>
              {filteredFriends.map(f=>{
                const fid=getFId(f);
                const stat=getFStat(fid);
                if(!stat) return null;
                const isOnline=stat.last_active&&(Date.now()-new Date(stat.last_active).getTime())<10*60*1000;
                const unread=unreadMap[fid]||0;
                const isPinned=pinnedChats.has(fid);
                return (
                  <div key={f.id} className="relative group/item">
                    <button onClick={()=>openDM(stat)} className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-[hsl(var(--accent))] text-left"
                      style={{ background:activeDM?.user_id===fid?"hsl(var(--accent))":"transparent" }}>
                      <Avatar name={stat.display_name} avatarUrl={stat.avatar_url} size={44} online={!!isOnline} statusEmoji={stat.status_emoji} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-medium truncate" style={{ color:"hsl(var(--foreground))" }}>
                            {isPinned&&<span className="mr-1">📌</span>}{stat.display_name}
                          </p>
                          {unread>0&&<span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background:"hsl(var(--foreground))",color:"hsl(var(--background))" }}>{unread}</span>}
                        </div>
                        <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>{isOnline?"Çevrimiçi":timeAgo(stat.last_active)}</p>
                      </div>
                    </button>
                    {/* Sabitle butonu */}
                    <button onClick={()=>togglePinChat(fid)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-[hsl(var(--accent))]"
                      style={{ color:"hsl(var(--muted-foreground))" }} title={isPinned?"Sabitlemeyi kaldır":"Sabitle"}>
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {filteredFriends.length===0&&filteredGroups.length===0&&(
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <MessageCircle className="w-8 h-8" style={{ color:"hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color:"hsl(var(--muted-foreground))" }}>Arkadaş bulunamadı</p>
              <button onClick={()=>router.push("/dashboard/friends")} className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background:"hsl(var(--secondary))",color:"hsl(var(--foreground))",border:"1px solid hsl(var(--border))" }}>Arkadaş Ekle</button>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel */}
      <div className={`${!showSidebar||activeDM||activeGroup?"flex":"hidden"} lg:flex flex-1 flex-col min-w-0`}>
        {!activeDM&&!activeGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background:"hsl(var(--secondary))" }}>
              <MessageCircle className="w-8 h-8" style={{ color:"hsl(var(--muted-foreground))" }} />
            </div>
            <p className="text-sm font-medium" style={{ color:"hsl(var(--foreground))" }}>Bir sohbet seç</p>
            <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>Sol taraftan arkadaşını veya grubu seç</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]" style={{ background:"hsl(var(--background))" }}>
              <button onClick={()=>{setShowSidebar(true);setActiveDM(null);setActiveGroup(null);}} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] lg:hidden" style={{ color:"hsl(var(--muted-foreground))" }}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              {activeDM?(
                <>
                  <Avatar name={activeDM.display_name} avatarUrl={activeDM.avatar_url} size={38} online={(Date.now()-new Date(activeDM.last_active).getTime())<10*60*1000} statusEmoji={activeDM.status_emoji} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color:"hsl(var(--foreground))" }}>{activeDM.display_name}</p>
                    <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>
                      {isTyping?<span className="text-emerald-400">Yazıyor...</span>
                        :(Date.now()-new Date(activeDM.last_active).getTime())<10*60*1000?"Çevrimiçi":`Son görülme: ${timeAgo(activeDM.last_active)}`}
                    </p>
                  </div>
                  <button onClick={()=>startCall("audio")} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors" style={{ color:"hsl(var(--muted-foreground))" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </button>
                  <button onClick={()=>startCall("video")} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors" style={{ color:"hsl(var(--muted-foreground))" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </button>
                </>
              ):activeGroup&&(
                <>
                  <GroupAvatar size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color:"hsl(var(--foreground))" }}>{activeGroup.name}</p>
                    <p className="text-xs" style={{ color:"hsl(var(--muted-foreground))" }}>{groupMembers.length} üye</p>
                  </div>
                </>
              )}
            </div>

            {/* Sabitlenmiş mesajlar */}
            {pinnedMessages.length>0&&(
              <div className="px-4 py-2 border-b border-[hsl(var(--border))] flex items-center gap-2"
                style={{ background:"hsl(var(--secondary)/0.5)" }}>
                <Pin className="w-3 h-3 flex-shrink-0" style={{ color:"hsl(var(--muted-foreground))" }} />
                <p className="text-xs truncate" style={{ color:"hsl(var(--muted-foreground))" }}>{pinnedMessages[pinnedMessages.length-1].content}</p>
              </div>
            )}

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background:"hsl(var(--background))" }}>
              {loadingMsgs?(
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor:"hsl(var(--muted-foreground))" }} />
                </div>
              ):messages.length===0?(
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color:"hsl(var(--muted-foreground))" }}>İlk mesajı sen gönder! 👋</p>
                </div>
              ):messages.map(msg=>(
                <Bubble key={msg.id} msg={msg}
                  isMe={msg.sender_id===user?.id}
                  senderName={activeGroup?getSName(msg.sender_id):undefined}
                  reactions={reactions} currentUserId={user?.id||""}
                  friends={friendStats}
                  onDelete={handleDelete} onReact={handleReact}
                  onReply={setReplyTo} onForward={setForwardMsg}
                  onCopy={handleCopy} onPin={handlePin} />
              ))}
              {isTyping&&<div className="flex justify-start mb-2"><TypingIndicator /></div>}
              <div ref={endRef} />
            </div>

            <ChatInput onSend={handleSend} replyTo={replyTo} onCancelReply={()=>setReplyTo(null)} />
          </>
        )}
      </div>

      {/* Modaller */}
      <AnimatePresence>
        {showCreateGroup&&<CreateGroupModal friends={friends} friendStats={friendStats} currentUserId={user?.id||""} onClose={()=>setShowCreateGroup(false)} onCreate={g=>{setGroupChats(prev=>[g,...prev]);openGroup(g);}} />}
        {forwardMsg&&<ForwardModal msg={forwardMsg} friends={friendStats} currentUserId={user?.id||""} onClose={()=>setForwardMsg(null)} onForward={handleForward} />}
      </AnimatePresence>

      {/* Jitsi */}
      <AnimatePresence>
        {callState==="in-call"&&callRoomId&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex flex-col" style={{background:"#1a1a2e"}}>
            <div className="flex items-center justify-between px-4 py-3" style={{background:"rgba(0,0,0,0.4)"}}>
              <div className="flex items-center gap-3">
                {activeDM&&<Avatar name={activeDM.display_name} avatarUrl={activeDM.avatar_url} size={32}/>}
                <div>
                  <p className="text-sm font-semibold text-white">{activeDM?.display_name}</p>
                  <p className="text-xs text-white/60">{callType==="video"?"Görüntülü arama":"Sesli arama"}</p>
                </div>
              </div>
              <button onClick={endCall} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{background:"#ef4444",color:"white"}}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/></svg>
                Aramayı Bitir
              </button>
            </div>
            <iframe src={`https://meet.jit.si/${callRoomId}${callType==="audio"?"#config.startWithVideoMuted=true":""}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay" className="flex-1 w-full border-0"/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gelen Arama */}
      <AnimatePresence>
        {callState==="incoming"&&incomingCall&&(
          <motion.div initial={{opacity:0,y:-80}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-80}}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl"
            style={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",minWidth:300}}>
            <motion.div animate={{rotate:[0,-15,15,-15,15,0]}} transition={{repeat:Infinity,duration:1}}
              className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:"#22c55e20"}}>
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{color:"hsl(var(--foreground))"}}>{incomingCall.fromName}</p>
              <p className="text-xs" style={{color:"hsl(var(--muted-foreground))"}}>{incomingCall.type==="video"?"Görüntülü":"Sesli"} arama geliyor...</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async()=>{await supabase.from("friend_activities").insert({user_id:user?.id,type:"call_ended",description:"Reddedildi",meta:{to_user:incomingCall.from}});setCallState("idle");setIncomingCall(null);}}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"#ef444420",color:"#ef4444"}}>
                <X className="w-4 h-4"/>
              </button>
              <button onClick={()=>{setCallRoomId(incomingCall.roomId);setCallType(incomingCall.type);setCallState("in-call");setIncomingCall(null);}}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"#22c55e20",color:"#22c55e"}}>
                <Check className="w-4 h-4"/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
