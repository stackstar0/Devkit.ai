import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const METRICS = [
  { value: 50000, suffix: "+", label: "Architectures Generated", display: "50k+" },
  { value: 93, suffix: "%", label: "Faster Planning", display: "93%" },
  { value: 6, suffix: "", label: "Discovery Phases", display: "6" },
  { value: 100, suffix: "%", label: "Production Ready", display: "100%" },
];

function useCountUp(target: number, duration = 1600, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [active, target, duration]);

  return count;
}

function MetricItem({ metric, index, active }: { metric: typeof METRICS[0]; index: number; active: boolean }) {
  const rawCount = useCountUp(metric.value, 1400 + index * 100, active);

  const formatDisplay = (n: number) => {
    if (metric.value >= 1000) return `${Math.floor(n / 1000)}k+`;
    return `${n}${metric.suffix}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-1.5 px-6 relative"
    >
      {/* Separator */}
      {index > 0 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px"
          style={{ background: "oklch(1 0 0 / 0.08)" }}
        />
      )}

      {/* Number */}
      <span
        className="text-3xl md:text-4xl font-bold tabular-nums"
        style={{
          background: "linear-gradient(135deg, #C084FC, #7C3AED)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {active ? formatDisplay(rawCount) : metric.display}
      </span>

      {/* Label */}
      <span className="text-xs text-muted-foreground text-center font-medium">
        {metric.label}
      </span>
    </motion.div>
  );
}

export function MetricsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div
        className="glass-premium rounded-2xl py-8 px-6 flex items-center justify-center flex-wrap gap-6"
        style={{
          border: "1px solid oklch(0.66 0.21 285 / 0.15)",
          background: "linear-gradient(135deg, oklch(0.14 0.025 270 / 0.9), oklch(0.1 0.018 270 / 0.85))",
        }}
      >
        {METRICS.map((m, i) => (
          <MetricItem key={m.label} metric={m} index={i} active={active} />
        ))}
      </div>
    </motion.div>
  );
}
