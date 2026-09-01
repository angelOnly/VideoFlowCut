import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame, Video } from "remotion";
import type { ActorPerformance, EffectCue, ProjectSnapshot, TimelineItem, TimelineTrack } from "@videocut/contracts";

export interface CompositionProps {
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
}

const mediaUrl = (snapshot: ProjectSnapshot, mediaBaseUrl: string, managedPath: string) => {
  const safePath = managedPath.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
  return `${mediaBaseUrl.replace(/\/$/, "")}/media/${encodeURIComponent(snapshot.project.id)}/${safePath}`;
};

const cueLabel = (cue: EffectCue) => {
  const labels: Record<EffectCue["type"], string> = {
    MetricBackdrop: "关键数字",
    ProductFan: "产品展示",
    GlowCTA: "立即行动",
    PortfolioWall: "作品墙",
    CommentCloud: "用户评论",
    EvidenceCard: "证据卡片",
    CameraPunch: "镜头强调",
    FullScreenMeme: "全屏解释",
    DeviceShowcase: "设备展示",
    ContentCarousel: "内容轮播",
    EndCard: "感谢观看"
  };
  return cue.note || labels[cue.type];
};

const cueMotion = (cue: EffectCue, frame: number) => {
  const enterFrames = Math.max(1, cue.motion?.enterFrames ?? 10);
  const exitFrames = Math.max(1, cue.motion?.exitFrames ?? 10);
  const enter = interpolate(frame, [cue.startFrame, cue.startFrame + enterFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [cue.endFrame - exitFrames, cue.endFrame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const intensity = Math.max(0, Math.min(1, cue.intensity));
  return {
    opacity: Math.min(enter, exit) * (cue.layer === "fullscreen" ? 1 : 0.65 + intensity * 0.35),
    enter,
    distance: Math.round((1 - enter) * (14 + intensity * 42)),
    scale: 0.96 + enter * (0.04 + intensity * 0.015)
  };
};

const typography: React.CSSProperties = {
  fontFamily: "Inter, Noto Sans SC, sans-serif",
  color: "white",
  letterSpacing: "0.02em"
};

const cueCard: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: 22,
  boxShadow: "0 18px 46px #0008",
  overflow: "hidden"
};

const captionFor = (text: string, eyebrow: string) => <><span style={{ display: "block", marginBottom: 8, opacity: 0.72, fontSize: 16, fontWeight: 800 }}>{eyebrow}</span><strong style={{ display: "block", fontSize: 30, lineHeight: 1.18 }}>{text}</strong></>;

/**
 * 第一阶段还没有姿态锚点时，前景卡片默认放在人物下半身两侧，
 * 留出中上部脸/嘴安全区和底部字幕安全区；有 Mask 的后景 Cue 才可进入人物背后区域。
 */
const bindingsFor = (snapshot: ProjectSnapshot, cue: EffectCue) => (cue.assetBindings ?? [])
  .map((binding) => ({ binding, asset: snapshot.assets.find((asset) => asset.id === binding.assetId) }))
  .filter((entry): entry is { binding: EffectCue["assetBindings"][number]; asset: NonNullable<typeof entry.asset> } => Boolean(entry.asset));

const projectTextList = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean)
  : [];

const BoundAssetVisual: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; index: number; style?: React.CSSProperties }> = ({ snapshot, mediaBaseUrl, cue, index, style }) => {
  const entry = bindingsFor(snapshot, cue)[index];
  if (!entry) return <div style={{ ...style, display: "grid", placeItems: "center", background: "#242a3d", color: "#ccd4ec", fontSize: 15, textAlign: "center", padding: 8 }}>缺少项目素材</div>;
  const src = mediaUrl(snapshot, mediaBaseUrl, entry.asset.managedPath);
  if (entry.asset.kind === "video" || entry.asset.kind === "actor_video") {
    return <Video src={src} volume={0} style={{ ...style, objectFit: "cover" }} />;
  }
  return <img src={src} alt={entry.asset.name} style={{ ...style, objectFit: "cover" }} />;
};

