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

interface StackStarState {
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

export const useStackStar = create<StackStarState>()(
  persist(
    (set) => ({
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
    }),
    { name: "stackstar-session" },
  ),
);
