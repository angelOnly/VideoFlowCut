import { z } from "zod";
import { parseHTML } from "linkedom";
/** 作者清单跨项目合同；OpenDesign 的副本由同步脚本生成。 */
export const AUTHORED_MOTION_MANIFEST_CONTRACT = "videoflowcut.authored-motion-manifest.v1";
export const MOTION_SOURCE_MAX_LENGTH = 2_000_000;
export const IMAGE_SLOT_ATTRIBUTE = "data-vfc-image-slot";
export const VIDEO_SLOT_ATTRIBUTE = "data-vfc-video-slot";
const slot = z.string().regex(/^[a-z][A-Za-z0-9_]{0,39}$/u);
const description = z.string().trim().min(8).max(1800);
/** 作者字段与正式提交共享同一个维护源。 */
export const motionWorkFields = z.object({
    compositing: z.enum(["opaque", "alpha"]).optional().describe("正式画面用途，省略时保留透明；opaque 要求输出不透明"),
    name: z.string().trim().min(1).max(120),
    props: z.record(z.unknown()).default({}).describe("作者输入，assets 与 fonts 由平台注入"),
    imageBindings: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/u), z.string().min(1).max(150)).default({}).describe("图片槽名到已就绪项目素材 ID 的映射"),
    width: z.number().int().min(64).max(1920).describe("画布宽度，64 至 1920 的偶数"), height: z.number().int().min(64).max(1920).describe("画布高度，64 至 1920 的偶数"),
    fps: z.number().int().min(15).max(60).describe("作品整数帧率"), durationInFrames: z.number().int().min(2).max(Number.MAX_SAFE_INTEGER).describe("作品根时钟的完整帧数；平台有界取帧并连续渲染，不按30秒、900帧或累计像素帧要求作者拆件。"),
    reference: z.object({ url: z.string().url(), observation: z.object({ layout: description, motion: description, rhythm: description, adaptation: description, evidence: description }).strict() }).strict().optional(),
    sourceDisplayScopeId: z.string().trim().min(1).max(150).optional().describe("已授权的来源说明范围，省略时使用项目范围"),
    creativeBrief: z.string().trim().min(1).max(6000).optional().describe("新作品的创作说明，完整编排指令由交付文件承载"),
    videoBindings: z.record(slot, z.object({
        assetId: z.string().min(1).max(150), sourceStartMs: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), sourceEndMs: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), endFrame: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        decodeScale: z.number().finite().gt(0).max(1).optional()
    }).strict()).optional().describe("视频槽绑定素材 ID、源毫秒范围和作品根帧范围，正常速度且静音"),
    fontBindings: z.record(slot, z.string().regex(/^[a-z][a-z0-9-]{0,79}$/u)).optional().describe("字体槽名到已登记 fontId 的映射，最多 8 槽")
}).strict();
export function validateMotionWorkFields(value, ctx) {
    if (!Number.isSafeInteger(value.width * value.height * value.durationInFrames * 8))
        ctx.addIssue({ code: "custom", message: "作品输出体积超过安全整数范围" });
    if (JSON.stringify(value.props).length > 24_000)
        ctx.addIssue({ code: "custom", path: ["props"], message: "Props 超过大小上限" });
    if (Object.keys(value.imageBindings).length > 8)
        ctx.addIssue({ code: "custom", path: ["imageBindings"], message: "单个作品最多绑定 8 个图片素材" });
    if ("assets" in value.props || "fonts" in value.props)
        ctx.addIssue({ code: "custom", path: ["props"], message: "Props.assets 和 Props.fonts 由平台注入" });
    if (Object.keys(value.fontBindings ?? {}).length > 8)
        ctx.addIssue({ code: "custom", path: ["fontBindings"], message: "单个作品最多绑定 8 个字体槽位" });
    if (value.width % 2)
        ctx.addIssue({ code: "custom", path: ["width"], message: "画布宽度必须是偶数" });
    if (value.height % 2)
        ctx.addIssue({ code: "custom", path: ["height"], message: "画布高度必须是偶数" });
    for (const [name, binding] of Object.entries(value.videoBindings ?? {})) {
        const frames = binding.endFrame - binding.startFrame, duration = binding.sourceEndMs - binding.sourceStartMs;
        if (frames <= 0 || binding.endFrame > value.durationInFrames)
            ctx.addIssue({ code: "custom", path: ["videoBindings", name], message: "视频作品帧范围必须为正且位于作品内" });
        if (duration <= 0 || duration + 1 < frames * 1000 / value.fps || duration - frames * 1000 / value.fps >= 1000 / value.fps + 1)
            ctx.addIssue({ code: "custom", path: ["videoBindings", name], message: "视频源范围与作品帧范围不匹配" });
    }
}
export const authoredMotionWorkFields = motionWorkFields.extend({ creativeBrief: z.string().trim().min(1).max(6000).describe("作者创作说明，完整指令使用交付文件") }).strict();
export const authoredMotionWorkSchema = authoredMotionWorkFields.superRefine(validateMotionWorkFields);
export class MotionSourceValidationError extends Error {
    code;
    location;
    nodeKind;
    token;
    suggestion;
    constructor(code, message, location, nodeKind, token, suggestion) {
        super(`${code}: ${message}`);
        this.code = code;
        this.location = location;
        this.nodeKind = nodeKind;
        this.token = token;
        this.suggestion = suggestion;
        this.name = "MotionSourceValidationError";
    }
}
export class AuthoredMotionValidationError extends Error {
    field;
    code = "MOTION_MANIFEST_INVALID";
    constructor(field, message) {
        super(`MOTION_MANIFEST_INVALID: ${field} ${message}`);
        this.field = field;
    }
}
/** 发布与导入共用 HTML 根时钟、入口和素材槽检查。 */
export function validateAuthoredMotionSource(source, work) {
    const reject = (code, message, token, suggestion) => {
        const prefix = source.slice(0, Math.max(0, source.indexOf(token))).split("\n");
        throw new MotionSourceValidationError(code, message, { line: prefix.length, column: prefix.at(-1).length + 1 }, "HTML", token.slice(0, 160), suggestion);
    };
    if (source.length < 20 || source.length > MOTION_SOURCE_MAX_LENGTH)
        reject("MOTION_SOURCE_INVALID", `源码长度必须为 20 至 ${MOTION_SOURCE_MAX_LENGTH} 字符`, source.slice(0, 80), "按作品源码合同提交完整 HTML");
    if (!/^\s*<!doctype\s+html\s*>/iu.test(source) || !/<html[\s>]/iu.test(source) || !/<\/html\s*>\s*$/iu.test(source))
        reject("MOTION_SOURCE_INVALID", "提交完整 HTML 文档", source.slice(0, 80), "读取作品源码合同");
    const doc = parseHTML(source).document;
    const roots = [...doc.querySelectorAll("[data-composition-id]")].filter(el => !el.parentElement?.closest("[data-composition-id]"));
    if (roots.length !== 1 || !roots[0]?.getAttribute("data-composition-id")?.trim())
        reject("MOTION_COMPOSITION_INVALID", "需要唯一主合成", "data-composition-id", "设置一个根合成 ID");
    const root = roots[0];
    if (work)
        for (const [attr, value] of Object.entries({ "data-width": work.width, "data-height": work.height, "data-duration": work.durationInFrames / work.fps, "data-start": 0 })) {
            const actual = root.getAttribute(attr);
            if (actual === null || !Number.isFinite(Number(actual)) || Math.abs(Number(actual) - value) > 1e-7)
                reject("MOTION_COMPOSITION_MISMATCH", `${attr} 必须与作品一致：${value}`, attr, "同时更新 HTML 和作品规格");
        }
    for (const el of doc.querySelectorAll("*")) {
        const tag = el.tagName.toLowerCase();
        if (["iframe", "object", "embed", "base", "link", "audio", "video"].includes(tag) || tag === "meta" && el.hasAttribute("http-equiv"))
            reject("MOTION_DOM_REJECTED", `不支持 ${tag} 入口`, el.outerHTML, "资源按槽绑定，声音交外层处理");
        if ([...el.attributes].some(attr => /^on/iu.test(attr.name)))
            reject("MOTION_DOM_REJECTED", "内联事件属性不参与确定性求值", el.outerHTML, "在主时间线中表达动作");
        for (const attr of [IMAGE_SLOT_ATTRIBUTE, VIDEO_SLOT_ATTRIBUTE])
            if (el.hasAttribute(attr)) {
                const name = el.getAttribute(attr), bindings = attr === IMAGE_SLOT_ATTRIBUTE ? work?.imageBindings : work?.videoBindings;
                if (!["img", "image"].includes(tag) || attr === VIDEO_SLOT_ATTRIBUTE && (tag !== "img" || !el.id) || ["src", "href", "srcset", "xlink:href"].some(key => el.hasAttribute(key)))
                    reject("MOTION_RESOURCE_INVALID", "槽元素或资源地址无效", el.outerHTML, "使用合法槽元素并移除资源地址");
                if (work && !Object.hasOwn(bindings ?? {}, name))
                    reject("MOTION_RESOURCE_INVALID", `未绑定槽位 ${name}`, el.outerHTML, "补齐当前作品的素材绑定");
            }
    }
    for (const el of doc.querySelectorAll("script"))
        if (el.hasAttribute("src") || !["", "text/javascript", "application/javascript"].includes(el.getAttribute("type") ?? ""))
            reject("MOTION_IMPORT_REJECTED", "仅接受普通内联 JavaScript", el.outerHTML, "移除外部加载和模块 import");
}
const authoredRangeFields = z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict();
/** 字段描述与运行时校验共享同一 Schema；跨字段关系在运行时执行。 */
export const authoredMotionManifestFields = z.object({
    authorSubmissionId: z.string().min(1).max(160).describe("作者交件身份"),
    sourceFile: z.string().min(1).describe("制作项目中的完整 HTML 源码路径"),
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u).describe("源码 SHA-256"),
    work: authoredMotionWorkFields,
    readyRanges: z.array(authoredRangeFields).min(1).describe("已完成的作品根帧半开范围"),
    changedRanges: z.array(authoredRangeFields.extend({ reason: z.string().min(1) }).strict()).describe("本版改变的作品根帧范围和原因")
}).strict();
// 作者提交时由阶段命令填充源码路径、哈希和交件身份。
export const authoredMotionInputFields = authoredMotionManifestFields.partial({ authorSubmissionId: true, sourceFile: true, sourceSha256: true });
export function parseAuthoredMotionManifest(value) {
    const fail = (error, prefix = []) => {
        const issue = error.issues[0];
        const keys = issue.code === "unrecognized_keys" ? [...issue.path, issue.keys[0]] : issue.path;
        const field = [...prefix, ...keys].reduce((text, part) => typeof part === "number" ? `${text}[${part}]` : text ? `${text}.${part}` : part, "");
        throw new AuthoredMotionValidationError(issue.code === "unrecognized_keys" && !field.includes(".") ? `不支持字段 ${field}` : field, issue.message);
    };
    const parsed = authoredMotionManifestFields.safeParse(value);
    if (!parsed.success)
        return fail(parsed.error);
    const manifest = parsed.data;
    const work = authoredMotionWorkSchema.safeParse(manifest.work);
    if (!work.success)
        return fail(work.error, ["work"]);
    for (const item of [...manifest.readyRanges, ...manifest.changedRanges]) {
        if (item.endFrame <= item.startFrame || item.endFrame > manifest.work.durationInFrames) {
            throw new Error("MOTION_MANIFEST_RANGE_INVALID: 范围必须非空且位于作品内");
        }
    }
    return manifest;
}
//# sourceMappingURL=authored-motion-manifest-v1.js.map