/** 每个 Registry 类型均有独立视觉语法，并在需要素材的效果中直接消费项目绑定。 */
const CueVisual: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; enter: number; distance: number; scale: number; fallback: boolean }> = ({ snapshot, mediaBaseUrl, cue, enter, distance, scale, fallback }) => {
  const label = cueLabel(cue);
  const slide = `${distance}px`;
  const fallbackLabel = fallback ? <span style={{ display: "block", marginTop: 8, color: "#ffd37d", fontSize: 14, fontWeight: 700 }}>未提供人物 Mask：以可见前景降级</span> : null;
  const bindingCount = bindingsFor(snapshot, cue).length;
  const comments = projectTextList(cue.props?.comments);
  switch (cue.type) {
    case "MetricBackdrop":
      return <div style={{ ...cueCard, position: "absolute", left: fallback ? "4%" : "7%", top: fallback ? undefined : "16%", bottom: fallback ? "23%" : undefined, minWidth: fallback ? "30%" : "34%", maxWidth: fallback ? "34%" : undefined, background: "linear-gradient(135deg,#7257ff,#2679f5)", transform: `translateY(${slide}) scale(${scale})` }}>{captionFor(label, "关键数字")}{fallbackLabel}</div>;
    case "ProductFan":
      return <div style={{ position: "absolute", right: "4%", bottom: "22%", width: "32%", height: "27%", transform: `translateY(${slide}) scale(${scale})` }}>
        {Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...cueCard, position: "absolute", inset: "13% 7%", overflow: "hidden", background: "#1e2c57", transform: `rotate(${[-13, 0, 13][index] ?? 0}deg) translate(${[-20, 0, 20][index] ?? 0}px, ${[14, 0, 14][index] ?? 0}px)`, border: "1px solid #ffffff55" }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, right: 12, bottom: 10, fontSize: 19, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}
        {fallbackLabel}
      </div>;
    case "GlowCTA":
      return <div style={{ position: "absolute", left: "50%", bottom: "13%", padding: "19px 38px", borderRadius: 999, background: "#f4d25d", color: "#17120a", boxShadow: "0 0 42px #f4d25dcc", fontSize: 29, fontWeight: 850, transform: `translate(-50%, ${slide})` }}>{label}</div>;
    case "PortfolioWall":
      return <div style={{ ...cueCard, position: "absolute", left: "4%", bottom: "22%", width: "30%", padding: "14px 16px", background: "#10172ce8", transform: `translateY(${slide}) scale(${scale})` }}>
        <span style={{ display: "block", marginBottom: 12, fontSize: 16, fontWeight: 800, color: "#b8c9ff" }}>作品 / 案例</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{Array.from({ length: Math.max(1, Math.min(6, bindingCount)) }, (_, index) => <BoundAssetVisual key={index} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", aspectRatio: "1", borderRadius: 10 }} />)}</div>
        <strong style={{ display: "block", marginTop: 12, fontSize: 22 }}>{label}</strong>{fallbackLabel}
      </div>;
    case "CommentCloud":
      return <div style={{ position: "absolute", right: "4%", bottom: "22%", width: "34%", transform: `translateY(${slide}) scale(${scale})` }}>
        {(comments.length > 0 ? comments : ["未提供项目评论"]).slice(0, 3).map((comment, index) => <div key={`${comment}-${index}`} style={{ ...cueCard, marginTop: index ? 10 : 0, marginLeft: `${index * 8}%`, padding: "14px 18px", background: index === 1 ? "#ececf6" : "#ffffffd9", color: "#202331", fontSize: 20, fontWeight: 700 }}>{`“${comment}”`}</div>)}
        {fallbackLabel}
      </div>;
    case "EvidenceCard":
      return <div style={{ ...cueCard, position: "absolute", left: "4%", bottom: "22%", width: "31%", padding: "14px 16px", background: "#f8f4e9", color: "#1c2738", transform: `translateY(${slide}) scale(${scale})` }}>
        <span style={{ display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#dbe9ff", color: "#245aaa", fontSize: 14, fontWeight: 850 }}>资料证据</span>
        <BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", aspectRatio: "1.35", borderRadius: 12, marginTop: 12 }} />
        <strong style={{ display: "block", marginTop: 12, fontSize: 21, lineHeight: 1.25 }}>{label}</strong>
        {fallbackLabel}
      </div>;
    case "CameraPunch":
      return <div style={{ position: "absolute", inset: "8%", border: "5px solid #f2d15e", borderRadius: 28, boxShadow: "inset 0 0 0 2px #111, 0 0 42px #f2d15e66", pointerEvents: "none" }}><span style={{ position: "absolute", right: 20, top: 18, padding: "8px 14px", borderRadius: 999, background: "#f2d15e", color: "#1a170e", fontSize: 18, fontWeight: 850 }}>{label}</span></div>;
    case "FullScreenMeme":
      return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10%", background: "radial-gradient(circle at 20% 20%,#ffcc5d 0 10%,transparent 10%), linear-gradient(135deg,#f15466,#6d49d8)", textAlign: "center" }}><div style={{ maxWidth: "82%" }}><div style={{ marginBottom: 24, fontSize: 76 }}>⚡</div><strong style={{ fontSize: 60, lineHeight: 1.08 }}>{label}</strong></div></AbsoluteFill>;
    case "DeviceShowcase":
      return <div style={{ position: "absolute", right: "4%", bottom: "21%", width: "26%", aspectRatio: "0.53", padding: 12, border: "7px solid #d9e5ff", borderRadius: 30, background: "#101935", boxShadow: "0 25px 60px #0009", transform: `translateY(${slide}) rotate(5deg) scale(${scale})` }}><div style={{ width: "36%", height: 6, margin: "0 auto 12px", borderRadius: 10, background: "#d9e5ff" }} /><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", height: "86%", borderRadius: 20 }} /><strong style={{ position: "absolute", left: 18, right: 18, bottom: 18, fontSize: 18, textShadow: "0 2px 8px #000" }}>{label}</strong>{fallbackLabel}</div>;
    case "ContentCarousel":
      return <div style={{ position: "absolute", left: "5%", right: "5%", bottom: "21%", display: "flex", gap: 14, transform: `translateY(${slide}) scale(${scale})` }}>{Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...cueCard, flex: 1, minHeight: 102, overflow: "hidden", padding: 0, background: "#21467e" }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, bottom: 10, fontSize: 18, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}{fallbackLabel}</div>;
    case "EndCard":
      return <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10%", background: "linear-gradient(160deg,#0e1730,#3558c8)", textAlign: "center" }}><span style={{ marginBottom: 22, fontSize: 22, fontWeight: 750, color: "#bacaff" }}>VideoCut</span><strong style={{ fontSize: 54, lineHeight: 1.15 }}>{label}</strong><span style={{ marginTop: 30, padding: "13px 24px", border: "1px solid #a9c0ff", borderRadius: 999, fontSize: 22 }}>继续探索</span></AbsoluteFill>;
  }
};

const CueLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; fallback?: boolean }> = ({ snapshot, mediaBaseUrl, cue, fallback = false }) => {
  const frame = useCurrentFrame();
  if (frame < cue.startFrame || frame >= cue.endFrame) return null;
  const motion = cueMotion(cue, frame);
  return <div style={{ position: "absolute", inset: 0, opacity: motion.opacity, ...typography, pointerEvents: "none" }}><CueVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} enter={motion.enter} distance={motion.distance} scale={motion.scale} fallback={fallback} /></div>;
};

const CaptionLayer: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "7%",
    color: "#fff",
    fontSize: 32,
    fontWeight: 750,
    lineHeight: 1.36,
    textAlign: "center",
    textShadow: "0 3px 14px #000",
    fontFamily: "Inter, Noto Sans SC, sans-serif"
  }}>{text}</div>
);

