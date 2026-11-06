/** 作者清单跨项目合同；OpenDesign 的副本由同步脚本生成。 */
export const AUTHORED_MOTION_MANIFEST_CONTRACT = "videoflowcut.authored-motion-manifest.v1";

export interface AuthoredMotionRange {
  startFrame: number;
  endFrame: number;
}

export interface AuthoredMotionManifest {
  authorSubmissionId: string;
  sourceFile: string;
  sourceSha256: string;
  work: Record<string, unknown>;
  readyRanges: AuthoredMotionRange[];
  changedRanges: Array<AuthoredMotionRange & { reason: string }>;
}

function invalid(field: string, reason: string): never {
  throw new Error(`MOTION_MANIFEST_INVALID: ${field} ${reason}`);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(field, "必须是对象");
  return value as Record<string, unknown>;
}

function strictFields(value: Record<string, unknown>, allowed: readonly string[], prefix: string): void {
  const extra = Object.keys(value).find(key => !allowed.includes(key));
  if (extra) invalid(prefix ? `${prefix}.${extra}` : `不支持字段 ${extra}`, prefix ? "不受支持" : "");
}

function ranges(value: unknown, field: string, changed: boolean): void {
  if (!Array.isArray(value) || (!changed && value.length === 0)) invalid(field, changed ? "必须是范围数组" : "必须是非空范围数组");
  for (const [index, raw] of value.entries()) {
    const label = `${field}[${index}]`;
    const item = record(raw, label);
    strictFields(item, changed ? ["startFrame", "endFrame", "reason"] : ["startFrame", "endFrame"], label);
    if (!Number.isInteger(item.startFrame) || (item.startFrame as number) < 0) invalid(`${label}.startFrame`, "必须是非负整数");
    if (!Number.isInteger(item.endFrame) || (item.endFrame as number) <= (item.startFrame as number)) invalid(`${label}.endFrame`, "必须大于起始帧");
    if (changed && (typeof item.reason !== "string" || item.reason.length === 0)) invalid(`${label}.reason`, "必须填写");
  }
}

/** 只校验清单公共字段；作品能力与源码由各接收端继续校验。 */
export function parseAuthoredMotionManifest(value: unknown): AuthoredMotionManifest {
  const manifest = record(value, "manifest");
  strictFields(manifest, ["authorSubmissionId", "sourceFile", "sourceSha256", "work", "readyRanges", "changedRanges"], "");
  if (typeof manifest.authorSubmissionId !== "string" || !manifest.authorSubmissionId || manifest.authorSubmissionId.length > 160) invalid("authorSubmissionId", "须为 1 至 160 字符");
  if (typeof manifest.sourceFile !== "string" || !manifest.sourceFile) invalid("sourceFile", "必须填写");
  if (typeof manifest.sourceSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(manifest.sourceSha256)) invalid("sourceSha256", "必须是 SHA-256 摘要");
  record(manifest.work, "work");
  ranges(manifest.readyRanges, "readyRanges", false);
  ranges(manifest.changedRanges, "changedRanges", true);
  return manifest as unknown as AuthoredMotionManifest;
}
