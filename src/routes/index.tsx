import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Bot,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { startSession } from "@/lib/api";
import { useDevKit } from "@/lib/store";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { WordRotator } from "@/components/WordRotator";
import { AIThinkingViz } from "@/components/AIThinkingViz";
import { DiscoveryTimeline } from "@/components/DiscoveryTimeline";
import { CapabilityCards } from "@/components/CapabilityCards";
import { MetricsStrip } from "@/components/MetricsStrip";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "DevKit.AI — Turn ideas into production-ready blueprints" },
      {
        name: "description",
        content:
          "DevKit.AI guides you through a 6-phase AI discovery process to transform raw software ideas into production-ready architecture blueprints.",
      },
      { property: "og:title", content: "DevKit.AI" },
      {
        property: "og:description",
        content: "Turn raw ideas into production-ready blueprints.",
      },
    ],
  }),
  component: Landing,
}));

const ROTATE_WORDS = [
  "Marketplace",
  "Startup",
  "SaaS",
  "Platform",
  "AI Product",
  "Ecosystem",
];

const PLACEHOLDER_PROMPTS = [
  "I want to build a marketplace for local artists…",
  "An AI-powered study planner for med students…",
  "A SaaS for managing freelance contracts…",
  "A real-time multiplayer trivia game…",
  "A subscription platform for indie creators…",
];

const FLOATING_PROMPTS = [
  "Build an AI SaaS",
  "Create a marketplace",
  "Launch a startup",
  "Design a social platform",
  "Build a fintech app",
  "Create an API service",
];

const SUGGESTION_CHIPS = [
  "A marketplace for local artists",
  "An AI study planner for med students",
  "A SaaS for freelance contracts",
  "A multiplayer trivia app",
];

/* ─── Magnetic Button ──────────────────────────────────────────── */
function MagneticButton({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
    onClick();
  };

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white overflow-hidden disabled:opacity-60 select-none"
      style={{
        background: "linear-gradient(135deg, #C084FC, #7C3AED, #6D28D9)",
        boxShadow: "0 0 30px -6px rgba(168,85,247,0.7), 0 4px 20px -4px rgba(109,40,217,0.5)",
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Shimmer overlay */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s linear infinite",
        }}
      />

      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 8,
            height: 8,
            transform: "translate(-50%, -50%)",
            animation: "ripple 0.7s ease-out forwards",
          }}
        />
      ))}

      <span className="relative z-10">
        {loading ? "Starting…" : "Start Building"}
      </span>
      <motion.span
        className="relative z-10"
        animate={{ x: 0 }}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <ArrowRight className="size-4" />
      </motion.span>
    </motion.button>
  );
}

