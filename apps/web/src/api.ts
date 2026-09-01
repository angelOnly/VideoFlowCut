import type { JobRecord, ProjectSnapshot, ProjectSummary, QualityReport, RevisionRecord } from "@videocut/contracts";

export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3100";

export interface ProjectState {
  revision: RevisionRecord;
  snapshot: ProjectSnapshot;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }), ...(init?.headers ?? {}) }
  });
  const payload = await response.json().catch(() => undefined) as { message?: string } | T | undefined;
  if (!response.ok) throw new Error(typeof payload === "object" && payload && "message" in payload ? String(payload.message) : `请求失败：${response.status}`);
  return payload as T;
}

export const api = {
  listProjects: () => request<ProjectSummary[]>("/api/projects"),
  createProject: (name: string) => request<ProjectState>("/api/projects", { method: "POST", body: JSON.stringify({ name, profile: "presenter_motion" }) }),
  project: (projectId: string) => request<ProjectState>(`/api/projects/${projectId}`),
  quality: (projectId: string) => request<QualityReport>(`/api/projects/${projectId}/quality`),
  jobs: (projectId: string) => request<JobRecord[]>(`/api/projects/${projectId}/jobs`),
  revisions: (projectId: string) => request<Array<Pick<RevisionRecord, "id" | "number" | "summary" | "createdAt" | "impact">>>(`/api/projects/${projectId}/revisions`),
  importPath: (projectId: string, baseRevision: number, filePath: string) => request(`/api/projects/${projectId}/assets/import-path`, { method: "POST", body: JSON.stringify({ baseRevision, filePath }) }),
  upload: (projectId: string, baseRevision: number, files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("media", file));
    return request(`/api/projects/${projectId}/assets/upload?baseRevision=${baseRevision}`, { method: "POST", body });
  },
  transcribe: (projectId: string, assetId: string) => request<JobRecord>(`/api/projects/${projectId}/transcription`, { method: "POST", body: JSON.stringify({ assetId }) }),
  registerVoiceReference: (projectId: string, baseRevision: number, assetId: string, label?: string) => request<ProjectState>(`/api/projects/${projectId}/voice-references`, { method: "POST", body: JSON.stringify({ baseRevision, assetId, label }) }),
  voiceSynthesis: (projectId: string, voiceReferenceId: string) => request<JobRecord>(`/api/projects/${projectId}/voice-synthesis`, { method: "POST", body: JSON.stringify({ voiceReferenceId }) }),
  rebuildSpeechTimeline: (projectId: string, baseRevision: number) => request<ProjectState>(`/api/projects/${projectId}/speech-asset/rebuild-timeline`, { method: "POST", body: JSON.stringify({ baseRevision }) }),
  alignPresenterToSpeech: (projectId: string, baseRevision: number) => request<ProjectState>(`/api/projects/${projectId}/timeline/align-presenter-to-speech`, { method: "POST", body: JSON.stringify({ baseRevision }) }),
  updateStory: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/story`, { method: "PATCH", body: JSON.stringify(payload) }),
  applySemanticUnits: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/semantic-units`, { method: "POST", body: JSON.stringify(payload) }),
  assemblePresenterTrack: (projectId: string, baseRevision: number, assetIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/timeline/assemble-presenter`, { method: "POST", body: JSON.stringify({ baseRevision, assetIds }) }),
  buildTimeline: (projectId: string, baseRevision: number, assetIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/timeline/build-presenter`, { method: "POST", body: JSON.stringify({ baseRevision, assetIds, sceneSize: 2 }) }),
  registerActorPerformance: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/actor-performances`, { method: "POST", body: JSON.stringify(payload) }),
  applyScript: (projectId: string, baseRevision: number, semanticUnitIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/script`, { method: "POST", body: JSON.stringify({ baseRevision, semanticUnitIds }) }),
  createEffect: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/effects`, { method: "POST", body: JSON.stringify(payload) }),
  updateEffect: (projectId: string, cueId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/effects/${cueId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  moveItem: (projectId: string, itemId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/items/${itemId}/move`, { method: "POST", body: JSON.stringify(payload) }),
  export: (projectId: string, revision?: number) => request<JobRecord>(`/api/projects/${projectId}/export`, { method: "POST", body: JSON.stringify({ revision }) }),
  preview: (projectId: string, payload: Record<string, unknown>) => request<JobRecord>(`/api/projects/${projectId}/previews`, { method: "POST", body: JSON.stringify(payload) }),
  rollback: (projectId: string, revision: number, baseRevision: number) => request<ProjectState>(`/api/projects/${projectId}/revisions/${revision}/rollback`, { method: "POST", body: JSON.stringify({ baseRevision }) }),
  retryJob: (jobId: string) => request<JobRecord>(`/api/jobs/${jobId}/retry`, { method: "POST" })
};
