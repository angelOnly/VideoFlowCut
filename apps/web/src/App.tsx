import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { EFFECT_TYPES, type Asset, type CaptionCard, type EffectCue, type ProjectSnapshot, type Scene, type TimelineItem } from "@videocut/contracts";
import { ProjectComposition, mediaUrl } from "@videocut/remotion";
import { API_BASE, api, type ProjectState } from "./api";

type Panel = "assets" | "script" | "audio" | "actors" | "scenes" | "captions" | "jobs";
type Selection = { kind: "asset" | "scene" | "item" | "cue"; id: string } | undefined;
type EditorFocusQuery = { sceneId?: string; itemId?: string; effectCueId?: string; frame?: number };

const panelMeta: Array<{ id: Panel; label: string; icon: string }> = [
  { id: "assets", label: "素材", icon: "▦" },
  { id: "script", label: "文字稿", icon: "¶" },
  { id: "audio", label: "声音", icon: "♬" },
  { id: "actors", label: "人物", icon: "◉" },
  { id: "scenes", label: "场景", icon: "◇" },
  { id: "captions", label: "字幕", icon: "CC" },
  { id: "jobs", label: "任务 / QC", icon: "✓" }
];

const effectTrackNameByLayer: Record<EffectCue["layer"], string> = {
  rear: "Rear FX",
  actor: "Actor FX",
  front: "Front FX",
  fullscreen: "Cutaway / Fullscreen"
};

// 每种效果使用固定图层，避免 Web 端再次维护一套效果布局规则。
const effectLayerByType: Record<EffectCue["type"], EffectCue["layer"]> = {
  MetricBackdrop: "rear",
  ProductFan: "front",
  GlowCTA: "front",
  PortfolioWall: "front",
  CommentCloud: "front",
  EvidenceCard: "front",
  CameraPunch: "actor",
  FullScreenMeme: "fullscreen",
  DeviceShowcase: "front",
  ContentCarousel: "front",
  EndCard: "fullscreen"
};

const formatDuration = (frames: number, fps: number) => `${(frames / fps).toFixed(1)} 秒`;
const formatTimecode = (frame: number, fps: number) => {
  const seconds = Math.floor(frame / fps);
  const frames = frame % fps;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
};
const statusText = (status: string) => ({ queued: "排队中", analyzing: "分析中", ready: "已就绪", failed: "失败", running: "运行中", succeeded: "完成", cancelled: "已取消", unknown: "未知", missing: "缺失", pending: "待生成", stale: "需复核" }[status] ?? status);
const assetIcon = (asset: Asset) => asset.kind === "video" || asset.kind === "actor_video" ? "▶" : asset.kind === "audio" || asset.kind === "speech" ? "♬" : "▧";

function readEditorFocus(): EditorFocusQuery {
  const params = new URLSearchParams(window.location.search);
  const frameValue = params.get("frame");
  const frame = frameValue === null ? undefined : Number(frameValue);
  return {
    sceneId: params.get("sceneId") ?? undefined,
    itemId: params.get("itemId") ?? undefined,
    effectCueId: params.get("effectCueId") ?? undefined,
    frame: typeof frame === "number" && Number.isInteger(frame) && frame >= 0 ? frame : undefined
  };
}

