import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame, Video } from "remotion";
import type { EffectCue, ProjectSnapshot, TimelineItem, TimelineTrack } from "@videocut/contracts";

export interface CompositionProps {
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
}

const mediaUrl = (snapshot: ProjectSnapshot, mediaBaseUrl: string, managedPath: string) => {
  const safePath = managedPath.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
  return `${mediaBaseUrl.replace(/\/$/, "")}/media/${encodeURIComponent(snapshot.project.id)}/${safePath}`;
};

const cueStyle = (cue: EffectCue, frame: number): React.CSSProperties => {
  const enter = interpolate(frame, [cue.startFrame, cue.startFrame + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [cue.endFrame - 8, cue.endFrame], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 全屏解释与片尾是场景切换，不应被通用效果强度降成半透明覆盖层。
  const opacity = Math.min(enter, exit) * (cue.layer === "fullscreen" ? 1 : cue.intensity);
  const common: React.CSSProperties = {
    position: "absolute",
    opacity,
    fontFamily: "Inter, Noto Sans SC, sans-serif",
    color: "white",
    letterSpacing: "0.02em"
  };
  switch (cue.type) {
    case "MetricBackdrop":
      return { ...common, left: "7%", top: "16%", padding: "28px 36px", borderRadius: 26, background: "linear-gradient(135deg,#6f48ff,#2f6cf6)", fontSize: 42, fontWeight: 800, boxShadow: "0 22px 70px #391d9a88" };
    case "GlowCTA":
      return { ...common, left: "50%", bottom: "13%", transform: "translateX(-50%)", padding: "22px 42px", borderRadius: 999, background: "#f5d35d", color: "#16120a", fontSize: 30, fontWeight: 800, boxShadow: "0 0 45px #f5d35daa" };
    case "CommentCloud":
      return { ...common, right: "6%", top: "22%", width: "38%", padding: "20px", borderRadius: 22, background: "#ffffffed", color: "#191b25", fontSize: 25, fontWeight: 650, boxShadow: "0 12px 35px #0006" };
    case "FullScreenMeme":
      return { ...common, inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#f14e62,#6f48ff)", fontSize: 60, fontWeight: 900, textAlign: "center" };
    case "EndCard":
      return { ...common, inset: 0, display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(160deg,#10172c,#3558c8)", fontSize: 52, fontWeight: 800, textAlign: "center" };
    default:
      return { ...common, right: "7%", bottom: "20%", maxWidth: "42%", padding: "22px 28px", borderRadius: 22, background: "#141a31dc", border: "1px solid #a2b4ff55", fontSize: 29, fontWeight: 750, boxShadow: "0 14px 40px #0008" };
  }
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

const CueLayer: React.FC<{ cue: EffectCue }> = ({ cue }) => {
  const frame = useCurrentFrame();
  if (frame < cue.startFrame || frame >= cue.endFrame) return null;
  return <div style={cueStyle(cue, frame)}>{cueLabel(cue)}</div>;
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

const VideoLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; item: TimelineItem; track: TimelineTrack }> = ({ snapshot, mediaBaseUrl, item, track }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  return (
    <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}>
      <Video
        src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)}
        startFrom={item.sourceStartFrame}
        endAt={item.sourceEndFrame}
        volume={itemVolume(item, track)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Sequence>
  );
};

const AudioLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; item: TimelineItem; track: TimelineTrack }> = ({ snapshot, mediaBaseUrl, item, track }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  return (
    <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}>
      <Audio src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={itemVolume(item, track)} />
    </Sequence>
  );
};

/**
 * Web Player 与 Render Worker 都消费同一 Revision Snapshot。图层顺序由 Timeline Track
 * 和 EffectCue.layer 决定，避免预览与导出分别维护一套合成规则。
 */
export const ProjectComposition: React.FC<CompositionProps> = ({ snapshot, mediaBaseUrl }) => {
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
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
  const readyCues = snapshot.effectCues.filter((cue) => cue.status === "ready");
  const cuesAt = (...layers: EffectCue["layer"][]) => readyCues.filter((cue) => layers.includes(cue.layer));

  return (
    <AbsoluteFill style={{ backgroundColor: "#070914", overflow: "hidden" }}>
      {cuesAt("rear").map((cue) => <CueLayer key={cue.id} cue={cue} />)}
      {videoItems.map((item) => <VideoLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} />)}
      {cuesAt("actor", "front").map((cue) => <CueLayer key={cue.id} cue={cue} />)}
      {cuesAt("fullscreen").map((cue) => <CueLayer key={cue.id} cue={cue} />)}
      {snapshot.timeline.captions.map((caption) => (
        <Sequence key={caption.id} from={caption.startFrame} durationInFrames={caption.endFrame - caption.startFrame}>
          <CaptionLayer text={caption.text} />
        </Sequence>
      ))}
      {audioItems.map((item) => <AudioLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} />)}
    </AbsoluteFill>
  );
};

export { mediaUrl };
