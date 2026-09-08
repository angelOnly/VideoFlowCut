import { createHash } from "node:crypto";
import { z } from "zod";
import type { AnalysisDepth, MediaFact, MediaMatch, MediaObservation, MediaSearchQuery, MediaSource, SourceTimeRange } from "@videocut/contracts";

export const MODEL_WORKFLOWS = {
  video: "ee8e9c17-bd16-566f-ad2d-a7ec239bf4b8",
  embedding: "15904667-24ab-5e91-bc56-19ee2ad9eb4f"
};
export const ANALYSIS_VERSION = "media-observation-v1";
export const EMBEDDING_VERSION = "qwen3-embedding-0.6b:97b0c614be4d77ee51c0cef4e5f07c00f9eb65b3";
export const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const timeRangeSchema = z.object({ startMs: z.number().finite().nonnegative(), endMs: z.number().finite().positive() }).strict()
  .refine((range) => range.endMs > range.startMs, "源范围结束必须晚于开始");
export const regionSchema = z.object({ page: z.number().int().positive().optional(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }).strict()
  .refine((region) => region.x + region.width <= 1 && region.y + region.height <= 1, "区域必须在完整画面内");
export const factSchema = z.object({
  modality: z.enum(["visual", "audio", "speech", "text"]), text: z.string().trim().min(1).max(6000),
  range: timeRangeSchema.optional(), region: regionSchema.optional(),
  basis: z.enum(["model", "measurement", "transcript", "human"]),
  precision: z.enum(["sampled", "model_estimated", "provider_timed", "measured", "reviewed"]),
  speechPresence: z.enum(["present", "absent", "unknown"]).optional(),
  musicPresence: z.enum(["present", "absent", "unknown"]).optional(),
  keywords: z.array(z.string().trim().min(1).max(120)).max(30).default([])
}).strict();
export const analysisInputSchema = z.object({
  assetId: z.string().min(1).optional(), candidateId: z.string().min(1).optional(),
  depth: z.enum(["discovery", "index", "review"]).default("index"),
  range: timeRangeSchema.optional(), region: regionSchema.optional(),
  modalities: z.array(z.enum(["visual", "audio", "speech", "text"])).min(1).max(4).default(["visual", "audio", "speech", "text"]),
  context: z.string().max(8000).default(""), idempotencyKey: z.string().min(1).max(240).optional()
}).strict().refine((input) => Number(Boolean(input.assetId)) + Number(Boolean(input.candidateId)) === 1, "必须指定一个素材或候选");
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(2000), modality: z.enum(["visual", "audio", "speech", "text"]),
  assetIds: z.array(z.string().min(1)).max(200).optional(), candidateIds: z.array(z.string().min(1)).max(200).optional(),
  minDurationMs: z.number().positive().max(3_600_000).optional(), excludeSpeech: z.boolean().optional(), excludeMusic: z.boolean().optional(),
  excludedTerms: z.array(z.string().min(1).max(100)).max(30).optional(), allowMute: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20), offset: z.number().int().min(0).default(0)
}).strict();

