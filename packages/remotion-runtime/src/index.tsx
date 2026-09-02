import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, Video } from "remotion";
import type { ActorPerformance, CaptionCard, CaptionFormat, Cutaway, EffectCue, ProjectSnapshot, TimelineItem, TimelineTrack } from "@videocut/contracts";
import { compileCutawayLayout, cutawaySourceVolume } from "./cutaway-layout";
import { compileCameraPunchLayout, compileMotionLayout, resolveEffectStylePack, type EffectStylePack } from "./motion-layout";

export interface CompositionProps {
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
}

/**
 * Render Worker 当前不会解析工作区 TypeScript 路径别名；此处保持与 Contract 相同的受类型约束默认值，
 * 让 Player 与 Render 均可直接打包。Card 上保存的 format 始终优先于默认值。
 */
const DEFAULT_RENDER_CAPTION_FORMAT = {
  fontSize: 32,
  fontWeight: 750,
  color: "#ffffff",
  bottomPercent: 7,
  horizontalInsetPercent: 8,
  textAlign: "center"
} satisfies CaptionFormat;

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

const cueCard = (stylePack: EffectStylePack): React.CSSProperties => ({
  position: "relative",
  padding: "20px 24px",
  borderRadius: stylePack.radius,
  boxShadow: stylePack.shadow,
  overflow: "hidden",
  background: stylePack.surface
});

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
    // Cue 可能位于整片后半段；Sequence 把绑定素材的时间轴重置到 Cue 起点，确保从素材第 0 帧播放。
    return <Sequence from={cue.startFrame} durationInFrames={cue.endFrame - cue.startFrame} layout="none"><Video src={src} volume={0} style={{ ...style, objectFit: "cover" }} /></Sequence>;
  }
  return <img src={src} alt={entry.asset.name} style={{ ...style, objectFit: "cover" }} />;
};

