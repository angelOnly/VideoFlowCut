import { join } from "node:path";
import { readRuntimeConfig } from "@videocut/project-overview";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parseHTML } from "linkedom";
import ts from "typescript";
import type { BoundMotionFont, BoundMotionImage, BoundMotionVideo, DecodedMotionVideo, MotionSubmission } from "./schema.js";
import type { FrozenSourceDisplay } from "../../contracts/src/source-display-policy.js";
import { motionFontProps } from "./fonts.js";
import { MotionSourceValidationError } from "./source-validation-error.js";
import { HYPERFRAMES_DEPENDENCIES, IMAGE_SLOT_ATTRIBUTE, VIDEO_SLOT_ATTRIBUTE, MOTION_ENGINE_VERSION } from "./hyperframes-contract.js";
import { MATERIAL_MATH_SOURCE } from "./material-math-source.js";
export { MOTION_ENGINE_VERSION } from "./hyperframes-contract.js";

export function parseMotionHtml(source: string): Document { return parseHTML(source).document; }

/** HTML 校验检查已发布入口和资源约定；执行隔离仍由浏览器、CSP 与网络拦截负责。 */
export function validateMotionSource(source: string, work?: Pick<MotionSubmission, "width" | "height" | "fps" | "durationInFrames" | "imageBindings" | "videoBindings">): void {
  const reject = (code: string, message: string, token: string, suggestion: string, position = Math.max(0, source.indexOf(token))): never => {
    const prefix = source.slice(0, position).split("\n");
    throw new MotionSourceValidationError(code, message, { line: prefix.length, column: prefix.at(-1)!.length + 1 }, "HTML", token.slice(0, 160), suggestion);
  };
  if (!/^\s*<!doctype\s+html\s*>/iu.test(source) || !/<html[\s>]/iu.test(source) || !/<\/html\s*>\s*$/iu.test(source))
    reject("MOTION_SOURCE_INVALID", "提交完整 HTML 文档；旧 TSX 入口已停用", source.slice(0, 80), "读取 read_motion_capabilities 的 HyperFrames 合同");
  const doc = parseMotionHtml(source);
  const roots = [...doc.querySelectorAll("[data-composition-id]")].filter(el => !el.parentElement?.closest("[data-composition-id]"));
  if (roots.length !== 1) reject("MOTION_COMPOSITION_INVALID", "需要唯一主合成", "data-composition-id", "设置一个根 data-composition-id 并注册同名暂停时间线");
  const root = roots[0]!;
  if (!root.getAttribute("data-composition-id")?.trim()) reject("MOTION_COMPOSITION_INVALID", "合成 ID 不能为空", root.outerHTML, "设置实际合成 ID");
  if (work) for (const [attr, value] of Object.entries({ "data-width": work.width, "data-height": work.height, "data-duration": work.durationInFrames / work.fps, "data-start": 0 })) {
    const actual = root.getAttribute(attr);
    if (actual === null || !Number.isFinite(Number(actual)) || Math.abs(Number(actual) - value) > 1e-7)
      reject("MOTION_COMPOSITION_MISMATCH", `${attr} 必须与作品一致：${value}`, attr, "按实际画布与最终时长同时更新 HTML 和 work");
  }
  for (const el of doc.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    if (["iframe", "object", "embed", "base", "link", "audio", "video"].includes(tag) || tag === "meta" && el.hasAttribute("http-equiv"))
      reject("MOTION_DOM_REJECTED", `不支持 ${tag} 入口`, el.outerHTML, "CSS/JS 内联；图片和视频按槽绑定，声音交外层正式链路");
    if ([...el.attributes].some(attr => /^on/iu.test(attr.name))) reject("MOTION_DOM_REJECTED", "内联事件属性不参与确定性求值", el.outerHTML, "在暂停的主时间线中表达动作");
    for (const attr of [IMAGE_SLOT_ATTRIBUTE, VIDEO_SLOT_ATTRIBUTE]) if (el.hasAttribute(attr)) {
      const slot = el.getAttribute(attr)!;
      const bindings = attr === IMAGE_SLOT_ATTRIBUTE ? work?.imageBindings : work?.videoBindings;
      if (!["img", "image"].includes(tag) || attr === VIDEO_SLOT_ATTRIBUTE && (tag !== "img" || !el.id) || el.hasAttribute("src") || el.hasAttribute("href") || el.hasAttribute("srcset") || el.hasAttribute("xlink:href"))
        reject("MOTION_RESOURCE_INVALID", "槽元素使用 img（图片也可用 SVG image），视频须有稳定 id，不能同时自带资源地址", el.outerHTML, "移除 src/href/srcset；填写真实槽名");
      if (work && !Object.hasOwn(bindings ?? {}, slot)) reject("MOTION_RESOURCE_INVALID", `未绑定槽位 ${slot}`, el.outerHTML, "补齐当前作品的素材绑定");
    }
  }
  for (const el of doc.querySelectorAll("script")) {
    if (el.hasAttribute("src") || !["", "text/javascript", "application/javascript"].includes(el.getAttribute("type") ?? ""))
      reject("MOTION_IMPORT_REJECTED", "仅接受普通内联 JavaScript；GSAP/HyperFrames 由平台固定提供", el.outerHTML, "移除外部加载和模块 import，直接使用 gsap 与 window.vfc");
    const code = el.textContent ?? "";
    const file = ts.createSourceFile("motion.js", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const diagnostic = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics[0];
    if (diagnostic) reject("MOTION_SOURCE_INVALID", ts.flattenDiagnosticMessageText(diagnostic.messageText, " "), code.slice(diagnostic.start ?? 0, (diagnostic.start ?? 0) + 80), "修正内联 JavaScript 语法", source.indexOf(code) + (diagnostic.start ?? 0));
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isExportAssignment(node) || ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
        reject("MOTION_IMPORT_REJECTED", "作品不加载外部模块", node.getText(file), "使用已发布的固定运行库与内联实现");
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
}

export function motionHash(input: MotionSubmission, images: BoundMotionImage[] = [], engineVersion = MOTION_ENGINE_VERSION, videos: BoundMotionVideo[] = [], fonts: BoundMotionFont[] = [], sourceDisplay?: FrozenSourceDisplay): string {
  return createHash("sha256").update(JSON.stringify({ engineVersion, dependencies: HYPERFRAMES_DEPENDENCIES, input, images, videos, fonts, sourceDisplay })).digest("hex");
}
/** 完整请求继续用于幂等；像素键不含名称、说明、参考观察和上一版本。 */
export function motionPixelKey(input: MotionSubmission, images: BoundMotionImage[] = [], videos: BoundMotionVideo[] = [], fonts: BoundMotionFont[] = []): string {
  const sort = (entries: Array<Record<string, unknown>>) => [...entries].sort((a, b) => String(a.slot).localeCompare(String(b.slot)));
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)])) : value;
  return createHash("sha256").update(JSON.stringify(canonical({ engine: MOTION_ENGINE_VERSION, dependencies: HYPERFRAMES_DEPENDENCIES,
    source: input.source, props: input.props, width: input.width, height: input.height, fps: input.fps, frames: input.durationInFrames,
    compositing: input.compositing ?? "alpha", encoding: input.compositing === "opaque" ? "h264-crf18-bt709-v1" : "ffv1-bgra-v1",
    images: sort(images.map(({ slot, hash }) => ({ slot, hash }))), videos: sort(videos.map(({ assetId, managedPath, ...v }) => v)), fonts: sort(fonts)
  }))).digest("hex");
}
export function motionHashEngine(input: MotionSubmission, images: BoundMotionImage[], version: unknown, declared?: unknown, videos: BoundMotionVideo[] = [], fonts: BoundMotionFont[] = [], sourceDisplay?: FrozenSourceDisplay): string {
  if (declared !== undefined && declared !== MOTION_ENGINE_VERSION) throw new Error("MOTION_ENGINE_UPGRADE_REQUIRED: 历史资产可读取，重新生成须提交 HTML 新版本");
  if (motionHash(input, images, MOTION_ENGINE_VERSION, videos, fonts, sourceDisplay) !== version) throw new Error("MOTION_VERSION_MISMATCH");
  return MOTION_ENGINE_VERSION;
}