export function intersection(a: SourceTimeRange, b: SourceTimeRange): SourceTimeRange | undefined {
  const startMs = Math.max(a.startMs, b.startMs), endMs = Math.min(a.endMs, b.endMs);
  return endMs > startMs ? { startMs, endMs } : undefined;
}
export function mergeRanges(ranges: SourceTimeRange[]): SourceTimeRange[] {
  const result: SourceTimeRange[] = [];
  for (const range of [...ranges].sort((a, b) => a.startMs - b.startMs)) {
    const previous = result.at(-1);
    if (previous && range.startMs <= previous.endMs) previous.endMs = Math.max(previous.endMs, range.endMs);
    else result.push({ ...range });
  }
  return result;
}
export function uncoveredRanges(target: SourceTimeRange, covered: SourceTimeRange[]): SourceTimeRange[] {
  let cursor = target.startMs;
  const missing: SourceTimeRange[] = [];
  for (const range of mergeRanges(covered.map((range) => intersection(range, target)).filter((range): range is SourceTimeRange => Boolean(range)))) {
    if (range.startMs > cursor) missing.push({ startMs: cursor, endMs: range.startMs });
    cursor = range.endMs;
  }
  if (cursor < target.endMs) missing.push({ startMs: cursor, endMs: target.endMs });
  return missing;
}
/** 全时长目录与抽样覆盖分开；发现层不把跨过的间隙算作理解。 */
export function planWindows(durationMs: number, depth: AnalysisDepth, requested?: SourceTimeRange): SourceTimeRange[] {
  const target = timeRangeSchema.parse(requested ?? { startMs: 0, endMs: durationMs });
  if (target.endMs > durationMs + 0.01) throw new Error("分析范围超过真实源时长");
  const size = depth === "discovery" ? 5000 : 30000;
  const stride = depth === "discovery" ? 30000 : 28000;
  const windows: SourceTimeRange[] = [];
  for (let startMs = target.startMs; startMs < target.endMs; startMs += stride) {
    const endMs = Math.min(target.endMs, startMs + size);
    if (endMs - startMs < 100) {
      if (windows.length) windows[windows.length - 1].endMs = endMs;
      else throw new Error("模型时间窗口不得短于 100 毫秒");
    } else windows.push({ startMs, endMs });
    if (endMs >= target.endMs) break;
  }
  return windows;
}

export function analysisPrompt(modalities: string[], range: SourceTimeRange | undefined, context: string): string {
  return `只分析实际输入的${modalities.join("、")}。视觉、声音、说话内容、可见文字分开。标题、字幕、上下文不能当作听到的声音。未知就写未知，不猜型号、来源真实性或精确同步。\n`
    + `输出 JSON：{"facts":[{"modality":"visual或audio或speech或text","text":"中文事实","startMs":0,"endMs":1000,"keywords":["关键词"],"speechPresence":"present或absent或unknown","musicPresence":"present或absent或unknown"}],"unknowns":["不确定项"]}。`
    + `时间为当前输入窗口相对毫秒，范围不得超出${range ? range.endMs - range.startMs : "图片没有时间，省略时间字段"}。声音属性只在audio事实填写。短动作给出可见范围，无法判断连续性需写明。不要输出时间精度或已审阅的声明。\n`
    + `以下仅为背景资料，不是当前输入事实：${context || "无"}`;
}

