import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download, Copy, Check, AlertTriangle, Cloud, Plug, ChevronDown,
  Sparkles, ArrowLeft, PackageOpen, Rocket, MessageSquarePlus, Loader2, Presentation, X
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
import { Skeleton } from "@/components/ui/skeleton";
import { WordRotator } from "@/components/WordRotator";

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
  const [logs, setLogs] = useState<string[]>([]);
  const [showViewport, setShowViewport] = useState(false);
  const [viewportType, setViewportType] = useState<"sandbox" | "export" | null>(null);

  const [streamEvent, setStreamEvent] = useState<string>("connecting");
  const [showOverlay, setShowOverlay] = useState(true);

  // Start streaming blueprint data into Zustand
  useStreamBlueprint(sessionId, setStreamEvent);

  const isStreaming = streamStatus === "streaming" || streamStatus === "idle";
  const hasArch = !!architecture && Object.keys(architecture).length > 0;
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  const hasMilestones = safeMilestones.length > 0;
  const hasInstruction = !!instructionMd;

  useEffect(() => {
    if (streamStatus === "complete") {
      setStreamEvent("done");
      const t = setTimeout(() => setShowOverlay(false), 2800);
      return () => clearTimeout(t);
    }
    if (streamStatus === "idle" && hasArch && hasMilestones && hasInstruction) {
      setShowOverlay(false);
    }
    if (streamStatus === "error") {
      const t = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(t);
    }
  }, [streamStatus, hasArch, hasMilestones, hasInstruction]);

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

  async function handleExport() {
    setViewportType("export");
    setShowViewport(true);
    setExporting(true);
    setLogs(["Preparing project layout...", "Resolving dependencies...", "Generating Dockerfile...", "Compressing assets..."]);
    try {
      const blob = await downloadBoilerplate(sessionId);
      setLogs(l => [...l, "Finalizing zip archive..."]);
      triggerBlobDownload(blob, `${sessionId}-boilerplate.zip`);
      setLogs(l => [...l, "Codebase exported successfully!"]);
      toast.success("Codebase exported!");
    } catch {
      setLogs(l => [...l, "[ERROR] Export failed — is the backend running?"]);
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
    setViewportType("sandbox");
    setShowViewport(true);
    setSandboxing(true);
    setLogs(["Booting StackBlitz WebContainer...", "Mounting virtual file system...", "Transpiling DevKit AI blueprint..."]);
    try {
      const blob = await downloadBoilerplate(sessionId);
      setLogs(l => [...l, "Unpacking boilerplate to workspace..."]);
      const files = await zipBlobToFiles(blob);
      setLogs(l => [...l, "Initializing dev server... Launching sandbox environment!"]);
      await openInSandbox(files, projectName || "DevKit Project");
    } catch {
      setLogs(l => [...l, "[ERROR] Sandbox launch failed"]);
      toast.error("Sandbox launch failed");
    } finally {
      setSandboxing(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      <AnimatePresence>
        {showOverlay && (
          <AIProcessingOverlay event={streamEvent} status={streamStatus as "streaming" | "complete" | "error" | "connecting" | "idle"} />
        )}
      </AnimatePresence>

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
              <div className="flex items-center gap-1.5 text-xs text-primary whitespace-nowrap flex-shrink-0 min-w-fit">
                <Loader2 className="size-3 animate-spin" />
                <span>Streaming…</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0 min-w-fit">
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

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 transition-all duration-300 ease-in-out">
        <div className="mb-6 rounded-xl p-4 bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="size-4 shrink-0 text-amber-500/70" />
          <p>
            <strong>Responsible AI Notice:</strong> This blueprint is an AI-generated estimate and a starting point, not a definitive technical specification. Review all recommendations with a qualified engineer before deployment.
          </p>
        </div>
        <div className={showViewport ? "grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start" : ""}>
          {/* Main Content Area */}
          <div className={`space-y-10 ${showViewport ? "xl:col-span-2" : "max-w-6xl mx-auto"}`}>

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
        {!hasArch && isStreaming && <SkeletonSection type="architecture" />}

        {/* Skeleton while streaming phases */}
        {(!phaseSummaries || Object.keys(phaseSummaries).length === 0) && isStreaming && <SkeletonSection type="phases" />}

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

        {!hasMilestones && isStreaming && <SkeletonSection type="milestones" />}

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

        {!hasInstruction && isStreaming && <SkeletonSection type="instruction" />}

          </div> {/* End Main Content Area */}

          {/* Execution Viewport */}
          <AnimatePresence>
            {showViewport && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass rounded-2xl p-4 sticky top-24 xl:col-span-1 h-[400px] flex flex-col mt-10 xl:mt-0"
              >
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {viewportType === "sandbox" ? <Rocket className="size-3.5 text-primary" /> : <PackageOpen className="size-3.5 text-amber-500" />}
                    {viewportType === "sandbox" ? "Sandbox Terminal" : "Export Log"}
                  </div>
                  <button onClick={() => setShowViewport(false)} className="opacity-50 hover:opacity-100 transition p-1 hover:bg-card rounded-md">
                    <X className="size-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 text-[11px] font-mono scrollbar-none flex flex-col">
                  {logs.map((log, i) => (
                    <div key={i} className="animate-fade-in text-muted-foreground flex items-start gap-2 shrink-0">
                      <span className="text-primary/60 shrink-0 mt-0.5">{'>'}</span> 
                      <span className="break-words flex-1 leading-relaxed">{log}</span>
                    </div>
                  ))}
                  {(exporting || sandboxing) && (
                    <div className="animate-pulse text-muted-foreground flex items-center gap-2 mt-2 shrink-0">
                      <span className="text-primary/60 shrink-0">{'>'}</span> 
                      <span className="w-1.5 h-3 bg-primary/60 inline-block animate-pulse" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

function SkeletonSection({ type }: { type: "architecture" | "phases" | "milestones" | "instruction" }) {
  if (type === "architecture") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <div className="mb-4">
          <Skeleton className="h-7 w-64 mb-1.5" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </motion.section>
    );
  }
  if (type === "phases") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <div className="mb-4">
          <Skeleton className="h-7 w-48 mb-1.5" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl delay-75" />
          <Skeleton className="h-16 w-full rounded-2xl delay-150" />
        </div>
      </motion.section>
    );
  }
  if (type === "milestones") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <div className="mb-4">
          <Skeleton className="h-7 w-56 mb-1.5" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-5 ml-3 pl-5 border-l border-border relative">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl delay-75" />
          <Skeleton className="h-20 w-full rounded-xl delay-150" />
        </div>
      </motion.section>
    );
  }
  if (type === "instruction") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <div className="mb-4">
          <Skeleton className="h-7 w-48 mb-1.5" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </motion.section>
    );
  }
  return null;
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

