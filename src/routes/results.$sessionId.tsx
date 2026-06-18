import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Download,
  Copy,
  Check,
  AlertTriangle,
  Server,
  Database,
  Globe,
  Code2,
  Cloud,
  Plug,
  ChevronDown,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { getResults, streamUrl } from "@/lib/api";

export const Route = createFileRoute("/results/$sessionId")({
  head: () => ({ meta: [{ title: "Blueprint — DevKit.AI" }] }),
  component: Results,
});

type Results = {
  project_name?: string;
  architecture?: {
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
    apis?: string[];
  };
  phase_summaries?: Record<string, string>;
  milestones?: { name: string; duration: string; dependencies?: string[] }[];
  cost?: { launch?: string; scale?: string };
  warnings?: { title: string; severity?: "warn" | "danger"; description?: string }[];
  instruction_md?: string;
  saved?: boolean;
};

function Results() {
  const { sessionId } = useParams({ from: "/results/$sessionId" });
  const [data, setData] = useState<Results | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getResults(sessionId)
      .then(setData)
      .catch(() => setData(SAMPLE));
    const es = new EventSource(streamUrl(sessionId));
    es.addEventListener("saved", () => {
      setSaved(true);
      es.close();
    });
    es.addEventListener("done", () => {
      es.close();
    });
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d?.event === "saved") {
          setSaved(true);
          es.close();
        }
        if (d?.event === "done") {
          es.close();
        }
      } catch {
        if (e.data === "saved") {
          setSaved(true);
          es.close();
        }
        if (e.data === "done") {
          es.close();
        }
      }
    };
    return () => es.close();
  }, [sessionId]);

  const r = data ?? SAMPLE;
  const ready = saved || r.saved;

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 md:px-8 py-5 border-b border-border/60 sticky top-0 z-30 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="size-8 rounded-lg border border-border grid place-items-center hover:bg-card transition"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Blueprint
              </div>
              <h1 className="text-base md:text-lg font-semibold truncate">
                {r.project_name || "Untitled Project"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!ready}
              onClick={() => download("instruction.md", r.instruction_md || "")}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border border-border bg-card/60 hover:bg-card disabled:opacity-40"
            >
              <Download className="size-3.5" /> instruction.md
            </button>
            <button
              disabled={!ready}
              onClick={() => download("devkit-report.md", buildReport(r))}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 bg-gradient-primary text-white shadow-glow disabled:opacity-40"
            >
              <Download className="size-3.5" /> Full Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* Architecture */}
        <Section title="Architecture Overview" subtitle="The stack we recommend, end to end.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <StackCard icon={Code2} label="Frontend" value={r.architecture?.frontend} />
            <StackCard icon={Server} label="Backend" value={r.architecture?.backend} />
            <StackCard icon={Database} label="Database" value={r.architecture?.database} />
            <StackCard icon={Cloud} label="Hosting" value={r.architecture?.hosting} />
            <StackCard icon={Plug} label="APIs" value={r.architecture?.apis?.join(", ")} />
            <StackCard icon={Globe} label="Realtime" value="WebSockets + SSE" />
          </div>
        </Section>

        {/* Phase summaries */}
        <Section title="Phase Summary" subtitle="A breakdown of each discovery phase.">
          <div className="space-y-2">
            {Object.entries(r.phase_summaries || {}).map(([k, v]) => (
              <Accordion key={k} title={pretty(k)} body={v} />
            ))}
          </div>
        </Section>

        {/* Milestones */}
        <Section title="Milestones Timeline" subtitle="Your suggested delivery roadmap.">
          <ol className="relative border-l border-border ml-3 space-y-5">
            {(r.milestones || []).map((m, i) => (
              <li key={i} className="pl-5 relative">
                <span className="absolute -left-[7px] top-1 size-3.5 rounded-full bg-gradient-primary shadow-glow" />
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.duration}</div>
                  </div>
                  {m.dependencies?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.dependencies.map((d) => (
                        <span
                          key={d}
                          className="text-[10px] rounded-full bg-card border border-border px-2 py-0.5 text-muted-foreground"
                        >
                          depends on {d}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Cost */}
        <Section title="Cost Estimate" subtitle="Rough monthly cloud spend.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CostCard label="Launch Cost" value={r.cost?.launch || "—"} accent />
            <CostCard label="Scale Cost" value={r.cost?.scale || "—"} />
          </div>
        </Section>

        {/* Warnings */}
        {!!r.warnings?.length && (
          <Section title="Integration Warnings" subtitle="Heads-ups before you build.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {r.warnings.map((w, i) => (
                <div
                  key={i}
                  className={[
                    "rounded-2xl p-4 border",
                    w.severity === "danger"
                      ? "bg-red-500/10 border-red-500/30 text-red-200"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <AlertTriangle className="size-4" /> {w.title}
                  </div>
                  {w.description && <p className="text-xs mt-1 opacity-90">{w.description}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* instruction.md preview */}
        <Section title="instruction.md" subtitle="Drop this into your AI coding agent.">
          <CodeViewer content={r.instruction_md || ""} />
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function StackCard({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3">
      <div className="size-9 rounded-xl bg-gradient-soft grid place-items-center">
        <Icon className="size-4" style={{ color: "oklch(0.78 0.16 285)" }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value || "—"}</div>
      </div>
    </div>
  );
}

function CostCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 ${accent ? "bg-gradient-primary text-white shadow-glow" : "glass"}`}
    >
      <div
        className={`text-[10px] uppercase tracking-widest ${accent ? "text-white/80" : "text-muted-foreground"}`}
      >
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight mt-1">{value}</div>
    </div>
  );
}

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">{body}</div>
      )}
    </div>
  );
}

function CodeViewer({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="size-3" /> instruction.md
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs inline-flex items-center gap-1.5 rounded-lg px-2 py-1 border border-border hover:bg-card"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[480px] overflow-auto p-4 text-xs leading-relaxed text-foreground/90">
        <code>
          {content || "# Your instruction set will appear here once generation completes."}
        </code>
      </pre>
    </div>
  );
}

function pretty(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

function buildReport(r: Results) {
  return `# ${r.project_name || "Project"} — DevKit Blueprint

## Architecture
- Frontend: ${r.architecture?.frontend || "-"}
- Backend: ${r.architecture?.backend || "-"}
- Database: ${r.architecture?.database || "-"}
- Hosting: ${r.architecture?.hosting || "-"}
- APIs: ${r.architecture?.apis?.join(", ") || "-"}

## Milestones
${(r.milestones || []).map((m) => `- ${m.name} (${m.duration})`).join("\n")}

## Cost
- Launch: ${r.cost?.launch || "-"}
- Scale: ${r.cost?.scale || "-"}

## instruction.md
${r.instruction_md || ""}
`;
}

const SAMPLE: Results = {
  project_name: "Local Artist Marketplace",
  architecture: {
    frontend: "Next.js + Tailwind",
    backend: "FastAPI",
    database: "PostgreSQL",
    hosting: "Vercel + Fly.io",
    apis: ["Stripe", "Cloudinary", "Resend"],
  },
  phase_summaries: {
    ui_ux: "Mobile-first marketplace with discover, artist, and order flows.",
    core_logic: "Listings, carts, checkout, messaging.",
    architecture: "Modular monolith with future service extraction.",
    security: "JWT auth, RLS, signed media URLs.",
    testing: "Pytest + Playwright end-to-end.",
    deployment: "CI on push, preview environments, blue/green rollouts.",
  },
  milestones: [
    { name: "MVP (auth, listings, browse)", duration: "3 weeks" },
    { name: "Checkout + payments", duration: "2 weeks", dependencies: ["MVP"] },
    { name: "Messaging + reviews", duration: "2 weeks", dependencies: ["Checkout"] },
    { name: "Launch", duration: "1 week", dependencies: ["Messaging"] },
  ],
  cost: { launch: "$42 / mo", scale: "$480 / mo" },
  warnings: [
    {
      title: "Stripe Connect KYC required",
      severity: "warn",
      description: "Plan 1-2 weeks for artist onboarding verification.",
    },
  ],
  instruction_md:
    "# Project Instructions\n\nBuild a marketplace for local artists using Next.js + FastAPI...\n",
  saved: true,
};
