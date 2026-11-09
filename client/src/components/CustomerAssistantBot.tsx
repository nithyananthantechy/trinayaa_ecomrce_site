import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolveProductImage, getCategoryPlaceholder } from "@/lib/productImage";
import { useLocation } from "wouter";
import {
  X,
  Send,
  ShieldCheck,
  Leaf,
  ChevronRight,
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowDown,
  ArrowUp,
  Trash2,
  LifeBuoy,
  Bot,
} from "lucide-react";

interface ProductCard {
  id: string;
  sku: string;
  nameEn: string;
  nameTa: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
  stockAvailability: string;
  category?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductCard[];
  orderInfo?: {
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    total: number;
    carrier?: string;
    trackingNumber?: string;
    itemCount: number;
    itemsSummary: string;
  } | null;
  quickPrompts?: string[];
  verified?: boolean;
}

const DEFAULT_PROMPTS = [
  "🌿 What are raw powders?",
  "🍵 How to take Ashwagandha Root Powder?",
  "📦 Track my order (e.g. TRN-10482)",
  "🚚 Pan-India delivery & shipping details",
  "🎫 How to raise a support ticket?",
];

export default function CustomerAssistantBot() {
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Initial welcome greeting
  const initialWelcome: ChatMessage = {
    id: "welcome-init",
    role: "assistant",
    content:
      "**வணக்கம்! Welcome to TRINAYAA Botanical Wellness Support.** 🌿\n\nI am your **100% Verified Herbal & Order Assistant**. How can I help you today?\n\n• **Botanical Guidance:** Traditional benefits, dosage & intake methods (with warm water, milk, or honey).\n• **Order Help:** Type your order number (e.g. `TRN-10482`) to track real-time dispatch.\n• **Store Policies:** Delivery times, free shipping over ₹499, and returns.",
    quickPrompts: DEFAULT_PROMPTS,
    verified: true,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);

  const clearChat = () => {
    setMessages([
      {
        ...initialWelcome,
        id: `welcome-${Date.now()}`,
      },
    ]);
  };

  const chatMutation = trpc.assistant.chat.useMutation({
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        products: data.products,
        orderInfo: data.orderInfo,
        quickPrompts: data.quickPrompts,
        verified: data.verified,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: () => {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content:
          "🌿 I am here to help with all TRINAYAA botanical products, traditional Ayurvedic wellness advice, and order tracking! Please choose a suggestion below or rephrase your question.",
        quickPrompts: DEFAULT_PROMPTS,
        verified: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    chatMutation.mutate({
      message: text,
      history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll handler for showing Top/Bottom helpers
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 150);
    setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Smooth scroll to the top of the newest assistant message so user can read from beginning
  useEffect(() => {
    if (isOpen && messages.length > 1) {
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [messages.length, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Hide bot completely on all admin routes (placed after all React Hooks)
  if (location.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button (Prominent circular FAB with brand emblem & live assistant status) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3">
          {/* Subtle floating companion badge on larger screens */}
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2.5 rounded-full border border-[#d4a373]/30 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur hover:bg-white hover:shadow-xl transition-all duration-200 group cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">100% Verified Herbal AI</span>
              <span className="font-serif text-xs font-semibold text-[#1b4332] group-hover:text-emerald-700">Need Botanical or Order Help?</span>
            </div>
          </button>

          {/* Luxury Circular E-Commerce FAB */}
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0e3820] via-[#1b4332] to-[#2d6a4f] p-2 text-white shadow-[0_10px_35px_rgba(27,67,50,0.5)] ring-2 ring-[#d4a373] transition-all duration-300 hover:scale-110 hover:shadow-[0_15px_45px_rgba(27,67,50,0.7)] hover:ring-[#e5b98b] active:scale-95 cursor-pointer"
            aria-label="Open TRINAYAA Botanical & Order Assistant"
            title="Chat with TRINAYAA Botanical & Order Assistant"
          >
            {/* Live pulsing green dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm"></span>
            </span>

            {/* Modern High-Visibility AI Bot Icon */}
            <Bot
              className="h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
              strokeWidth={2.3}
            />
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border-2 border-emerald-900/30 bg-[#faf8f5] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 ${
            isExpanded
              ? "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[96vw] sm:w-[680px] h-[90vh] max-h-[850px]"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[430px] h-[min(560px,calc(100vh-90px))]"
          }`}
        >
          {/* 1. Header (Always visible, sticky at top) */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-emerald-900/20 bg-gradient-to-r from-[#143d2b] via-[#1b4332] to-[#245840] px-4 py-3 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 p-1 ring-1 ring-white/30 text-white shadow-inner">
                <Bot className="h-5 w-5 text-white" strokeWidth={2.3} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm font-bold tracking-wide text-white">TRINAYAA Herbal Assistant</h3>
                  <Badge variant="outline" className="border-emerald-300/40 bg-emerald-950/60 px-1.5 py-0 text-[10px] text-emerald-200">
                    100% Verified
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-[11px] text-emerald-100/90">
                  <ShieldCheck className="h-3 w-3 text-emerald-300" />
                  Traditional Botanical & Order Guidance
                </p>
              </div>
            </div>

            {/* Header Control Buttons: Helpdesk, Clear Chat, Maximize / Expand, Close */}
            <div className="flex items-center gap-1.5">
              {/* Helpdesk shortcut */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/account?tab=tickets");
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-700/60 border border-emerald-400/30 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-600"
                title="Open Customer Support Helpdesk"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-amber-300" />
                <span className="hidden sm:inline">Helpdesk</span>
              </button>

              {/* Clear Chat History */}
              <button
                onClick={clearChat}
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-medium text-emerald-100 transition-colors hover:bg-white/20 hover:text-white"
                title="Clear chat history and start fresh"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>

              {/* Fullscreen / Expand Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg bg-white/10 p-1.5 text-emerald-100 transition-colors hover:bg-white/20 hover:text-white"
                title={isExpanded ? "Collapse to standard view" : "Expand to large reading view"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              {/* High-visibility Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/30 text-white transition-colors hover:bg-red-600 hover:text-white"
                title="Close assistant"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 2. Messages List with Native Draggable & Visible Scrollbar */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#2d6a4f #ede8de",
            }}
          >
            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1;
              return (
                <div
                  key={msg.id}
                  ref={isLast ? lastMessageRef : undefined}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Verified Botanical Guidance</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[92%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#1b4332] text-white rounded-br-xs"
                        : "border border-amber-900/15 bg-white text-[#222] rounded-bl-xs"
                    }`}
                  >
                    <div
                      className="whitespace-pre-line space-y-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-[#1b4332] [&>h4]:text-xs [&>h4]:font-semibold [&>h4]:text-[#2d6a4f] [&>strong]:text-[#1b4332] [&>em]:text-[#3b594b]"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/^### (.*$)/gim, '<h3 class="font-bold text-sm text-[#1b4332] mt-1 mb-1 pb-0.5 border-b border-emerald-100">$1</h3>')
                          .replace(/^#### (.*$)/gim, '<h4 class="font-semibold text-xs text-[#2d6a4f] mt-2 mb-1">$1</h4>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1b4332]">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="text-[#2b4c3e]">$1</em>')
                          .replace(/`(.*?)`/g, '<code class="bg-emerald-50 text-emerald-900 px-1 py-0.5 rounded text-[11px] font-mono border border-emerald-200">$1</code>'),
                      }}
                    />

                    {/* Order Tracking Card (if available) */}
                    {msg.orderInfo && (
                      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-emerald-950">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-emerald-950">{msg.orderInfo.orderNumber}</span>
                          <Badge className="bg-emerald-700 text-[10px] text-white hover:bg-emerald-700">
                            {msg.orderInfo.orderStatus}
                          </Badge>
                        </div>
                        <div className="mt-2 text-[11px] space-y-1 text-emerald-900">
                          <p>• Items: {msg.orderInfo.itemsSummary}</p>
                          <p>• Total: ₹{msg.orderInfo.total}</p>
                          {msg.orderInfo.carrier && <p>• Carrier: {msg.orderInfo.carrier}</p>}
                          {msg.orderInfo.trackingNumber && <p>• Tracking: {msg.orderInfo.trackingNumber}</p>}
                        </div>
                      </div>
                    )}

                    {/* Recommended Product Cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3.5 space-y-2 border-t border-amber-900/10 pt-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Recommended Products:</p>
                        <div className={`grid gap-2 ${isExpanded ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                          {msg.products.map((p) => (
                            <div
                              key={p.id}
                              className="group flex items-center justify-between gap-3 rounded-xl border border-amber-900/15 bg-[#fdfbf7] p-2.5 transition-all hover:border-emerald-600 hover:bg-white hover:shadow-xs"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <img
                                  src={resolveProductImage(p.sku, undefined, undefined, p.image)}
                                  alt={p.nameEn}
                                  className="h-12 w-12 flex-shrink-0 rounded-lg border border-amber-900/10 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getCategoryPlaceholder();
                                  }}
                                />
                                <div className="truncate">
                                  <p className="truncate text-xs font-bold text-[#1b4332]">{p.nameEn}</p>
                                  <p className="truncate text-[10px] text-[#40534c]">{p.nameTa}</p>
                                  <p className="text-[11px] font-semibold text-emerald-800">
                                    ₹{p.price} <span className="text-[10px] text-gray-400 line-through">₹{p.mrp}</span>
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  navigate(`/products/${p.slug}`);
                                  setIsOpen(false);
                                }}
                                className="h-8 flex-shrink-0 border-emerald-700 bg-white px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-700 hover:text-white"
                              >
                                View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(prompt)}
                          className="rounded-full border border-emerald-800/25 bg-white px-3 py-1.5 text-[11px] font-medium text-[#1b4332] shadow-xs transition-all hover:border-emerald-700 hover:bg-emerald-50 active:scale-95"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {chatMutation.isPending && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-900/15 bg-white p-3.5 text-xs text-emerald-800 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                <span className="font-medium">Consulting verified botanical pharmacopeia...</span>
              </div>
            )}
          </div>

          {/* Quick Floating Scroll Navigation Helpers */}
          {(showScrollTop || showScrollBottom) && (
            <div className="absolute right-6 bottom-20 flex flex-col gap-1.5 z-10">
              {showScrollTop && (
                <button
                  onClick={scrollToTop}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b4332]/90 text-white shadow-md hover:bg-[#1b4332]"
                  title="Scroll to top"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              )}
              {showScrollBottom && (
                <button
                  onClick={scrollToBottom}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b4332]/90 text-white shadow-md hover:bg-[#1b4332]"
                  title="Scroll to bottom"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* 3. Footer Input Area (Always sticky at bottom) */}
          <div className="flex-shrink-0 border-t border-amber-900/15 bg-white p-3">
            <div className="flex items-center gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about herbs, health benefits, or order..."
                className="h-10 rounded-full border-emerald-900/25 bg-[#faf8f5] px-4 text-xs focus-visible:ring-emerald-700"
                disabled={chatMutation.isPending}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="h-10 w-10 flex-shrink-0 rounded-full bg-[#1b4332] text-white hover:bg-[#143426] disabled:opacity-50"
              >
                {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span>Traditional Ayurvedic wellness. Consult a doctor for medical issues.</span>
              <button
                onClick={clearChat}
                className="text-emerald-800 hover:text-emerald-950 font-medium hover:underline flex items-center gap-0.5"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
