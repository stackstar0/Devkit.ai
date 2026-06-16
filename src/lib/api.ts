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

export async function startSession(initial_input: string) {
  const { data } = await api.post<StartSessionResponse>("/session/start", {
    initial_input,
  });
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

export function wsUrl(session_id: string) {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/ws/session/${session_id}`;
}

export function streamUrl(session_id: string) {
  return `${API_BASE}/stream/generate/${session_id}`;
}
