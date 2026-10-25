import { audioCueVolumeAt, plannedVoiceVolumeAt, resolveVideoSourceVolume, resolveVlogAmbientVolume } from "./audio-semantics.js";
export { audioCueVolumeAt, plannedVoiceVolumeAt, resolveVideoSourceVolume, resolveVlogAmbientVolume } from "./audio-semantics.js";
import { captionTextShadowCss, captionIsDisplayed, captionBoxWidthPercent, resolveCaptionFormat } from "../../contracts/src/caption-presentation.js";
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, useCurrentFrame, getRemotionEnvironment, delayRender, continueRender, cancelRender } from "remotion";
import { sourceAudioTimeOrigin, inspectEffectContentContract, type ActorPerformance, type AudioCue, type CaptionCard, type CaptionEmphasis, type CaptionFormat, type Cutaway, type EffectCue, type ProjectSnapshot, type TimelineItem, type TimelineTrack } from "@videocut/contracts";
import { compileCutawayLayout, cutawaySourceVolume } from "./cutaway-layout";
import {
  CaptionLayoutError,
  CaptionTimelineOverlapError,
  captionContentHeight,
  layoutCaptionInBrowser,
  resolveCaptionLayoutInput
} from "./caption-layout";
import { captionFontIsLoaded, loadCaptionFont } from "./caption-font";
import { compileVisualComposition, resolveCompositionReachability } from "./composition-reachability";
import { motionFrameAtProjectFrame } from "../../contracts/src/frame-rate.js";
import { ExplainerSceneLayer } from "./explainer-registry";
import { compileCameraPunchLayout, compileMotionLayout, resolveEffectStylePack, type EffectStylePack } from "./motion-layout";

export interface CompositionProps {
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
  captionsOnly?: boolean;
}

/** 透明度只作用于字幕底板，不降低文字或强调短语的可读性。 */
const captionBackgroundColor = (format: CaptionFormat): string | undefined => {
  if (!format.backgroundColor) return undefined;
  if (format.backgroundOpacity === undefined) return format.backgroundColor;
  const alpha = Math.round(format.backgroundOpacity * 255).toString(16).padStart(2, "0");
  return `${format.backgroundColor}${alpha}`;
};

const mediaUrl = (snapshot: ProjectSnapshot, mediaBaseUrl: string, managedPath: string) => {
  const safePath = managedPath.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");
  return `${mediaBaseUrl.replace(/\/$/, "")}/media/${encodeURIComponent(snapshot.project.id)}/${safePath}`;
};

/** 正式文案只来自 Cue.props；note 是编辑备注，绝不能误渲染成默认成片文案。 */
const cueLabel = (cue: EffectCue) => {
  const props = cue.props ?? {};
  // EvidenceCard 的正式说明允许放在 caption / claim / source；合同与实际渲染必须
  // 消费同一组字段，不能出现“质量已放行、画面却没有说明”的空卡片。
  const preferred = [props.headline, props.title, props.label, props.text, props.metric, props.value, props.caption, props.claim, props.source];
  const value = preferred.find((candidate) => (
    (typeof candidate === "string" && Boolean(candidate.trim()))
    || (typeof candidate === "number" && Number.isFinite(candidate))
  ));
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
};

const cueCard = (stylePack: EffectStylePack): React.CSSProperties => ({
  position: "relative",
  padding: "20px 24px",
  borderRadius: stylePack.radius,
  boxShadow: stylePack.shadow,
  overflow: "hidden",
  background: stylePack.surface
});

/**
 * 第一阶段还没有姿态锚点时，前景卡片默认放在人物下半身两侧，
 * 留出中上部脸/嘴安全区和底部字幕安全区；有 Mask 的后景 Cue 才可进入人物背后区域。
 */
const bindingsFor = (snapshot: ProjectSnapshot, cue: EffectCue) => (cue.assetBindings ?? [])
  .map((binding) => ({ binding, asset: snapshot.assets.find((asset) => asset.id === binding.assetId) }))
  .filter((entry): entry is { binding: EffectCue["assetBindings"][number]; asset: NonNullable<typeof entry.asset> } => Boolean(entry.asset && entry.asset.status === "ready"));

const projectTextList = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean)
  : [];

const BoundAssetVisual: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; index: number; style?: React.CSSProperties }> = ({ snapshot, mediaBaseUrl, cue, index, style }) => {
  const entry = bindingsFor(snapshot, cue)[index];
  // 调用方已经通过内容合同；这里仍安全返回空，避免旧 Revision 或并发修改将调试占位写入成片。
  if (!entry) return null;
  const src = mediaUrl(snapshot, mediaBaseUrl, entry.asset.managedPath);
  if (entry.asset.kind === "video" || entry.asset.kind === "actor_video") {
    // Cue 可能位于整片后半段；Sequence 把绑定素材的时间轴重置到 Cue 起点，确保从素材第 0 帧播放。
    return <Sequence from={cue.startFrame} durationInFrames={cue.endFrame - cue.startFrame} layout="none"><OffthreadVideo src={src} volume={0} transparent={Boolean(entry.asset.metadata?.hasAlpha)} style={{ ...style, objectFit: "cover" }} /></Sequence>;
  }
  return <img src={src} alt={entry.asset.name} style={{ ...style, objectFit: "cover" }} />;
};

