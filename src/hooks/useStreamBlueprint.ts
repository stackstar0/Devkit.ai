import { useEffect, useRef } from "react";
import { streamUrl } from "@/lib/api";
import { useDevKit } from "@/lib/store";

/**
 * Opens an SSE connection to /stream/generate/{sessionId} and fans out
 * each event into the appropriate Zustand blueprint slice.
 *
 * Returns { status } so callers can react to stream lifecycle changes.
 */
export function useStreamBlueprint(sessionId: string | null) {
  const {
    setArchitecture,
    setMilestones,
    setPhaseSummaries,
    setInstructionMd,
    setCost,
    setWarnings,
    setProjectName,
    setStreamStatus,
  } = useDevKit();

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === "pending") return;

    setStreamStatus("streaming");
    const es = new EventSource(streamUrl(sessionId));
    esRef.current = es;

    function handleData(raw: string) {
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      const event = parsed?.event;
      const payload = parsed?.payload_json;

      if (event === "architect_complete" && payload) {
        try {
          const arch = typeof payload === "string" ? JSON.parse(payload) : payload;
          setArchitecture(arch);
          if (arch.cost) setCost(arch.cost);
        } catch {}
      }

      if (event === "pm_complete" && payload) {
        try {
          const pm = typeof payload === "string" ? JSON.parse(payload) : payload;
          setMilestones(pm.milestones || []);
        } catch {}
      }

      if (event === "prompt_complete" && payload) {
        try {
          const pr = typeof payload === "string" ? JSON.parse(payload) : payload;
          setInstructionMd(pr.instruction_md || "");
        } catch {}
      }

      if (event === "done" && payload) {
        try {
          const done = typeof payload === "string" ? JSON.parse(payload) : payload;
          if (done.phase_summaries) setPhaseSummaries(done.phase_summaries);
          if (done.warnings) setWarnings(done.warnings);
          if (done.project_name) setProjectName(done.project_name);
          if (done.cost) setCost(done.cost);
          // Ensure all fields populated from the combined payload
          if (done.architecture) setArchitecture(done.architecture);
          if (done.milestones?.milestones) setMilestones(done.milestones.milestones);
          if (done.instruction_md) setInstructionMd(done.instruction_md);
        } catch {}
        setStreamStatus("complete");
        es.close();
      }

      if (event === "saved") {
        setStreamStatus("complete");
        es.close();
      }

      if (event === "error") {
        setStreamStatus("error");
        es.close();
      }
    }

    es.onmessage = (e) => handleData(e.data);

    // Named event listeners for spec-compliant SSE servers
    const namedEvents = [
      "architect_complete",
      "pm_complete",
      "prompt_complete",
      "brief_ready",
      "done",
      "saved",
      "error",
    ];
    namedEvents.forEach((name) => {
      es.addEventListener(name, (e: MessageEvent) => handleData(e.data || `{"event":"${name}"}`));
    });

    es.onerror = () => {
      // EventSource auto-retries — only mark error after repeated failures
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId]);
}