function AIProcessingOverlay({ event, status }: { event: string; status: "connecting" | "streaming" | "complete" | "error" | "idle" }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "streaming") return;
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const STAGES = [
    { key: "brief_ready", label: "User Requirements" },
    { key: "architect_complete", label: "Architecture Planning" },
    { key: "pm_complete", label: "Project Milestones" },
    { key: "prompt_complete", label: "instruction.md" },
    { key: "done", label: "Deployment Blueprint" }
  ];

  const activeIndex = STAGES.findIndex(s => s.key === event) + 1;

  const ROTATE_WORDS = [
    "Analyzing your idea...",
    "Extracting requirements...",
    "Identifying core features...",
    "Mapping system architecture...",
    "Evaluating technology tradeoffs...",
    "Designing database structure...",
    "Planning authentication flow...",
    "Generating deployment strategy...",
    "Creating implementation roadmap...",
    "Building instruction.md..."
  ];

  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    if (status === "complete") return;
    const timer = setInterval(() => {
      setWordIndex(i => (i + 1) % ROTATE_WORDS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [status]);

  if (status === "idle" && event === "connecting") return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-background/60 backdrop-blur-md"
    >
      <div className="glass max-w-sm w-full rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-border/50">
         <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-50" />
         
         <div className="relative z-10 flex flex-col gap-8">
           <div className="text-center">
             <h2 className="text-xl font-bold tracking-tight mb-2">
               {status === "error" ? "Connection Interrupted" : status === "complete" ? "Architecture Complete" : "AI Architect Working"}
             </h2>
             <div className="h-6">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={status === "error" ? "error" : status === "complete" ? "complete" : wordIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`text-sm ${status === "error" ? "text-red-400" : status === "complete" ? "text-emerald-400" : "text-primary font-medium"}`}
                  >
                    {status === "error" ? "Attempting to reconnect..." : status === "complete" ? "Transitioning to dashboard..." : elapsed > 10 ? "Still working. Complex architectures may take a little longer." : ROTATE_WORDS[wordIndex]}
                  </motion.p>
                </AnimatePresence>
             </div>
           </div>
           
           <div className="space-y-4">
             {STAGES.map((s, i) => {
               const isDone = i < activeIndex || STAGES.findIndex(x => x.key === event) >= i || event === "done" || status === "complete";
               const isActive = i === activeIndex || (event === STAGES[i-1]?.key);
               return (
                 <div key={s.key} className="flex items-center gap-3">
                    <div className={`size-6 rounded-full flex shrink-0 items-center justify-center border-2 transition-all duration-500 ${isDone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : isActive ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-border text-muted-foreground'}`}>
                       {isDone ? <Check className="size-3" /> : isActive ? <Loader2 className="size-3 animate-spin" /> : <div className="size-1.5 rounded-full bg-current opacity-50" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors duration-500 ${isDone ? 'text-emerald-50' : isActive ? 'text-primary-50' : 'text-muted-foreground'}`}>
                       {s.label}
                    </span>
                 </div>
               )
             })}
           </div>
         </div>
      </div>
    </motion.div>
  )
}
