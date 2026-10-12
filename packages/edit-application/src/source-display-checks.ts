import ts from "typescript";
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

/** 只检查可定位的 JSX 可见文本及已知元数据映射；不执行源码，也不冒称覆盖像素与路径绘字。 */
export function checkMotionSourceDisplay(source: string, props: Record<string, unknown>, frozen: FrozenSourceDisplay): SourceDisplayFinding[] {
  const file = ts.createSourceFile("motion.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const warnings: SourceDisplayFinding[] = [];
  const rejected: SourceDisplayFinding[] = [];
  const metadataNames = new Set(["sourceCaption", "sourceTitle", "sourceUrl", "publisher", "fileName", "pageNumber"]);
  const constants = new Map<string, ts.Expression[]>();
  const collect = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) constants.set(node.name.text, [...constants.get(node.name.text) ?? [], node.initializer]);
    // 有同名参数时不猜测标识符绑定，避免把另一个作用域的常量误判为可见文字。
    if (ts.isParameter(node) && ts.isIdentifier(node.name)) constants.set(node.name.text, [...constants.get(node.name.text) ?? [], node.name]);
    ts.forEachChild(node, collect);
  };
  collect(file);
  const resolve = (node: ts.Expression, seen = new Set<string>()): { text?: string; metadata?: boolean } => {
    if (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) return { text: node.text };
    if (ts.isParenthesizedExpression(node)) return resolve(node.expression, seen);
    if (ts.isIdentifier(node) && !seen.has(node.text)) {
      const values = constants.get(node.text);
      if (values?.length === 1) return resolve(values[0]!, new Set([...seen, node.text]));
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "props") {
      const value = props[node.name.text];
      return { text: typeof value === "string" || typeof value === "number" ? String(value) : undefined, metadata: metadataNames.has(node.name.text) };
    }
    if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "props" && ts.isStringLiteral(node.argumentExpression)) {
      const key = node.argumentExpression.text, value = props[key];
      return { text: typeof value === "string" || typeof value === "number" ? String(value) : undefined, metadata: metadataNames.has(key) };
    }
    if (ts.isTemplateExpression(node)) {
      let text: string | undefined = node.head.text;
      let metadata = false;
      for (const span of node.templateSpans) {
        const value = resolve(span.expression, seen);
        text = text !== undefined && value.text !== undefined ? text + value.text + span.literal.text : undefined;
        metadata ||= Boolean(value.metadata);
      }
      return { text, metadata };
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = resolve(node.left, seen), right = resolve(node.right, seen);
      return { text: left.text !== undefined && right.text !== undefined ? left.text + right.text : undefined, metadata: left.metadata || right.metadata };
    }
    return {};
  };
  const inspect = (node: ts.Node, value: { text?: string; metadata?: boolean }) => {
    const text = value.text?.replace(/\s+/gu, " ").trim();
    const location = file.getLineAndCharacterOfPosition(node.getStart(file));
    const finding = { field: "work.source", text, line: location.line + 1, column: location.character + 1, message: "核对可见文字是否为新增出处或原件页码", suggestion };
    // 只认独立说明格式；“数据来源是什么”等正文不因包含来源二字被拦截。
    const explicit = text && /^(?:(?:资料|图片|视频|数据|素材)?来源\s*[:：]|出处\s*[:：]|原件(?:页码)?\s*[:：]?\s*(?:第?\s*\d+\s*页|[pP]\.?\s*\d+)|第\s*\d+\s*页$|[pP]\.?\s*\d+$|source\s*:|credit(?:s)?\s*:)/iu.test(text);
    if (text && (explicit || value.metadata)) {
      if (!sourceCaptionAllowed(frozen.policy, frozen.scopeId, text)) rejected.push({ ...finding, message: "检测到当前范围未允许的独立出处文字或来源元数据展示" });
    } else if (value.metadata || text && /来源|出处|页码|研究备注/u.test(text)) warnings.push(finding);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) inspect(node, { text: node.text });
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) inspect(node, resolve(node.expression));
    if (ts.isJsxAttribute(node) && ["children", "text", "sourceCaption"].includes(node.name.getText(file)) && node.initializer) {
      const expression = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (expression) inspect(node, { ...resolve(expression), ...(node.name.getText(file) === "sourceCaption" ? { metadata: true } : {}) });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (rejected.length) throw new SourceDisplayValidationError(rejected);
  return warnings;
}

export function checkFrozenExplainerSourceDisplay(snapshot: ProjectSnapshot): void {
  // 无冻结合同的历史 Program 保持原样；新编译和明确修订才采用当前任务策略。
  for (const program of snapshot.explainerPrograms) if (program.sourceDisplay) checkProgramSourceDisplay(program.props, program.sourceDisplay, `explainerPrograms.${program.id}.props`);
}
