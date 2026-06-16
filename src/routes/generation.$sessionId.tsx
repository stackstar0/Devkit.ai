import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Loader2, FileText, Layers, Map, Sparkles } from "lucide-react";
import { streamUrl } from "@/lib/api";

export const Route = createFileRoute("/generation/$sessionId")({
  head: () => ({ meta: [{ title: "Generating — DevKit.AI" }] }),
  component: Generation,
});

type StageKey = "brief" | "architect" | "pm" | "prompt";
const STAGES: { key: StageKey; label: string; icon: any; event: string }[] = [
  { key: "brief", label: "Project Brief", icon: FileText, event: "brief_ready" },
  { key: "architect", label: "Systems Architecture", icon: Layers, event: "architect_complete" },
  { key: "pm", label: "Project Milestones", icon: Map, event: "pm_complete" },
  { key: "prompt", label: "instruction.md", icon: Sparkles, event: "prompt_complete" },
];

function Generation() {
  const { sessionId } = useParams({ from: "/generation/$sessionId" });
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<StageKey>("brief");

  useEffect(() => {
    const es = new EventSource(streamUrl(sessionId));
    function markEvent(name: string) {
      const stage = STAGES.find((s) => s.event === name);
      if (!stage) return;
      setCompleted((c) => ({ ...c, [stage.key]: true }));
      const idx = STAGES.findIndex((s) => s.key === stage.key);
      const next = STAGES[idx + 1];
      if (next) setActive(next.key);
    }
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.event) markEvent(data.event);
        if (data?.event === "done" || data === "done") {
          es.close();
          setTimeout(() => navigate({ to: "/results/$sessionId", params: { sessionId } }), 800);
        }
      } catch {
        if (e.data === "done") {
          es.close();
          setTimeout(() => navigate({ to: "/results/$sessionId", params: { sessionId } }), 800);
        }
      }
    };
    STAGES.forEach((s) => {
      es.addEventListener(s.event, () => markEvent(s.event));
    });
    es.addEventListener("done", () => {
      es.close();
      setTimeout(() => navigate({ to: "/results/$sessionId", params: { sessionId } }), 800);
    });
    es.onerror = () => {
      // keep open, EventSource auto-retries
    };
    return () => es.close();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="size-12 mx-auto rounded-2xl bg-gradient-primary shadow-glow grid place-items-center mb-5">
            <Loader2 className="size-5 text-white animate-spin" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Building your blueprint</h1>
          <p className="mt-2 text-muted-foreground">
            Our pipeline is composing your architecture, milestones and AI instruction set.
          </p>
        </div>

        <div className="space-y-3">
          {STAGES.map((s, i) => {
            const done = !!completed[s.key];
            const isActive = active === s.key && !done;
            const Icon = s.icon;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass rounded-2xl p-4 flex items-center gap-4 ${isActive ? "shadow-glow" : ""}`}
              >
                <div
                  className={[
                    "size-10 rounded-xl grid place-items-center",
                    done
                      ? "bg-emerald-500/15 text-emerald-300"
                      : isActive
                        ? "bg-gradient-primary text-white"
                        : "bg-card text-muted-foreground",
                  ].join(" ")}
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {done ? "Ready" : isActive ? "Generating…" : "Queued"}
                  </div>
                </div>
                {done && (
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                    Done
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
