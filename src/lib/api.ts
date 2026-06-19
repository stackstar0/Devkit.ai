import axios from "axios";

export const API_BASE =
  (typeof window !== "undefined" && (window as any).__DEVKIT_API__) ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export interface StartSessionResponse {
  session_id: string;
}

/** Quick Mode: single-shot full blueprint inference — skips conversation */
export async function predictSession(initial_input: string): Promise<StartSessionResponse> {
  const { data } = await api.post<StartSessionResponse>("/session/predict", { initial_input });
  return data;
}

/** Advanced Mode: triage → conversation Q&A */
export async function startSession(initial_input: string): Promise<StartSessionResponse> {
  const { data } = await api.post<StartSessionResponse>("/session/start", { initial_input });
  return data;
}

export async function getSession(session_id: string) {
  const { data } = await api.get(`/session/${session_id}`);
  return data;
}

export async function getResults(session_id: string) {
  const { data } = await api.get(`/session/${session_id}/results`);
  return data;
}

/** Natural-language blueprint refinement */
export async function refineBlueprint(session_id: string, message: string) {
  const { data } = await api.post(`/session/${session_id}/refine`, { message });
  return data;
}

/** Download a ZIP of the generated project boilerplate */
export async function downloadBoilerplate(session_id: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/boilerplate/${session_id}`, { method: "POST" });
  if (!res.ok) throw new Error(`Boilerplate export failed: ${res.status}`);
  return res.blob();
}

export function wsUrl(session_id: string) {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/ws/session/${session_id}`;
}

export function streamUrl(session_id: string) {
  return `${API_BASE}/stream/generate/${session_id}`;
}