/** 每个 Registry 类型均有独立视觉语法，并在需要素材的效果中直接消费项目绑定。 */
const CueVisual: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue; stylePack: EffectStylePack }> = ({ snapshot, mediaBaseUrl, cue, stylePack }) => {
  const label = cueLabel(cue);
  const card = cueCard(stylePack);
  const bindingCount = bindingsFor(snapshot, cue).length;
  const comments = projectTextList(cue.props?.comments);
  switch (cue.type) {
    case "MetricBackdrop":
      // 固定最小视觉面积，避免短指标文本把信息卡压成一条细线；内容仍完全来自项目 props。
      return <div style={{ ...card, width: "100%", minHeight: 132, display: "flex", alignItems: "center", color: stylePack.accentForeground, background: `linear-gradient(135deg,${stylePack.accent},${stylePack.mutedSurface})` }}><strong style={{ display: "block", fontSize: 30, lineHeight: 1.18 }}>{label}</strong></div>;
    case "ProductFan":
      return <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...card, position: "absolute", inset: "13% 7%", overflow: "hidden", background: stylePack.mutedSurface, transform: `rotate(${[-13, 0, 13][index] ?? 0}deg) translate(${[-20, 0, 20][index] ?? 0}px, ${[14, 0, 14][index] ?? 0}px)`, border: `1px solid ${stylePack.accentForeground}55` }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, right: 12, bottom: 10, fontSize: 19, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}
      </div>;
    case "GlowCTA":
      return <div style={{ width: "max-content", padding: "19px 38px", borderRadius: 999, background: stylePack.accent, color: stylePack.accentForeground, boxShadow: `0 0 42px ${stylePack.accent}cc`, fontSize: 29, fontWeight: 850 }}>{label}</div>;
    case "PortfolioWall":
      return <div style={{ ...card, width: "100%", padding: "14px 16px", color: stylePack.foreground }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{Array.from({ length: Math.max(1, Math.min(6, bindingCount)) }, (_, index) => <BoundAssetVisual key={index} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", aspectRatio: "1", borderRadius: 10 }} />)}</div>
        <strong style={{ display: "block", marginTop: 12, fontSize: 22 }}>{label}</strong>
      </div>;
    case "CommentCloud":
      return <div style={{ width: "100%" }}>
        {comments.slice(0, 3).map((comment, index) => <div key={`${comment}-${index}`} style={{ ...card, marginTop: index ? 10 : 0, marginLeft: `${index * 8}%`, padding: "14px 18px", background: index === 1 ? stylePack.surface : "#ffffffd9", color: index === 1 ? stylePack.foreground : "#202331", fontSize: 20, fontWeight: 700 }}>{`“${comment}”`}</div>)}
      </div>;
    case "EvidenceCard":
      return <div style={{ ...card, width: "100%", padding: "14px 16px", background: stylePack.surface, color: stylePack.foreground }}>
        <BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", aspectRatio: "1.35", borderRadius: 12, marginTop: 12 }} />
        <strong style={{ display: "block", marginTop: 12, fontSize: 21, lineHeight: 1.25 }}>{label}</strong>
      </div>;
    // CameraPunch 的可见结果只应是人物构图推近；描边和“镜头强调”标签会像调试 UI，
    // 与口播字幕争夺注意力。实际缩放由下方 VideoLayer 按 Cue 时序完成。
    case "CameraPunch":
      return null;
    case "FullScreenMeme":
      return <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10%", background: `radial-gradient(circle at 20% 20%,${stylePack.accent} 0 10%,transparent 10%), linear-gradient(135deg,${stylePack.mutedSurface},${stylePack.accent})`, color: stylePack.accentForeground, textAlign: "center" }}><div style={{ maxWidth: "82%" }}><div style={{ marginBottom: 24, fontSize: 76 }}>⚡</div><strong style={{ fontSize: 60, lineHeight: 1.08 }}>{label}</strong></div></AbsoluteFill>;
    case "DeviceShowcase":
      return <div style={{ position: "relative", width: "100%", height: "100%", padding: 12, border: `7px solid ${stylePack.accentForeground}`, borderRadius: stylePack.radius + 8, background: stylePack.mutedSurface, boxShadow: stylePack.shadow }}><div style={{ width: "36%", height: 6, margin: "0 auto 12px", borderRadius: 10, background: stylePack.accentForeground }} /><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={0} style={{ display: "block", width: "100%", height: "86%", borderRadius: stylePack.radius }} /><strong style={{ position: "absolute", left: 18, right: 18, bottom: 18, fontSize: 18, textShadow: "0 2px 8px #000" }}>{label}</strong></div>;
    case "ContentCarousel":
      return <div style={{ width: "100%", display: "flex", gap: 14 }}>{Array.from({ length: Math.max(1, Math.min(3, bindingCount)) }, (_, index) => <div key={index} style={{ ...card, flex: 1, minHeight: 102, overflow: "hidden", padding: 0, background: stylePack.mutedSurface }}><BoundAssetVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} index={index} style={{ width: "100%", height: "100%" }} /><strong style={{ position: "absolute", left: 12, bottom: 10, fontSize: 18, textShadow: "0 2px 8px #000" }}>{index === 0 ? label : ""}</strong></div>)}</div>;
    case "EndCard": {
      const brand = typeof cue.props?.brand === "string" ? cue.props.brand.trim() : typeof cue.props?.brandName === "string" ? cue.props.brandName.trim() : "";
      const cta = typeof cue.props?.cta === "string" ? cue.props.cta.trim() : typeof cue.props?.ctaText === "string" ? cue.props.ctaText.trim() : "";
      return <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10%", background: `linear-gradient(160deg,${stylePack.mutedSurface},${stylePack.accent})`, color: stylePack.accentForeground, textAlign: "center" }}><span style={{ marginBottom: 22, fontSize: 22, fontWeight: 750, color: stylePack.accentForeground }}>{brand}</span><strong style={{ fontSize: 54, lineHeight: 1.15 }}>{label}</strong><span style={{ marginTop: 30, padding: "13px 24px", border: `1px solid ${stylePack.accentForeground}`, borderRadius: 999, fontSize: 22 }}>{cta}</span></AbsoluteFill>;
    }
  }
};

const CueLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; cue: EffectCue }> = ({ snapshot, mediaBaseUrl, cue }) => {
  const frame = useCurrentFrame();
  if (frame < cue.startFrame || frame >= cue.endFrame) return null;
  // 无法满足正式内容合同的 Cue 由 QualityReport 标为问题；Preview 和交付都不能绘制调试占位。
  if (!inspectEffectContentContract(cue, snapshot.assets, snapshot.timeline).ready) return null;
  if (cue.type === "ManagedMotion") {
    const asset = snapshot.assets.find((entry) => entry.id === cue.assetBindings.find((binding) => binding.slot === "motion")?.assetId);
    if (!asset?.motion) return null;
    const localFrame = motionFrameAtProjectFrame(frame - cue.startFrame, asset.motion.fps, snapshot.timeline.fps, asset.motion.frameCount);
    if (asset.motion.output) {
      if (asset.motion.output.kind === "opaque_video") return <Sequence from={cue.startFrame} durationInFrames={cue.endFrame - cue.startFrame}><OffthreadVideo src={mediaUrl(snapshot, mediaBaseUrl, asset.motion.output.path)} muted style={{ width: "100%", height: "100%", objectFit: "contain" }} /></Sequence>;
      return <AbsoluteFill><Img src={`${mediaBaseUrl.replace(/\/$/, "")}/motion-frame/${encodeURIComponent(snapshot.project.id)}/${encodeURIComponent(asset.id)}/${asset.motion.output.hash}/${localFrame}.png`} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></AbsoluteFill>;
    }
    const framePath = `${asset.motion.framesDirectory}/frame-${String(localFrame).padStart(5, "0")}.png`;
    // 直接使用固定版本的透明帧，不叠加旧 Registry 的通用进出场，也不播放审阅代理的背景。
    return <AbsoluteFill><Img src={mediaUrl(snapshot, mediaBaseUrl, framePath)} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></AbsoluteFill>;
  }
  // actor_head / actor_hands 只从当前帧的 Actor / A-roll 已就绪表演读取。
  // 多人物同时命中时不猜数组第一个，Quality 会阻止交付，这里安全降级到普通位置。
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
  const actorPerformances = snapshot.timeline.items.flatMap((item) => {
    if (item.sceneId !== cue.sceneId || item.disabled || item.startFrame > frame || item.endFrame <= frame || tracksById.get(item.trackId)?.name !== "Actor / A-roll") return [];
    const performance = snapshot.actorPerformances.find((candidate) => candidate.timelineItemId === item.id && candidate.status === "ready");
    return performance ? [performance] : [];
  });
  const actorLayout = actorPerformances.length === 1 ? actorPerformances[0]?.layout : undefined;
  const layout = compileMotionLayout(cue, frame, actorLayout);
  return <div style={{ position: "absolute", inset: 0, opacity: layout.motion.opacity, fontFamily: layout.stylePack.fontFamily, color: layout.stylePack.foreground, letterSpacing: "0.02em", pointerEvents: "none" }}>
    <div style={{ ...layout.container, transform: `${layout.anchorTransform} ${layout.motion.transform}`.trim(), transformOrigin: "center" }}>
      <CueVisual snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} stylePack={layout.stylePack} />
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