/** 每个 Registry 类型均有独立视觉语法，并在需要素材的效果中直接消费项目绑定。 */
const CueVisual: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; fallback: boolean; stylePack: EffectStylePack }> = ({ snapshot, mediaBaseUrl, cue, fallback, stylePack }) => {
  const label = cueLabel(cue);
  const card = cueCard(stylePack);
  const fallbackLabel = fallback ? <span style={{ display: "block", marginTop: 8, color: "#ffd37d", fontSize: 14, fontWeight: 700 }}>未提供人物 Mask：以可见前景降级</span> : null;
  const bindingCount = bindingsFor(snapshot, cue).length;
  const comments = projectTextList(cue.props?.comments);
  switch (cue.type) {
    case "MetricBackdrop":
      return <div style={{ ...card, width: "100%", color: stylePack.accentForeground, background: `linear-gradient(135deg,${stylePack.accent},${stylePack.mutedSurface})` }}>{captionFor(label, "关键数字")}{fallbackLabel}</div>;
    case "ProductFan":
      return <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...card, position: "absolute", inset: "13% 7%", overflow: "hidden", background: stylePack.mutedSurface, transform: `rotate(${[-13, 0, 13][index] ?? 0}deg) translate(${[-20, 0, 20][index] ?? 0}px, ${[14, 0, 14][index] ?? 0}px)`, border: `1px solid ${stylePack.accentForeground}55` }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, right: 12, bottom: 10, fontSize: 19, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}
        {fallbackLabel}
      </div>;
    case "GlowCTA":
      return <div style={{ width: "max-content", padding: "19px 38px", borderRadius: 999, background: stylePack.accent, color: stylePack.accentForeground, boxShadow: `0 0 42px ${stylePack.accent}cc`, fontSize: 29, fontWeight: 850 }}>{label}</div>;
    case "PortfolioWall":
      return <div style={{ ...card, width: "100%", padding: "14px 16px", color: stylePack.foreground }}>
        <span style={{ display: "block", marginBottom: 12, fontSize: 16, fontWeight: 800, color: stylePack.accent }}>作品 / 案例</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{Array.from({ length: Math.max(1, Math.min(6, bindingCount)) }, (_, index) => <BoundAssetVisual key={index} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", aspectRatio: "1", borderRadius: 10 }} />)}</div>
        <strong style={{ display: "block", marginTop: 12, fontSize: 22 }}>{label}</strong>{fallbackLabel}
      </div>;
    case "CommentCloud":
      return <div style={{ width: "100%" }}>
        {(comments.length > 0 ? comments : ["未提供项目评论"]).slice(0, 3).map((comment, index) => <div key={`${comment}-${index}`} style={{ ...card, marginTop: index ? 10 : 0, marginLeft: `${index * 8}%`, padding: "14px 18px", background: index === 1 ? stylePack.surface : "#ffffffd9", color: index === 1 ? stylePack.foreground : "#202331", fontSize: 20, fontWeight: 700 }}>{`“${comment}”`}</div>)}
        {fallbackLabel}
      </div>;
    case "EvidenceCard":
      return <div style={{ ...card, width: "100%", padding: "14px 16px", background: stylePack.surface, color: stylePack.foreground }}>
        <span style={{ display: "inline-block", padding: "5px 10px", borderRadius: 999, background: stylePack.accent, color: stylePack.accentForeground, fontSize: 14, fontWeight: 850 }}>资料证据</span>
        <BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", aspectRatio: "1.35", borderRadius: 12, marginTop: 12 }} />
        <strong style={{ display: "block", marginTop: 12, fontSize: 21, lineHeight: 1.25 }}>{label}</strong>
        {fallbackLabel}
      </div>;
    // CameraPunch 的可见结果只应是人物构图推近；描边和“镜头强调”标签会像调试 UI，
    // 与口播字幕争夺注意力。实际缩放由下方 VideoLayer 按 Cue 时序完成。
    case "CameraPunch":
      return null;
    case "FullScreenMeme":
      return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10%", background: `radial-gradient(circle at 20% 20%,${stylePack.accent} 0 10%,transparent 10%), linear-gradient(135deg,${stylePack.mutedSurface},${stylePack.accent})`, color: stylePack.accentForeground, textAlign: "center" }}><div style={{ maxWidth: "82%" }}><div style={{ marginBottom: 24, fontSize: 76 }}>⚡</div><strong style={{ fontSize: 60, lineHeight: 1.08 }}>{label}</strong></div></AbsoluteFill>;
    case "DeviceShowcase":
      return <div style={{ position: "relative", width: "100%", height: "100%", padding: 12, border: `7px solid ${stylePack.accentForeground}`, borderRadius: stylePack.radius + 8, background: stylePack.mutedSurface, boxShadow: stylePack.shadow }}><div style={{ width: "36%", height: 6, margin: "0 auto 12px", borderRadius: 10, background: stylePack.accentForeground }} /><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", height: "86%", borderRadius: stylePack.radius }} /><strong style={{ position: "absolute", left: 18, right: 18, bottom: 18, fontSize: 18, textShadow: "0 2px 8px #000" }}>{label}</strong>{fallbackLabel}</div>;
    case "ContentCarousel":
      return <div style={{ width: "100%", display: "flex", gap: 14 }}>{Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...card, flex: 1, minHeight: 102, overflow: "hidden", padding: 0, background: stylePack.mutedSurface }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, bottom: 10, fontSize: 18, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}{fallbackLabel}</div>;
    case "EndCard":
      return <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10%", background: `linear-gradient(160deg,${stylePack.mutedSurface},${stylePack.accent})`, color: stylePack.accentForeground, textAlign: "center" }}><span style={{ marginBottom: 22, fontSize: 22, fontWeight: 750, color: stylePack.accentForeground }}>VideoCut</span><strong style={{ fontSize: 54, lineHeight: 1.15 }}>{label}</strong><span style={{ marginTop: 30, padding: "13px 24px", border: `1px solid ${stylePack.accentForeground}`, borderRadius: 999, fontSize: 22 }}>继续探索</span></AbsoluteFill>;
  }
};

const CueLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; fallback?: boolean }> = ({ snapshot, mediaBaseUrl, cue, fallback = false }) => {
  const frame = useCurrentFrame();
  if (frame < cue.startFrame || frame >= cue.endFrame) return null;
  const layout = compileMotionLayout(cue, frame);
  return <div style={{ position: "absolute", inset: 0, opacity: layout.motion.opacity, fontFamily: layout.stylePack.fontFamily, color: layout.stylePack.foreground, letterSpacing: "0.02em", pointerEvents: "none" }}>
    <div style={{ ...layout.container, transform: `${layout.anchorTransform} ${layout.motion.transform}`.trim(), transformOrigin: "center" }}>
      <CueVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} fallback={fallback} stylePack={layout.stylePack} />
    </div>
  </div>;
};

function captionEmphasisIndex(text: string, phrase: string, occurrence: number): number {
  let index = -1;
  for (let current = 0; current <= occurrence; current += 1) {
    index = text.indexOf(phrase, index + 1);
    if (index < 0) return -1;
  }
  return index;
}

/** 首版只做 Card 级强调：不按字符猜时间，不把稳定字幕升级成逐词弹跳。 */
const CaptionLayer: React.FC<{ caption: CaptionCard }> = ({ caption }) => {
  const format = { ...DEFAULT_RENDER_CAPTION_FORMAT, ...caption.format };
  const emphasis = caption.emphasis;
  const emphasisIndex = emphasis ? captionEmphasisIndex(caption.text, emphasis.text, emphasis.occurrence) : -1;
  const before = emphasisIndex >= 0 && emphasis ? caption.text.slice(0, emphasisIndex) : caption.text;
  const focused = emphasisIndex >= 0 && emphasis ? caption.text.slice(emphasisIndex, emphasisIndex + emphasis.text.length) : "";
  const after = emphasisIndex >= 0 && emphasis ? caption.text.slice(emphasisIndex + emphasis.text.length) : "";
  return <div style={{
    position: "absolute",
    left: `${format.horizontalInsetPercent}%`,
    right: `${format.horizontalInsetPercent}%`,
    bottom: `${format.bottomPercent}%`,
    color: format.color,
    fontSize: format.fontSize,
    fontWeight: format.fontWeight,
    lineHeight: 1.36,
    textAlign: format.textAlign,
    textShadow: "0 3px 14px #000",
    fontFamily: "Inter, Noto Sans SC, sans-serif",
    whiteSpace: "pre-wrap"
  }}><span style={format.backgroundColor ? { display: "inline", padding: "0.13em 0.32em", borderRadius: "0.22em", backgroundColor: format.backgroundColor } : undefined}>{before}{focused && emphasis && <span style={{ display: "inline-block", color: emphasis.color ?? format.color, backgroundColor: emphasis.backgroundColor, fontWeight: emphasis.fontWeight ?? Math.min(900, format.fontWeight + 100), transform: emphasis.scale === undefined ? undefined : `scale(${emphasis.scale})`, transformOrigin: "center bottom" }}>{focused}</span>}{after}</span></div>;
};

const itemDuration = (item: TimelineItem) => item.endFrame - item.startFrame;
const itemVolume = (item: TimelineItem, track: TimelineTrack) => track.muted ? 0 : Math.pow(10, (item.gainDb ?? 0) / 20);

