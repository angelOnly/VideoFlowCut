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
  const enter = interpolate(frame, [cue.startFrame, cue.startFrame + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [cue.endFrame - 8, cue.endFrame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { opacity: Math.min(enter, exit) * (cue.layer === "fullscreen" ? 1 : cue.intensity), enter };
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
/** 每个 Registry 类型均有独立视觉语法，避免枚举很多但全部落到同一张默认卡片。 */
const CueVisual: React.FC<{ cue: EffectCue; enter: number; fallback: boolean }> = ({ cue, enter, fallback }) => {
  const label = cueLabel(cue);
  const slide = `${Math.round((1 - enter) * 30)}px`;
  const fallbackLabel = fallback ? <span style={{ display: "block", marginTop: 8, color: "#ffd37d", fontSize: 14, fontWeight: 700 }}>未提供人物 Mask：以可见前景降级</span> : null;
  switch (cue.type) {
    case "MetricBackdrop":
      return <div style={{ ...cueCard, position: "absolute", left: fallback ? "4%" : "7%", top: fallback ? undefined : "16%", bottom: fallback ? "23%" : undefined, minWidth: fallback ? "30%" : "34%", maxWidth: fallback ? "34%" : undefined, background: "linear-gradient(135deg,#7257ff,#2679f5)", transform: `translateY(${slide})` }}>{captionFor(label, "关键数字")}{fallbackLabel}</div>;
    case "ProductFan":
      return <div style={{ position: "absolute", right: "4%", bottom: "22%", width: "32%", height: "27%", transform: `translateY(${slide})` }}>
        {["核心功能", "真实素材", label].map((card, index) => <div key={card} style={{ ...cueCard, position: "absolute", inset: "13% 7%", display: "flex", alignItems: "end", background: ["#255ed2", "#7549a8", "#de8056"][index], transform: `rotate(${[-13, 0, 13][index]}deg) translate(${[-20, 0, 20][index]}px, ${[14, 0, 14][index]}px)`, border: "1px solid #ffffff55" }}><strong style={{ fontSize: 25 }}>{card}</strong></div>)}
        {fallbackLabel}
      </div>;
    case "GlowCTA":
      return <div style={{ position: "absolute", left: "50%", bottom: "13%", padding: "19px 38px", borderRadius: 999, background: "#f4d25d", color: "#17120a", boxShadow: "0 0 42px #f4d25dcc", fontSize: 29, fontWeight: 850, transform: `translate(-50%, ${slide})` }}>{label}</div>;
    case "PortfolioWall":
      return <div style={{ ...cueCard, position: "absolute", left: "4%", bottom: "22%", width: "30%", padding: "14px 16px", background: "#10172ce8", transform: `translateY(${slide})` }}>
        <span style={{ display: "block", marginBottom: 12, fontSize: 16, fontWeight: 800, color: "#b8c9ff" }}>作品 / 案例</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{["A", "B", "C", "D", "E", "F"].map((name, index) => <div key={name} style={{ display: "grid", aspectRatio: "1", placeItems: "center", borderRadius: 10, background: ["#4965bc", "#8b5ec0", "#386d80"][index % 3], fontSize: 20, fontWeight: 800 }}>{name}</div>)}</div>
        <strong style={{ display: "block", marginTop: 12, fontSize: 22 }}>{label}</strong>{fallbackLabel}
      </div>;
    case "CommentCloud":
      return <div style={{ position: "absolute", right: "4%", bottom: "22%", width: "34%", transform: `translateY(${slide})` }}>
        {["“这个解释终于听懂了”", `“${label}”`, "“能不能再讲具体一点？”"].map((comment, index) => <div key={comment} style={{ ...cueCard, marginTop: index ? 10 : 0, marginLeft: `${index * 8}%`, padding: "14px 18px", background: index === 1 ? "#ececf6" : "#ffffffd9", color: "#202331", fontSize: 20, fontWeight: 700 }}>{comment}</div>)}
        {fallbackLabel}
      </div>;
    case "EvidenceCard":
      return <div style={{ ...cueCard, position: "absolute", left: "4%", bottom: "22%", width: "31%", padding: "14px 16px", background: "#f8f4e9", color: "#1c2738", transform: `translateY(${slide})` }}>
        <span style={{ display: "inline-block", padding: "5px 10px", borderRadius: 999, background: "#dbe9ff", color: "#245aaa", fontSize: 14, fontWeight: 850 }}>资料证据</span>
        <strong style={{ display: "block", marginTop: 16, fontSize: 25, lineHeight: 1.25 }}>{label}</strong>
        {[82, 96, 71].map((width, index) => <span key={width} style={{ display: "block", width: `${width}%`, height: 8, marginTop: 13, borderRadius: 10, background: index === 1 ? "#f0c56b" : "#b7c4d5" }} />)}
        {fallbackLabel}
      </div>;
    case "CameraPunch":
      return <div style={{ position: "absolute", inset: "8%", border: "5px solid #f2d15e", borderRadius: 28, boxShadow: "inset 0 0 0 2px #111, 0 0 42px #f2d15e66", pointerEvents: "none" }}><span style={{ position: "absolute", right: 20, top: 18, padding: "8px 14px", borderRadius: 999, background: "#f2d15e", color: "#1a170e", fontSize: 18, fontWeight: 850 }}>{label}</span></div>;
    case "FullScreenMeme":
      return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10%", background: "radial-gradient(circle at 20% 20%,#ffcc5d 0 10%,transparent 10%), linear-gradient(135deg,#f15466,#6d49d8)", textAlign: "center" }}><div style={{ maxWidth: "82%" }}><div style={{ marginBottom: 24, fontSize: 76 }}>⚡</div><strong style={{ fontSize: 60, lineHeight: 1.08 }}>{label}</strong></div></AbsoluteFill>;
    case "DeviceShowcase":
      return <div style={{ position: "absolute", right: "4%", bottom: "21%", width: "26%", aspectRatio: "0.53", padding: 12, border: "7px solid #d9e5ff", borderRadius: 30, background: "#101935", boxShadow: "0 25px 60px #0009", transform: `translateY(${slide}) rotate(5deg)` }}><div style={{ width: "36%", height: 6, margin: "0 auto 12px", borderRadius: 10, background: "#d9e5ff" }} /><div style={{ display: "grid", height: "86%", placeItems: "center", borderRadius: 20, background: "linear-gradient(160deg,#7457ed,#22a2ce)", textAlign: "center" }}><strong style={{ padding: 14, fontSize: 22 }}>{label}</strong></div>{fallbackLabel}</div>;
    case "ContentCarousel":
      return <div style={{ position: "absolute", left: "5%", right: "5%", bottom: "21%", display: "flex", gap: 14, transform: `translateY(${slide})` }}>{["洞察", "方法", label].map((card, index) => <div key={card} style={{ ...cueCard, flex: 1, minHeight: 102, display: "flex", alignItems: "end", padding: 14, background: ["#21467e", "#5c3e85", "#9c5d35"][index], fontSize: 20, fontWeight: 850 }}>{card}</div>)}{fallbackLabel}</div>;
    case "EndCard":
      return <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10%", background: "linear-gradient(160deg,#0e1730,#3558c8)", textAlign: "center" }}><span style={{ marginBottom: 22, fontSize: 22, fontWeight: 750, color: "#bacaff" }}>VideoCut</span><strong style={{ fontSize: 54, lineHeight: 1.15 }}>{label}</strong><span style={{ marginTop: 30, padding: "13px 24px", border: "1px solid #a9c0ff", borderRadius: 999, fontSize: 22 }}>继续探索</span></AbsoluteFill>;
  }
};

const CueLayer: React.FC<{ cue: EffectCue; fallback?: boolean }> = ({ cue, fallback = false }) => {
  const frame = useCurrentFrame();
  if (frame < cue.startFrame || frame >= cue.endFrame) return null;
  const motion = cueMotion(cue, frame);
  return <div style={{ position: "absolute", inset: 0, opacity: motion.opacity, ...typography, pointerEvents: "none" }}><CueVisual cue={cue} enter={motion.enter} fallback={fallback} /></div>;
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
  return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}><Video src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={itemVolume(item, track)} style={videoStyle} /></Sequence>;
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
    {rearCues.filter(hasMaskedActorFor).map((cue) => <CueLayer key={cue.id} cue={cue} />)}
    {videoItems.map((item) => <VideoLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} performance={performancesByItem.get(item.id)} compositionFrame={frame} />)}
    {rearCues.filter((cue) => !hasMaskedActorFor(cue)).map((cue) => <CueLayer key={cue.id} cue={cue} fallback />)}
    {cuesAt("actor", "front").map((cue) => <CueLayer key={cue.id} cue={cue} />)}
    {cuesAt("fullscreen").map((cue) => <CueLayer key={cue.id} cue={cue} />)}
    {snapshot.timeline.captions.map((caption) => <Sequence key={caption.id} from={caption.startFrame} durationInFrames={caption.endFrame - caption.startFrame}><CaptionLayer text={caption.text} /></Sequence>)}
    {audioItems.map((item) => <AudioLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} />)}
  </AbsoluteFill>;
};

export { mediaUrl };