/**
 * 只有当前 SpeechAsset、当前 Script 与真实强制对齐都一致时，才让词级时间驱动字幕高亮。
 * 手工改写过的字幕可能不再逐字对应语音，因此宁可回退到其原有 Card 强调，也不做字符猜测。
 */
export function resolveWordExactCaptionHighlight(
  snapshot: ProjectSnapshot,
  caption: CaptionCard,
  frame: number
): CaptionEmphasis | undefined {
  if (snapshot.timeline.captionFormat) return undefined;
  const alignment = snapshot.speechAlignment;
  const speechAsset = snapshot.speechAsset;
  if (caption.precision !== "word_exact" || caption.textMode === "manual"
    || !alignment || alignment.status !== "ready" || !speechAsset
    || alignment.speechAssetId !== speechAsset.id
    || alignment.scriptRevision !== speechAsset.scriptRevision
    || alignment.scriptRevision !== snapshot.script.revision) return undefined;
  const current = alignment.words.find((word) => word.speechSegmentId === caption.speechSegmentId
    && frame >= word.startFrame && frame < word.endFrame);
  const text = current?.text.trim();
  if (!current || !text || !caption.text.includes(text)) return undefined;
  const occurrence = alignment.words
    .filter((word) => word.speechSegmentId === caption.speechSegmentId
      && (word.startFrame < current.startFrame || (word.startFrame === current.startFrame && word.endFrame < current.endFrame))
      && word.text.trim() === text)
    .length;
  // 文案中的第 N 次出现必须真实存在；不使用 normalizedText 去猜屏幕排版位置。
  if (captionEmphasisIndex(caption.text, text, occurrence) < 0) return undefined;
  return {
    text,
    occurrence,
    color: "#ffe08a",
    backgroundColor: "#382b0ab8",
    fontWeight: 900,
    scale: 1.06
  };
}

/**
 * 段级字幕保持稳定；只有经真实对齐验证的当前词才会覆盖为短暂的词级强调。
 * 关键点：浏览器只收到一或两条明确的行，并使用 whiteSpace: pre。绝不让 CSS 再把一条
 * Provider segment 偷偷折成第三行；真正不能装下时显式抛出 CAPTION_LAYOUT_OVERFLOW。
 */
