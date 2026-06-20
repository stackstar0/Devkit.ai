import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Wifi, WifiOff, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { wsUrl } from "@/lib/api";
import { useDevKit, type PhaseKey, type ChatMessage } from "@/lib/store";
import { PhaseBar } from "@/components/PhaseBar";

export const Route = createFileRoute("/conversation/$sessionId")({
  head: () => ({
    meta: [{ title: "Discovery — DevKit.AI" }],
  }),
  component: Conversation,
});

function uid() {
  return Math.random().toString(36).slice(2);
}

function Conversation() {
  const { sessionId } = useParams({ from: "/conversation/$sessionId" });
  const navigate = useNavigate();
  const { phases, messages, addMessage, markPhase, setCurrentPhase } = useDevKit();

  const [input, setInput] = useState("");
  const [connState, setConnState] = useState<"connecting" | "open" | "reconnecting" | "closed">(
    "connecting",
  );
  const [aiTyping, setAiTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSeeded = useRef(false);
  const [phasesComplete, setPhasesComplete] = useState(false);


  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiTyping]);

  // WebSocket connection w/ exponential backoff
  useEffect(() => {
    let cancelled = false;
    function connect() {
      try {
        const ws = new WebSocket(wsUrl(sessionId));
        wsRef.current = ws;
        setConnState(retryRef.current === 0 ? "connecting" : "reconnecting");
        ws.onopen = () => {
          retryRef.current = 0;
          setConnState("open");
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            handleServerMessage(msg);
          } catch {
            // ignore non-json
          }
        };
        ws.onclose = () => {
          if (cancelled) return;
          if (retryRef.current < 3) {
            retryRef.current++;
            setConnState("reconnecting");
            const delay = Math.min(8000, 600 * Math.pow(2, retryRef.current));
            setTimeout(connect, delay);
          } else {
            setConnState("closed");
          }
        };
        ws.onerror = () => ws.close();
      } catch {
        setConnState("closed");
      }
    }
    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function handleServerMessage(msg: any) {
    if (msg.status === "phases_complete") {
      setPhasesComplete(true);
      setTimeout(() => {
        navigate({ to: "/results/$sessionId", params: { sessionId } });
      }, 1000);
      return;
    }
    if (msg.type === "question" || msg.question) {
      const phase: PhaseKey | undefined = msg.phase;
      if (phase) {
        setCurrentPhase(phase);
        markPhase(phase, "active");
      }
      setAiTyping(true);
      setTimeout(() => {
        setAiTyping(false);
        addMessage({
          id: uid(),
          role: "ai",
          phase,
          timestamp: Date.now(),
          text: msg.question || msg.text,
        });
      }, 600);
    }
    if (msg.type === "phase_complete" && msg.phase) {
      markPhase(msg.phase, "complete");
    }
    if (msg.type === "phase_skipped" && msg.phase) {
      markPhase(msg.phase, "skipped");
    }
  }

  function sendPayload(payload: any) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && !selectedFile) return;

    // ── Semantic guard: reject gibberish / very short answers ─────────────
    if (text && !selectedFile) {
      const GIBBERISH = /^(asdf+|1234+|qwerty|xyz|test|ok\.?|yes\.?|no\.?|idk|lol|\.+|asd|fgh|hjk|zxc)$/i;
      if (text.length < 3 || GIBBERISH.test(text)) {
        toast.warning("Could you add a bit more detail? The AI needs context to reason well.", { duration: 3000 });
        return;
      }
    }

    setIsSending(true);
    let base64String = undefined;


    if (selectedFile) {
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    const msg: ChatMessage = {
      id: uid(),
      role: "user",
      timestamp: Date.now(),
      text: text || "Sent an image.",
    };
    addMessage(msg);
    setInput("");
    // Reset textarea height after clearing input
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAiTyping(true);

    sendPayload({ answer: text, skipped: false, image_base64: base64String });
    setIsSending(false);
  }

  function handleSkip() {
    addMessage({
      id: uid(),
      role: "user",
      timestamp: Date.now(),
      text: "Use the recommended default",
      skipped: true,
    });
    setAiTyping(true);
    sendPayload({ answer: "", skipped: true });
    toast.success("Skipped — we'll use a smart default ✨");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are supported.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 md:px-8 py-4 border-b border-border/60 glass sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">
                DevKit<span className="text-gradient">.AI</span>
              </span>
            </div>
            <ConnectionBadge state={connState} />
          </div>
          {/* Mobile only phase bar */}
          <div className="md:hidden">
            <PhaseBar phases={phases} orientation="horizontal" />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 px-4 md:px-8 py-6">
        {/* Sidebar Step Indicator (Desktop) */}
        <aside className="hidden md:block flex-shrink-0 min-w-fit w-max border-r border-border/50 pr-6">
          <PhaseBar phases={phases} orientation="vertical" />
        </aside>

        {/* Main Content Panel */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto pb-40">
          <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
          </AnimatePresence>
          {aiTyping && <TypingBubble />}
        </div>
      </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 md:px-8 pb-6">
        <div className="max-w-3xl mx-auto glass rounded-2xl p-2 shadow-card flex flex-col gap-2">
          {imagePreview && (
            <div className="relative inline-block w-20 h-20 ml-2 mt-2">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-border/50" />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 hover:bg-muted transition"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input 
              type="file" 
              accept=".png, .jpg, .jpeg, .webp" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 mb-[1px] text-muted-foreground hover:text-foreground hover:bg-card/50 rounded-xl transition-colors shrink-0"
              title="Attach image"
              disabled={isSending}
            >
              <Paperclip className="size-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // 1. Temporarily hide overflow to prevent Chrome scrollbar measurement artifacts
                e.target.style.overflowY = 'hidden'; 
                // 2. Reset height to auto to shrink if text was deleted
                e.target.style.height = 'auto';
                // 3. Apply the true scroll height
                e.target.style.height = `${e.target.scrollHeight}px`;
                // 4. Restore overflow behavior so max-h limits still work when exceeded
                e.target.style.overflowY = 'auto';
              }}
              rows={1}
              placeholder="Type your answer…"
              className="flex-1 resize-none bg-transparent px-3 py-2.5 outline-none text-sm placeholder:text-muted-foreground max-h-40 scrollbar-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isSending}
            />
            <button
              onClick={handleSkip}
              className="text-xs mb-[3px] rounded-xl px-3 py-2 border border-border bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground transition whitespace-nowrap"
              title="Skip & use recommended default"
              disabled={isSending}
            >
              Skip & Use Recommended ✨
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || isSending}
              className="rounded-xl bg-gradient-primary size-10 flex shrink-0 place-items-center justify-center text-white shadow-glow disabled:opacity-40"
            >
              {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {phasesComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="size-16 rounded-2xl bg-gradient-primary shadow-glow mx-auto grid place-items-center mb-6">
                <Loader2 className="size-7 text-white animate-spin" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Generating your architecture…
              </h2>
              <p className="mt-2 text-muted-foreground">Hold tight — wiring up the blueprint.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectionBadge({ state }: { state: "connecting" | "open" | "reconnecting" | "closed" }) {
  const cfg = {
    open: {
      icon: Wifi,
      text: "Connected",
      cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    },
    connecting: {
      icon: Loader2,
      text: "Connecting…",
      cls: "text-muted-foreground bg-card/40 border-border",
    },
    reconnecting: {
      icon: Loader2,
      text: "Reconnecting…",
      cls: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    },
    closed: { icon: WifiOff, text: "Offline", cls: "text-red-300 bg-red-500/10 border-red-500/30" },
  }[state];
  const Icon = cfg.icon;
  return (
    <div
      className={`text-[11px] inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${cfg.cls}`}
    >
      <Icon
        className={`size-3 ${state === "connecting" || state === "reconnecting" ? "animate-spin" : ""}`}
      />
      {cfg.text}
    </div>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const isAi = m.role === "ai";
  const time = useMemo(
    () => new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [m.timestamp],
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isAi ? "justify-start" : "justify-end"}`}
    >
      <div className={`max-w-[85%] ${isAi ? "" : "text-right"}`}>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1 flex gap-2 items-center">
          {isAi ? (
            <span>DevKit AI{m.phase ? ` · ${m.phase.replace("_", " ")}` : ""}</span>
          ) : (
            <span>You</span>
          )}
          <span>· {time}</span>
        </div>
        <div
          className={[
            "inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isAi
              ? "glass rounded-tl-sm"
              : "bg-gradient-primary text-white rounded-tr-sm shadow-glow",
          ].join(" ")}
        >
          {m.text}
          {m.skipped && <span className="ml-2 text-[10px] opacity-80">(skipped)</span>}
        </div>
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 inline-flex items-center gap-1.5">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </div>
  );
}
function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="size-1.5 rounded-full bg-muted-foreground"
      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
