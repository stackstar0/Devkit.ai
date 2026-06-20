import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download, Copy, Check, AlertTriangle, Cloud, Plug, ChevronDown,
  Sparkles, ArrowLeft, PackageOpen, Rocket, MessageSquarePlus, Loader2, Presentation
} from "lucide-react";
import { toast } from "sonner";
import { getResults, downloadBoilerplate, downloadPitchDeck } from "@/lib/api";
import { useDevKit } from "@/lib/store";
import { useStreamBlueprint } from "@/hooks/useStreamBlueprint";
import { ArchitectureCanvas } from "@/components/ArchitectureCanvas";
import { CostEstimator } from "@/components/CostEstimator";
import { InstructionEditor } from "@/components/InstructionEditor";
import { RefinementPanel } from "@/components/RefinementPanel";
import { openInSandbox, zipBlobToFiles, triggerBlobDownload } from "@/lib/sandbox";

export const Route = createFileRoute("/results/$sessionId")({
  head: () => ({ meta: [{ title: "Blueprint — DevKit.AI" }] }),
  component: Results,
});

function Results() {
  const { sessionId } = useParams({ from: "/results/$sessionId" });
  const {
    architecture, milestones, phaseSummaries, instructionMd,
    cost, warnings, projectName, streamStatus, resetBlueprint,
  } = useDevKit();

  const [saved, setSaved] = useState(false);
  const [archView, setArchView] = useState<"graph" | "card">("graph");
  const [panelOpen, setPanelOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deckExporting, setDeckExporting] = useState(false);
  const [sandboxing, setSandboxing] = useState(false);

  // Start streaming blueprint data into Zustand
  useStreamBlueprint(sessionId);

  // Also fetch saved results (handles page refresh / direct link)
  useEffect(() => {
    getResults(sessionId)
      .then((data) => {
        if (data.architecture && !architecture) {
          const { setArchitecture, setMilestones, setInstructionMd, setCost, setWarnings, setProjectName, setPhaseSummaries, setRefinementHistory } = useDevKit.getState();
          if (data.architecture) setArchitecture(data.architecture);
          if (data.milestones) setMilestones(data.milestones);
          if (data.instruction_md) setInstructionMd(data.instruction_md);
          if (data.cost) setCost(data.cost);
          if (data.warnings) setWarnings(data.warnings);
          if (data.project_name) setProjectName(data.project_name);
          if (data.phase_summaries) setPhaseSummaries(data.phase_summaries);
          if (data.refinement_history) setRefinementHistory(data.refinement_history);
          setSaved(true);
        }
      })
      .catch(() => {/* streaming will populate the data */});
  }, [sessionId]);

  const isStreaming = streamStatus === "streaming" || streamStatus === "idle";
  const hasArch = !!architecture;
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const hasMilestones = safeMilestones.length > 0;
  const hasInstruction = !!instructionMd;

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await downloadBoilerplate(sessionId);
      triggerBlobDownload(blob, `${sessionId}-boilerplate.zip`);
      toast.success("Codebase exported!");
    } catch {
      toast.error("Export failed — is the backend running?");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPitchDeck() {
    if (!sessionId) return;
    setDeckExporting(true);
    try {
      const blob = await downloadPitchDeck(sessionId);
      triggerBlobDownload(blob, `${projectName?.replace(/\\s+/g, "_") || "Project"}_PitchDeck.md`);
      toast.success("Pitch Deck Exported!");
    } catch {
      toast.error("Pitch Deck export failed");
    } finally {
      setDeckExporting(false);
    }
  }

  async function handleSandbox() {
    setSandboxing(true);
    try {
      const blob = await downloadBoilerplate(sessionId);
      const files = await zipBlobToFiles(blob);
      await openInSandbox(files, projectName || "DevKit Project");
    } catch {
      toast.error("Sandbox launch failed");
    } finally {
      setSandboxing(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border/60 sticky top-0 z-30 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="size-8 rounded-lg border border-border grid place-items-center hover:bg-card transition">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Blueprint</div>
              <h1 className="text-base md:text-lg font-semibold truncate">
                {projectName || (isStreaming ? "Generating…" : "Untitled Project")}
              </h1>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="size-3 animate-spin" />
                <span>Streaming…</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPanelOpen(true)}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border border-border/60 bg-card/40 hover:bg-card transition"
            >
              <MessageSquarePlus className="size-3.5" /> Refine
            </button>
            <button
              disabled={!hasInstruction}
              onClick={() => {
                const blob = new Blob([instructionMd || ""], { type: "text/markdown" });
                triggerBlobDownload(blob, "instruction.md");
              }}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border border-border bg-card/60 hover:bg-card disabled:opacity-40 transition"
            >
              <Download className="size-3.5" /> instruction.md
            </button>
            <button
              disabled={deckExporting || !hasArch}
              onClick={handleExportPitchDeck}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition"
            >
              {deckExporting ? <Loader2 className="size-3.5 animate-spin" /> : <Presentation className="size-3.5" />}
              VC Pitch Deck 📊
            </button>
            <button
              disabled={exporting || !hasArch}
              onClick={handleExport}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition"
            >
              {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <PackageOpen className="size-3.5" />}
              Export Codebase ⚡
            </button>
            <button
              disabled={sandboxing || !hasArch}
              onClick={handleSandbox}
              className="text-xs inline-flex items-center gap-1.5 rounded-xl px-3 py-2 bg-gradient-primary text-white shadow-glow disabled:opacity-40 transition"
            >
              {sandboxing ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
              🚀 Run in Sandbox
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-10">

        {/* Architecture */}
        <AnimatePresence>
          {hasArch && (
            <motion.section
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Architecture Overview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Live data-flow graph of your recommended stack</p>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-border text-xs">
                  {(["graph", "card"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setArchView(v)}
                      className={`px-3 py-1.5 capitalize transition-colors ${archView === v ? "bg-gradient-primary text-white" : "hover:bg-card"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <ArchitectureCanvas architecture={architecture!} view={archView} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Skeleton while streaming architecture */}
        {!hasArch && isStreaming && <SkeletonSection label="Architecture Overview" rows={3} />}

        {/* Phase summaries */}
        <AnimatePresence>
          {phaseSummaries && Object.keys(phaseSummaries).length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <SectionHeader title="Phase Summary" subtitle="AI-inferred breakdown across all discovery phases." />
              <div className="space-y-2">
                {Object.entries(phaseSummaries).map(([k, v]) => (
                  <Accordion key={k} title={pretty(k)} body={v} />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Milestones */}
        <AnimatePresence>
          {hasMilestones && (
            <motion.section
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <SectionHeader title="Milestones Timeline" subtitle="Your suggested delivery roadmap." />
              <motion.ol
                className="relative border-l border-border ml-3 space-y-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              >
                {safeMilestones.map((m, i) => (
                  <motion.li
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                    className="pl-5 relative"
                  >
                    <span className="absolute -left-[7px] top-1 size-3.5 rounded-full bg-gradient-primary shadow-glow" />
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="font-medium text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.duration}</div>
                      </div>
                      {Array.isArray(m.dependencies) && m.dependencies.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.dependencies.map((d: any) => (
                            <span key={d} className="text-[10px] rounded-full bg-card border border-border px-2 py-0.5 text-muted-foreground">
                              depends on {d}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            </motion.section>
          )}
        </AnimatePresence>

        {!hasMilestones && isStreaming && <SkeletonSection label="Milestones Timeline" rows={2} />}

        {/* Cost Estimator */}
        <AnimatePresence>
          {hasArch && (
            <motion.section
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <SectionHeader title="Cloud Cost Estimator" subtitle="Drag the slider to model infrastructure at your scale." />
              <div className="glass rounded-2xl p-6">
                <CostEstimator />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader title="Integration Warnings" subtitle="Heads-ups before you build." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 border ${
                    w.severity === "danger"
                      ? "bg-red-500/10 border-red-500/30 text-red-200"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <AlertTriangle className="size-4" /> {w.title}
                  </div>
                  {w.description && <p className="text-xs mt-1 opacity-90">{w.description}</p>}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* instruction.md */}
        <AnimatePresence>
          {hasInstruction && (
            <motion.section
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <SectionHeader title="instruction.md" subtitle="Drop this into Cursor, Copilot, or Devin to start building." />
              <InstructionEditor content={instructionMd!} />
            </motion.section>
          )}
        </AnimatePresence>

        {!hasInstruction && isStreaming && <SkeletonSection label="instruction.md" rows={6} />}

      </main>

      {/* Refinement Side Panel */}
      <RefinementPanel sessionId={sessionId} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SkeletonSection({ label, rows }: { label: string; rows: number }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-4">
        <div className="h-5 w-48 skeleton rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 skeleton rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </motion.section>
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function pretty(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}