const CaptionLayer: React.FC<{ snapshot: ProjectSnapshot; caption: CaptionCard }> = ({ snapshot, caption }) => {
  const frame = useCurrentFrame();
  const format = resolveCaptionFormat(snapshot.timeline, caption);
  // 全片统一样式独立禁用强调；实际背景高度只由本卡排版结果决定。
  const emphasisEnabled = !snapshot.timeline.captionFormat;
  const backgroundColor = captionBackgroundColor(format);
  const emphasis = emphasisEnabled ? resolveWordExactCaptionHighlight(snapshot, caption, frame) ?? caption.emphasis : undefined;
  // emphasis 的 transform 不参与普通 CSS 流式布局；先按最大字号/字重预留空间，避免视觉上越出安全区。
  const layout = React.useMemo(() => layoutCaptionInBrowser({
    text: caption.text,
    compositionWidth: snapshot.timeline.width,
    compositionHeight: snapshot.timeline.height,
    format,
    emphasisScale: emphasis?.scale,
    emphasisFontWeight: emphasis?.fontWeight
  }), [caption.text, emphasis?.fontWeight, emphasis?.scale, format, snapshot.timeline.width, snapshot.timeline.height]);
  const resolved = resolveCaptionLayoutInput({ text: caption.text, compositionWidth: snapshot.timeline.width, format, emphasisScale: emphasis?.scale, emphasisFontWeight: emphasis?.fontWeight })!;
  const allowedHeight = layout.ready ? captionContentHeight(resolved, layout.lines.length) : 0;
  const displayText = layout.ready ? layout.lines.join("\n") : "";
  const emphasisIndex = emphasis ? captionEmphasisIndex(displayText, emphasis.text, emphasis.occurrence) : -1;
  const before = emphasisIndex >= 0 && emphasis ? displayText.slice(0, emphasisIndex) : displayText;
  const focused = emphasisIndex >= 0 && emphasis ? displayText.slice(emphasisIndex, emphasisIndex + emphasis.text.length) : "";
  const after = emphasisIndex >= 0 && emphasis ? displayText.slice(emphasisIndex + emphasis.text.length) : "";
  const contentRef = React.useRef<HTMLSpanElement>(null);
  const layoutCheckKey = `${displayText}\u0000${JSON.stringify(format)}\u0000${JSON.stringify(emphasis)}`;
  const [domCheck, setDomCheck] = React.useState<{ key: string; overflowReason?: string }>({ key: layoutCheckKey });

  React.useLayoutEffect(() => {
    if (!layout.ready || !contentRef.current) return;
    const element = contentRef.current;
    // Canvas 是同一 Chromium / 同一字体栈的分行依据；DOM 再以实际 box 复核，防止字体回退、
    // 字重或浏览器实现差异变成横向溢出或意外第三行。
    // 所有测量使用未变换的 CSS 布局像素；Player 的整体缩放不能与 scrollWidth 混比。
    const renderedWidth = element.offsetWidth;
    const availableWidth = element.parentElement?.clientWidth ?? 0;
    const horizontalOverflow = renderedWidth > availableWidth + 1
      || (renderedWidth > 0 && element.scrollWidth > Math.ceil(renderedWidth) + 1);
    const verticalOverflow = element.scrollHeight > Math.ceil(allowedHeight) + 1;
    const reason = horizontalOverflow || verticalOverflow
      ? `DOM_MEASURED_OVERFLOW(width ${element.scrollWidth}/${Math.ceil(renderedWidth)}/${Math.ceil(availableWidth)}; height ${element.scrollHeight}/${Math.ceil(allowedHeight)})`
      : undefined;
    setDomCheck((previous) => previous.key === layoutCheckKey && previous.overflowReason === reason
      ? previous
      : { key: layoutCheckKey, overflowReason: reason });
  }, [allowedHeight, displayText, layout, layoutCheckKey]);

  if (!layout.ready) throw new CaptionLayoutError(layout.reason);
  // 切到下一张 Card 时，前一张的 DOM 复核结果不能污染新布局；新布局会在 layout effect 后写回。
  if (domCheck.key === layoutCheckKey && domCheck.overflowReason) throw new CaptionLayoutError(domCheck.overflowReason);

  return <div data-caption-track="ordinary" style={{
    position: "absolute",
    left: `${format.placement?.leftPercent ?? format.horizontalInsetPercent}%`,
    // selectComposition 元数据阶段的父画布还可能为零宽；字幕安全宽度由同一 Timeline
    // 尺寸确定，不能靠百分比收缩成仅剩底板 padding，也不能跳过真实溢出校验。
    width: snapshot.timeline.width * captionBoxWidthPercent(format) / 100,
    top: format.placement ? `${format.placement.topPercent}%` : undefined,
    bottom: format.placement ? undefined : `${format.bottomPercent}%`,
    color: format.color,
    fontSize: format.fontSize,
    fontWeight: format.fontWeight,
    lineHeight: resolved.lineHeight,
    textAlign: format.textAlign,
    textShadow: captionTextShadowCss(format.textShadow),
    fontFamily: resolved.fontFamily,
    fontStyle: format.font?.style,
    pointerEvents: "none"
  }}><span
      ref={contentRef}
      data-caption-layout={`actual-${layout.lines.length}-lines`}
      style={{
        display: "inline-block",
        maxWidth: "100%",
        width: format.boxWidth === "full" ? "100%" : undefined,
        height: allowedHeight,
        verticalAlign: "top",
        boxSizing: "border-box",
        // 只显示 layoutCaptionInBrowser 产出的 \n；pre 禁止浏览器进行额外自动折行。
        whiteSpace: "pre",
        padding: `${resolved.paddingVertical}px ${resolved.paddingHorizontal}px`,
        borderRadius: format.borderRadius ?? (backgroundColor ? "0.22em" : undefined),
        backgroundColor
      }}
    >{before}{focused && emphasis && <span style={{ display: "inline-block", color: emphasis.color ?? format.color, backgroundColor: emphasis.backgroundColor, fontWeight: emphasis.fontWeight ?? Math.min(900, format.fontWeight + 100), transform: emphasis.scale === undefined ? undefined : `scale(${emphasis.scale})`, transformOrigin: "center bottom" }}>{focused}</span>}{after}</span></div>;
};

/** 纯函数也供质量/测试核对：半开区间内同一帧最多只能命中一条 CaptionCard。 */
export function activeCaptionsAtFrame(captions: CaptionCard[], frame: number): CaptionCard[] {
  return captions.filter((caption) => captionIsDisplayed(caption, frame));
}