const itemDuration = (item: TimelineItem) => item.endFrame - item.startFrame;
const itemVolume = (item: TimelineItem, track: TimelineTrack) => track.muted ? 0 : Math.pow(10, (item.gainDb ?? 0) / 20);

const VideoLayer: React.FC<{
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
  item: TimelineItem;
  track: TimelineTrack;
  performance?: ActorPerformance;
  compositionFrame: number;
}> = ({ snapshot, mediaBaseUrl, item, track, performance, compositionFrame }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  const maskAsset = performance?.maskMode === "alpha_asset" && performance.maskAssetId
    ? snapshot.assets.find((candidate) => candidate.id === performance.maskAssetId)
    : undefined;
  const cameraPunch = (snapshot.effectCues ?? []).find((cue) => cue.type === "CameraPunch" && cue.status === "ready" && cue.sceneId === item.sceneId && cue.startFrame <= compositionFrame && compositionFrame < cue.endFrame);
  const punchProgress = cameraPunch ? interpolate(compositionFrame, [cameraPunch.startFrame, Math.min(cameraPunch.startFrame + 10, cameraPunch.endFrame)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const scale = 1 + punchProgress * 0.075;
  const videoStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})`, transformOrigin: "50% 46%" };
  if (maskAsset) {
    const maskUrl = mediaUrl(snapshot, mediaBaseUrl, maskAsset.managedPath);
    Object.assign(videoStyle, { maskImage: `url("${maskUrl}")`, maskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskImage: `url("${maskUrl}")`, WebkitMaskSize: "100% 100%", WebkitMaskRepeat: "no-repeat" });
  }
  // 有 Dialogue 时，未登记的旧人物 Item 也默认静音，优先避免“原声 + OmniVoice”双重播放。
  const audioMode = performance?.audioMode ?? (snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio");
  const sourceVolume = audioMode === "use_source_audio" ? itemVolume(item, track) : 0;
  return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}><Video src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={sourceVolume} style={videoStyle} /></Sequence>;
};

const AudioLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; item: TimelineItem; track: TimelineTrack }> = ({ snapshot, mediaBaseUrl, item, track }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}><Audio src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={itemVolume(item, track)} /></Sequence>;
};

/**
 * Web Player 与 Render Worker 都消费同一 Revision Snapshot。人物 Mask、效果层和字幕
 * 均由同一组合规则渲染，未提供 Mask 时明确走可见的前景降级。
 */
export const ProjectComposition: React.FC<CompositionProps> = ({ snapshot, mediaBaseUrl }) => {
  const frame = useCurrentFrame();
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
  // 旧 Revision 可能还没有人物表演字段，预览应以“没有登记人物”降级而不是崩溃。
  const performancesByItem = new Map((snapshot.actorPerformances ?? []).filter((performance) => performance.status === "ready").map((performance) => [performance.timelineItemId, performance]));
  const videoItems = snapshot.timeline.items
    .filter((item) => {
      const track = tracksById.get(item.trackId);
      return track?.kind === "video" && !track.hidden && !item.disabled;
    })
    // Track 0 是工作台最上层，DOM 需要从底层到顶层绘制。
    .sort((left, right) => (tracksById.get(right.trackId)!.order - tracksById.get(left.trackId)!.order) || left.startFrame - right.startFrame);
  const audioItems = snapshot.timeline.items
    .filter((item) => {
      const track = tracksById.get(item.trackId);
      return track?.kind === "audio" && !track.muted && !item.disabled;
    })
    .sort((left, right) => left.startFrame - right.startFrame);
  const readyCues = (snapshot.effectCues ?? []).filter((cue) => cue.status === "ready");
  const cuesAt = (...layers: EffectCue["layer"][]) => readyCues.filter((cue) => layers.includes(cue.layer));
  const hasMaskedActorFor = (cue: EffectCue) => videoItems.some((item) => item.sceneId === cue.sceneId && performancesByItem.get(item.id)?.maskMode !== "none");
  const rearCues = cuesAt("rear");

  return <AbsoluteFill style={{ backgroundColor: "#070914", overflow: "hidden" }}>
    {rearCues.filter(hasMaskedActorFor).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {videoItems.map((item) => <VideoLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} performance={performancesByItem.get(item.id)} compositionFrame={frame} />)}
    {rearCues.filter((cue) => !hasMaskedActorFor(cue)).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} fallback />)}
    {cuesAt("actor", "front").map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {cuesAt("fullscreen").map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {snapshot.timeline.captions.map((caption) => <Sequence key={caption.id} from={caption.startFrame} durationInFrames={caption.endFrame - caption.startFrame}><CaptionLayer text={caption.text} /></Sequence>)}
    {audioItems.map((item) => <AudioLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} />)}
  </AbsoluteFill>;
};

export { mediaUrl };
