import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Wifi, WifiOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { wsUrl } from "@/lib/api";
import { useStackStar, type PhaseKey, type ChatMessage } from "@/lib/store";
import { PhaseBar } from "@/components/PhaseBar";

export const Route = createFileRoute("/conversation/$sessionId")({
  head: () => ({
    meta: [{ title: "Discovery — StackStar.AI" }],
  }),
  component: Conversation,
});

function uid() {
  return Math.random().toString(36).slice(2);
}

function Conversation() {
  const { sessionId } = useParams({ from: "/conversation/$sessionId" });
  const navigate = useNavigate();
  const { phases, messages, addMessage, markPhase, setCurrentPhase } = useStackStar();

  const [input, setInput] = useState("");
  const [connState, setConnState] = useState<"connecting" | "open" | "reconnecting" | "closed">(
    "connecting",
  );
  const [aiTyping, setAiTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [phasesComplete, setPhasesComplete] = useState(false);

  // Seed first AI message on first visit
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: uid(),
        role: "ai",
        phase: "ui_ux",
        timestamp: Date.now(),
        text: "Awesome — let's shape this together. First, who is the primary user, and what's the single most important thing they should be able to do on day one?",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        navigate({ to: "/generation/$sessionId", params: { sessionId } });
      }, 1800);
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

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: uid(),
      role: "user",
      timestamp: Date.now(),
      text,
    };
    addMessage(msg);
    setInput("");
    sendPayload({ answer: text, skipped: false });
  }

  function handleSkip() {
    addMessage({
      id: uid(),
      role: "user",
      timestamp: Date.now(),
      text: "Use the recommended default",
      skipped: true,
    });
    sendPayload({ answer: "", skipped: true });
    toast.success("Skipped — we'll use a smart default ✨");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 md:px-8 py-4 border-b border-border/60 glass sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">
                StackStar<span className="text-gradient">.AI</span>
              </span>
            </div>
            <ConnectionBadge state={connState} />
          </div>
          <PhaseBar phases={phases} />
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-40">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
          </AnimatePresence>
          {aiTyping && <TypingBubble />}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 md:px-8 pb-6">
        <div className="max-w-3xl mx-auto glass rounded-2xl p-2 shadow-card">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Type your answer…"
              className="flex-1 resize-none bg-transparent px-3 py-2.5 outline-none text-sm placeholder:text-muted-foreground max-h-40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSkip}
              className="text-xs rounded-xl px-3 py-2 border border-border bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground transition whitespace-nowrap"
              title="Skip & use recommended default"
            >
              Skip & Use Recommended ✨
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="rounded-xl bg-gradient-primary size-10 grid place-items-center text-white shadow-glow disabled:opacity-40"
            >
              <Send className="size-4" />
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
            <span>StackStar AI{m.phase ? ` · ${m.phase.replace("_", " ")}` : ""}</span>
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
