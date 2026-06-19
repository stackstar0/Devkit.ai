import { useMemo } from "react";
import { motion } from "motion/react";
import * as Slider from "@radix-ui/react-slider";
import { Server, Database, Cloud, TrendingUp } from "lucide-react";
import { estimateMonthlyCost } from "@/lib/aws-pricing";
import { useDevKit } from "@/lib/store";

const USER_STEPS = [1_000, 5_000, 10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

function formatUsers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

const BADGE_STYLES: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber:   "bg-amber-500/15  text-amber-300  border-amber-500/30",
  red:     "bg-red-500/15    text-red-300    border-red-500/30",
};

const TRACK_COLORS: Record<string, string> = {
  emerald: "oklch(0.75 0.18 155)",
  amber:   "oklch(0.78 0.18 70)",
  red:     "oklch(0.65 0.22 25)",
};

export function CostEstimator() {
  const { concurrentUsers, setConcurrentUsers } = useDevKit();

  const stepIdx = useMemo(() => {
    let closest = 0;
    let minDiff = Infinity;
    USER_STEPS.forEach((v, i) => {
      const d = Math.abs(v - concurrentUsers);
      if (d < minDiff) { minDiff = d; closest = i; }
    });
    return closest;
  }, [concurrentUsers]);

  const estimate = useMemo(() => estimateMonthlyCost(concurrentUsers), [concurrentUsers]);

  return (
    <div className="space-y-5">
      {/* Slider header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Concurrent Users</p>
          <p className="text-xs text-muted-foreground">Drag to model your infrastructure at scale</p>
        </div>
        <motion.div
          key={concurrentUsers}
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold tabular-nums"
          style={{ color: TRACK_COLORS[estimate.badgeColor] }}
        >
          {formatUsers(concurrentUsers)}
        </motion.div>
      </div>

      {/* Radix slider */}
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[stepIdx]}
        min={0}
        max={USER_STEPS.length - 1}
        step={1}
        onValueChange={([i]) => setConcurrentUsers(USER_STEPS[i])}
      >
        <Slider.Track className="bg-muted relative grow rounded-full h-1.5">
          <Slider.Range
            className="absolute h-full rounded-full transition-colors duration-300"
            style={{ background: TRACK_COLORS[estimate.badgeColor] }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block size-5 rounded-full border-2 bg-background shadow-glow outline-none transition-transform hover:scale-110 focus:scale-110"
          style={{ borderColor: TRACK_COLORS[estimate.badgeColor] }}
        />
      </Slider.Root>

      <div className="flex justify-between text-[9px] text-muted-foreground/60 px-0.5">
        {USER_STEPS.map((v) => <span key={v}>{formatUsers(v)}</span>)}
      </div>

      {/* Tier badge */}
      <motion.div
        layout
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition-colors duration-300 ${BADGE_STYLES[estimate.badgeColor]}`}
      >
        <TrendingUp className="size-3" />
        {estimate.tierLabel} Traffic Tier
      </motion.div>

      {/* Instance breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* App server */}
        <motion.div layout className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-xl bg-gradient-soft grid place-items-center">
              <Server className="size-3.5" style={{ color: "oklch(0.72 0.18 200)" }} />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">App Server</div>
          </div>
          <div className="text-sm font-semibold">{estimate.appInstance.label} × {estimate.appCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{estimate.appInstance.vcpu} vCPU · {estimate.appInstance.ram}</div>
          <div className="text-base font-bold mt-2" style={{ color: TRACK_COLORS[estimate.badgeColor] }}>
            ${estimate.breakdown[0].cost}/mo
          </div>
        </motion.div>

        {/* Database */}
        {estimate.dbInstance && (
          <motion.div layout className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-xl bg-gradient-soft grid place-items-center">
                <Database className="size-3.5" style={{ color: "oklch(0.75 0.18 90)" }} />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Database</div>
            </div>
            <div className="text-sm font-semibold">{estimate.dbInstance.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{estimate.dbInstance.vcpu} vCPU · {estimate.dbInstance.ram}</div>
            <div className="text-base font-bold mt-2" style={{ color: TRACK_COLORS[estimate.badgeColor] }}>
              ${estimate.breakdown[1].cost}/mo
            </div>
          </motion.div>
        )}

        {/* Total */}
        <motion.div
          layout
          key={estimate.totalMonthlyUsd}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          className="rounded-2xl p-4 bg-gradient-primary text-white shadow-glow"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-xl bg-white/10 grid place-items-center">
              <Cloud className="size-3.5 text-white" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/70">Est. Total</div>
          </div>
          <div className="text-3xl font-bold tabular-nums">${estimate.totalMonthlyUsd}</div>
          <div className="text-xs text-white/70 mt-0.5">per month</div>
          <div className="text-[10px] text-white/50 mt-2">
            {estimate.extras.slice(0, 2).join(" · ")}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