/* ─── Floating Empty State Prompts ──────────────────────────────── */
function FloatingPrompts({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {FLOATING_PROMPTS.map((p, i) => (
        <motion.span
          key={p}
          className="absolute text-[11px] font-medium px-3 py-1.5 rounded-full"
          style={{
            left: `${10 + (i % 3) * 30}%`,
            top: `${15 + Math.floor(i / 3) * 50}%`,
            background: "oklch(0.66 0.21 285 / 0.12)",
            border: "1px solid oklch(0.66 0.21 285 / 0.2)",
            color: "oklch(0.66 0.21 285 / 0.7)",
          }}
          animate={{
            y: [0, -10, 0, 6, 0],
            opacity: [0.6, 0.9, 0.6, 0.7, 0.6],
          }}
          transition={{
            duration: 4 + i * 0.7,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          {p}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── Main Landing ───────────────────────────────────────────────── */
function Landing() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const setSession = useDevKit((s) => s.setSession);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder text
  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const handleStart = useCallback(async () => {
    if (!idea.trim()) {
      toast.error("Tell us what you're building first.");
      return;
    }
    setLoading(true);
    try {
      const { session_id } = await startSession(idea.trim());
      setSession(session_id, idea.trim());
      navigate({ to: "/conversation/$sessionId", params: { sessionId: session_id } });
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't reach the DevKit backend. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [idea, navigate, setSession]);

  const isEmpty = idea.trim().length === 0;
  const charCount = idea.length;

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "oklch(0.08 0.015 265)" }}
    >
      {/* Background system */}
      <AnimatedBackground />

      {/* Content layer */}
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="px-6 md:px-10 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <motion.div
              className="size-9 rounded-xl grid place-items-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #C084FC, #7C3AED)",
                boxShadow: "0 0 20px -4px rgba(168,85,247,0.7)",
              }}
              animate={{ boxShadow: ["0 0 20px -4px rgba(168,85,247,0.7)", "0 0 28px -2px rgba(168,85,247,0.9)", "0 0 20px -4px rgba(168,85,247,0.7)"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="size-4 text-white relative z-10" />
            </motion.div>
            <span className="font-bold text-base tracking-tight">
              DevKit<span className="text-gradient">.AI</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5"
              style={{
                background: "oklch(0.66 0.21 285 / 0.1)",
                border: "1px solid oklch(0.66 0.21 285 / 0.2)",
                color: "oklch(0.8 0.12 285)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: "#4ade80",
                  boxShadow: "0 0 6px #4ade80",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              />
              v1.0 · Early access
            </span>
          </motion.div>
        </header>

        {/* ── Hero ───────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center px-6 py-10 md:py-16">
          {/* Radial spotlight behind headline */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: "80vw",
              height: "60vh",
              background: "radial-gradient(ellipse at 50% 0%, oklch(0.55 0.22 285 / 0.14) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium mb-8"
            style={{
              background: "oklch(0.66 0.21 285 / 0.1)",
              border: "1px solid oklch(0.66 0.21 285 / 0.25)",
              color: "oklch(0.82 0.12 285)",
            }}
          >
            <Bot className="size-3.5" />
            AI-guided architecture discovery
            <span
              className="size-1.5 rounded-full"
              style={{ background: "#C084FC", animation: "pulse-glow 1.8s ease-in-out infinite" }}
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-4"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
              What are you building
              <br />
              <WordRotator words={ROTATE_WORDS} interval={2400} className="text-4xl md:text-6xl lg:text-7xl font-bold" />
              {"  "}
              <span style={{ color: "oklch(0.9 0.02 260)" }}>today?</span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-base md:text-lg max-w-xl text-center mb-12"
            style={{ color: "oklch(0.65 0.04 265)" }}
          >
            Transform a raw idea into a production-ready architecture blueprint — in minutes, not months.
          </motion.p>

          {/* ── Command Center + AI Viz ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="w-full max-w-3xl"
          >
            <div className="flex items-start gap-4">
              {/* Textarea container */}
              <div className="flex-1">
                {/* Animated glowing border wrapper */}
                <motion.div
                  className="relative rounded-2xl"
                  animate={{
                    boxShadow: isFocused
                      ? "0 0 0 1px oklch(0.66 0.21 285 / 0.6), 0 0 32px -4px oklch(0.66 0.21 285 / 0.4), inset 0 0 20px -8px oklch(0.66 0.21 285 / 0.08)"
                      : "0 0 0 1px oklch(1 0 0 / 0.08), 0 4px 24px -4px oklch(0 0 0 / 0.3)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.14 0.022 270 / 0.95), oklch(0.11 0.018 270 / 0.9))",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* AI icon header bar */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                      <motion.div
                        className="size-5 rounded-md grid place-items-center"
                        style={{ background: "linear-gradient(135deg, #C084FC, #7C3AED)" }}
                        animate={idea.length > 0 ? {
                          boxShadow: ["0 0 4px rgba(192,132,252,0.4)", "0 0 12px rgba(192,132,252,0.8)", "0 0 4px rgba(192,132,252,0.4)"],
                        } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        <Bot className="size-3 text-white" />
                      </motion.div>
                      <span className="text-[11px] font-medium" style={{ color: "oklch(0.7 0.08 285)" }}>
                        AI Command Center
                      </span>
                      {idea.length > 0 && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] ml-auto"
                          style={{ color: "oklch(0.65 0.04 265)" }}
                        >
                          {charCount} chars
                        </motion.span>
                      )}
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        rows={4}
                        placeholder={isFocused ? PLACEHOLDER_PROMPTS[placeholderIdx] : ""}
                        className="w-full resize-none bg-transparent px-4 py-3 outline-none text-sm leading-relaxed"
                        style={{
                          color: "oklch(0.92 0.01 260)",
                          caretColor: "#C084FC",
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleStart();
                        }}
                      />

                      {/* Floating prompts (empty state) */}
                      <FloatingPrompts visible={isEmpty && !isFocused} />

                      {/* Empty state hint */}
                      {isEmpty && !isFocused && (
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl"
                        >
                          <span className="text-sm font-medium" style={{ color: "oklch(0.45 0.04 265)" }}>
                            Describe your product idea…
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
                      <span className="text-[11px]" style={{ color: "oklch(0.5 0.03 265)" }}>
                        ⌘ Ctrl + Enter to start
                      </span>
                      <MagneticButton onClick={handleStart} disabled={loading} loading={loading} />
                    </div>
                  </div>
                </motion.div>

                {/* Suggestion chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTION_CHIPS.map((s) => (
                    <motion.button
                      key={s}
                      onClick={() => { setIdea(s); textareaRef.current?.focus(); }}
                      className="text-xs rounded-full px-3 py-1.5 transition-all duration-200"
                      style={{
                        background: "oklch(0.16 0.025 270 / 0.8)",
                        border: "1px solid oklch(1 0 0 / 0.08)",
                        color: "oklch(0.65 0.04 265)",
                      }}
                      whileHover={{
                        scale: 1.04,
                        background: "oklch(0.66 0.21 285 / 0.15)",
                        borderColor: "oklch(0.66 0.21 285 / 0.35)",
                        color: "oklch(0.85 0.1 285)",
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* AI Thinking Visualization */}
              <div className="hidden lg:block flex-shrink-0">
                <AIThinkingViz visible={idea.trim().length > 3} />
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex flex-col items-center gap-1.5"
            style={{ color: "oklch(0.45 0.03 265)" }}
          >
            <span className="text-[11px] uppercase tracking-widest">Explore</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="size-4" />
            </motion.div>
          </motion.div>
        </main>

        {/* ── Metrics Strip ─────────────────────────────────── */}
        <section className="px-6 py-12 flex justify-center">
          <MetricsStrip />
        </section>

        {/* ── Capability Cards ──────────────────────────────── */}
        <section className="px-6 py-12 flex justify-center">
          <CapabilityCards />
        </section>

        {/* ── Discovery Timeline ────────────────────────────── */}
        <section className="px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <DiscoveryTimeline />
          </motion.div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────── */}
        <section className="px-6 py-16 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full text-center rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.22 285 / 0.15), oklch(0.5 0.23 305 / 0.1))",
              border: "1px solid oklch(0.66 0.21 285 / 0.2)",
            }}
          >
            {/* Glow blob */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 100%, oklch(0.55 0.22 285 / 0.2) 0%, transparent 70%)",
              }}
            />
            <Sparkles className="size-8 mx-auto mb-4" style={{ color: "#C084FC" }} />
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Ready to architect your vision?
            </h2>
            <p className="text-sm mb-6" style={{ color: "oklch(0.65 0.04 265)" }}>
              Join thousands of founders and engineers using DevKit.AI to ship faster.
            </p>
            <motion.button
              onClick={() => textareaRef.current?.focus()}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #C084FC, #7C3AED)",
                boxShadow: "0 0 30px -6px rgba(168,85,247,0.7)",
              }}
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px -4px rgba(168,85,247,0.9)" }}
              whileTap={{ scale: 0.97 }}
            >
              Start Building for Free
              <ArrowRight className="size-4" />
            </motion.button>
          </motion.div>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="px-6 md:px-10 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div
              className="size-6 rounded-lg grid place-items-center"
              style={{ background: "linear-gradient(135deg, #C084FC, #7C3AED)" }}
            >
              <Sparkles className="size-3 text-white" />
            </div>
            <span className="text-xs font-semibold">
              DevKit<span className="text-gradient">.AI</span>
            </span>
          </div>
          <p className="text-xs" style={{ color: "oklch(0.45 0.03 265)" }}>
            Built for founders, engineers and tinkerers.
          </p>
          <span
            className="text-xs"
            style={{ color: "oklch(0.4 0.03 265)" }}
          >
            v1.0 · Early Access
          </span>
        </footer>
      </div>
    </div>
  );
}