const json = (value: unknown) => JSON.stringify(value).replace(/</gu, "\\u003c");
/** 读取固定包提供的浏览器构建；不在后台调用 OpenDesign。 */
export function readHyperframesLibraries() {
  const release = readRuntimeConfig().runtime.distributionDirectory;
  if (release) {
    const root = join(release, "hyperframes");
    const versions = JSON.parse(readFileSync(join(root, "versions.json"), "utf8"));
    if (versions.hyperframes !== HYPERFRAMES_DEPENDENCIES.hyperframes || versions.gsap !== HYPERFRAMES_DEPENDENCIES.gsap) throw new Error("MOTION_DEPENDENCY_VERSION: 发行运行库版本不匹配");
    return { gsap: readFileSync(join(root, "gsap.min.js"), "utf8"), hyperframes: readFileSync(join(root, "hyperframe.runtime.iife.js"), "utf8") };
  }
  const require = createRequire(typeof __filename === "string" ? __filename : import.meta.url);
  for (const [name, expected] of [["@hyperframes/core", HYPERFRAMES_DEPENDENCIES.hyperframes], ["gsap", HYPERFRAMES_DEPENDENCIES.gsap]]) {
    if (JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8")).version !== expected) throw new Error(`MOTION_DEPENDENCY_VERSION: ${name} 需要 ${expected}`);
  }
  return { gsap: readFileSync(require.resolve("gsap/dist/gsap.min.js"), "utf8"), hyperframes: readFileSync(require.resolve("@hyperframes/core/runtime"), "utf8") };
}

export async function compileMotion(input: MotionSubmission, imageData: Record<string, string> = {}, videos: Record<string, DecodedMotionVideo> = {}, fonts: BoundMotionFont[] = [], fontCss = ""): Promise<string> {
  validateMotionSource(input.source, input);
  const doc = parseMotionHtml(input.source);
  const libraries = readHyperframesLibraries();
  const scripts = [...doc.querySelectorAll("script")].map(el => { const code = el.textContent ?? ""; el.remove(); return code; });
  const config = { width: input.width, height: input.height, fps: input.fps, durationInFrames: input.durationInFrames };
  const fontProps = motionFontProps(fonts);
  const style = doc.createElement("style");
  style.textContent = `${fontCss}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}svg{text-rendering:geometricPrecision}[data-vfc-out-of-range]{visibility:hidden!important}`;
  doc.head.prepend(style);
  const bootstrap = `window.addEventListener('securitypolicyviolation',e=>console.error('MOTION_CSP_VIOLATION:'+e.violatedDirective));
window.addEventListener('error',e=>{window.__motionError=String(e.error||e.message)});
window.addEventListener('unhandledrejection',e=>{window.__motionError=String(e.reason)});
window.__HF_EXPORT_RENDER_SEEK_CONFIG={fps:${input.fps},fpsSource:'render-options'};
window.vfc=${json({ props: { ...input.props, assets: imageData, fonts: fontProps }, config, assets: imageData, fonts: fontProps })};
(()=>{${MATERIAL_MATH_SOURCE.replace(/export /gu, "")} window.vfc.geometry={fitSource,focusCover,sourcePoint,parentPoint,frameMapping,previewRange};})();
const appendScript=code=>{const script=document.createElement('script');script.textContent=code;document.body.appendChild(script);};
const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
(async()=>{try{
 const images=vfc.assets,fonts=vfc.fonts,ranges=${json(videos)};
 for(const [slot,url] of Object.entries(images))document.documentElement.style.setProperty('--vfc-image-'+slot,'url("'+url+'")');
 for(const [slot,font] of Object.entries(fonts))document.documentElement.style.setProperty('--vfc-font-'+slot,'"'+font.family+'"');
 const bindImages=()=>{for(const el of document.querySelectorAll('[${IMAGE_SLOT_ATTRIBUTE}]')){const url=images[el.getAttribute('${IMAGE_SLOT_ATTRIBUTE}')];if(!url)throw Error('MOTION_IMAGE_BINDING_MISMATCH');el.setAttribute(el.tagName.toLowerCase()==='image'?'href':'src',url);}};
 bindImages();
 await Promise.all(Object.values(images).map(src=>{const img=new Image();img.src=src;return img.decode()}));
 await Promise.all(Object.values(fonts).map(async font=>{try{const loaded=await document.fonts.load(font.style+' '+font.weight+' 16px "'+font.family+'"');if(!loaded.length||loaded.some(f=>f.status!=='loaded'))throw Error('字体未就绪');}catch(error){throw Error('MOTION_FONT_LOAD_FAILED: '+font.family+': '+String(error));}}));
 await document.fonts.ready;
 let videoElements=[];
 const blank='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

 appendScript(${json(libraries.gsap)});
 window.__timelines={};
 for(const code of ${json(scripts)})appendScript(code);
 bindImages();
 await Promise.all([...document.querySelectorAll('img[${IMAGE_SLOT_ATTRIBUTE}]')].map(el=>el.decode()));
 videoElements=[...document.querySelectorAll('[${VIDEO_SLOT_ATTRIBUTE}]')];
 const videoIds=new Set();
 for(const el of videoElements){const range=ranges[el.getAttribute('${VIDEO_SLOT_ATTRIBUTE}')];if(el.tagName!=='IMG'||!el.id||videoIds.has(el.id))throw Error('MOTION_RESOURCE_INVALID: 视频元素须为 img 并具有唯一稳定 ID');videoIds.add(el.id);if(!range)throw Error('MOTION_VIDEO_BINDING_MISMATCH');el.src=blank;el.setAttribute('data-start',String(range.startFrame/vfc.config.fps));el.setAttribute('data-duration',String((range.endFrame-range.startFrame)/vfc.config.fps));}
 if(window.__motionError)throw Error(window.__motionError);
 const root=document.querySelector('[data-composition-id]');const timeline=window.__timelines[root.getAttribute('data-composition-id')];
 if(!timeline||!timeline.paused()||Math.abs(timeline.totalDuration()-vfc.config.durationInFrames/vfc.config.fps)>1e-7)throw Error('MOTION_TIMELINE_INVALID: 主时间线须暂停，且总时长与作品一致');
 appendScript(${json(libraries.hyperframes)});
 while(!window.__renderReady||!window.__playerReady){if(window.__motionError)throw Error(window.__motionError);await paint();}
 window.__player.pause();gsap.ticker.sleep();
 window.__readMotionEvents=()=>typeof window.getVfcMotionEvents==='function'?window.getVfcMotionEvents():null;
 window.__motionSeek=async frame=>{
  if(!Number.isInteger(frame)||frame<0||frame>=vfc.config.durationInFrames)throw Error('MOTION_FRAME_RANGE');
  window.__player.renderSeek(frame/vfc.config.fps);await window.__hfWaitForSeekCompletion?.();
  await Promise.all(videoElements.map(async el=>{const slot=el.getAttribute('${VIDEO_SLOT_ATTRIBUTE}'),range=ranges[slot];const active=frame>=range.startFrame&&frame<range.endFrame;
   el.toggleAttribute('data-vfc-out-of-range',!active);el.src=active?'https://motion.invalid/video/'+slot+'/'+frame+'.png':blank;await el.decode();}));
  await document.fonts.ready;await paint();if(window.__motionError)throw Error(window.__motionError);
 };
 window.__motionReady=true;
}catch(error){window.__motionError=String(error);}})();`;
  const script = doc.createElement("script");
  script.textContent = bootstrap.replace(/<\/script/giu, "<\\/script");
  doc.body.appendChild(script);
  return doc.toString();
}

/** 延后插入的作者脚本也按原文哈希授权，不开放任意脚本加载。 */
export function motionContentSecurityPolicy(html: string, source: string): string {
  const libraries = readHyperframesLibraries();
  const scripts = [libraries.gsap, libraries.hyperframes, ...[...parseMotionHtml(source).querySelectorAll("script")].map(el => el.textContent ?? ""), ...[...parseMotionHtml(html).querySelectorAll("script")].map(el => el.textContent ?? "")];
  const hashes = [...new Set(scripts.map(code => `'sha256-${createHash("sha256").update(code).digest("base64")}'`))].join(" ");
  return `default-src 'none'; script-src ${hashes}; style-src 'unsafe-inline'; img-src data: https://motion.invalid/video/; font-src https://motion.invalid/fonts/; media-src 'none'; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts`;
}
