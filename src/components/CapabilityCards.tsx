import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Eye, Network, ShieldCheck, CloudUpload } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Eye,
    title: "Vision Analysis",
    description: "AI-powered requirement parsing that understands your product vision and translates it into technical specifications.",
    color: "#C084FC",
    animation: "scan",
  },
  {
    icon: Network,
    title: "Architecture Planning",
    description: "Generates scalable system diagrams, microservice topologies, and data flow architectures tailored to your stack.",
    color: "#A855F7",
    animation: "network",
  },
  {
    icon: ShieldCheck,
    title: "Security Intelligence",
    description: "Proactive threat modeling, vulnerability assessment, and compliance-ready security architecture recommendations.",
    color: "#7C3AED",
    animation: "shield",
  },
  {
    icon: CloudUpload,
    title: "Deployment Blueprint",
    description: "Cloud-native infrastructure plans with auto-scaling, CI/CD pipelines, and cost-optimized deployment strategies.",
    color: "#6D28D9",
    animation: "cloud",
  },
];

function CapabilityCard({ cap, index }: { cap: typeof CAPABILITIES[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const Icon = cap.icon;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 6, y: dx * 6 });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false); }}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
        y: isHovered ? -6 : 0,
        opacity: 1,
      }}
      transition={{
        opacity: { delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        y: { type: "spring", stiffness: 300, damping: 25 },
        rotateX: { type: "spring", stiffness: 300, damping: 25 },
        rotateY: { type: "spring", stiffness: 300, damping: 25 },
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 800,
        animationName: "float-slow",
        animationDuration: `${5 + index * 1.3}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDelay: `${index * 0.8}s`,
      }}
      className="glass-premium rounded-2xl p-6 cursor-default relative overflow-hidden group"
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at 50% 0%, ${cap.color}15 0%, transparent 70%)`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Animated border on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background: `linear-gradient(135deg, ${cap.color}30, transparent, ${cap.color}20)`,
          padding: "1px",
          borderRadius: "inherit",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Icon */}
      <motion.div
        className="size-12 rounded-xl grid place-items-center mb-4"
        style={{ background: `${cap.color}18`, border: `1px solid ${cap.color}30` }}
        animate={{ boxShadow: isHovered ? `0 0 20px ${cap.color}50` : `0 0 0px ${cap.color}00` }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="size-6" style={{ color: cap.color }} />
      </motion.div>

      {/* Text */}
      <h3 className="font-semibold text-sm mb-2" style={{ color: "oklch(0.95 0.01 260)" }}>
        {cap.title}
      </h3>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {cap.description}
      </p>

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20"
        style={{ background: `radial-gradient(circle at top right, ${cap.color}, transparent)` }}
      />
    </motion.div>
  );
}

export function CapabilityCards() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55 }}
        className="text-center mb-10"
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
          Core Intelligence
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Everything your architecture needs
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          From vision to deployment. AI-driven insights across every layer of your software.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ perspective: "1200px" }}>
        {CAPABILITIES.map((cap, i) => (
          <CapabilityCard key={cap.title} cap={cap} index={i} />
        ))}
      </div>
    </section>
  );
}
