import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Code2, Layers, Shield, FlaskConical, Rocket } from "lucide-react";

const PHASES = [
  {
    icon: Sparkles,
    label: "UI / UX",
    color: "#C084FC",
    description: "Map user journeys, wireframes, and interaction patterns for a delightful product experience.",
  },
  {
    icon: Code2,
    label: "Core Logic",
    color: "#A855F7",
    description: "Define business rules, state machines, and the algorithmic foundation of your product.",
  },
  {
    icon: Layers,
    label: "Architecture",
    color: "#9333EA",
    description: "Design scalable system architecture with microservices, APIs, and data flow diagrams.",
  },
  {
    icon: Shield,
    label: "Security",
    color: "#7C3AED",
    description: "Threat modeling, authentication flows, encryption strategies, and compliance requirements.",
  },
  {
    icon: FlaskConical,
    label: "Testing",
    color: "#6D28D9",
    description: "Unit, integration, and E2E test strategies. Coverage targets and CI/CD pipeline design.",
  },
  {
    icon: Rocket,
    label: "Deployment",
    color: "#5B21B6",
    description: "Cloud infrastructure, container orchestration, auto-scaling, and monitoring setup.",
  },
];

export function DiscoveryTimeline() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          The 6-Phase Discovery
        </p>
      </div>

      {/* Desktop: horizontal timeline */}
      <div className="hidden md:block relative">
        {/* Flowing connector line */}
        <div className="absolute top-8 left-0 right-0 flex items-center px-16 pointer-events-none" style={{ zIndex: 0 }}>
          <svg width="100%" height="4" className="overflow-visible">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                {PHASES.map((p, i) => (
                  <stop key={i} offset={`${(i / (PHASES.length - 1)) * 100}%`} stopColor={p.color} stopOpacity="0.4" />
                ))}
              </linearGradient>
              <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                {PHASES.map((p, i) => (
                  <stop key={i} offset={`${(i / (PHASES.length - 1)) * 100}%`} stopColor={p.color} />
                ))}
              </linearGradient>
            </defs>
            {/* Base line */}
            <line x1="0" y1="2" x2="100%" y2="2" stroke="url(#lineGrad)" strokeWidth="1.5" />
            {/* Animated flow particle */}
            <circle r="4" fill="white" fillOpacity="0.8">
              <animateMotion dur="3s" repeatCount="indefinite" path="M0,2 L100%,2" />
            </circle>
            <circle r="8" fill="url(#flowGrad)" fillOpacity="0.4">
              <animateMotion dur="3s" repeatCount="indefinite" path="M0,2 L100%,2" />
            </circle>
          </svg>
        </div>

        {/* Phase cards */}
        <div className="grid grid-cols-6 gap-3 relative" style={{ zIndex: 1 }}>
          {PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isActive = activeIndex === i;

            return (
              <motion.div
                key={phase.label}
                onHoverStart={() => setActiveIndex(i)}
                onHoverEnd={() => setActiveIndex(null)}
                className="flex flex-col items-center gap-3 cursor-default"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
              >
                {/* Icon node */}
                <motion.div
                  className="size-16 rounded-2xl grid place-items-center relative"
                  animate={{
                    scale: isActive ? 1.12 : 1,
                    boxShadow: isActive
                      ? `0 0 0 1px ${phase.color}60, 0 0 30px -4px ${phase.color}80`
                      : `0 0 0 1px ${phase.color}20, 0 0 0px ${phase.color}00`,
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(135deg, ${phase.color}18, ${phase.color}08)`,
                    border: `1px solid ${phase.color}30`,
                  }}
                >
                  <Icon className="size-6" style={{ color: phase.color }} />

                  {/* Step number */}
                  <div
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full grid place-items-center text-[9px] font-bold"
                    style={{ background: phase.color, color: "white" }}
                  >
                    {i + 1}
                  </div>
                </motion.div>

                {/* Label */}
                <span
                  className="text-xs font-medium text-center"
                  style={{ color: isActive ? phase.color : "oklch(0.65 0.04 265)" }}
                >
                  {phase.label}
                </span>

                {/* Expanded description */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="text-[11px] text-center leading-relaxed rounded-xl p-2.5"
                        style={{
                          color: "oklch(0.78 0.04 265)",
                          background: `${phase.color}10`,
                          border: `1px solid ${phase.color}20`,
                        }}
                      >
                        {phase.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          return (
            <motion.div
              key={phase.label}
              className="glass-premium rounded-xl p-3 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <Icon className="size-5" style={{ color: phase.color }} />
              <span className="text-xs text-muted-foreground font-medium">{phase.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