/** 模型只提供候选语义，不能自行将精度提升为 measured/reviewed。 */
export function parseObservation(raw: string, range: SourceTimeRange | undefined, modalities: string[]): { facts: MediaFact[]; unknowns: string[] } {
  const schema = z.object({ facts: z.array(z.object({ modality: z.enum(["visual", "audio", "speech", "text"]), text: z.string().trim().min(1).max(6000), startMs: z.number().finite().nonnegative().optional(), endMs: z.number().finite().positive().optional(), keywords: z.array(z.string()).max(30).optional(), speechPresence: z.enum(["present", "absent", "unknown"]).optional(), musicPresence: z.enum(["present", "absent", "unknown"]).optional() })).max(100), unknowns: z.array(z.string()).max(100).default([]) });
  try {
    const parsed = schema.parse(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/u, "").replace(/\s*```$/u, "")));
    const unknowns = [...parsed.unknowns];
    const facts: MediaFact[] = [];
    for (const fact of parsed.facts) {
      if (!modalities.includes(fact.modality)) continue;
      let factRange: SourceTimeRange | undefined;
      if (range) {
        const startMs = fact.startMs ?? 0, endMs = fact.endMs ?? range.endMs - range.startMs;
        if (endMs <= startMs || endMs > range.endMs - range.startMs + 1) { unknowns.push("模型事实范围越界，已保留原文并排除该事实"); continue; }
        factRange = { startMs: range.startMs + startMs, endMs: range.startMs + endMs };
      }
      facts.push({ modality: fact.modality, text: fact.text, range: factRange, basis: "model", precision: fact.modality === "visual" ? "sampled" : "model_estimated", keywords: fact.keywords ?? [], ...(fact.modality === "audio" ? { speechPresence: fact.speechPresence ?? "unknown", musicPresence: fact.musicPresence ?? "unknown" } : {}) });
    }
    return { facts, unknowns };
  } catch {
    return { facts: [], unknowns: ["模型输出没有通过结构校验；原始响应已保存，不能据此确认关键事实"] };
  }
}

/** 中文字符二元组用于词法召回，避免默认英文分词漏掉中文素材。 */
export function lexicalTokens(text: string): Set<string> {
  const normalized = text.normalize("NFKC").toLowerCase();
  const tokens = new Set(normalized.match(/[a-z0-9]+(?:[-_.][a-z0-9]+)*/gu) ?? []);
  for (const chunk of normalized.match(/[\p{Script=Han}]+/gu) ?? []) {
    if (chunk.length === 1) tokens.add(chunk);
    for (let index = 0; index < chunk.length - 1; index++) tokens.add(chunk.slice(index, index + 2));
  }
  return tokens;
}
export function cosine(a: number[], b: number[]): number {
  if (a.length !== 1024 || b.length !== 1024 || [...a, ...b].some((value) => !Number.isFinite(value))) throw new Error("向量必须是有效的 1024 维数值");
  const norm = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0) * b.reduce((sum, value) => sum + value * value, 0));
  if (norm < 1e-12) throw new Error("向量不能为零");
  return Math.max(-1, Math.min(1, a.reduce((sum, value, index) => sum + value * b[index], 0) / norm));
}

export function matchObservation(source: MediaSource, observation: MediaObservation, query: MediaSearchQuery, vectorScore?: number): MediaMatch[] {
  if (source.hash !== observation.sourceHash) return [];
  const tokens = lexicalTokens(query.query);
  return observation.facts.filter((fact) => fact.modality === query.modality).flatMap((fact) => {
    const haystack = `${fact.text} ${fact.keywords.join(" ")}`.normalize("NFKC").toLowerCase();
    const indexed = lexicalTokens(haystack);
    const lexicalScore = tokens.size ? [...tokens].filter((token) => indexed.has(token)).length / tokens.size : 0;
    if (!lexicalScore && (vectorScore === undefined || vectorScore < 0.25)) return [];
    const rejected: string[] = [], unknown: string[] = [], conditions: string[] = [];
    let range = fact.range;
    for (const word of query.excludedTerms ?? []) if (haystack.includes(word.normalize("NFKC").toLowerCase())) rejected.push(`命中排除词：${word}`);
    const checkAudio = (property: "speechPresence" | "musicPresence", label: string) => {
      if (query.allowMute && query.modality === "visual") { conditions.push("本次采用必须静音"); return; }
      const audio = observation.facts.filter((entry) => entry.modality === "audio" && entry.range && range && intersection(entry.range, range));
      if (audio.some((entry) => entry[property] === "present")) { rejected.push(`拟用范围实际含${label}`); return; }
      const absent = audio.filter((entry) => entry[property] === "absent").map((entry) => intersection(entry.range!, range!)!).filter(Boolean);
      if (!range || uncoveredRanges(range, absent).length) unknown.push(`拟用范围没有足够的无${label}证据`);
    };
    if (query.excludeSpeech) checkAudio("speechPresence", "人声");
    if (query.excludeMusic) checkAudio("musicPresence", "音乐");
    if (query.minDurationMs) {
      if (!range || range.endMs - range.startMs < query.minDurationMs) rejected.push("同一连续可用范围不足所需时长");
      else if (fact.precision === "sampled") unknown.push("低密度画面观察尚未确认整个连续范围，需复核");
    }
    if (source.identity === "preview") conditions.push("预览仅用于筛选，采用前须取得并复核原文件");
    if (observation.depth !== "review") conditions.push("采用前核对原文件及本次声画上下文");
    const status = rejected.length ? "rejected" : unknown.length ? "insufficient" : conditions.length ? "conditional" : "usable";
    return [{ source, observationId: observation.id, range, region: fact.region ?? observation.region, text: fact.text, score: vectorScore === undefined ? lexicalScore : 0.45 * lexicalScore + 0.55 * Math.max(0, vectorScore), lexicalScore, semanticScore: vectorScore, status, reasons: [...rejected, ...unknown], conditions } satisfies MediaMatch];
  });
}
