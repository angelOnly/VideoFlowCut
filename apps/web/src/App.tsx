import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import type { Asset, EffectCue, ProjectSnapshot, Scene, TimelineItem } from "@videocut/contracts";
import { ProjectComposition, mediaUrl } from "@videocut/remotion";
import { API_BASE, api, type ProjectState } from "./api";

type Panel = "assets" | "script" | "scenes" | "captions" | "jobs";
type Selection = { kind: "asset" | "scene" | "item" | "cue"; id: string } | undefined;
type EditorFocusQuery = { sceneId?: string; itemId?: string; effectCueId?: string; frame?: number };

const panelMeta: Array<{ id: Panel; label: string; icon: string }> = [
  { id: "assets", label: "素材", icon: "▦" },
  { id: "script", label: "文字稿", icon: "¶" },
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

const formatDuration = (frames: number, fps: number) => `${(frames / fps).toFixed(1)} 秒`;
const formatTimecode = (frame: number, fps: number) => {
  const seconds = Math.floor(frame / fps);
  const frames = frame % fps;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
};
const statusText = (status: string) => ({ queued: "排队中", analyzing: "分析中", ready: "已就绪", failed: "失败", running: "运行中", succeeded: "完成", cancelled: "已取消", unknown: "未知", missing: "缺失", pending: "待生成", stale: "需复核" }[status] ?? status);
const assetIcon = (asset: Asset) => asset.kind === "video" ? "▶" : asset.kind === "audio" || asset.kind === "speech" ? "♬" : "▧";

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
  const update = (next: string | undefined) => {
    setProjectId(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("projectId", next);
    else url.searchParams.delete("projectId");
    window.history.replaceState({}, "", url);
  };
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
  const [message, setMessage] = useState("准备就绪");
  const [busy, setBusy] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const initialFocus = useRef<EditorFocusQuery>(readEditorFocus());
  const initialFocusApplied = useRef(false);

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

  useEffect(() => {
    if (!state) return;
    setSelectedUnitIds(state.snapshot.semanticUnits.filter((unit) => unit.status === "included").map((unit) => unit.id));
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

  const createProject = () => act("创建项目", async () => {
    const created = await api.createProject(newProjectName.trim() || "未命名项目");
    setProjectId(created.snapshot.project.id);
    setState(created);
  });

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

  const videoAssets = snapshot.assets.filter((asset) => asset.kind === "video" && asset.status === "ready");
  const selectedForTimeline = videoAssets.map((asset) => asset.id);
  const blockingIssues = quality?.issues.filter((issue) => issue.level === "blocking") ?? [];

  return (
    <main className="workbench">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" />VideoCut <span className="brand-sub">创作工作台</span></div>
        <select aria-label="选择项目" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <strong data-testid="project-name" className="project-name">{snapshot.project.name}</strong>
        <span className="save-state">● 已保存</span>
        <div className="top-spacer" />
        <span className="revision-badge" data-testid="revision">R{currentRevision}</span>
        <span className="canvas-summary">{snapshot.timeline.width}×{snapshot.timeline.height} · {snapshot.timeline.fps} fps · {formatDuration(snapshot.timeline.durationInFrames, snapshot.timeline.fps)}</span>
        <button onClick={() => playerRef.current?.toggle()} disabled={!snapshot.timeline.durationInFrames}>播放</button>
        <button className="primary" data-testid="export-button" onClick={() => void act("提交导出", () => api.export(snapshot.project.id, currentRevision))} disabled={busy || blockingIssues.length > 0}>导出</button>
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
            onBuildTimeline={() => void act("建立 Presenter 主线", () => api.buildTimeline(snapshot.project.id, currentRevision, selectedForTimeline))}
            onToggleUnit={(unitId) => setSelectedUnitIds((old) => old.includes(unitId) ? old.filter((id) => id !== unitId) : [...old, unitId])}
            onApplyScript={() => void act("应用 Script", () => api.applyScript(snapshot.project.id, currentRevision, selectedUnitIds))}
            onAddEffect={(scene) => void act("添加效果", () => api.createEffect(snapshot.project.id, { baseRevision: currentRevision, sceneId: scene.id, type: "MetricBackdrop", layer: "rear", startFrame: scene.startFrame, endFrame: Math.min(scene.endFrame, scene.startFrame + Math.max(48, snapshot.timeline.fps * 3)), note: "关键数字" }))}
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

        <aside className="inspector" data-testid="inspector">
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
  onBuildTimeline: () => void;
  onToggleUnit: (unitId: string) => void;
  onApplyScript: () => void;
  onAddEffect: (scene: Scene) => void;
  onRetryJob: (jobId: string) => void;
  onRollback: (revision: number) => void;
}

function PanelContent(props: PanelContentProps) {
  const { panel, snapshot } = props;
  if (panel === "assets") {
    const readyVideoCount = snapshot.assets.filter((asset) => asset.kind === "video" && asset.status === "ready").length;
    return <>
      <PanelTitle title="素材库" meta={`${snapshot.assets.length} 个素材`} />
      <label className="upload-button">上传媒体<input aria-label="上传媒体" type="file" accept="video/*,audio/*,image/*" multiple hidden onChange={(event) => event.target.files && props.onUpload([...event.target.files])} /></label>
      <div className="path-import"><input aria-label="本地素材路径" placeholder="本地素材绝对路径" value={props.localPath} onChange={(event) => props.setLocalPath(event.target.value)} /><button onClick={props.onImportPath} disabled={!props.localPath.trim()}>导入</button></div>
      <button className="wide-button" onClick={props.onBuildTimeline} disabled={readyVideoCount === 0}>用 {readyVideoCount} 条视频建立 Presenter 主线</button>
      <div className="asset-list">{snapshot.assets.map((asset) => <article key={asset.id} className="asset-card" data-testid={`asset-${asset.id}`} onClick={() => props.onSelect({ kind: "asset", id: asset.id })}>
        {asset.metadata?.thumbnailPath ? <img src={mediaUrl(snapshot, API_BASE, asset.metadata.thumbnailPath)} alt="素材缩略图" /> : <div className="asset-placeholder">{assetIcon(asset)}</div>}
        <div className="asset-copy"><strong>{asset.name}</strong><small>{asset.metadata?.durationMs ? `${(asset.metadata.durationMs / 1000).toFixed(1)} 秒` : "等待媒体分析"}</small><span className={`status status-${asset.status}`}>{statusText(asset.status)}</span></div>
        {asset.kind === "video" && asset.status === "ready" && asset.metadata?.hasAudio && <button className="compact" onClick={(event) => { event.stopPropagation(); props.onTranscribe(asset.id); }}>转写</button>}
      </article>)}</div>
    </>;
  }
  if (panel === "script") {
    return <>
      <PanelTitle title="文字稿 / Script" meta={`Script R${snapshot.script.revision}`} />
      {snapshot.transcripts.length === 0 && <p className="empty-panel">选择有声素材后提交 FunASR 转写。当前 API 只提供全文，不能凭字数伪造词级时间。</p>}
      <div className="script-list">{snapshot.semanticUnits.sort((a, b) => a.order - b.order).map((unit) => <label className={props.selectedUnitIds.includes(unit.id) ? "semantic-unit selected" : "semantic-unit"} key={unit.id} data-testid={`semantic-${unit.id}`}><input type="checkbox" checked={props.selectedUnitIds.includes(unit.id)} onChange={() => props.onToggleUnit(unit.id)} /><span>{unit.text}</span></label>)}</div>
      {snapshot.semanticUnits.length > 0 && <button className="primary wide-button" onClick={props.onApplyScript}>应用语义选择 · 生成 SpeechSegment</button>}
      <PanelTitle title="SpeechSegment" meta={`${snapshot.speechSegments.length} 段`} />
      {snapshot.speechSegments.map((segment) => <div className="speech-row" key={segment.id}><span>{segment.text}</span><small>{statusText(segment.status)}</small></div>)}
    </>;
  }
  if (panel === "scenes") {
    return <>
      <PanelTitle title="Storyboard / Scenes" meta={`${snapshot.scenes.length} 个场景`} />
      {snapshot.scenes.length === 0 && <p className="empty-panel">建立 Presenter 主线后，系统会按可编辑片段生成 Scene Strip。</p>}
      <div className="scene-list">{snapshot.scenes.map((scene) => <article className="scene-card" key={scene.id} data-testid={`scene-${scene.id}`} onClick={() => { props.onSelect({ kind: "scene", id: scene.id }); props.onSeek(scene.startFrame); }}><span className="scene-type">{scene.type.replace("Scene", "")}</span><strong>{scene.title}</strong><p>{scene.purpose}</p><small>{formatDuration(scene.endFrame - scene.startFrame, snapshot.timeline.fps)}</small><button onClick={(event) => { event.stopPropagation(); props.onAddEffect(scene); }}>+ 效果</button></article>)}</div>
    </>;
  }
  if (panel === "captions") {
    return <>
      <PanelTitle title="Captions" meta={`${snapshot.timeline.captions.length} 张字幕卡`} />
      {snapshot.timeline.captions.length === 0 && <p className="empty-panel">当前没有可用的段级语音时序。字幕只会在 SpeechAsset 组装成功后生成。</p>}
      {snapshot.timeline.captions.map((caption) => <article key={caption.id} className="caption-card" onClick={() => props.onSeek(caption.startFrame)}><strong>{caption.text}</strong><small>F{caption.startFrame}–{caption.endFrame} · {caption.precision}</small></article>)}
    </>;
  }
  return <>
    <PanelTitle title="Jobs / Quality / Revision" meta="统一状态" />
    <section className="quality-section"><h3>质量门禁</h3>{props.quality?.issues.length ? props.quality.issues.map((issue) => <div className={`quality-row ${issue.level}`} key={issue.id}><strong>{issue.level === "blocking" ? "阻塞" : "建议"}</strong><span>{issue.message}</span></div>) : <p className="success-text">没有检测到结构性问题</p>}</section>
    <section><h3>任务</h3>{props.jobs.map((job) => <div className="job-row" key={job.id}><span className={`status status-${job.status}`}>{statusText(job.status)}</span><div><strong>{job.kind}</strong><small>{job.error ?? job.id.slice(0, 14)}</small></div>{job.status === "failed" && <button onClick={() => props.onRetryJob(job.id)}>重试</button>}</div>)}</section>
    <section><h3>Revision</h3>{props.revisions.map((revision) => <div className="revision-row" key={revision.id}><div><strong>R{revision.number}</strong><span>{revision.summary}</span></div>{revision.number !== props.currentRevision && <button onClick={() => props.onRollback(revision.number)}>回退</button>}</div>)}</section>
  </>;
}

function PanelTitle({ title, meta }: { title: string; meta: string }) {
  return <div className="panel-title"><h2>{title}</h2><span>{meta}</span></div>;
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
    <section className="scene-strip" aria-label="Scene Strip">
      <div className="strip-label">Scenes</div>
      <div className="strip-canvas">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            className={`scene-chip ${scene.startFrame <= playhead && playhead < scene.endFrame ? "current" : ""}`}
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
    <section className="timeline" aria-label="多轨时间线">
      <div className="timeline-header">
        <span>轨道</span>
        <div className="ruler" onClick={seekFromRuler}>
          {[0, 0.25, 0.5, 0.75, 1].map((point) => <span key={point} style={{ left: `${point * 100}%` }}>F{Math.round(duration * point)}</span>)}
        </div>
      </div>
      <div className="timeline-body">
        {timeline.tracks.map((track) => (
          <div className="track-row" key={track.id}>
            <div className="track-name"><strong>{track.name}</strong><small>{track.kind}</small></div>
            <div className="track-canvas">
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
  return <button className={`timeline-item ${active ? "selected" : ""}`} data-testid={`timeline-item-${item.id}`} style={style} onClick={onClick}><span>{asset?.name ?? "缺失素材"}</span><small>F{item.startFrame}</small></button>;
}

function TimelineCue({ cue, duration, active, onClick }: { cue: EffectCue; duration: number; active: boolean; onClick: () => void }) {
  const style: CSSProperties = {
    left: `${(cue.startFrame / duration) * 100}%`,
    width: `${((cue.endFrame - cue.startFrame) / duration) * 100}%`
  };
  return <button className={`timeline-cue ${active ? "selected" : ""}`} data-testid={`timeline-cue-${cue.id}`} style={style} onClick={onClick}><span>{cue.type}</span><small>F{cue.startFrame}</small></button>;
}
