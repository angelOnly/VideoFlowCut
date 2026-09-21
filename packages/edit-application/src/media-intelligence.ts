import { isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { assetById, createId, DomainError, now } from "@videocut/domain";
import { readRuntimeConfig } from "@videocut/project-overview";
import { probeMedia } from "@videocut/speech";
import { assetRequestVersion, intersection, regionContains } from "../../media-intelligence/src/index.js";
import type { MediaAdoption, MediaFact, MediaObservation, MediaSearchQuery, MediaSource, MediaUsageTarget, SourceRegion, SourceTimeRange } from "@videocut/contracts";
import { mediaUsageProblem, mediaUsageState } from "../../media-intelligence/src/usage.js";
import { analysisInputSchema, ANALYSIS_VERSION, cosine, digest, EMBEDDING_VERSION, factSchema, matchObservation, regionSchema, searchQuerySchema, timeRangeSchema, uncoveredRanges, type AnalysisInput } from "../../media-intelligence/src/index.js";
import type { EditingApplication } from "./index.js";

export async function hashMediaFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
export async function managedSourcePath(root: string, path: string): Promise<string> {
  const base = await realpath(root), source = await realpath(isAbsolute(path) ? path : join(root, path));
  const local = relative(base, source);
  if (local.startsWith("..") || isAbsolute(local)) throw new DomainError("素材必须位于受管项目目录", "MEDIA_SOURCE_OUTSIDE_PROJECT");
  return source;
}

/** 只读绑定不可变输出；不为审片重新导入素材或创建视频版本。 */
export async function renderedAnalysisSource(app: EditingApplication, projectId: string, input: Pick<AnalysisInput, "exportArtifactId" | "previewJobId">) {
  const root = app.getProjectRoot(projectId);
  const artifact = input.exportArtifactId ? app.readExportArtifact({ projectId, artifactId: input.exportArtifactId }) : undefined;
  const job = app.trackJob(artifact?.jobId ?? input.previewJobId!);
  if (job.projectId !== projectId || job.status !== "succeeded" || job.kind !== (artifact ? "export" : "preview")) throw new DomainError("复核来源必须为本项目成功的导出或预览", "MEDIA_REVIEW_SOURCE_INVALID");
  const revision = artifact?.revision ?? Number(job.payload.revision);
  const snapshot = app.repository.getRevision(projectId, revision).snapshot;
  const fromFrame = artifact ? 0 : Number(job.payload.fromFrame), toFrame = artifact ? snapshot.timeline.durationInFrames : Number(job.payload.toFrame);
  const rawPath = artifact?.relativePath ?? job.result?.path;
  if (typeof rawPath !== "string" || !Number.isInteger(fromFrame) || !Number.isInteger(toFrame) || fromFrame < 0 || toFrame <= fromFrame || toFrame > snapshot.timeline.durationInFrames || (!artifact && (job.result?.revision !== revision || job.result?.fromFrame !== fromFrame || job.result?.toFrame !== toFrame))) throw new DomainError("复核文件缺少一致的版本与范围", "MEDIA_REVIEW_SOURCE_INVALID");
  const path = await managedSourcePath(root, rawPath), hash = await hashMediaFile(path), file = await stat(path);
  if (!file.isFile() || file.size <= 0 || artifact && (hash !== artifact.fileHash || file.size !== artifact.fileSizeBytes)) throw new DomainError("成片已丢失或替换，不能沿用原导出身份", "MEDIA_REVIEW_SOURCE_CHANGED");
  return { path, hash, composition: { revision, fromFrame, toFrame, fps: snapshot.timeline.fps } };
}

/** Web、MCP 和 Worker 使用同一分析/采用规则，不建立第二份项目快照。 */
export class MediaIntelligenceApplication {
  constructor(private readonly app: EditingApplication) {}
  get store() { return this.app.repository.mediaIntelligence; }

  retry(projectId: string, jobId: string) {
    const previous = this.app.trackJob(jobId);
    if (previous.projectId !== projectId || !["media_understanding", "media_search", "sound_ranking"].includes(previous.kind) || !["failed", "cancelled"].includes(previous.status)) throw new DomainError("只能恢复此项目明确失败或已取消的素材任务", "MEDIA_RETRY_INVALID");
    const retry = this.app.repository.createJob({ projectId, kind: previous.kind, payload: { ...previous.payload, retryOfJobId: previous.id }, idempotencyKey: `media-retry:${previous.id}` });
    this.app.publish({ projectId, revision: this.app.readProject(projectId).revision.number, type: "job" });
    return retry;
  }

  bind(projectId: string, input: { baseRevision: number; adoptionId: string; target: MediaUsageTarget }) {
    const state = this.app.repository.commit(projectId, input.baseRevision, "关联素材采用依据与实际使用", (snapshot, impact) => {
      const adoption = snapshot.mediaAdoptions?.find((entry) => entry.id === input.adoptionId);
      if (!adoption) throw new DomainError("采用依据不存在", "MEDIA_ADOPTION_NOT_FOUND");
      const item = input.target.timelineItemId && snapshot.timeline.items.find((entry) => entry.id === input.target.timelineItemId);
      if (item && adoption.audioPolicy !== "not_applicable") item.mediaAudioPolicy = adoption.audioPolicy;
      const problem = mediaUsageProblem(snapshot, adoption, input.target);
      if (problem) throw new DomainError(problem, "MEDIA_USAGE_INVALID");
      const usage = mediaUsageState(snapshot, input.target)!;
      for (const entry of snapshot.mediaAdoptions ?? []) entry.uses = entry.uses?.filter((use) => digest(use.target) !== digest(input.target));
      (adoption.uses ??= []).push({ target: input.target, signature: usage.signature });
      impact.changed.push(adoption.id, input.target.timelineItemId ?? input.target.effectCueId!);
      impact.dirtyRanges.push({ ...usage.frameRange, reason: "素材采用依据与声音策略已关联到实际使用" });
    });
    this.app.publish({ projectId, revision: state.revision.number, type: "revision" });
    return state;
  }

  async submitAnalysis(projectId: string, value: AnalysisInput) {
    const input = analysisInputSchema.parse(value);
    const state = this.app.readProject(projectId);
    let sourceVersion: string;
    if (input.assetId) {
      const asset = assetById(state.snapshot, input.assetId);
      if (asset.status !== "ready") throw new DomainError("先完成源文件技术分析", "MEDIA_SOURCE_NOT_READY");
      if (asset.motion) throw new DomainError("请分析受管作品的真实预览或最终合成文件", "MEDIA_SOURCE_NOT_PLAYABLE");
      if (["image", "document"].includes(asset.kind) && input.range) throw new DomainError("图片和文档使用区域/页码，不使用视频时间", "MEDIA_RANGE_KIND_MISMATCH");
      if (!["image", "document"].includes(asset.kind) && input.region) throw new DomainError("视频/音频分析使用源时间范围", "MEDIA_RANGE_KIND_MISMATCH");
      sourceVersion = asset.sourceHash ?? digest([asset.managedPath, asset.metadata]);
    } else if (input.exportArtifactId || input.previewJobId) {
      const rendered = await renderedAnalysisSource(this.app, projectId, input);
      if (input.range) {
        // 复核范围属于实际文件；编码后的音轨尾部可略长于画面帧范围，不能按帧数截断核听。
        const media = await probeMedia(rendered.path);
        if (!Number.isFinite(media.durationMs) || media.durationMs! <= 0 || input.range.endMs > media.durationMs! + 1) throw new DomainError("复核范围超出所选成片或预览", "MEDIA_REVIEW_RANGE_INVALID");
      }
      sourceVersion = rendered.hash;
    } else {
      const { candidate, request } = this.app.readAssetCandidate({ projectId, assetCandidateId: input.candidateId! });
      if (!candidate.previewUrl) throw new DomainError("候选没有可取得的试听/预览文件", "MEDIA_PREVIEW_UNAVAILABLE");
      if (candidate.rightsStatus === "rejected" || candidate.rightsStatus === "restricted") throw new DomainError("候选使用条件尚不满足分析要求", "MEDIA_RIGHTS_NOT_CLEARED");
      sourceVersion = digest([candidate.previewUrl, assetRequestVersion(request)]);
    }
    const config = readRuntimeConfig();
    const modelConfig = { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl };
    const key = digest({ ...input, idempotencyKey: undefined, sourceVersion, version: ANALYSIS_VERSION, modelConfig });
    const job = this.app.repository.createJob({ projectId, kind: "media_understanding", payload: { input, sourceVersion, analysisKey: key, modelConfig }, idempotencyKey: input.idempotencyKey ?? `media_understanding:${key}` });
    this.app.publish({ projectId, revision: state.revision.number, type: "job" });
    return job;
  }

  inspect(projectId: string, target: { assetId?: string; candidateId?: string; exportArtifactId?: string; previewJobId?: string; range?: SourceTimeRange; region?: SourceRegion }, offset = 0, limit = 40) {
    const snapshot = this.app.readProject(projectId).snapshot;
    const sources = this.store.sources(projectId).filter((source) => target.assetId ? source.target.assetId === target.assetId : target.candidateId ? source.target.candidateId === target.candidateId : target.exportArtifactId ? source.target.exportArtifactId === target.exportArtifactId : target.previewJobId ? source.target.previewJobId === target.previewJobId : true);
    const currentSources = sources.filter((source) => !source.target.assetId || snapshot.assets.some((asset) => asset.id === source.target.assetId && (!asset.sourceHash || asset.sourceHash === source.hash)));
    const observations = currentSources.flatMap((source) => this.store.observations(projectId, source.id)).filter((observation) => (!target.range || observation.range && intersection(target.range, observation.range)) && (!target.region || observation.region?.page === target.region.page));
    const analyses = currentSources.flatMap((source) => this.store.analyses(projectId, source.id));
    return {
      requests: snapshot.assetRequests.filter((entry) => entry.status !== "closed").map((entry) => ({ id: entry.id, title: entry.title, version: assetRequestVersion(entry) })),
      sources: currentSources, total: observations.length,
      evidenceAvailability: observations.slice(offset, offset + limit).map((observation) => ({ observationId: observation.id, inputAvailable: observation.inputEvidence ? existsSync(observation.inputEvidence.path) : undefined, sourceAvailable: existsSync(currentSources.find((source) => source.id === observation.sourceId)!.path) })),
      modalityCoverage: analyses.map((record) => ({ analysisId: record.id, windows: record.windows.map((window) => ({ range: window.range, region: window.region, modalities: window.modalityStatus ?? {}, error: window.error })), facts: record.modalities.map((modality) => {
        const facts = observations.filter((observation) => observation.sourceId === record.sourceId).flatMap((observation) => observation.facts).filter((fact) => fact.modality === modality);
        const localized = facts.flatMap((fact) => fact.range ? [fact.range] : []);
        return { modality, factCount: facts.length, unlocatedFactCount: facts.filter((fact) => !fact.range && record.targetRange).length, unknownRanges: record.targetRange ? uncoveredRanges(record.targetRange, localized) : undefined, precision: [...new Set(facts.map((fact) => fact.precision))] };
      }) })),
      observations: observations.slice(offset, offset + limit), nextOffset: offset + limit < observations.length ? offset + limit : undefined,
      coverage: analyses.map((record) => ({ id: record.id, sourceId: record.sourceId, depth: record.depth, status: record.status, totalWindows: record.windows.length, completedWindows: record.windows.filter((window) => window.status === "succeeded").length, failedWindows: record.windows.filter((window) => ["failed", "unknown"].includes(window.status)), missingRanges: record.targetRange ? uncoveredRanges(record.targetRange, record.windows.filter((window) => window.status === "succeeded" && window.range).map((window) => window.range!)) : [], shotRanges: record.shotRanges.slice(offset, offset + limit), totalShots: record.shotRanges.length })),
      technicalStatus: target.assetId ? assetById(snapshot, target.assetId).status : undefined,
      // 窗口处理完成不等于画面/声音事实完整覆盖，更不等于已经复听。
      semanticStatus: !analyses.length ? "not_analyzed" : observations.some((observation) => observation.facts.length) ? "observations_available" : "no_confirmed_facts",
      processingStatus: !analyses.length ? "not_started" : analyses.every((record) => record.status === "succeeded") ? "requested_windows_processed" : "partial_or_pending"
    };
  }

  submitSearch(projectId: string, input: MediaSearchQuery) {
    this.app.readProject(projectId);
    const query = searchQuerySchema.parse(input);
    const config = readRuntimeConfig();
    const modelConfig = { ...config.semantic, apiBaseUrl: config.bridge.apiBaseUrl };
    const job = this.app.repository.createJob({ projectId, kind: "media_search", payload: { query, modelConfig }, idempotencyKey: `media_search:${digest([query, this.store.observations(projectId).map((observation) => observation.id), modelConfig])}` });
    this.app.publish({ projectId, revision: this.app.readProject(projectId).revision.number, type: "job" });
    return job;
  }

  search(projectId: string, input: MediaSearchQuery, queryVector?: number[], embeddingVersion = EMBEDDING_VERSION) {
    const query = searchQuerySchema.parse(input);
    const snapshot = this.app.readProject(projectId).snapshot;
    const sources = this.store.sources(projectId).filter((source) => (!query.assetIds || Boolean(source.target.assetId && query.assetIds.includes(source.target.assetId))) && (!query.candidateIds || Boolean(source.target.candidateId && query.candidateIds.includes(source.target.candidateId)))
      && (!source.target.assetId || snapshot.assets.some((asset) => asset.id === source.target.assetId && (!asset.sourceHash || asset.sourceHash === source.hash))));
    const matches = sources.flatMap((source) => this.store.observations(projectId, source.id).flatMap((observation) => {
      const scores = observation.facts.map((fact) => {
        const text = `${fact.text} ${fact.keywords.join(" ")}`;
        const vector = queryVector ? this.store.vector(observation.id, `${fact.modality}:${digest(text)}`, embeddingVersion, digest(text)) : undefined;
        return queryVector && vector ? cosine(queryVector, vector) : undefined;
      });
      return matchObservation(source, observation, query, undefined, scores);
    })).sort((a, b) => Number(a.status === "rejected") - Number(b.status === "rejected") || b.score - a.score);
    const unique = matches.filter((match, index) => !matches.slice(0, index).some((earlier) => earlier.source.id === match.source.id && earlier.text === match.text && earlier.range?.startMs === match.range?.startMs && earlier.region?.page === match.region?.page));
    return { mode: queryVector ? "hybrid" : "lexical", total: unique.length, matches: unique.slice(query.offset, query.offset + query.limit), nextOffset: query.offset + query.limit < unique.length ? query.offset + query.limit : undefined, unanalysedAssetIds: snapshot.assets.filter((asset) => !sources.some((source) => source.target.assetId === asset.id)).map((asset) => asset.id) };
  }

  correct(projectId: string, input: { observationId: string; facts: MediaFact[]; unknowns: string[]; reason: string; author: string; baseRevision?: number }) {
    const current = this.app.readProject(projectId);
    const previous = this.store.observation(projectId, input.observationId);
    if (!previous || this.store.isSuperseded(projectId, previous.id)) throw new DomainError("观察不存在或已经被纠正，请重新读取", "MEDIA_OBSERVATION_STALE");
    if (input.reason.trim().length < 8 || !input.author.trim()) throw new DomainError("请记录纠错依据和作者", "MEDIA_CORRECTION_REASON_REQUIRED");
    const facts = input.facts.map((fact) => factSchema.parse(fact));
    for (const fact of facts) {
      if (fact.range && (!previous.range || fact.range.startMs < previous.range.startMs || fact.range.endMs > previous.range.endMs)) throw new DomainError("纠错范围不得超出原观察输入", "MEDIA_CORRECTION_RANGE_INVALID");
      if (!regionContains(previous.region, fact.region ?? previous.region)) throw new DomainError("纠正区域不得超出实际输入页面或裁切区域", "MEDIA_CORRECTION_REGION_INVALID");
      // 只改文字不等于确认整个窗口；未定位事实保持未定位，复核者必须显式提交范围。
      if (previous.region && !fact.region) fact.region = previous.region;
      fact.basis = "human";
      fact.precision = "reviewed";
    }
    const affected = (current.snapshot.mediaAdoptions ?? []).filter((adoption) => adoption.observationIds.includes(previous.id));
    if (affected.length && input.baseRevision !== current.revision.number) throw new DomainError("此纠错影响已采用素材，需要当前 Revision", "REVISION_CONFLICT");
    const observation: MediaObservation = { ...previous, id: createId("observation"), facts, unknowns: input.unknowns, supersedes: previous.id, correction: { reason: input.reason.trim(), author: input.author.trim() }, createdAt: now() };
    const state = affected.length ? this.app.repository.commit(projectId, current.revision.number, "纠正已采用素材的观察依据", (snapshot, impact) => {
      // 观察替换与创作失效处于同一 SQLite 事务；冲突时一起回滚。
      this.store.saveObservation(observation);
      for (const adoption of snapshot.mediaAdoptions ?? []) if (affected.some((entry) => entry.id === adoption.id)) { adoption.status = "needs_review"; adoption.reviewReason = input.reason; impact.stale.push(adoption.id); }
      for (const item of snapshot.timeline.items) if (affected.some((entry) => entry.uses?.some((use) => use.target.timelineItemId === item.id) || snapshot.audioCues.some((cue) => cue.adoptionId === entry.id && cue.timelineItemId === item.id))) {
        impact.dirtyRanges.push({ startFrame: item.startFrame, endFrame: item.endFrame, reason: "所用素材观察已纠正，需复核原有选择" });
      }
      impact.warnings.push("素材观察已纠正，受影响采用需重新复核。");
    }) : current;
    if (!affected.length) this.store.saveObservation(observation);
    this.app.publish({ projectId, revision: state.revision.number, type: affected.length ? "revision" : "job" });
    return { observation, affectedAdoptionIds: affected.map((entry) => entry.id), revision: state.revision.number };
  }

  async adopt(projectId: string, input: { baseRevision: number; assetId: string; observationIds: string[]; range?: SourceTimeRange; region?: SourceRegion; requestId?: string; requestVersion?: string; purpose: string; audioPolicy: MediaAdoption["audioPolicy"]; conditions: string[] }) {
    const current = this.app.readProject(projectId);
    const asset = assetById(current.snapshot, input.assetId);
    const path = await managedSourcePath(current.snapshot.project.rootPath, asset.managedPath);
    const hash = await hashMediaFile(path);
    if (!input.observationIds.length || !input.purpose.trim()) throw new DomainError("采用必须保留观察和用途", "MEDIA_ADOPTION_EVIDENCE_REQUIRED");
    if (asset.status !== "ready" || (asset.sourceHash && hash !== asset.sourceHash)) throw new DomainError("原文件已变化或尚未就绪", "MEDIA_SOURCE_CHANGED");
    const range = input.range && timeRangeSchema.parse(input.range), region = input.region && regionSchema.parse(input.region);
    if (["image", "document"].includes(asset.kind) ? !!range : !range || !!region) throw new DomainError("请提供与原文件类型一致的时间或页面范围", "MEDIA_RANGE_KIND_MISMATCH");
    if (asset.kind === "document" && !region?.page) throw new DomainError("文档采用必须明确页码及区域", "MEDIA_ADOPTION_REGION_MISMATCH");
    if (asset.provenance && !["cleared", "attribution_required"].includes(asset.provenance.rightsStatus)) throw new DomainError("素材许可尚未满足采用条件", "MEDIA_RIGHTS_NOT_CLEARED");
    if (range && range.endMs > (asset.metadata?.durationMs ?? 0)) throw new DomainError("采用范围超出原文件", "MEDIA_ADOPTION_RANGE_INVALID");
    if (asset.kind === "audio" && input.audioPolicy !== "retain" || ["image", "document"].includes(asset.kind) && input.audioPolicy !== "not_applicable") throw new DomainError("原声策略与素材类型不一致", "MEDIA_ADOPTION_AUDIO_POLICY_INVALID");
    const observations = input.observationIds.map((id) => {
      const observation = this.store.observation(projectId, id);
      const source = observation && this.store.source(projectId, observation.sourceId);
      if (!observation || !source || source.identity === "preview" || source.target.assetId !== asset.id || source.hash !== hash || this.store.isSuperseded(projectId, id)) throw new DomainError("采用必须使用此原文件的有效观察，不能继承预览", "MEDIA_ADOPTION_EVIDENCE_STALE");
      if (observation.depth !== "review" || !observation.facts.length) throw new DomainError("拟采用范围需要原文件复核观察", "MEDIA_ADOPTION_REVIEW_REQUIRED");
      return observation;
    });
    const facts = observations.flatMap((observation) => observation.facts);
    const requestedModality = ["audio", "speech"].includes(asset.kind) ? "audio" : "visual";
    const relevant = facts.filter((fact) => fact.modality === requestedModality || requestedModality === "visual" && fact.modality === "text");
    if (range && uncoveredRanges(range, relevant.flatMap((fact) => fact.range ? [fact.range] : [])).length) throw new DomainError("实际事实未覆盖完整采用范围", "MEDIA_ADOPTION_COVERAGE_INCOMPLETE");
    if (range && ["video", "actor_video"].includes(asset.kind) && uncoveredRanges(range, relevant.filter((fact) => fact.precision === "reviewed").flatMap((fact) => fact.range ? [fact.range] : [])).length) throw new DomainError("抽帧观察不能确认连续画面；请实际复核并记录所用连续范围", "MEDIA_ADOPTION_CONTINUITY_REVIEW_REQUIRED");
    if (!range && !observations.some((observation) => regionContains(observation.region, region))) throw new DomainError("采用区域超出实际观察的页面或裁切范围", "MEDIA_ADOPTION_REGION_MISMATCH");
    const request = input.requestId ? current.snapshot.assetRequests.find((entry) => entry.id === input.requestId) : undefined;
    if (input.requestId && (!request || request.status === "closed")) throw new DomainError("素材需求已关闭或不存在", "ASSET_REQUEST_NOT_FOUND");
    if (request && input.requestVersion !== assetRequestVersion(request)) throw new DomainError("采用需要当前需求版本，旧推荐需重新检查", "MEDIA_REQUEST_STALE");
    if (request?.minDurationMs && range && range.endMs - range.startMs < request.minDurationMs) throw new DomainError("采用的连续范围不足需求时长", "MEDIA_ADOPTION_DURATION_INSUFFICIENT");
    // visual 是需求大类，不能拿它直接与 video/image/document 文件类型比较。
    if (request && (request.mediaKind === "audio" ? !["audio", "speech"].includes(asset.kind) : !["video", "actor_video", "image", "document"].includes(asset.kind))) throw new DomainError("采用素材类型与需求不一致", "MEDIA_RANGE_KIND_MISMATCH");
    if (request?.rightsRequirement === "cleared_only" && asset.provenance?.rightsStatus !== "cleared") throw new DomainError("当前需求不接受待署名或未核实的素材许可", "MEDIA_RIGHTS_NOT_CLEARED");
    if (request?.sound?.maxDurationMs && range && range.endMs - range.startMs > request.sound.maxDurationMs) throw new DomainError("拟用声音范围超过需求允许长度", "MEDIA_ADOPTION_DURATION_EXCEEDED");
    if (request?.sound && input.audioPolicy === "retain" && range) {
      for (const [exclude, key] of [[request.sound.excludeSpeech, "speechPresence"], [request.sound.excludeMusic, "musicPresence"]] as const) {
        if (!exclude) continue;
        const audio = facts.filter((fact) => fact.modality === "audio" && fact.range && intersection(fact.range, range));
        if (audio.some((fact) => fact[key] === "present") || uncoveredRanges(range, audio.filter((fact) => fact[key] === "absent").map((fact) => fact.range!)).length) throw new DomainError("当前原声没有满足需求排除条件的完整证据，请复核或重新选择", "MEDIA_ADOPTION_CONDITION_UNMET");
      }
    }
    const adoption: MediaAdoption = { id: createId("media_adoption"), assetId: asset.id, sourceHash: hash, observationIds: input.observationIds, requestId: request?.id, requestVersion: request && assetRequestVersion(request), range, region, purpose: input.purpose.trim(), audioPolicy: input.audioPolicy, conditions: input.conditions, status: "current", createdAt: now() };
    const state = this.app.repository.commit(projectId, input.baseRevision, "确认素材范围及使用依据", (snapshot, impact) => {
      const duplicate = snapshot.mediaAdoptions?.find((entry) => digest({ ...entry, id: undefined, createdAt: undefined }) === digest({ ...adoption, id: undefined, createdAt: undefined }));
      if (duplicate) return;
      (snapshot.mediaAdoptions ??= []).push(adoption);
      impact.changed.push(adoption.id);
    });
    this.app.publish({ projectId, revision: state.revision.number, type: "revision" });
    return state;
  }
}