const VideoLayer: React.FC<{
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
  item: TimelineItem;
  track: TimelineTrack;
  performance?: ActorPerformance;
  cutaway?: Cutaway;
  compositionFrame: number;
}> = ({ snapshot, mediaBaseUrl, item, track, performance, cutaway, compositionFrame }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  const maskAsset = performance?.maskMode === "alpha_asset" && performance.maskAssetId
    ? snapshot.assets.find((candidate) => candidate.id === performance.maskAssetId)
    : undefined;
  const cameraPunch = !cutaway && (snapshot.effectCues ?? []).find((cue) => cue.type === "CameraPunch" && cue.status === "ready" && cue.sceneId === item.sceneId && cue.startFrame <= compositionFrame && compositionFrame < cue.endFrame);
  // 推近和回位由与普通 Cue 共用的编译器决定，避免 Presenter 主画面另有一套隐藏的线性运动逻辑。
  const cameraLayout = cameraPunch ? compileCameraPunchLayout(cameraPunch, compositionFrame) : undefined;
  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${cameraLayout?.scale ?? 1})`,
    transformOrigin: cameraLayout?.transformOrigin ?? "50% 46%"
  };
  if (maskAsset) {
    const maskUrl = mediaUrl(snapshot, mediaBaseUrl, maskAsset.managedPath);
    Object.assign(videoStyle, { maskImage: `url("${maskUrl}")`, maskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskImage: `url("${maskUrl}")`, WebkitMaskSize: "100% 100%", WebkitMaskRepeat: "no-repeat" });
  }
  // 有 Dialogue 时，未登记的旧人物 Item 也默认静音，优先避免“原声 + OmniVoice”双重播放。
  const audioMode = performance?.audioMode ?? (snapshot.speechAsset ? "use_dialogue_track" : "use_source_audio");
  const sourceVolume = cutaway ? cutawaySourceVolume(cutaway, item, track) : audioMode === "use_source_audio" ? itemVolume(item, track) : 0;
  if (cutaway) {
    const aspectRatio = asset.metadata?.width && asset.metadata.height ? asset.metadata.width / asset.metadata.height : undefined;
    const layout = compileCutawayLayout(cutaway, aspectRatio);
    return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}>
      <div style={layout.container}>
        <Video src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={sourceVolume} style={layout.media} />
      </div>
    </Sequence>;
  }
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
  const cutawaysByItem = new Map((snapshot.cutaways ?? []).filter((cutaway) => cutaway.status === "ready").map((cutaway) => [cutaway.timelineItemId, cutaway]));
  // 新写入会禁用 stale Item；这里额外保护旧 Revision，避免它把已经失效的 Cutaway 当成普通全屏视频播放。
  const staleCutawayItemIds = new Set((snapshot.cutaways ?? []).filter((cutaway) => cutaway.status === "stale").map((cutaway) => cutaway.timelineItemId));
  const videoItems = snapshot.timeline.items
    .filter((item) => {
      const track = tracksById.get(item.trackId);
      return track?.kind === "video" && !track.hidden && !item.disabled && !staleCutawayItemIds.has(item.id);
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
  // 没有登记人物表演或独立 Mask 文件时必须走可见前景降级，不能因 undefined !== "none" 误判为已抠像。
  const hasMaskedActorFor = (cue: EffectCue) => videoItems.some((item) => {
    if (item.sceneId !== cue.sceneId) return false;
    const performance = performancesByItem.get(item.id);
    if (!performance) return false;
    if (performance.maskMode === "embedded_alpha") return true;
    return performance.maskMode === "alpha_asset"
      && Boolean(performance.maskAssetId)
      && snapshot.assets.some((asset) => asset.id === performance.maskAssetId && asset.status === "ready");
  });
  const rearCues = cuesAt("rear");

  return <AbsoluteFill style={{ backgroundColor: "#070914", overflow: "hidden" }}>
    {rearCues.filter(hasMaskedActorFor).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {videoItems.map((item) => <VideoLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} performance={performancesByItem.get(item.id)} cutaway={cutawaysByItem.get(item.id)} compositionFrame={frame} />)}
    {rearCues.filter((cue) => !hasMaskedActorFor(cue)).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} fallback />)}
    {cuesAt("actor", "front").map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {cuesAt("fullscreen").map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {snapshot.timeline.captions.map((caption) => <Sequence key={caption.id} from={caption.startFrame} durationInFrames={caption.endFrame - caption.startFrame}><CaptionLayer caption={caption} /></Sequence>)}
    {audioItems.map((item) => <AudioLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} />)}
  </AbsoluteFill>;
};

export { mediaUrl, compileCameraPunchLayout, compileMotionLayout, resolveEffectStylePack, compileCutawayLayout, cutawaySourceVolume };
