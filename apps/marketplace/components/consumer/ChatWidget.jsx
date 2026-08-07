"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Sparkles,
  MoreVertical,
  Package,
  ChevronRight,
} from "lucide-react";

// ─── Mock AI Responses ───────────────────────────────────────────────────────
const MOCK_RESPONSES = [
  {
    trigger: ["halo", "hai", "siang", "pagi", "sore", "tanya"],
    message: "Halo! Saya adalah Asisten AI ReMat. Ada yang bisa saya bantu terkait pencarian material daur ulang atau transaksi hari ini?",
    materials: [],
  },
  {
    trigger: ["plastik", "pet", "hdpe", "ldpe", "pp"],
    message: "ReMat memiliki persediaan material plastik berkualitas tinggi seperti PET bening, PP regrind, dan HDPE scrap. Berikut adalah beberapa rekomendasi untuk Anda:",
    materials: [
      { id: "1", title: "Biji Plastik PET Grade A", price: 12500, unit: "kg", location: "Surabaya" },
      { id: "7", title: "Biji Plastik PP Clear Regrind", price: 9800, unit: "kg", location: "Tangerang" },
    ],
  },
  {
    trigger: ["harga", "berapa", "price"],
    message: "Harga material di ReMat bervariasi tergantung jenis, grade, dan kondisi. Plastik PET berkisar Rp 8.000-15.000/kg, scrap besi Rp 3.500-5.000/kg, dan aluminium Rp 15.000-22.000/kg.",
    materials: [],
  },
];

const SUGGESTION_CHIPS = [
  "Apakah bisa dikirim ke Surabaya?",
  "Material plastik apa yang tersedia?",
  "Bagaimana cara pembayaran?",
  "Harga scrap besi berapa?",
];

function getAIResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  for (const r of MOCK_RESPONSES) {
    if (r.trigger.some((t) => lower.includes(t))) return r;
  }
  return {
    message: "Terima kasih atas pertanyaannya! Untuk informasi lebih lanjut, Anda bisa menelusuri marketplace kami untuk mencari material daur ulang yang Anda butuhkan.",
    materials: [],
    cta: { label: "Jelajahi Marketplace", href: "/marketplace" },
  };
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser ? "bg-remat-green" : "bg-white border border-gray-200 shadow-sm"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-remat-green" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-remat-green text-white rounded-tr-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
          }`}
        >
          <div className="chat-content" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }} />
        </div>

        {/* Material cards */}
        {msg.materials?.length > 0 && (
          <div className="space-y-1.5 w-full">
            {msg.materials.map((m) => (
              <Link
                key={m.id}
                href={`/marketplace/${m.id}`}
                className="flex items-center gap-2 bg-white border border-gray-100 hover:border-remat-green/40 rounded-xl px-3 py-2 transition-all shadow-sm group"
              >
                <div className="w-8 h-8 bg-remat-blue rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-remat-green/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-remat-green transition-colors">{m.title}</p>
                  <p className="text-[10px] text-gray-400">Rp {m.price.toLocaleString("id-ID")}/{m.unit} · {m.location}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-remat-green transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        {msg.cta && (
          <Link href={msg.cta.href} className="text-xs font-semibold text-remat-green flex items-center gap-1 hover:underline">
            <Package className="w-3 h-3" />
            {msg.cta.label} →
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * ChatWidget
 * @param {boolean} floating - Show as floating button (bottom-right)
 * @param {boolean} inline - Show as inline card (e.g., in PDP sidebar)
 * @param {string} materialId - For context-aware suggestions
 * @param {string} materialTitle - For welcome message
 */
export default function ChatWidget({ floating = false, inline = false, materialId, materialTitle }) {
  const [isOpen, setIsOpen] = useState(inline);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: materialTitle
        ? `Halo! Saya Asisten ReMat 👋\n\nSaya bisa membantu Anda dengan informasi tentang **${materialTitle}** — mulai dari spesifikasi, ketersediaan, hingga pengiriman. Tanyakan saja!`
        : "Halo! Saya Asisten ReMat 👋\n\nSaya dapat membantu Anda menemukan material yang tepat, menanyakan detail produk, atau mengecek ketersediaan stok. Apa yang ingin Anda tanyakan?",
      materials: [],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const userText = text || inputValue;
    if (!userText.trim()) return;
    setInputValue("");

    const userMsg = { id: Date.now(), role: "user", content: userText, materials: [] };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    const response = getAIResponse(userText);
    const aiMsg = {
      id: Date.now() + 1,
      role: "assistant",
      content: response.message,
      materials: response.materials || [],
      cta: response.cta || null,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const chatHeight = isExpanded ? "h-[500px]" : "h-[380px]";

  // ── Inline card (for PDP sidebar) ────────────────────────────────────────
  const ChatPanel = () => (
    <div className={`flex flex-col bg-white rounded-card border border-gray-100 shadow-card overflow-hidden ${inline ? "h-[480px]" : chatHeight}`}>
      {/* Header */}
      <div className="bg-remat-green px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-sm flex items-center gap-1.5">
            Asisten ReMat <Sparkles className="w-3.5 h-3.5 text-white/80" />
          </p>
          <p className="text-white/70 text-[10px]">AI-powered · Selalu siap membantu</p>
        </div>
        <div className="flex items-center gap-1">
          {!inline && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {!inline && (
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-remat-green" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-remat-green/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips (shown only when few messages) */}
      {messages.length < 3 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide bg-gray-50 border-t border-gray-100">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="flex-shrink-0 text-xs bg-white text-gray-600 border border-gray-200 hover:border-remat-green hover:text-remat-green px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Tanya sesuatu..."
            className="input-base flex-1 py-2 text-sm"
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="w-9 h-9 bg-remat-green hover:bg-remat-green-dark text-white rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Inline mode (no toggle button, just the panel) ────────────────────────
  if (inline) {
    return <ChatPanel />;
  }

  // ── Floating mode ────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 animate-slide-up">
          <ChatPanel />
        </div>
      )}

      {/* Toggle button */}
      <button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
          isOpen ? "bg-gray-700 hover:bg-gray-800" : "bg-remat-green hover:bg-remat-green-dark"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>
    </div>
  );
}
