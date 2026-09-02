import type { AgentWorkOrder, ExportArtifact, ExportPurpose, JobRecord, ProductionProfile, ProjectSnapshot, ProjectSummary, QualityReport, RevisionRecord, VideoGenerationMode } from "@videocut/contracts";

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
  createProject: (name: string, profile: ProductionProfile) => request<ProjectState>("/api/projects", { method: "POST", body: JSON.stringify({ name, profile }) }),
  project: (projectId: string) => request<ProjectState>(`/api/projects/${projectId}`),
  quality: (projectId: string) => request<QualityReport>(`/api/projects/${projectId}/quality`),
  jobs: (projectId: string) => request<JobRecord[]>(`/api/projects/${projectId}/jobs`),
  revisions: (projectId: string) => request<Array<Pick<RevisionRecord, "id" | "number" | "summary" | "createdAt" | "impact">>>(`/api/projects/${projectId}/revisions`),
  agentWorkOrders: (projectId: string) => request<{ revision: number; agentWorkOrders: AgentWorkOrder[] }>(`/api/projects/${projectId}/agent-work-orders`),
  createAgentWorkOrder: (projectId: string, payload: { baseRevision: number; title: string; intent: string; relatedObjectIds: string[] }) => request<{ state: ProjectState; workOrder: AgentWorkOrder }>(`/api/projects/${projectId}/agent-work-orders`, { method: "POST", body: JSON.stringify(payload) }),
  cancelAgentWorkOrder: (projectId: string, workOrderId: string, payload: { baseRevision: number; reason: string }) => request<{ state: ProjectState; workOrder: AgentWorkOrder }>(`/api/projects/${projectId}/agent-work-orders/${workOrderId}/cancel`, { method: "POST", body: JSON.stringify(payload) }),
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
  editCaption: (projectId: string, captionId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/captions/${captionId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  manageAudio: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/audio`, { method: "POST", body: JSON.stringify(payload) }),
  alignPresenterToSpeech: (projectId: string, baseRevision: number) => request<ProjectState>(`/api/projects/${projectId}/timeline/align-presenter-to-speech`, { method: "POST", body: JSON.stringify({ baseRevision }) }),
  updateStory: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/story`, { method: "PATCH", body: JSON.stringify(payload) }),
  applySemanticUnits: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/semantic-units`, { method: "POST", body: JSON.stringify(payload) }),
  assemblePresenterTrack: (projectId: string, baseRevision: number, assetIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/timeline/assemble-presenter`, { method: "POST", body: JSON.stringify({ baseRevision, assetIds }) }),
  buildTimeline: (projectId: string, baseRevision: number, assetIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/timeline/build-presenter`, { method: "POST", body: JSON.stringify({ baseRevision, assetIds, sceneSize: 2 }) }),
  registerActorPerformance: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/actor-performances`, { method: "POST", body: JSON.stringify(payload) }),
  applyScript: (projectId: string, baseRevision: number, semanticUnitIds: string[]) => request<ProjectState>(`/api/projects/${projectId}/script`, { method: "POST", body: JSON.stringify({ baseRevision, semanticUnitIds }) }),
  manageVisualTreatment: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/visual-treatments`, { method: "POST", body: JSON.stringify(payload) }),
  manageCutaway: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/cutaways`, { method: "POST", body: JSON.stringify(payload) }),
  replaceSceneAsset: (projectId: string, cutawayId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/cutaways/${cutawayId}/replace-asset`, { method: "POST", body: JSON.stringify(payload) }),
  createEffect: (projectId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/effects`, { method: "POST", body: JSON.stringify(payload) }),
  updateEffect: (projectId: string, cueId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/effects/${cueId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  moveItem: (projectId: string, itemId: string, payload: Record<string, unknown>) => request<ProjectState>(`/api/projects/${projectId}/items/${itemId}/move`, { method: "POST", body: JSON.stringify(payload) }),
  renderPreflight: (projectId: string, revision?: number) => request<JobRecord>(`/api/projects/${projectId}/render-preflight`, { method: "POST", body: JSON.stringify({ revision }) }),
  export: (projectId: string, revision?: number, purpose: ExportPurpose = "delivery") => request<JobRecord>(`/api/projects/${projectId}/export`, { method: "POST", body: JSON.stringify({ revision, purpose }) }),
  exportArtifacts: (projectId: string) => request<ExportArtifact[]>(`/api/projects/${projectId}/export-artifacts`),
  approveExportArtifact: (projectId: string, artifactId: string, note?: string) => request<ExportArtifact>(`/api/projects/${projectId}/export-artifacts/${artifactId}/approve`, { method: "POST", body: JSON.stringify({ note }) }),
  preview: (projectId: string, payload: Record<string, unknown>) => request<JobRecord>(`/api/projects/${projectId}/previews`, { method: "POST", body: JSON.stringify(payload) }),
  /** 高级面板只提交可测量的 Vlog 镜头分析，不在 Web 端伪造事件或剪辑语义。 */
  submitVlogAnalysis: (projectId: string, payload: { baseRevision: number; assetIds: string[]; sceneThreshold?: number }) => request<JobRecord>(`/api/projects/${projectId}/vlog-analysis`, { method: "POST", body: JSON.stringify(payload) }),
  /** 自动同步只会生成 candidate；是否 verified 仍须由连续预览证据通过 MCP 回写。 */
  submitMulticamSync: (projectId: string, payload: {
    baseRevision: number;
    title?: string;
    assetIds: string[];
    angleLabels: Record<string, string>;
    referenceAssetId: string;
    masterAudioAssetId: string;
    sourceRanges: Record<string, { startFrame: number; endFrame: number }>;
  }) => request<JobRecord>(`/api/projects/${projectId}/multicam/sync`, { method: "POST", body: JSON.stringify(payload) }),
  /** 只能在受管并排 Preview 已生成后写入人工连续核对结论；服务端会再次校验 Preview 的哈希和范围。 */
  verifyMulticamGroup: (projectId: string, payload: { baseRevision: number; groupId: string; previewEvidence: string }) => request<unknown>(`/api/projects/${projectId}/multicam/verify`, { method: "POST", body: JSON.stringify(payload) }),
  /** workflowId 必须来自本次实时 Bridge Schema；Web 不保存 Provider 私有字段。 */
  submitVideoGeneration: (projectId: string, payload: {
    baseRevision: number;
    workflowId: string;
    mode: VideoGenerationMode;
    inputAssetIds: string[];
    prompt: string;
    durationSeconds: number;
  }) => request<JobRecord>(`/api/projects/${projectId}/video-generation`, { method: "POST", body: JSON.stringify(payload) }),
  submitMusicGeneration: (projectId: string, payload: { baseRevision: number; workflowId: string; prompt: string; durationSeconds: number }) => request<JobRecord>(`/api/projects/${projectId}/music-generation`, { method: "POST", body: JSON.stringify(payload) }),
  submitSpeechAlignment: (projectId: string, payload: { baseRevision: number; workflowId: string; speechAssetId?: string }) => request<JobRecord>(`/api/projects/${projectId}/speech-alignment`, { method: "POST", body: JSON.stringify(payload) }),
  rollback: (projectId: string, revision: number, baseRevision: number) => request<ProjectState>(`/api/projects/${projectId}/revisions/${revision}/rollback`, { method: "POST", body: JSON.stringify({ baseRevision }) }),
  retryJob: (jobId: string) => request<JobRecord>(`/api/jobs/${jobId}/retry`, { method: "POST" })
};