/** 统一字幕轨只渲染当前一条 Card；错误数据不会靠 DOM 叠加假装成功。 */
const CaptionFontLayer: React.FC<{ snapshot: ProjectSnapshot; caption: CaptionCard; mediaBaseUrl: string }> = ({ snapshot, caption, mediaBaseUrl }) => {
  const format = resolveCaptionFormat(snapshot.timeline, caption);
  const font = format.font;
  if (format.fontId && font?.fontId !== format.fontId || font && font.family !== `VFC_${font.hash}`) throw new Error("CAPTION_FONT_BINDING_INVALID: 字体选择与固定绑定不符");
  const [handle] = React.useState(() => font && !captionFontIsLoaded(font, mediaBaseUrl) ? delayRender(`载入字幕字体 ${font.fontId}`) : undefined);
  const [ready, setReady] = React.useState(() => !font || captionFontIsLoaded(font, mediaBaseUrl));
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    if (!font || handle === undefined) return;
    let disposed = false;
    loadCaptionFont(font, mediaBaseUrl).then(() => {
      if (!disposed) setReady(true);
      continueRender(handle);
    }, (reason: Error) => {
      if (!disposed) {
        setError(reason);
        if (getRemotionEnvironment().isRendering) cancelRender(reason);
      }
      continueRender(handle);
    });
    return () => { disposed = true; continueRender(handle); };
  }, [font, handle, mediaBaseUrl]);
  if (error) throw error;
  return ready ? <CaptionLayer snapshot={snapshot} caption={caption} /> : null;
};

const CaptionTrackLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string }> = ({ snapshot, mediaBaseUrl }) => {
  const frame = useCurrentFrame();
  const globalFont = snapshot.project.brief.captionMode !== "none" ? snapshot.timeline.captionFormat?.font : undefined;
  React.useEffect(() => {
    // 片头无字幕时也提前读取全片字形；失败在真正显示字幕时由正式加载门禁明确报告。
    if (globalFont) void loadCaptionFont(globalFont, mediaBaseUrl).catch(() => undefined);
  }, [globalFont, mediaBaseUrl]);
  const active = snapshot.project.brief.captionMode === "none" ? [] : activeCaptionsAtFrame(snapshot.timeline.captions, frame);
  if (active.length === 0) return null;
  if (active.length > 1) throw new CaptionTimelineOverlapError();
  const caption = active[0]!;
  const font = resolveCaptionFormat(snapshot.timeline, caption).font;
  return <CaptionFontLayer key={font?.hash ?? "legacy"} snapshot={snapshot} caption={caption} mediaBaseUrl={mediaBaseUrl} />;
};

const itemDuration = (item: TimelineItem) => item.endFrame - item.startFrame;
function previewMixGain(snapshot: ProjectSnapshot): number {
  return getRemotionEnvironment().isRendering ? 1 : Math.pow(10, (snapshot.audioMixGainDb ?? 0) / 20);
}

/**
 * 运行时复核独立 Mask 的最小事实，避免旧 Revision 或手工篡改只改 mode 字段后，
 * 让普通图片在 Player 中被误当成真实人物遮挡。
 */
function usableAlphaMaskAsset(snapshot: ProjectSnapshot, item: TimelineItem, performance: ActorPerformance | undefined) {
  if (performance?.maskMode !== "alpha_asset" || !performance.maskAssetId) return undefined;
  const actor = snapshot.assets.find((asset) => asset.id === item.assetId);
  const mask = snapshot.assets.find((asset) => asset.id === performance.maskAssetId);
  if (!actor?.metadata?.width || !actor.metadata.height
    || !mask || mask.status !== "ready" || !["image", "derived"].includes(mask.kind)
    || mask.role !== "actor_mask" || !mask.metadata?.hasAlpha
    || mask.metadata.width !== actor.metadata.width || mask.metadata.height !== actor.metadata.height
    || !performance.layout) return undefined;
  return mask;
}

function hasUsableActorMask(snapshot: ProjectSnapshot, item: TimelineItem, performance: ActorPerformance | undefined): boolean {
  if (!performance) return false;
  if (performance.maskMode === "embedded_alpha") {
    return Boolean(snapshot.assets.find((asset) => asset.id === item.assetId)?.metadata?.hasAlpha);
  }
  return Boolean(usableAlphaMaskAsset(snapshot, item, performance));
}

