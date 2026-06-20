import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PhaseKey =
  | "ui_ux"
  | "core_logic"
  | "architecture"
  | "security"
  | "testing"
  | "deployment";

export interface Phase {
  key: PhaseKey;
  label: string;
  status: "pending" | "active" | "complete" | "skipped";
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  phase?: PhaseKey;
  timestamp: number;
  skipped?: boolean;
}

export interface ArchitectureData {
  frontend?: string;
  backend?: string;
  database?: string;
  hosting?: string;
  apis?: string[];
  cost?: { launch?: string; scale?: string };
}

export interface Milestone {
  name: string;
  duration: string;
  dependencies?: string[];
}

export interface Warning {
  title: string;
  severity?: "warn" | "danger";
  description?: string;
}

export interface RefinementMessage {
  role: "ai" | "user";
  text: string;
  patch?: any;
}

// ── Blueprint Slice ────────────────────────────────────────────────────────────
interface BlueprintSlice {
  architecture: ArchitectureData | null;
  milestones: Milestone[] | null;
  phaseSummaries: Record<string, string> | null;
  instructionMd: string | null;
  cost: { launch?: string; scale?: string } | null;
  warnings: Warning[] | null;
  projectName: string | null;
  refinementHistory: RefinementMessage[];
  concurrentUsers: number;
  streamStatus: "idle" | "streaming" | "complete" | "error";
  mode: "quick" | "advanced";
  setArchitecture: (d: ArchitectureData) => void;
  setMilestones: (m: Milestone[]) => void;
  setPhaseSummaries: (s: Record<string, string>) => void;
  setInstructionMd: (md: string) => void;
  setCost: (c: { launch?: string; scale?: string }) => void;
  setWarnings: (w: Warning[]) => void;
  setProjectName: (n: string) => void;
  setRefinementHistory: (h: RefinementMessage[]) => void;
  setConcurrentUsers: (n: number) => void;
  setStreamStatus: (s: BlueprintSlice["streamStatus"]) => void;
  setMode: (m: "quick" | "advanced") => void;
  resetBlueprint: () => void;
}

// ── Session Slice ──────────────────────────────────────────────────────────────
interface SessionSlice {
  sessionId: string | null;
  initialIdea: string;
  phases: Phase[];
  currentPhase: PhaseKey;
  messages: ChatMessage[];
  setSession: (id: string, idea: string) => void;
  setCurrentPhase: (key: PhaseKey) => void;
  markPhase: (key: PhaseKey, status: Phase["status"]) => void;
  addMessage: (m: ChatMessage) => void;
  reset: () => void;
}

export const PHASE_DEFS: Phase[] = [
  { key: "ui_ux", label: "UI / UX", status: "active" },
  { key: "core_logic", label: "Core Logic", status: "pending" },
  { key: "architecture", label: "Architecture", status: "pending" },
  { key: "security", label: "Security", status: "pending" },
  { key: "testing", label: "Testing", status: "pending" },
  { key: "deployment", label: "Deployment", status: "pending" },
];

const BLUEPRINT_DEFAULTS: BlueprintSlice = {
  architecture: null,
  milestones: null,
  phaseSummaries: null,
  instructionMd: null,
  cost: null,
  warnings: null,
  projectName: null,
  refinementHistory: [],
  concurrentUsers: 1000,
  streamStatus: "idle",
  mode: "quick",
  setArchitecture: () => {},
  setMilestones: () => {},
  setPhaseSummaries: () => {},
  setInstructionMd: () => {},
  setCost: () => {},
  setWarnings: () => {},
  setProjectName: () => {},
  setRefinementHistory: () => {},
  setConcurrentUsers: () => {},
  setStreamStatus: () => {},
  setMode: () => {},
  resetBlueprint: () => {},
};

type DevKitState = SessionSlice & BlueprintSlice;

export const useDevKit = create<DevKitState>()(
  persist(
    (set) => ({
      // ── Session ──────────────────────────────────────────────────────────
      sessionId: null,
      initialIdea: "",
      phases: PHASE_DEFS,
      currentPhase: "ui_ux",
      messages: [],

      setSession: (id, idea) =>
        set({
          sessionId: id,
          initialIdea: idea,
          phases: PHASE_DEFS,
          messages: [],
          currentPhase: "ui_ux",
        }),
      setCurrentPhase: (key) => set({ currentPhase: key }),
      markPhase: (key, status) =>
        set((s) => ({
          phases: s.phases.map((p) => (p.key === key ? { ...p, status } : p)),
        })),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      reset: () =>
        set({
          sessionId: null,
          initialIdea: "",
          phases: PHASE_DEFS,
          messages: [],
          currentPhase: "ui_ux",
        }),

      // ── Blueprint ─────────────────────────────────────────────────────────
      architecture: null,
      milestones: null,
      phaseSummaries: null,
      instructionMd: null,
      cost: null,
      warnings: null,
      projectName: null,
      refinementHistory: [],
      concurrentUsers: 1000,
      streamStatus: "idle",
      mode: "quick",

      setArchitecture: (d) => set({ architecture: d }),
      setMilestones: (m) => set({ milestones: m }),
      setPhaseSummaries: (s) => set({ phaseSummaries: s }),
      setInstructionMd: (md) => set({ instructionMd: md }),
      setCost: (c) => set({ cost: c }),
      setWarnings: (w) => set({ warnings: w }),
      setProjectName: (n) => set({ projectName: n }),
      setRefinementHistory: (h) => set({ refinementHistory: h }),
      setConcurrentUsers: (n) => set({ concurrentUsers: n }),
      setStreamStatus: (s) => set({ streamStatus: s }),
      setMode: (m) => set({ mode: m }),
      resetBlueprint: () =>
        set({
          architecture: null,
          milestones: null,
          phaseSummaries: null,
          instructionMd: null,
          cost: null,
          warnings: null,
          projectName: null,
          refinementHistory: [],
          concurrentUsers: 1000,
          streamStatus: "idle",
        }),
    }),
    { name: "devkit-session" },
  ),
);
