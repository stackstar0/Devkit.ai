import { motion, AnimatePresence } from "motion/react";
import { Database, Globe, Server, ShieldCheck, CloudUpload, Lightbulb } from "lucide-react";

const ARCH_NODES = [
  { icon: Lightbulb,   label: "Idea",       color: "#C084FC" },
  { icon: Globe,       label: "Frontend",   color: "#A855F7" },
  { icon: Server,      label: "Backend",    color: "#9333EA" },
  { icon: Database,    label: "Database",   color: "#7C3AED" },
  { icon: ShieldCheck, label: "Security",   color: "#6D28D9" },
  { icon: CloudUpload, label: "Deployment", color: "#5B21B6" },
];

interface AIThinkingVizProps {
  visible: boolean;
}

export function AIThinkingViz({ visible }: AIThinkingVizProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 16, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="glass-premium rounded-2xl p-4 flex flex-col gap-0"
          style={{
            border: "1px solid oklch(0.66 0.21 285 / 0.2)",
            minWidth: 160,
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            AI Mapping
          </p>

          {ARCH_NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.label} className="flex flex-col items-start">
                {/* Node row */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.18 + 0.1, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    className="size-7 rounded-lg grid place-items-center flex-shrink-0"
                    style={{ backgroundColor: `${node.color}22`, border: `1px solid ${node.color}40` }}
                    animate={{ boxShadow: [`0 0 0px ${node.color}00`, `0 0 10px ${node.color}60`, `0 0 0px ${node.color}00`] }}
                    transition={{ delay: i * 0.18 + 0.3, duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Icon className="size-3.5" style={{ color: node.color }} />
                  </motion.div>
                  <span className="text-xs font-medium" style={{ color: node.color }}>
                    {node.label}
                  </span>
                </motion.div>

                {/* Connector line */}
                {i < ARCH_NODES.length - 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 16, opacity: 1 }}
                    transition={{ delay: i * 0.18 + 0.25, duration: 0.2 }}
                    className="ml-3 w-px"
                    style={{
                      background: `linear-gradient(to bottom, ${node.color}80, ${ARCH_NODES[i+1].color}40)`,
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Pulsing indicator */}
          <motion.div
            className="mt-3 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ARCH_NODES.length * 0.18 + 0.2 }}
          >
            <motion.span
              className="size-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] text-muted-foreground">Analyzing…</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