const VideoLayer: React.FC<{
  snapshot: ProjectSnapshot;
  mediaBaseUrl: string;
  item: TimelineItem;
  track: TimelineTrack;
  performance?: ActorPerformance;
  cutaway?: Cutaway;
  compositionFrame: number;
  pixelsHidden?: boolean;
}> = ({ snapshot, mediaBaseUrl, item, track, performance, cutaway, compositionFrame, pixelsHidden }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset) return null;
  const maskAsset = pixelsHidden ? undefined : usableAlphaMaskAsset(snapshot, item, performance);
  const cameraPunch = !cutaway && (snapshot.effectCues ?? []).find((cue) => cue.type === "CameraPunch" && cue.status === "ready" && cue.sceneId === item.sceneId && cue.startFrame <= compositionFrame && compositionFrame < cue.endFrame);
  // 推近和回位由与普通 Cue 共用的编译器决定，避免 Presenter 主画面另有一套隐藏的线性运动逻辑。
  const cameraLayout = cameraPunch ? compileCameraPunchLayout(cameraPunch, compositionFrame, performance?.layout) : undefined;
  const videoStyle: React.CSSProperties = {
    // 保持挂载与声音，不能用条件卸载或 disabled 代替像素接管。
    opacity: pixelsHidden ? 0 : 1,
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
  const sourceVolume = resolveVideoSourceVolume(snapshot, item, track, performance, cutaway) * plannedVoiceVolumeAt(snapshot, item, "source_speech", compositionFrame) * previewMixGain(snapshot);
  // 导出按时间戳解码确切源帧，不截取 HTML5 seek 后可能仍显示的旧帧；Player 仍正常连续播放。
  if (cutaway) {
    const aspectRatio = asset.metadata?.width && asset.metadata.height ? asset.metadata.width / asset.metadata.height : undefined;
    const layout = compileCutawayLayout(cutaway, aspectRatio);
    return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}>
      <div style={layout.container}>
        <OffthreadVideo useWebAudioApi={Boolean(snapshot.audioMixGainDb)} src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={sourceVolume} transparent={Boolean(asset.metadata?.hasAlpha)} style={layout.media} />
      </div>
    </Sequence>;
  }
  return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}><OffthreadVideo useWebAudioApi={Boolean(snapshot.audioMixGainDb)} src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={sourceVolume} transparent={Boolean(asset.metadata?.hasAlpha)} style={videoStyle} /></Sequence>;
};

const AudioLayer: React.FC<{ snapshot: ProjectSnapshot; mediaBaseUrl: string; item: TimelineItem; track: TimelineTrack; cue?: AudioCue }> = ({ snapshot, mediaBaseUrl, item, track, cue }) => {
  const asset = snapshot.assets.find((candidate) => candidate.id === item.assetId);
  if (!asset || item.mediaAudioPolicy === "mute") return null;
  // loop 会让 Audio 自身的回调帧回到源片段开头；Duck 必须始终按整条成片的全局时间判断。
  const compositionFrame = useCurrentFrame();
  const timelineLocalFrame = compositionFrame - item.startFrame;
  const vlogAmbientVolume = resolveVlogAmbientVolume(snapshot, item, track);
  if (cue?.loop && (cue.loopCrossfadeFrames ?? 0) > 0) {
    const length = item.sourceEndFrame - item.sourceStartFrame, crossfade = cue.loopCrossfadeFrames!, step = length - crossfade;
    const offsets = Array.from({ length: Math.ceil(itemDuration(item) / step) }, (_, index) => index * step);
    return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}>{offsets.map((offset, index) => <Sequence key={offset} from={offset} durationInFrames={Math.min(length, itemDuration(item) - offset)}><Audio useWebAudioApi={Boolean(snapshot.audioMixGainDb)} src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} volume={() => {
      const local = timelineLocalFrame - offset;
      const enter = index ? Math.min(1, Math.max(0, local / crossfade)) : 1;
      const leave = offset + step < itemDuration(item) ? Math.min(1, Math.max(0, (length - local) / crossfade)) : 1;
      return audioCueVolumeAt(snapshot, item, track, cue, timelineLocalFrame) * enter * leave * previewMixGain(snapshot);
    }} /></Sequence>)}</Sequence>;
  }
  return <Sequence from={item.startFrame} durationInFrames={itemDuration(item)}><Audio useWebAudioApi={Boolean(snapshot.audioMixGainDb)} src={mediaUrl(snapshot, mediaBaseUrl, asset.managedPath)} startFrom={item.sourceStartFrame} endAt={item.sourceEndFrame} loop={cue?.loop ?? false} volume={() => (vlogAmbientVolume ?? audioCueVolumeAt(snapshot, item, track, cue, timelineLocalFrame)) * previewMixGain(snapshot)} /></Sequence>;
};

/**
 * Web Player 与 Render Worker 都消费同一 Revision Snapshot。人物 Mask、效果层和字幕
 * 均由同一组合规则渲染，未提供 Mask 时明确走可见的前景降级。
 */
