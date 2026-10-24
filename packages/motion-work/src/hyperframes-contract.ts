/** 作者、提交校验与 Worker 共用的 HTML 合同；变更运行依赖必须升级作品身份。 */
export const HYPERFRAMES_DEPENDENCIES = { hyperframes: "0.8.1", gsap: "3.14.2" } as const;
export const MOTION_ENGINE_VERSION = "managed-hyperframes-1";
export const MOTION_SOURCE_MAX_LENGTH = 2_000_000;
export const IMAGE_SLOT_ATTRIBUTE = "data-vfc-image-slot";
export const VIDEO_SLOT_ATTRIBUTE = "data-vfc-video-slot";
export const hyperframesContract = {
  sourceFormat: "html", maxSourceLength: MOTION_SOURCE_MAX_LENGTH,
  dependencies: HYPERFRAMES_DEPENDENCIES,
  entry: "完整单页 HTML；CSS/JS 内联；不得携带外部脚本、样式或原生音视频。平台先加载绑定资源与字体，再执行普通内联脚本，最后启动 HyperFrames。不要依赖 DOMContentLoaded 回调。",
  composition: "一个根 data-composition-id，data-width/data-height/data-duration 与 work 一致（duration 单位秒），data-start=0；将暂停的 GSAP 主时间线按该 ID 注册到 window.__timelines，实际总时长与 work 一致。",
  startup: "window.vfc={props,config:{width,height,fps,durationInFrames},assets,fonts,geometry}；props.assets/props.fonts 保留平台字段；geometry 提供 fitSource/focusCover/sourcePoint/parentPoint/frameMapping/previewRange。",
  images: { attribute: IMAGE_SLOT_ATTRIBUTE, css: "--vfc-image-<slot>", usage: "img 或 SVG image 用槽属性；背景与遮罩使用 CSS var(--vfc-image-<slot>)；脚本可读 vfc.assets[slot]。" },
  videos: { attribute: VIDEO_SLOT_ATTRIBUTE, clock: "work_root", usage: "稳定 id 的 img 使用视频槽；平台注入 data-start/data-duration 与根帧图像，正常速度静音，显隐和变换不重置源时间；不得自改 src 或绑定范围。" },
  fonts: { css: "--vfc-font-<slot>", usage: "font-family:var(--vfc-font-title)；实际 family/weight/style 也见 vfc.fonts[slot]。所有字形测量在作者脚本执行时进行。" },
  events: "可选 window.getVfcMotionEvents() 返回原事件条目 {id,meaning,startFrame,endFrame?}；从动画共用时序计算，帧坐标以作品根时钟为准。",
  rendering: "HyperFrames renderSeek 按根秒求值，再注入视频帧、检查实际 DOM、等待绘制并保存透明 RGBA PNG。局部校样保留完整时钟；声音与普通字幕沿外层正式链路。",
} as const;