function useProjectId(): [string | undefined, (projectId: string | undefined) => void] {
  const initial = new URLSearchParams(window.location.search).get("projectId") ?? undefined;
  const [projectId, setProjectId] = useState<string | undefined>(initial);
  const update = useCallback((next: string | undefined) => {
    setProjectId(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("projectId", next);
    else url.searchParams.delete("projectId");
    window.history.replaceState({}, "", url);
  }, []);
  return [projectId, update];
}

export function App() {
  const [projectId, setProjectId] = useProjectId();
  const [state, setState] = useState<ProjectState>();
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [panel, setPanel] = useState<Panel>("assets");
  const [selection, setSelection] = useState<Selection>();
  const [playhead, setPlayhead] = useState(0);
  const [quality, setQuality] = useState<Awaited<ReturnType<typeof api.quality>>>();
  const [jobs, setJobs] = useState<Awaited<ReturnType<typeof api.jobs>>>([]);
  const [revisions, setRevisions] = useState<Awaited<ReturnType<typeof api.revisions>>>([]);
  const [newProjectName, setNewProjectName] = useState("数字人口播项目");
  const [localPath, setLocalPath] = useState("");
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [selectedARollIds, setSelectedARollIds] = useState<string[]>([]);
  const [message, setMessage] = useState("准备就绪");
  const [busy, setBusy] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const initialFocus = useRef<EditorFocusQuery>(readEditorFocus());
  const initialFocusApplied = useRef(false);
  const hasPendingWork = Boolean(
    state?.snapshot.assets.some((asset) => asset.status === "queued" || asset.status === "analyzing")
    || jobs.some((job) => job.status === "queued" || job.status === "running")
  );

  const load = useCallback(async (id: string) => {
    const [nextState, nextQuality, nextJobs, nextRevisions] = await Promise.all([api.project(id), api.quality(id), api.jobs(id), api.revisions(id)]);
    setState(nextState);
    setQuality(nextQuality);
    setJobs(nextJobs);
    setRevisions(nextRevisions);
    setProjects((previous) => previous.some((project) => project.id === id) ? previous : [...previous, { id, name: nextState.snapshot.project.name }]);
  }, []);

  const refreshProjects = useCallback(async () => {
    const nextProjects = await api.listProjects();
    setProjects(nextProjects.map((project) => ({ id: project.id, name: project.name })));
    if (!projectId && nextProjects[0]) setProjectId(nextProjects[0].id);
  }, [projectId, setProjectId]);

  useEffect(() => { void refreshProjects().catch((error) => setMessage(error.message)); }, [refreshProjects]);
  useEffect(() => { if (projectId) void load(projectId).catch((error) => setMessage(error.message)); }, [projectId, load]);

  useEffect(() => {
    if (!projectId) return;
    const source = new EventSource(`${API_BASE}/api/events?projectId=${encodeURIComponent(projectId)}`);
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(projectId).catch((error) => setMessage(error.message)), 180);
    };
    source.addEventListener("revision", refresh);
    source.addEventListener("job", refresh);
    source.onerror = () => source.close();
    return () => { window.clearTimeout(timer); source.close(); };
  }, [projectId, load]);

  /**
   * Server 与 Worker 可独立运行，Worker 的内存事件无法跨进程推给当前 Web Server。
   * 仅在存在未完成任务时轮询读回，任务结束后自动停止，保证素材和导出状态不会卡在旧快照。
   */
  useEffect(() => {
    if (!projectId || !hasPendingWork) return;
    const timer = window.setInterval(() => void load(projectId).catch((error) => setMessage(error.message)), 1_500);
    return () => window.clearInterval(timer);
  }, [projectId, hasPendingWork, load]);

  useEffect(() => {
    if (!state) return;
    setSelectedUnitIds(state.snapshot.semanticUnits.filter((unit) => unit.status === "included").map((unit) => unit.id));
    const readyVideoIds = new Set(state.snapshot.assets
      .filter((asset) => (asset.kind === "video" || asset.kind === "actor_video") && asset.status === "ready")
      .map((asset) => asset.id));
    setSelectedARollIds((current) => current.filter((assetId) => readyVideoIds.has(assetId)));
  }, [state?.revision.id]);

  /**
   * MCP 返回的 editor-url 只在首次打开时应用，避免实时刷新 Revision 时抢走用户正在调整的选中项。
   */
  useEffect(() => {
    if (!state || initialFocusApplied.current) return;
    const focus = initialFocus.current;
    const snapshot = state.snapshot;
    let nextSelection: Selection;
    let targetFrame = focus.frame;
    if (focus.effectCueId) {
      const cue = snapshot.effectCues.find((candidate) => candidate.id === focus.effectCueId);
      if (cue) {
        nextSelection = { kind: "cue", id: cue.id };
        targetFrame ??= cue.startFrame;
        setPanel("scenes");
      }
    } else if (focus.itemId) {
      const item = snapshot.timeline.items.find((candidate) => candidate.id === focus.itemId);
      if (item) {
        nextSelection = { kind: "item", id: item.id };
        targetFrame ??= item.startFrame;
        setPanel("scenes");
      }
    } else if (focus.sceneId) {
      const scene = snapshot.scenes.find((candidate) => candidate.id === focus.sceneId);
      if (scene) {
        nextSelection = { kind: "scene", id: scene.id };
        targetFrame ??= scene.startFrame;
        setPanel("scenes");
      }
    }
    if (nextSelection) setSelection(nextSelection);
    initialFocusApplied.current = true;
    if (targetFrame === undefined) return;
    const safeFrame = Math.max(0, Math.min(targetFrame, Math.max(0, snapshot.timeline.durationInFrames - 1)));
    const timer = window.setTimeout(() => {
      playerRef.current?.seekTo(safeFrame);
      setPlayhead(safeFrame);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state?.revision.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (event: { detail: { frame: number } }) => setPlayhead(event.detail.frame);
    player.addEventListener("frameupdate", onFrame);
    return () => player.removeEventListener("frameupdate", onFrame);
  }, [state?.revision.id]);

  const act = async (label: string, operation: () => Promise<unknown>) => {
    try {
      setBusy(true);
      setMessage(`${label}…`);
      await operation();
      if (projectId) await load(projectId);
      await refreshProjects();
      setMessage(`${label}完成`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const seekTo = (frame: number) => {
    const safeFrame = Math.max(0, Math.min(frame, Math.max(0, (state?.snapshot.timeline.durationInFrames ?? 1) - 1)));
    playerRef.current?.seekTo(safeFrame);
    setPlayhead(safeFrame);
  };

  const snapshot = state?.snapshot;
  const currentRevision = state?.revision.number ?? 0;
  const selectedAsset = selection?.kind === "asset" ? snapshot?.assets.find((asset) => asset.id === selection.id) : undefined;
  const selectedScene = selection?.kind === "scene" ? snapshot?.scenes.find((scene) => scene.id === selection.id) : undefined;
  const selectedItem = selection?.kind === "item" ? snapshot?.timeline.items.find((item) => item.id === selection.id) : undefined;
  const selectedCue = selection?.kind === "cue" ? snapshot?.effectCues.find((cue) => cue.id === selection.id) : undefined;
  const activeScene = useMemo(() => snapshot?.scenes.find((scene) => scene.startFrame <= playhead && playhead < scene.endFrame), [snapshot, playhead]);

  const createProject = async () => {
    try {
      setBusy(true);
      setMessage("创建项目…");
      const created = await api.createProject(newProjectName.trim() || "未命名项目");
      const createdProjectId = created.snapshot.project.id;
      setProjectId(createdProjectId);
      // 新建后直接读回新项目，避免顶部入口仍短暂显示旧项目状态。
      await load(createdProjectId);
      await refreshProjects();
      setMessage("创建项目完成");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  if (!snapshot) {
    return (
      <main className="empty-state">
        <div className="empty-mark">▶</div>
        <h1>VideoCut 工作台</h1>
        <p>创建项目后，导入视频并建立可继续编辑的时间线。</p>
        <div className="create-project-row">
          <input aria-label="项目名称" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void createProject()} />
          <button className="primary" onClick={() => void createProject()} disabled={busy}>创建项目</button>
        </div>
        {message !== "准备就绪" && <p className="message">{message}</p>}
      </main>
    );
  }

  const videoAssets = snapshot.assets.filter((asset) => (asset.kind === "video" || asset.kind === "actor_video") && asset.status === "ready");
  const selectedForTimeline = selectedARollIds.filter((assetId) => videoAssets.some((asset) => asset.id === assetId));
  const blockingIssues = quality?.issues.filter((issue) => issue.level === "blocking") ?? [];
  const deliveryReviewReady = quality?.editorial.status === "reviewed"
    && quality.editorial.previewEvidence.length > 0
    && quality.editorial.passes.includes("audiovisual")
    && quality.editorial.passes.includes("first_viewer");

  return (
    <main className="workbench" data-testid="workbench" data-project-id={snapshot.project.id} data-revision={currentRevision}>
      <header className="topbar">
        <div className="brand"><span className="brand-dot" />VideoCut <span className="brand-sub">创作工作台</span></div>
        <select aria-label="选择项目" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <input className="new-project-input" aria-label="新建项目名称" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void createProject()} />
        <button data-testid="create-project-button" onClick={() => void createProject()} disabled={busy}>新建</button>
        <strong data-testid="project-name" data-object-id={snapshot.project.id} className="project-name">{snapshot.project.name}</strong>
        <span className="save-state">● 已保存</span>
        <div className="top-spacer" />
        <span className="revision-badge" data-testid="revision">R{currentRevision}</span>
        <span className="canvas-summary">{snapshot.timeline.width}×{snapshot.timeline.height} · {snapshot.timeline.fps} fps · {formatDuration(snapshot.timeline.durationInFrames, snapshot.timeline.fps)}</span>
        <button onClick={() => playerRef.current?.toggle()} disabled={!snapshot.timeline.durationInFrames}>播放</button>
        <button onClick={() => void act("提交局部预览", () => api.preview(snapshot.project.id, {
          revision: currentRevision,
          fromFrame: Math.max(0, playhead - snapshot.timeline.fps * 2),
          toFrame: Math.min(snapshot.timeline.durationInFrames, Math.max(playhead + snapshot.timeline.fps * 3, snapshot.timeline.fps))
        }))} disabled={busy || !snapshot.timeline.durationInFrames}>局部预览</button>
        <button onClick={() => void act("提交草稿导出", () => api.export(snapshot.project.id, currentRevision, "draft"))} disabled={busy || blockingIssues.length > 0}>草稿导出</button>
        <button className="primary" data-testid="export-button" onClick={() => void act("提交交付导出", () => api.export(snapshot.project.id, currentRevision, "delivery"))} disabled={busy || blockingIssues.length > 0 || !deliveryReviewReady} title={deliveryReviewReady ? "" : "交付导出需要当前 Revision 的真实预览、完整声画审片和首次观众复核"}>交付导出</button>
      </header>

      <section className="editor-grid">
        <nav className="toolrail" aria-label="工作区">
          {panelMeta.map((entry) => <button key={entry.id} className={panel === entry.id ? "tool active" : "tool"} onClick={() => setPanel(entry.id)} title={entry.label} data-testid={`panel-${entry.id}`}><span>{entry.icon}</span><small>{entry.label}</small></button>)}
        </nav>

        <aside className="content-panel">
          <PanelContent
            panel={panel}
            snapshot={snapshot}
            currentRevision={currentRevision}
            quality={quality}
            jobs={jobs}
            revisions={revisions}
            selectedUnitIds={selectedUnitIds}
            localPath={localPath}
            setLocalPath={setLocalPath}
            onSelect={(next) => setSelection(next)}
            onSeek={seekTo}
            onImportPath={() => void act("导入本地素材", () => api.importPath(snapshot.project.id, currentRevision, localPath))}
            onUpload={(files) => void act("上传素材", () => api.upload(snapshot.project.id, currentRevision, files))}
            onTranscribe={(assetId) => void act("提交转写", () => api.transcribe(snapshot.project.id, assetId))}
            onRegisterVoiceReference={(assetId) => void act("登记 VoiceReference", () => api.registerVoiceReference(snapshot.project.id, currentRevision, assetId))}
            onSubmitVoiceSynthesis={(voiceReferenceId) => void act("提交 OmniVoice 旁白", () => api.voiceSynthesis(snapshot.project.id, voiceReferenceId))}
            onRebuildSpeechTimeline={() => void act("修复 SpeechAsset 时间线", () => api.rebuildSpeechTimeline(snapshot.project.id, currentRevision))}
            onEditCaption={(captionId, payload) => void act("更新字幕卡", () => api.editCaption(snapshot.project.id, captionId, { baseRevision: currentRevision, ...payload }))}
            onAlignPresenterToSpeech={() => void act("按旁白收齐 Presenter 主线", () => api.alignPresenterToSpeech(snapshot.project.id, currentRevision))}
            busy={busy}
            selectedARollIds={selectedForTimeline}
            onToggleARoll={(assetId) => setSelectedARollIds((old) => old.includes(assetId) ? old.filter((id) => id !== assetId) : [...old, assetId])}
            onBuildTimeline={() => void act("组装所选 Presenter A-roll", () => api.assemblePresenterTrack(snapshot.project.id, currentRevision, selectedForTimeline))}
            onToggleUnit={(unitId) => setSelectedUnitIds((old) => old.includes(unitId) ? old.filter((id) => id !== unitId) : [...old, unitId])}
            onApplyScript={() => void act("应用 Script", () => api.applyScript(snapshot.project.id, currentRevision, selectedUnitIds))}
            onRegisterActor={(timelineItemId, maskAssetId) => void act("登记人物表演", () => api.registerActorPerformance(snapshot.project.id, {
              baseRevision: currentRevision,
              timelineItemId,
              source: "imported",
              maskMode: maskAssetId ? "alpha_asset" : "none",
              audioMode: snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio",
              maskAssetId,
              note: "从工作台导入的人物主画面"
            }))}
            onAddEffect={(scene, type) => void act("添加效果", () => api.createEffect(snapshot.project.id, { baseRevision: currentRevision, sceneId: scene.id, type, layer: effectLayerByType[type], startFrame: scene.startFrame, endFrame: Math.min(scene.endFrame, scene.startFrame + Math.max(48, snapshot.timeline.fps * 3)), note: `${type}：由工作台添加` }))}
            onRetryJob={(jobId) => void act("重试任务", () => api.retryJob(jobId))}
            onRollback={(revision) => void act("回退 Revision", () => api.rollback(snapshot.project.id, revision, currentRevision))}
          />
        </aside>

        <section className="preview-panel">
          <div className="preview-toolbar">
            <span>真实合成预览</span>
            <span className="preview-status">{activeScene?.title ?? "未定位场景"}</span>
            <span>{formatTimecode(playhead, snapshot.timeline.fps)} · F{playhead}</span>
          </div>
          <div className="preview-stage" data-testid="preview-stage">
            <Player
              ref={playerRef}
              component={ProjectComposition}
              inputProps={{ snapshot, mediaBaseUrl: API_BASE }}
              durationInFrames={Math.max(1, snapshot.timeline.durationInFrames)}
              compositionWidth={snapshot.timeline.width}
              compositionHeight={snapshot.timeline.height}
              fps={snapshot.timeline.fps}
              controls
              clickToPlay
              acknowledgeRemotionLicense
              style={{ width: "100%", height: "100%" }}
            />
            <div className="safe-area safe-area-title">标题安全区</div>
            <div className="safe-area safe-area-caption">字幕安全区</div>
          </div>
          <div className="preview-controls">
            <button onClick={() => seekTo(Math.max(0, playhead - 1))}>‹ 帧</button>
            <button onClick={() => playerRef.current?.toggle()}>{playerRef.current?.isPlaying() ? "暂停" : "播放"}</button>
            <button onClick={() => seekTo(Math.min(snapshot.timeline.durationInFrames - 1, playhead + 1))}>帧 ›</button>
            <button onClick={() => activeScene && seekTo(activeScene.startFrame)}>场景起点</button>
            <span className="message" aria-live="polite">{message}</span>
          </div>
        </section>

        <aside className="inspector" data-testid="inspector" data-selected-kind={selection?.kind ?? "none"} data-selected-id={selection?.id ?? ""}>
          <Inspector
            snapshot={snapshot}
            selection={selection}
            selectedAsset={selectedAsset}
            selectedScene={selectedScene}
            selectedItem={selectedItem}
            selectedCue={selectedCue}
            currentRevision={currentRevision}
            onMoveItem={(item, startFrame) => void act("移动片段", () => api.moveItem(snapshot.project.id, item.id, { baseRevision: currentRevision, startFrame, ripple: false }))}
            onUpdateCue={(cue, intensity) => void act("调整效果", () => api.updateEffect(snapshot.project.id, cue.id, { baseRevision: currentRevision, intensity }))}
            onSeek={seekTo}
          />
        </aside>

        <section className="timeline-area">
          <SceneStrip scenes={snapshot.scenes} duration={snapshot.timeline.durationInFrames} playhead={playhead} onSelect={(scene) => { setSelection({ kind: "scene", id: scene.id }); seekTo(scene.startFrame); }} />
          <Timeline snapshot={snapshot} selection={selection} playhead={playhead} onSelect={(selectionValue, frame) => { setSelection(selectionValue); seekTo(frame); }} onSeek={seekTo} />
        </section>
      </section>
    </main>
  );
}

interface PanelContentProps {
  panel: Panel;
  snapshot: ProjectSnapshot;
  currentRevision: number;
  quality: Awaited<ReturnType<typeof api.quality>> | undefined;
  jobs: Awaited<ReturnType<typeof api.jobs>>;
  revisions: Awaited<ReturnType<typeof api.revisions>>;
  selectedUnitIds: string[];
  localPath: string;
  setLocalPath: (value: string) => void;
  onSelect: (selection: Selection) => void;
  onSeek: (frame: number) => void;
  onImportPath: () => void;
  onUpload: (files: File[]) => void;
  onTranscribe: (assetId: string) => void;
  onRegisterVoiceReference: (assetId: string) => void;
  onSubmitVoiceSynthesis: (voiceReferenceId: string) => void;
  onRebuildSpeechTimeline: () => void;
  onEditCaption: (captionId: string, payload: Record<string, unknown>) => void;
  onAlignPresenterToSpeech: () => void;
  busy: boolean;
  selectedARollIds: string[];
  onToggleARoll: (assetId: string) => void;
  onBuildTimeline: () => void;
  onToggleUnit: (unitId: string) => void;
  onApplyScript: () => void;
  onRegisterActor: (timelineItemId: string, maskAssetId?: string) => void;
  onAddEffect: (scene: Scene, type: EffectCue["type"]) => void;
  onRetryJob: (jobId: string) => void;
  onRollback: (revision: number) => void;
}

function PanelContent(props: PanelContentProps) {
  const { panel, snapshot } = props;
  if (panel === "assets") {
    return <>
      <PanelTitle title="素材库" meta={`${snapshot.assets.length} 个素材`} />
      <label className="upload-button">上传媒体<input aria-label="上传媒体" type="file" accept="video/*,audio/*,image/*" multiple hidden onChange={(event) => event.target.files && props.onUpload([...event.target.files])} /></label>
      <div className="path-import"><input aria-label="本地素材路径" placeholder="本地素材绝对路径" value={props.localPath} onChange={(event) => props.setLocalPath(event.target.value)} /><button onClick={props.onImportPath} disabled={!props.localPath.trim()}>导入</button></div>
      <p className="empty-panel">先明确选择 A-roll，再由导演 Skill 通过 Story Beat 编译 Scene；不会默认把所有视频当人物主画面。</p>
      <button className="wide-button" onClick={props.onBuildTimeline} disabled={props.selectedARollIds.length === 0}>组装 {props.selectedARollIds.length} 条所选 A-roll</button>
      <div className="asset-list">{snapshot.assets.map((asset) => <article key={asset.id} className="asset-card" data-testid={`asset-${asset.id}`} data-object-id={asset.id} aria-label={`素材：${asset.name}`} onClick={() => props.onSelect({ kind: "asset", id: asset.id })}>
        {asset.metadata?.thumbnailPath ? <img src={mediaUrl(snapshot, API_BASE, asset.metadata.thumbnailPath)} alt="素材缩略图" /> : <div className="asset-placeholder">{assetIcon(asset)}</div>}
        <div className="asset-copy"><strong>{asset.name}</strong><small>{asset.metadata?.durationMs ? `${(asset.metadata.durationMs / 1000).toFixed(1)} 秒` : "等待媒体分析"}</small><span className={`status status-${asset.status}`}>{statusText(asset.status)}</span></div>
        {(asset.kind === "video" || asset.kind === "actor_video") && asset.status === "ready" && <button className="compact" onClick={(event) => { event.stopPropagation(); props.onToggleARoll(asset.id); }}>{props.selectedARollIds.includes(asset.id) ? "取消 A-roll" : "选为 A-roll"}</button>}
        {(asset.kind === "video" || asset.kind === "actor_video") && asset.status === "ready" && asset.metadata?.hasAudio && <button className="compact" onClick={(event) => { event.stopPropagation(); props.onTranscribe(asset.id); }}>转写</button>}
      </article>)}</div>
    </>;
  }
  if (panel === "script") {
    return <>
      <PanelTitle title="文字稿 / Script" meta={`Script R${snapshot.script.revision}`} />
      {snapshot.transcripts.length === 0 && <p className="empty-panel">选择有声素材后提交 FunASR 转写。当前 API 只提供全文，不能凭字数伪造词级时间。</p>}
      <div className="script-list">{snapshot.semanticUnits.sort((a, b) => a.order - b.order).map((unit) => <label className={props.selectedUnitIds.includes(unit.id) ? "semantic-unit selected" : "semantic-unit"} key={unit.id} data-testid={`semantic-${unit.id}`} data-object-id={unit.id}><input aria-label={`选择语义单元：${unit.text}`} type="checkbox" checked={props.selectedUnitIds.includes(unit.id)} onChange={() => props.onToggleUnit(unit.id)} /><span>{unit.text}</span></label>)}</div>
      {snapshot.semanticUnits.length > 0 && <button className="primary wide-button" onClick={props.onApplyScript}>应用语义选择 · 生成 SpeechSegment</button>}
      <PanelTitle title="SpeechSegment" meta={`${snapshot.speechSegments.length} 段`} />
      {snapshot.speechSegments.map((segment) => <div className="speech-row" key={segment.id} data-testid={`speech-segment-${segment.id}`} data-object-id={segment.id}><span>{segment.text}</span><small>{statusText(segment.status)}</small></div>)}
      <PanelTitle title="VoiceReference" meta={`${snapshot.voiceReferences.length} 条本地参考`} />
      {snapshot.voiceReferences.map((reference) => {
        const asset = snapshot.assets.find((candidate) => candidate.id === reference.assetId);
        return <div className="speech-row" key={reference.id} data-testid={`voice-reference-${reference.id}`} data-object-id={reference.id}><span>{reference.label}</span><small>{asset?.name ?? "素材缺失"}</small></div>;
      })}
      {snapshot.assets.filter((asset) => asset.kind === "audio" && asset.status === "ready" && !snapshot.voiceReferences.some((reference) => reference.assetId === asset.id)).map((asset) => <button className="wide-button" key={asset.id} onClick={() => props.onRegisterVoiceReference(asset.id)}>将「{asset.name}」登记为 VoiceReference</button>)}
    </>;
  }
  if (panel === "audio") {
    const speechFile = snapshot.speechAsset ? snapshot.assets.find((asset) => asset.id === snapshot.speechAsset?.assetId) : undefined;
    const pendingSegments = snapshot.speechSegments.filter((segment) => segment.status !== "ready");
    const needsAssembly = Boolean(!snapshot.speechAsset && snapshot.speechSegments.length > 0 && pendingSegments.length === 0);
    const dialogueTrack = snapshot.timeline.tracks.find((track) => track.name === "Dialogue");
    const hasSpeechOnDialogue = Boolean(snapshot.speechAsset && snapshot.timeline.items.some((item) => item.trackId === dialogueTrack?.id && item.assetId === snapshot.speechAsset?.assetId && !item.disabled));
    return <>
      <PanelTitle title="Audio / Voice" meta={`${snapshot.voiceReferences.length} 条参考声音`} />
      {snapshot.voiceReferences.length === 0 && <p className="empty-panel">先在文字稿面板登记一个已就绪的本地音频。VoiceReference 仅保存本地 Asset，不会创建不存在的远端 Voice ID。</p>}
      {snapshot.voiceReferences.map((reference) => <article className="audio-card" key={reference.id} data-testid={`voice-reference-${reference.id}`} data-object-id={reference.id}>
        <strong>{reference.label}</strong>
        <small>{reference.quality === "passed" ? "技术检查通过" : "需复核：建议使用 3～15 秒、单人且低噪声的参考音频"}</small>
        <small>{reference.authorizationNote}</small>
        <button className="wide-button primary" data-testid={`submit-voice-${reference.id}`} onClick={() => props.onSubmitVoiceSynthesis(reference.id)} disabled={snapshot.speechSegments.length === 0 || (pendingSegments.length === 0 && !needsAssembly)}>{needsAssembly ? "复用已生成片段并重新组装旁白" : "生成 / 更新待处理旁白"}</button>
      </article>)}
      <PanelTitle title="SpeechAsset" meta={snapshot.speechAsset ? snapshot.speechAsset.timing.precision : "尚未生成"} />
      {snapshot.speechAsset
        ? <section className="audio-card" data-testid="speech-asset" data-object-id={snapshot.speechAsset.id}><strong>{speechFile?.name ?? "旁白总轨"}</strong><small>Script R{snapshot.speechAsset.scriptRevision} · {snapshot.speechAsset.timing.segments.length} 个段边界 · {hasSpeechOnDialogue ? "已写入 Dialogue 轨" : "尚未写入 Dialogue 轨"}</small><small>{speechFile?.metadata?.durationMs ? `${(speechFile.metadata.durationMs / 1000).toFixed(2)} 秒` : "等待音频元数据"} · 不提供词级时间</small>{!hasSpeechOnDialogue && <button className="wide-button" data-testid="rebuild-speech-timeline" onClick={props.onRebuildSpeechTimeline}>修复 Dialogue 与字幕</button>}{hasSpeechOnDialogue && <button className="wide-button" data-testid="align-presenter-to-speech" onClick={props.onAlignPresenterToSpeech}>按旁白时长收齐 Presenter 主线</button>}</section>
        : <p className="empty-panel">选择 VoiceReference 后，系统会仅生成 pending / stale 的 SpeechSegment，完成后组装为可播放的 SpeechAsset、Dialogue Item 和稳定字幕。</p>}
      <div className="speech-list">{snapshot.speechSegments.map((segment) => <div className="speech-row" key={segment.id} data-testid={`audio-segment-${segment.id}`} data-object-id={segment.id}><span>{segment.text}</span><small>{statusText(segment.status)}</small></div>)}</div>
    </>;
  }
  if (panel === "actors") {
    return <ActorsPanel snapshot={snapshot} onRegisterActor={props.onRegisterActor} />;
  }
  if (panel === "scenes") {
    return <ScenesPanel snapshot={snapshot} onSelect={props.onSelect} onSeek={props.onSeek} onAddEffect={props.onAddEffect} />;
  }
  if (panel === "captions") {
    return <>
      <PanelTitle title="字幕 Caption" meta={`${snapshot.timeline.captions.length} 张字幕卡`} />
      {snapshot.timeline.captions.length === 0 && <p className="empty-panel">当前没有可用的段级语音时序。字幕只会在 SpeechAsset 组装成功后生成。</p>}
      <p className="empty-panel">仅编辑屏幕呈现：双行文案、字号、底部安全区和一个强调短语。不会修改 Script、旁白或段级时序。</p>
      {snapshot.timeline.captions.map((caption) => <CaptionEditor key={caption.id} caption={caption} disabled={props.busy} onSeek={props.onSeek} onSave={props.onEditCaption} />)}
    </>;
  }
  return <>
    <PanelTitle title="Jobs / Quality / Revision" meta="统一状态" />
    <section className="quality-section"><h3>质量门禁</h3>{props.quality && <p className="quality-review-status">编辑审片：{props.quality.editorial.status === "reviewed" ? "已记录" : props.quality.editorial.status === "stale" ? "已过期，需复核当前 Revision" : "尚未记录"} · 预览证据 {props.quality.editorial.previewEvidence.length} 条</p>}{props.quality?.issues.length ? props.quality.issues.map((issue) => <div className={`quality-row ${issue.level}`} key={issue.id}><strong>{issue.level === "blocking" ? "阻塞" : "建议"}</strong><span>{issue.message}</span></div>) : <p className="success-text">没有检测到结构性问题</p>}</section>
    <section><h3>任务</h3>{props.jobs.map((job) => <div className="job-row" key={job.id} data-testid={`job-${job.id}`} data-object-id={job.id}><span className={`status status-${job.status}`}>{statusText(job.status)}</span><div><strong>{job.kind}</strong><small>{job.error ?? job.id.slice(0, 14)}</small></div>{job.status === "failed" && <button onClick={() => props.onRetryJob(job.id)}>重试</button>}</div>)}</section>
    <section><h3>Revision</h3>{props.revisions.map((revision) => <div className="revision-row" key={revision.id} data-testid={`revision-${revision.number}`} data-object-id={revision.id}><div><strong>R{revision.number}</strong><span>{revision.summary}</span></div>{revision.number !== props.currentRevision && <button onClick={() => props.onRollback(revision.number)}>回退</button>}</div>)}</section>
  </>;
}

/** 字幕面板只开放稳定 Card 的最小微调，复杂逐词动画仍由后续能力与真实时序支持。 */
function CaptionEditor({ caption, disabled, onSeek, onSave }: {
  caption: CaptionCard;
  disabled: boolean;
  onSeek: (frame: number) => void;
  onSave: (captionId: string, payload: Record<string, unknown>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(caption.text);
  const [fontSize, setFontSize] = useState(caption.format?.fontSize ?? 32);
  const [bottomPercent, setBottomPercent] = useState(caption.format?.bottomPercent ?? 7);
  const [emphasisText, setEmphasisText] = useState(caption.emphasis?.text ?? "");

  useEffect(() => {
    setText(caption.text);
    setFontSize(caption.format?.fontSize ?? 32);
    setBottomPercent(caption.format?.bottomPercent ?? 7);
    setEmphasisText(caption.emphasis?.text ?? "");
  }, [caption.id, caption.text, caption.format?.fontSize, caption.format?.bottomPercent, caption.emphasis?.text]);

  const save = () => {
    const phrase = emphasisText.trim();
    const previousEmphasis = caption.emphasis;
    onSave(caption.id, {
      action: "update",
      text,
      format: { fontSize, bottomPercent },
      emphasis: phrase ? {
        text: phrase,
        occurrence: previousEmphasis?.text === phrase ? previousEmphasis.occurrence : 0,
        color: previousEmphasis?.text === phrase ? previousEmphasis.color : "#ffd166",
        backgroundColor: previousEmphasis?.text === phrase ? previousEmphasis.backgroundColor : undefined,
        fontWeight: previousEmphasis?.text === phrase ? previousEmphasis.fontWeight : 850,
        scale: previousEmphasis?.text === phrase ? previousEmphasis.scale : 1.05
      } : null
    });
  };

  return <article className="caption-card" data-testid={`caption-${caption.id}`} data-object-id={caption.id}>
    <button className="caption-summary" type="button" onClick={() => { onSeek(caption.startFrame); setExpanded((value) => !value); }}>
      <strong>{caption.text}</strong>
      <small>F{caption.startFrame}–{caption.endFrame} · {caption.precision} · {caption.textMode === "manual" ? "屏幕文案已编辑" : "语音原文"}</small>
    </button>
    {expanded && <div className="caption-editor">
      <label>屏幕文案<textarea aria-label={`字幕文案：${caption.id}`} value={text} maxLength={80} rows={2} onChange={(event) => setText(event.target.value)} /></label>
      <div className="caption-field-row">
        <label>字号<input aria-label={`字幕字号：${caption.id}`} type="number" min="16" max="72" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label>
        <label>底部 %<input aria-label={`字幕底部安全区：${caption.id}`} type="number" min="4" max="20" step="0.5" value={bottomPercent} onChange={(event) => setBottomPercent(Number(event.target.value))} /></label>
      </div>
      <label>强调短语（可留空）<input aria-label={`字幕强调短语：${caption.id}`} value={emphasisText} maxLength={40} onChange={(event) => setEmphasisText(event.target.value)} /></label>
      <div className="button-row">
        <button type="button" disabled={disabled} onClick={save}>保存字幕</button>
        <button type="button" disabled={disabled} onClick={() => onSave(caption.id, { action: "reset" })}>恢复语音原文</button>
      </div>
    </div>}
  </article>;
}

/**
 * 效果类型在 Web 中只负责选择，所属图层仍由 Application 的统一映射决定。
 */
function ScenesPanel({ snapshot, onSelect, onSeek, onAddEffect }: {
  snapshot: ProjectSnapshot;
  onSelect: (selection: Selection) => void;
  onSeek: (frame: number) => void;
  onAddEffect: (scene: Scene, type: EffectCue["type"]) => void;
}) {
  const [effectType, setEffectType] = useState<EffectCue["type"]>("MetricBackdrop");
  return <>
    <PanelTitle title="Story / Scenes" meta={`${snapshot.scenes.length} 个场景`} />
    <section className="story-card" data-testid="story-document" data-object-id={snapshot.story.id}>
      <strong>{snapshot.story.title}</strong>
      <p>{snapshot.story.summary || "尚未填写叙事摘要；可通过 Codex 的 manage_story 先稳定创作意图。"}</p>
      <small>{snapshot.story.beats.length} 个叙事 Beat · 与当前 Revision 同步</small>
    </section>
    <label className="effect-picker">新增效果
      <select aria-label="效果类型" data-testid="effect-type-select" value={effectType} onChange={(event) => setEffectType(event.target.value as EffectCue["type"])}>
        {EFFECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
    </label>
    {snapshot.scenes.length === 0 && <p className="empty-panel">A-roll 已组装后，请由 production-director / scene-planning 通过 MCP 根据 Story Beat 编译 Scene Strip。</p>}
    <div className="scene-list">{snapshot.scenes.map((scene) => <article className="scene-card" key={scene.id} data-testid={`scene-${scene.id}`} data-object-id={scene.id} aria-label={`场景：${scene.title}`} onClick={() => { onSelect({ kind: "scene", id: scene.id }); onSeek(scene.startFrame); }}><span className="scene-type">{scene.type.replace("Scene", "")}</span><strong>{scene.title}</strong><p>{scene.purpose}</p><small>{formatDuration(scene.endFrame - scene.startFrame, snapshot.timeline.fps)}</small><button onClick={(event) => { event.stopPropagation(); onAddEffect(scene, effectType); }}>+ {effectType}</button></article>)}</div>
  </>;
}

function PanelTitle({ title, meta }: { title: string; meta: string }) {
  return <div className="panel-title"><h2>{title}</h2><span>{meta}</span></div>;
}

/**
 * 人物表演仍绑定 Timeline Item，Mask 只是该 Item 的显示能力，避免在 Web 侧创建第二份人物状态。
 */
function ActorsPanel({ snapshot, onRegisterActor }: { snapshot: ProjectSnapshot; onRegisterActor: (timelineItemId: string, maskAssetId?: string) => void }) {
  const [maskByItem, setMaskByItem] = useState<Record<string, string>>({});
  const actorTrack = snapshot.timeline.tracks.find((track) => track.name === "Actor / A-roll");
  const actorItems = actorTrack ? snapshot.timeline.items.filter((item) => item.trackId === actorTrack.id && !item.disabled) : [];
  // 领域层只接受图片或派生图作为独立 alpha Mask，界面不展示必然会被拒绝的视频素材。
  const usableMasks = snapshot.assets.filter((asset) => asset.status === "ready" && (asset.kind === "image" || asset.kind === "derived"));
  const performanceByItem = new Map((snapshot.actorPerformances ?? []).map((performance) => [performance.timelineItemId, performance]));

  return <>
    <PanelTitle title="人物 / Actor" meta={`${actorItems.length} 条主画面`} />
    {actorItems.length === 0 && <p className="empty-panel">先在素材库建立 Presenter 主线，再在这里登记人物视频与可选 Mask。</p>}
    <div className="actor-list">
      {actorItems.map((item) => {
        const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
        const performance = performanceByItem.get(item.id);
        return <article className="actor-card" key={item.id} data-testid={`actor-item-${item.id}`} data-object-id={item.id}>
          <strong>{asset?.name ?? "缺失素材"}</strong>
          <small>F{item.startFrame}–{item.endFrame}</small>
          {performance ? <span className={`status status-${performance.status}`}>{performance.maskMode === "none" ? "已登记（前景降级）" : "已登记 Mask"}</span> : <span className="status">尚未登记</span>}
          <label className="actor-mask-label">Mask
            <select aria-label={`人物 Mask：${asset?.name ?? item.id}`} value={maskByItem[item.id] ?? ""} onChange={(event) => setMaskByItem((current) => ({ ...current, [item.id]: event.target.value }))}>
              <option value="">不使用 Mask（前景降级）</option>
              {usableMasks.filter((candidate) => candidate.id !== item.assetId).map((mask) => <option key={mask.id} value={mask.id}>{mask.name}</option>)}
            </select>
          </label>
          <button className="wide-button" onClick={() => onRegisterActor(item.id, maskByItem[item.id] || undefined)}>{performance ? "更新人物登记" : "登记为人物主画面"}</button>
        </article>;
      })}
    </div>
    <p className="empty-panel">未提供 Mask 时会明确采用前景降级，并在质量报告中提示复核遮挡；不会伪造抠像结果。</p>
  </>;
}

function Inspector({ snapshot, selectedAsset, selectedScene, selectedItem, selectedCue, currentRevision, onMoveItem, onUpdateCue, onSeek }: {
  snapshot: ProjectSnapshot;
  selection: Selection;
  selectedAsset?: Asset;
  selectedScene?: Scene;
  selectedItem?: TimelineItem;
  selectedCue?: EffectCue;
  currentRevision: number;
  onMoveItem: (item: TimelineItem, frame: number) => void;
  onUpdateCue: (cue: EffectCue, intensity: number) => void;
  onSeek: (frame: number) => void;
}) {
  if (selectedCue) {
    return (
      <>
        <PanelTitle title="Inspector" meta="EffectCue" />
        <InspectorGroup title="Basic">
          <InspectorRow label="效果类型" value={selectedCue.type} />
          <InspectorRow label="图层" value={selectedCue.layer} />
          <InspectorRow label="锚点" value={selectedCue.anchor} />
        </InspectorGroup>
        <InspectorGroup title="Timing">
          <InspectorRow label="进入" value={`F${selectedCue.startFrame}`} />
          <InspectorRow label="稳定" value={`F${selectedCue.holdFrame}`} />
          <InspectorRow label="退出" value={`F${selectedCue.endFrame}`} />
          <button className="wide-button" onClick={() => onSeek(selectedCue.startFrame)}>跳到进入帧</button>
        </InspectorGroup>
        <InspectorGroup title="Animation">
          <label className="range-label">强度 <b>{Math.round(selectedCue.intensity * 100)}%</b></label>
          <div className="button-row">
            <button onClick={() => onUpdateCue(selectedCue, Math.max(0, selectedCue.intensity - 0.1))}>−</button>
            <button onClick={() => onUpdateCue(selectedCue, Math.min(1, selectedCue.intensity + 0.1))}>+</button>
          </div>
        </InspectorGroup>
        <InspectorGroup title="Quality"><p>前景层效果需在真实预览中复核脸部、嘴部与字幕安全区。</p></InspectorGroup>
      </>
    );
  }
  if (selectedItem) {
    const asset = snapshot.assets.find((candidate) => candidate.id === selectedItem.assetId);
    return (
      <>
        <PanelTitle title="Inspector" meta="Timeline Item" />
        <InspectorGroup title="Basic">
          <InspectorRow label="素材" value={asset?.name ?? "缺失素材"} />
          <InspectorRow label="场景" value={selectedItem.sceneId ? "已绑定" : "全局"} />
        </InspectorGroup>
        <InspectorGroup title="Timing">
          <InspectorRow label="成片范围" value={`F${selectedItem.startFrame}–${selectedItem.endFrame}`} />
          <InspectorRow label="源范围" value={`F${selectedItem.sourceStartFrame}–${selectedItem.sourceEndFrame}`} />
          <div className="button-row">
            <button onClick={() => onMoveItem(selectedItem, Math.max(0, selectedItem.startFrame - 1))}>前移 1 帧</button>
            <button onClick={() => onMoveItem(selectedItem, selectedItem.startFrame + 1)}>后移 1 帧</button>
          </div>
        </InspectorGroup>
        <InspectorGroup title="Dependency"><p>直接移动只作用于当前 Item；需要同步的字幕、Cue 与独立轨应由 ImpactReport 复核。</p></InspectorGroup>
      </>
    );
  }
  if (selectedScene) {
    return <><PanelTitle title="Inspector" meta="Scene" /><InspectorGroup title="Basic"><InspectorRow label="类型" value={selectedScene.type} /><InspectorRow label="叙事目的" value={selectedScene.purpose} /><InspectorRow label="素材数" value={String(selectedScene.assetIds.length)} /></InspectorGroup><InspectorGroup title="Timing"><InspectorRow label="范围" value={`F${selectedScene.startFrame}–${selectedScene.endFrame}`} /></InspectorGroup></>;
  }
  if (selectedAsset) {
    return <><PanelTitle title="Inspector" meta="Asset" /><InspectorGroup title="Basic"><InspectorRow label="名称" value={selectedAsset.name} /><InspectorRow label="类型" value={selectedAsset.kind} /><InspectorRow label="状态" value={statusText(selectedAsset.status)} /></InspectorGroup><InspectorGroup title="Media"><InspectorRow label="时长" value={selectedAsset.metadata ? `${(selectedAsset.metadata.durationMs / 1000).toFixed(2)} 秒` : "等待分析"} /><InspectorRow label="规格" value={selectedAsset.metadata?.width ? `${selectedAsset.metadata.width}×${selectedAsset.metadata.height}` : "—"} /><InspectorRow label="音频" value={selectedAsset.metadata?.hasAudio ? "有" : "无 / 未知"} /></InspectorGroup></>;
  }
  return <><PanelTitle title="Inspector" meta={`R${currentRevision}`} /><p className="empty-panel">从素材、预览、Scene Strip 或 Timeline 中选择对象，以精确检查其属性。</p></>;
}

function InspectorGroup({ title, children }: { title: string; children: React.ReactNode }) { return <section className="inspector-group"><h3>{title}</h3>{children}</section>; }
function InspectorRow({ label, value }: { label: string; value: string }) { return <div className="inspector-row"><span>{label}</span><strong>{value}</strong></div>; }

function SceneStrip({ scenes, duration, playhead, onSelect }: { scenes: Scene[]; duration: number; playhead: number; onSelect: (scene: Scene) => void }) {
  return (
    <section className="scene-strip" aria-label="Scene Strip" data-testid="scene-strip">
      <div className="strip-label">Scenes</div>
      <div className="strip-canvas">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            className={`scene-chip ${scene.startFrame <= playhead && playhead < scene.endFrame ? "current" : ""}`}
            data-testid={`scene-strip-${scene.id}`}
            data-object-id={scene.id}
            aria-label={`定位场景：${scene.title}`}
            style={{
              left: `${duration ? (scene.startFrame / duration) * 100 : 0}%`,
              width: `${duration ? ((scene.endFrame - scene.startFrame) / duration) * 100 : 0}%`
            }}
            onClick={() => onSelect(scene)}
          >
            {scene.title}
          </button>
        ))}
        <div className="playhead" style={{ left: `${duration ? (playhead / duration) * 100 : 0}%` }} />
      </div>
    </section>
  );
}

function Timeline({ snapshot, selection, playhead, onSelect, onSeek }: { snapshot: ProjectSnapshot; selection: Selection; playhead: number; onSelect: (selection: Selection, frame: number) => void; onSeek: (frame: number) => void }) {
  const { timeline } = snapshot;
  const duration = Math.max(1, timeline.durationInFrames);
  const seekFromRuler = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(Math.round(((event.clientX - rect.left) / rect.width) * duration));
  };
  return (
    <section className="timeline" aria-label="多轨时间线" data-testid="timeline">
      <div className="timeline-header">
        <span>轨道</span>
        <div className="ruler" data-testid="timeline-ruler" onClick={seekFromRuler}>
          {[0, 0.25, 0.5, 0.75, 1].map((point) => <span key={point} style={{ left: `${point * 100}%` }}>F{Math.round(duration * point)}</span>)}
          {snapshot.markers.map((marker) => <button key={marker.id} type="button" className={`timeline-marker ${marker.level}`} data-testid={`marker-${marker.id}`} data-object-id={marker.id} aria-label={`标记：${marker.label}，F${marker.frame}`} style={{ left: `${(marker.frame / duration) * 100}%` }} onClick={(event) => { event.stopPropagation(); onSeek(marker.frame); }} />)}
        </div>
      </div>
      <div className="timeline-body">
        {timeline.tracks.map((track) => (
          <div className="track-row" key={track.id} data-testid={`track-${track.id}`} data-object-id={track.id}>
            <div className="track-name"><strong>{track.name}</strong><small>{track.kind}</small></div>
            <div className="track-canvas" aria-label={`轨道：${track.name}`}>
              {timeline.items.filter((item) => item.trackId === track.id).map((item) => (
                <TimelineBlock
                  key={item.id}
                  item={item}
                  snapshot={snapshot}
                  duration={duration}
                  active={selection?.kind === "item" && selection.id === item.id}
                  onClick={() => onSelect({ kind: "item", id: item.id }, item.startFrame)}
                />
              ))}
              {track.kind === "caption" && timeline.captions.map((caption) => (
                <button
                  className="caption-block"
                  key={caption.id}
                  data-testid={`timeline-caption-${caption.id}`}
                  data-object-id={caption.id}
                  aria-label={`字幕：${caption.text}`}
                  style={{ left: `${(caption.startFrame / duration) * 100}%`, width: `${((caption.endFrame - caption.startFrame) / duration) * 100}%` }}
                  onClick={() => onSeek(caption.startFrame)}
                >{caption.text}</button>
              ))}
              {snapshot.effectCues.filter((cue) => effectTrackNameByLayer[cue.layer] === track.name).map((cue) => (
                <TimelineCue
                  key={cue.id}
                  cue={cue}
                  duration={duration}
                  active={selection?.kind === "cue" && selection.id === cue.id}
                  onClick={() => onSelect({ kind: "cue", id: cue.id }, cue.startFrame)}
                />
              ))}
              <div className="playhead" style={{ left: `${(playhead / duration) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineBlock({ item, snapshot, duration, active, onClick }: { item: TimelineItem; snapshot: ProjectSnapshot; duration: number; active: boolean; onClick: () => void }) {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  const style: CSSProperties = {
    left: `${(item.startFrame / duration) * 100}%`,
    width: `${((item.endFrame - item.startFrame) / duration) * 100}%`
  };
  return <button className={`timeline-item ${active ? "selected" : ""}`} data-testid={`timeline-item-${item.id}`} data-object-id={item.id} data-start-frame={item.startFrame} data-end-frame={item.endFrame} aria-label={`时间线片段：${asset?.name ?? "缺失素材"}，F${item.startFrame} 到 F${item.endFrame}`} style={style} onClick={onClick}><span>{asset?.name ?? "缺失素材"}</span><small>F{item.startFrame}</small></button>;
}

function TimelineCue({ cue, duration, active, onClick }: { cue: EffectCue; duration: number; active: boolean; onClick: () => void }) {
  const style: CSSProperties = {
    left: `${(cue.startFrame / duration) * 100}%`,
    width: `${((cue.endFrame - cue.startFrame) / duration) * 100}%`
  };
  return <button className={`timeline-cue ${active ? "selected" : ""}`} data-testid={`timeline-cue-${cue.id}`} data-object-id={cue.id} data-start-frame={cue.startFrame} data-end-frame={cue.endFrame} aria-label={`效果：${cue.type}，F${cue.startFrame} 到 F${cue.endFrame}`} style={style} onClick={onClick}><span>{cue.type}</span><small>F{cue.startFrame}</small></button>;
}
