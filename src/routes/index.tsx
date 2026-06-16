import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Code2, Layers, Shield, Rocket, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { startSession } from "@/lib/api";
import { useDevKit } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevKit.AI — Turn ideas into production-ready blueprints" },
      {
        name: "description",
        content:
          "DevKit.AI guides you through a 6-phase AI discovery process to transform raw software ideas into production-ready architecture blueprints.",
      },
      { property: "og:title", content: "DevKit.AI" },
      { property: "og:description", content: "Turn raw ideas into production-ready blueprints." },
    ],
  }),
  component: Landing,
});

const SUGGESTIONS = [
  "A marketplace for local artists",
  "An AI study planner for med students",
  "A SaaS for managing freelance contracts",
  "A real-time multiplayer trivia app",
];

const PHASES = [
  { icon: Sparkles, label: "UI / UX" },
  { icon: Code2, label: "Core Logic" },
  { icon: Layers, label: "Architecture" },
  { icon: Shield, label: "Security" },
  { icon: FlaskConical, label: "Testing" },
  { icon: Rocket, label: "Deployment" },
];

function Landing() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useDevKit((s) => s.setSession);

  async function handleStart() {
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
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-primary shadow-glow grid place-items-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">
            DevKit<span className="text-gradient">.AI</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">v1.0 · Early access</div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="size-1.5 rounded-full bg-gradient-primary" />
              AI-guided architecture discovery
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              What are you <span className="text-gradient">building</span> today?
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Transform a raw idea into a production-ready architecture blueprint.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-10"
          >
            <div className="glass rounded-2xl p-2 shadow-card">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                placeholder="I want to build a marketplace for local artists…"
                className="w-full resize-none bg-transparent px-4 py-3 outline-none placeholder:text-muted-foreground text-base"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleStart();
                }}
              />
              <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-1">
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  ⌘/Ctrl + Enter to start
                </span>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow transition disabled:opacity-60 hover:brightness-110"
                >
                  {loading ? "Starting…" : "Start Building"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setIdea(s)}
                  className="text-xs rounded-full border border-border bg-card/50 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-card transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16"
          >
            <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4">
              The 6-phase discovery
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {PHASES.map(({ icon: Icon, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="glass rounded-xl p-3 flex flex-col items-center gap-2"
                >
                  <Icon
                    className="size-4 text-gradient"
                    style={{ color: "oklch(0.66 0.21 285)" }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="px-6 md:px-10 py-6 text-center text-xs text-muted-foreground">
        Built for founders, engineers and tinkerers.
      </footer>
    </div>
  );
}