export const ProjectComposition: React.FC<CompositionProps> = ({ snapshot, mediaBaseUrl, captionsOnly }) => {
  const frame = useCurrentFrame();
  const tracksById = new Map(snapshot.timeline.tracks.map((track) => [track.id, track]));
  const reachability = resolveCompositionReachability(snapshot);
  const visual = compileVisualComposition(snapshot, reachability);
  const primaryCueIds = new Set(visual.primaryCues.map(cue => cue.id));
  const pixelsHidden = (id: string) => (visual.replacedActorRanges.get(id) ?? []).some(range => range.startFrame <= frame && frame < range.endFrame);
  // 旧 Revision 可能还没有人物表演字段，预览应以“没有登记人物”降级而不是崩溃。
  const performancesByItem = new Map((snapshot.actorPerformances ?? []).filter((performance) => performance.status === "ready").map((performance) => [performance.timelineItemId, performance]));
  const cutawaysByItem = new Map((snapshot.cutaways ?? []).filter((cutaway) => cutaway.status === "ready").map((cutaway) => [cutaway.timelineItemId, cutaway]));
  const videoItems = snapshot.timeline.items
    .filter((item) => reachability.videoItemIds.has(item.id))
    // Track 0 是工作台最上层，DOM 需要从底层到顶层绘制。
    .sort((left, right) => (tracksById.get(right.trackId)!.order - tracksById.get(left.trackId)!.order) || left.startFrame - right.startFrame);
  const audioItems = snapshot.timeline.items
    .filter((item) => reachability.audioItemIds.has(item.id))
    .sort((left, right) => left.startFrame - right.startFrame);
  const audioCuesByItem = new Map((snapshot.audioCues ?? []).filter((cue) => cue.status === "ready").map((cue) => [cue.timelineItemId, cue]));
  const readyCues = (snapshot.effectCues ?? []).filter((cue) => reachability.effectCueIds.has(cue.id));
  const cuesAt = (...layers: EffectCue["layer"][]) => readyCues.filter((cue) => layers.includes(cue.layer));
  // 解释片的全屏 Cue 与原生 Program 都是主视觉，不能在 Cutaway 之上再次盖回模型。
  // 明确 front 包装仍在 Cutaway 上方；主视觉一直使用原局部时间，返回不重启动画。
  const explainerSceneIds = new Set(snapshot.scenes.filter(scene => scene.type === "ExplainerScene").map(scene => scene.id));
  const primaryExplainerCues = cuesAt("fullscreen").filter(cue => explainerSceneIds.has(cue.sceneId) && !primaryCueIds.has(cue.id));
  const renderVideoItem = (item: TimelineItem) => <VideoLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} performance={performancesByItem.get(item.id)} cutaway={cutawaysByItem.get(item.id)} pixelsHidden={pixelsHidden(item.id)} compositionFrame={frame} />;
  // 后景 Cue 只有被同一个 Actor / A-roll 人物在完整范围内覆盖时才能置于人物后方。
  const hasMaskedActorFor = (cue: EffectCue) => videoItems.some((item) => {
    if (pixelsHidden(item.id) || item.sceneId !== cue.sceneId || item.startFrame > cue.startFrame || item.endFrame < cue.endFrame
      || tracksById.get(item.trackId)?.name !== "Actor / A-roll") return false;
    const performance = performancesByItem.get(item.id);
    return hasUsableActorMask(snapshot, item, performance);
  });
  const rearCues = cuesAt("rear");

  if (captionsOnly) return <AbsoluteFill><CaptionTrackLayer snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} /></AbsoluteFill>;
  return <AbsoluteFill style={{ backgroundColor: "#070914", overflow: "hidden" }}>
    {rearCues.filter(hasMaskedActorFor).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {videoItems.filter(item => !cutawaysByItem.has(item.id)).map(renderVideoItem)}
    {/* ExplainerProgram 是主视觉，不借用 Presenter Cue；没有对应 Program 的普通 Scene 不会凭空渲染。 */}
    <ExplainerSceneLayer snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} />
    {primaryExplainerCues.map(cue => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {visual.primaryCues.map(cue => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {videoItems.filter(item => cutawaysByItem.has(item.id)).map(renderVideoItem)}
    {rearCues.filter((cue) => !hasMaskedActorFor(cue)).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {cuesAt("actor", "front").map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    {cuesAt("fullscreen").filter(cue => !explainerSceneIds.has(cue.sceneId) && !primaryCueIds.has(cue.id)).map((cue) => <CueLayer key={cue.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} cue={cue} />)}
    <CaptionTrackLayer snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} />
    {audioItems.map((item) => <AudioLayer key={item.id} snapshot={snapshot} mediaBaseUrl={mediaBaseUrl} item={item} track={tracksById.get(item.trackId)!} cue={audioCuesByItem.get(item.id)} />)}
  </AbsoluteFill>;
};

export { mediaUrl, compileCameraPunchLayout, compileMotionLayout, resolveEffectStylePack, compileCutawayLayout, cutawaySourceVolume };
export { resolveCompositionReachability, type CompositionReachability } from "./composition-reachability";
export {
  ADVANCED_VISUAL_RUNTIME_CAPABILITIES,
  RESTRICTED_SCENE_ACCENTS,
  RESTRICTED_SCENE_SCHEMA_VERSION,
  RESTRICTED_SCENE_TEMPLATES,
  RestrictedSceneVisual,
  resolveAdvancedVisualRequest,
  resolveRestrictedScene
} from "./restricted-scene-registry";
