import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refineBlueprint } from "@/lib/api";
import { useDevKit } from "@/lib/store";

interface Props {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
}

export function RefinementPanel({ sessionId, open, onClose }: Props) {
  const { 
    setArchitecture, architecture, 
    refinementHistory, setRefinementHistory,
    setInstructionMd, setMilestones, setCost, setWarnings
  } = useDevKit();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayMessages: Message[] = [
    {
      id: "welcome",
      role: "ai",
      text: "I can refine your blueprint. Try: \"Switch to PostgreSQL\", \"Add Redis caching\", \"Use FastAPI instead of Express\", or \"Add Stripe payments\".",
    },
    ...refinementHistory.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role,
      text: m.text,
    }))
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [displayMessages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setRefinementHistory([...refinementHistory, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const result = await refineBlueprint(sessionId, text);
      if (result.refinement_history) {
        setRefinementHistory(result.refinement_history);
      }
      
      if (result.architecture) {
        setArchitecture({ ...(architecture || {}), ...result.architecture });
      }
      if (result.instruction_md) {
        setInstructionMd(result.instruction_md);
      }
      if (result.milestones) {
        setMilestones(result.milestones);
      }
      if (result.cost) {
        setCost(result.cost);
      }
      if (result.warnings) {
        setWarnings(result.warnings);
      }
      
      toast.success("Blueprint updated!");
    } catch {
      setRefinementHistory([...refinementHistory, { role: "user", text }, {
        role: "ai",
        text: "I couldn't reach the backend to apply that change. Is the DevKit server running?",
      }]);
      toast.error("Refinement failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
            style={{
              background: "oklch(0.10 0.018 270 / 0.97)",
              borderLeft: "1px solid oklch(1 0 0 / 0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                  <Sparkles className="size-3.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Blueprint Refiner</div>
                  <div className="text-[10px] text-muted-foreground">AI-powered architecture updates</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg border border-border grid place-items-center hover:bg-card transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Suggestion chips */}
            <div className="px-4 py-2 border-b border-border/30 flex gap-1.5 flex-wrap">
              {["Add Redis", "Use PostgreSQL", "Add Stripe", "Switch to FastAPI"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-none">
              {displayMessages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "ai" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === "ai"
                        ? "glass rounded-tl-sm"
                        : "bg-gradient-primary text-white rounded-tr-sm shadow-glow"
                    }`}
                    dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
                  />
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-tl-sm px-3 py-2.5 inline-flex items-center gap-1.5">
                    <RefreshCw className="size-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Refining blueprint…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="glass rounded-2xl flex items-end gap-2 p-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. switch database to PostgreSQL…"
                  rows={2}
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground scrollbar-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="size-9 rounded-xl bg-gradient-primary grid place-items-center text-white shadow-glow disabled:opacity-40 flex-shrink-0"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
