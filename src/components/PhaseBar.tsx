import { Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import type { Phase } from "@/lib/store";

export function PhaseBar({ phases }: { phases: Phase[] }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2">
        {phases.map((p, i) => {
          const isActive = p.status === "active";
          const isComplete = p.status === "complete";
          const isSkipped = p.status === "skipped";
          return (
            <div key={p.key} className="flex items-center gap-2 md:gap-3 shrink-0">
              <motion.div
                layout
                className={[
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border transition",
                  isActive
                    ? "border-transparent bg-gradient-primary text-white shadow-glow"
                    : isComplete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : isSkipped
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-border bg-card/40 text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid place-items-center size-4 rounded-full text-[10px] font-semibold",
                    isActive
                      ? "bg-white/20"
                      : isComplete
                        ? "bg-emerald-500/30"
                        : isSkipped
                          ? "bg-amber-500/30"
                          : "bg-white/5",
                  ].join(" ")}
                >
                  {isComplete ? (
                    <Check className="size-3" />
                  ) : isSkipped ? (
                    <Sparkles className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="whitespace-nowrap">{p.label}</span>
                {isSkipped && <span className="text-[10px] opacity-80">Auto-filled ✨</span>}
              </motion.div>
              {i < phases.length - 1 && <div className="h-px w-4 md:w-8 bg-border" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
