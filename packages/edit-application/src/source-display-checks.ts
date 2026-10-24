import { parseMotionHtml } from "../../motion-work/src/compiler.js";
import { DomainError } from "@videocut/domain";
import type { ProjectSnapshot } from "@videocut/contracts";
import { sourceCaptionAllowed, type FrozenSourceDisplay, type SourceDisplayPolicy } from "../../contracts/src/source-display-policy.js";

export interface SourceDisplayFinding { field: string; text?: string; line?: number; column?: number; message: string; suggestion: string }
export class SourceDisplayValidationError extends DomainError {
  constructor(readonly fields: SourceDisplayFinding[], code = "SOURCE_CAPTION_NOT_ALLOWED") {
    super(fields.map(field => `${field.field}: ${field.message}`).join("；"), code);
  }
}
const suggestion = "删除新增出处层，保留必要日期、单位与条件；有真实署名要求时由主任务登记匹配范围、文本及依据。";

export function validateSourceDisplayScopes(snapshot: ProjectSnapshot, policy: SourceDisplayPolicy): void {
  if (policy.mode === "specified") for (const entry of policy.exceptions) validateSourceDisplayScope(snapshot, entry.scopeId);
}

export function validateSourceDisplayScope(snapshot: ProjectSnapshot, scopeId: string): void {
  const scopes = new Set([snapshot.project.id, ...snapshot.scenes.map(item => item.id), ...snapshot.narrativeMap?.beats.map(item => item.id) ?? []]);
  if (!scopes.has(scopeId)) {
    throw new SourceDisplayValidationError([{ field: "sourceDisplay.scopeId", text: scopeId,
      message: "例外范围必须是当前项目、已有 Scene 或 NarrativeMap Beat", suggestion: "先建立真实范围，再由主任务登记依据；不能使用虚构范围。" }], "SOURCE_DISPLAY_SCOPE_INVALID");
  }
}

export function checkSourceCaption(frozen: FrozenSourceDisplay, text: unknown, field: string): void {
  if (typeof text === "string" && !sourceCaptionAllowed(frozen.policy, frozen.scopeId, text)) {
    throw new SourceDisplayValidationError([{ field, text, message: "当前范围不允许这条新增来源说明", suggestion }]);
  }
}

/** 递归检查确定性的来源字段；其他内容字段不按关键词删除。 */
export function checkProgramSourceDisplay(props: unknown, frozen: FrozenSourceDisplay, field = "props"): void {
  if (!props || typeof props !== "object") return;
  for (const [key, value] of Object.entries(props)) {
    if (key === "sourceCaption") checkSourceCaption(frozen, value, `${field}.${key}`);
    else if (typeof value === "object") checkProgramSourceDisplay(value, frozen, `${field}.${key}`);
  }
}

/** 静态 HTML 和真实 DOM 共用文字判断；不把脚本字符串或素材路径误当成可见文字。 */
export function checkMotionDisplayTexts(texts: string[], props: Record<string, unknown>, frozen: FrozenSourceDisplay): SourceDisplayFinding[] {
  const warnings: SourceDisplayFinding[] = [], rejected: SourceDisplayFinding[] = [];
  const metadata = new Set(["sourceCaption", "sourceTitle", "sourceUrl", "publisher", "fileName", "pageNumber"]
    .map(key => props[key]).filter((value): value is string => typeof value === "string"));
  for (const raw of new Set(texts)) {
    const text = raw.replace(/\s+/gu, " ").trim();
    if (!text) continue;
    const finding = { field: "work.source", text, message: "核对可见文字是否为新增出处或原件页码", suggestion };
    const explicit = /^(?:(?:资料|图片|视频|数据|素材)?来源\s*[:：]|出处\s*[:：]|原件(?:页码)?\s*[:：]?\s*(?:第?\s*\d+\s*页|[pP]\.?\s*\d+)|第\s*\d+\s*页$|[pP]\.?\s*\d+$|source\s*:|credit(?:s)?\s*:)/iu.test(text);
    if (explicit || metadata.has(text)) {
      if (!sourceCaptionAllowed(frozen.policy, frozen.scopeId, text)) rejected.push({ ...finding, message: "检测到当前范围未允许的独立出处文字或来源元数据展示" });
    } else if (/来源|出处|页码|研究备注/u.test(text)) warnings.push(finding);
  }
  if (rejected.length) throw new SourceDisplayValidationError(rejected);
  return warnings;
}

export function checkMotionSourceDisplay(source: string, props: Record<string, unknown>, frozen: FrozenSourceDisplay): SourceDisplayFinding[] {
  const doc = parseMotionHtml(source);
  for (const el of doc.querySelectorAll("script,style,head,template")) el.remove();
  // 保留一个文本容器内的分段 span，检查完整说明而非单独关键词。
  const texts = [...doc.querySelectorAll("body *")].filter(el => !el.querySelector("div,p,section,article,text"))
    .map(el => el.textContent ?? "");
  const locate = (finding: SourceDisplayFinding) => {
    const offset = source.indexOf(finding.text ?? "");
    if (offset >= 0) {
      const lines = source.slice(0, offset).split("\n");
      Object.assign(finding, { line: lines.length, column: lines.at(-1)!.length + 1 });
    }
    return finding;
  };
  try { return checkMotionDisplayTexts(texts, props, frozen).map(locate); }
  catch (error) { if (error instanceof SourceDisplayValidationError) error.fields.forEach(locate); throw error; }
}

export function checkFrozenExplainerSourceDisplay(snapshot: ProjectSnapshot): void {
  // 无冻结合同的历史 Program 保持原样；新编译和明确修订才采用当前任务策略。
  for (const program of snapshot.explainerPrograms) if (program.sourceDisplay) checkProgramSourceDisplay(program.props, program.sourceDisplay, `explainerPrograms.${program.id}.props`);
}
