import { z } from "zod";

/** 仅接收用户原文；sourceName 是真实文件名或来源标识，不充当已读取文件的声明。 */
export const captionSrtImportSchema = z.object({
  srtText: z.string().min(1).max(2_000_000),
  sourceName: z.string().trim().min(1).max(500),
  offsetMs: z.number().int().safe().default(0),
  targetRange: z.object({ startFrame: z.number().int().nonnegative(), endFrame: z.number().int().positive() }).strict(),
  writePolicy: z.enum(["reject_conflicts", "replace_range"]),
  idempotencyKey: z.string().trim().min(1).max(240)
}).strict();
export type CaptionSrtImportInput = z.input<typeof captionSrtImportSchema>;
export interface CaptionSrtImport {
  id: string;
  idempotencyKey: string;
  requestHash: string;
  fps: number;
  captionIds: string[];
  sourceName: string;
  srtText: string;
  offsetMs: number;
  targetRange: { startFrame: number; endFrame: number };
  writePolicy: "reject_conflicts" | "replace_range";
  createdAt: string;
}

export interface SrtCue { index: number; text: string; startMs: number; endMs: number }

/** 先解析整份文件，保留正文换行和原毫秒；不猜测损坏块，也不制造 token 时间。 */
export function parseSrt(text: string): SrtCue[] {
  const normalized = text.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n").replace(/^\n+|\n+$/gu, "");
  if (!normalized.trim()) throw new Error("SRT 正文不能为空");
  const cues: SrtCue[] = [];
  const indices = new Set<number>();
  const timestamp = (value: string): number => {
    const match = /^(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})$/u.exec(value);
    if (!match) throw new Error(`无效 SRT 时间：${value}`);
    const result = Number(match[1]) * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1000 + Number(match[4]);
    if (!Number.isSafeInteger(result)) throw new Error("SRT 时间超出安全整数范围");
    return result;
  };
  for (const block of normalized.split(/\n[\t ]*\n+/u)) {
    const [indexLine, timeLine, ...body] = block.split("\n");
    if (!/^\d+$/u.test(indexLine?.trim() ?? "")) throw new Error("SRT 每块必须包含数字序号");
    const index = Number(indexLine!.trim());
    if (!Number.isSafeInteger(index) || index < 1 || indices.has(index)) throw new Error("SRT 序号必须是唯一正整数");
    const times = /^\s*(\d{2,}:[0-5]\d:[0-5]\d,\d{3})\s+-->\s+(\d{2,}:[0-5]\d:[0-5]\d,\d{3})\s*$/u.exec(timeLine ?? "");
    if (!times) throw new Error(`SRT 第 ${index} 块时间行无效`);
    const startMs = timestamp(times[1]!);
    const endMs = timestamp(times[2]!);
    const bodyText = body.join("\n");
    if (!bodyText.trim() || endMs <= startMs || (cues.length && startMs < cues[cues.length - 1]!.endMs)) {
      throw new Error(`SRT 第 ${index} 块正文为空、时间倒置、乱序或重叠`);
    }
    indices.add(index);
    cues.push({ index, text: bodyText, startMs, endMs });
    if (cues.length > 10_000) throw new Error("单次 SRT 导入最多 10000 块");
  }
  return cues;
}
