import { isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { realpath } from "node:fs/promises";
import { assetById, createId, DomainError, now } from "@videocut/domain";
import type { MediaAdoption, MediaFact, MediaObservation, MediaSearchQuery, MediaSource, SourceRegion, SourceTimeRange } from "@videocut/contracts";
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

/** Web、MCP 和 Worker 使用同一分析/采用规则，不建立第二份项目快照。 */
export class MediaIntelligenceApplication {
  constructor(private readonly app: EditingApplication) {}
  get store() { return this.app.repository.mediaIntelligence; }

  submitAnalysis(projectId: string, value: AnalysisInput) {
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
    } else {
      const { candidate, request } = this.app.readAssetCandidate({ projectId, assetCandidateId: input.candidateId! });
      if (!candidate.previewUrl) throw new DomainError("候选没有可取得的试听/预览文件", "MEDIA_PREVIEW_UNAVAILABLE");
      if (candidate.rightsStatus === "rejected" || candidate.rightsStatus === "restricted") throw new DomainError("候选使用条件尚不满足分析要求", "MEDIA_RIGHTS_NOT_CLEARED");
      sourceVersion = digest([candidate.previewUrl, request.updatedAt]);
    }
    const key = digest({ ...input, idempotencyKey: undefined, sourceVersion, version: ANALYSIS_VERSION });
    return this.app.repository.createJob({ projectId, kind: "media_understanding", payload: { input, sourceVersion, analysisKey: key }, idempotencyKey: input.idempotencyKey ?? `media_understanding:${key}` });
  }

  inspect(projectId: string, target: { assetId?: string; candidateId?: string }, offset = 0, limit = 40) {
    const snapshot = this.app.readProject(projectId).snapshot;
    const sources = this.store.sources(projectId).filter((source) => target.assetId ? source.target.assetId === target.assetId : target.candidateId ? source.target.candidateId === target.candidateId : true);
    const currentSources = sources.filter((source) => !source.target.assetId || snapshot.assets.some((asset) => asset.id === source.target.assetId && (!asset.sourceHash || asset.sourceHash === source.hash)));
    const observations = currentSources.flatMap((source) => this.store.observations(projectId, source.id));
    const analyses = currentSources.flatMap((source) => this.store.analyses(projectId, source.id));
    return {
      sources: currentSources, total: observations.length,
      observations: observations.slice(offset, offset + limit), nextOffset: offset + limit < observations.length ? offset + limit : undefined,
      coverage: analyses.map((record) => ({ id: record.id, sourceId: record.sourceId, depth: record.depth, status: record.status, totalWindows: record.windows.length, completedWindows: record.windows.filter((window) => window.status === "succeeded").length, failedWindows: record.windows.filter((window) => ["failed", "unknown"].includes(window.status)), missingRanges: record.targetRange ? uncoveredRanges(record.targetRange, record.windows.filter((window) => window.status === "succeeded" && window.range).map((window) => window.range!)) : [], shotRanges: record.shotRanges.slice(offset, offset + limit), totalShots: record.shotRanges.length })),
      technicalStatus: target.assetId ? assetById(snapshot, target.assetId).status : undefined,
      semanticStatus: !analyses.length ? "not_analyzed" : analyses.every((record) => record.status === "succeeded") ? "requested_coverage_complete" : "partial_or_pending"
    };
  }

  submitSearch(projectId: string, input: MediaSearchQuery) {
    this.app.readProject(projectId);
    const query = searchQuerySchema.parse(input);
    return this.app.repository.createJob({ projectId, kind: "media_search", payload: { query }, idempotencyKey: `media_search:${digest([query, this.store.observations(projectId).map((observation) => observation.id), EMBEDDING_VERSION])}` });
  }

  search(projectId: string, input: MediaSearchQuery, queryVector?: number[]) {
    const query = searchQuerySchema.parse(input);
    const snapshot = this.app.readProject(projectId).snapshot;
    const sources = this.store.sources(projectId).filter((source) => (!query.assetIds || Boolean(source.target.assetId && query.assetIds.includes(source.target.assetId))) && (!query.candidateIds || Boolean(source.target.candidateId && query.candidateIds.includes(source.target.candidateId)))
      && (!source.target.assetId || snapshot.assets.some((asset) => asset.id === source.target.assetId && (!asset.sourceHash || asset.sourceHash === source.hash))));
    const matches = sources.flatMap((source) => this.store.observations(projectId, source.id).flatMap((observation) => {
      const text = observation.facts.filter((fact) => fact.modality === query.modality).map((fact) => `${fact.text} ${fact.keywords.join(" ")}`).join("\n");
      const vector = queryVector ? this.store.vector(observation.id, query.modality, EMBEDDING_VERSION, digest(text)) : undefined;
      return matchObservation(source, observation, query, queryVector && vector ? cosine(queryVector, vector) : undefined);
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
      fact.basis = "human";
      fact.precision = "reviewed";
    }
    const affected = (current.snapshot.mediaAdoptions ?? []).filter((adoption) => adoption.observationIds.includes(previous.id));
    if (affected.length && input.baseRevision !== current.revision.number) throw new DomainError("此纠错影响已采用素材，需要当前 Revision", "REVISION_CONFLICT");
    const observation: MediaObservation = { ...previous, id: createId("observation"), facts, unknowns: input.unknowns, supersedes: previous.id, correction: { reason: input.reason.trim(), author: input.author.trim() }, createdAt: now() };
    this.store.saveObservation(observation);
    const state = affected.length ? this.app.repository.commit(projectId, current.revision.number, "纠正已采用素材的观察依据", (snapshot, impact) => {
      for (const adoption of snapshot.mediaAdoptions ?? []) if (affected.some((entry) => entry.id === adoption.id)) { adoption.status = "needs_review"; adoption.reviewReason = input.reason; impact.stale.push(adoption.id); }
      impact.warnings.push("素材观察已纠正，受影响采用需重新复核。");
    }) : current;
    return { observation, affectedAdoptionIds: affected.map((entry) => entry.id), revision: state.revision.number };
  }

  async adopt(projectId: string, input: { baseRevision: number; assetId: string; observationIds: string[]; range?: SourceTimeRange; region?: SourceRegion; requestId?: string; purpose: string; audioPolicy: MediaAdoption["audioPolicy"]; conditions: string[] }) {
    const current = this.app.readProject(projectId);
    const asset = assetById(current.snapshot, input.assetId);
    const path = await managedSourcePath(current.snapshot.project.rootPath, asset.managedPath);
    const hash = await hashMediaFile(path);
    if (!input.observationIds.length || !input.purpose.trim()) throw new DomainError("采用必须保留观察和用途", "MEDIA_ADOPTION_EVIDENCE_REQUIRED");
    if (asset.status !== "ready" || (asset.sourceHash && hash !== asset.sourceHash)) throw new DomainError("原文件已变化或尚未就绪", "MEDIA_SOURCE_CHANGED");
    const range = input.range && timeRangeSchema.parse(input.range), region = input.region && regionSchema.parse(input.region);
    const observations = input.observationIds.map((id) => {
      const observation = this.store.observation(projectId, id);
      const source = observation && this.store.source(projectId, observation.sourceId);
      if (!observation || !source || source.identity === "preview" || source.target.assetId !== asset.id || source.hash !== hash || this.store.isSuperseded(projectId, id)) throw new DomainError("采用必须使用此原文件的有效观察，不能继承预览", "MEDIA_ADOPTION_EVIDENCE_STALE");
      return observation;
    });
    if (range && uncoveredRanges(range, observations.flatMap((observation) => observation.range ? [observation.range] : [])).length) throw new DomainError("观察未覆盖完整采用范围", "MEDIA_ADOPTION_COVERAGE_INCOMPLETE");
    if (region && !observations.some((observation) => observation.region?.page === region.page)) throw new DomainError("采用页面没有对应观察", "MEDIA_ADOPTION_REGION_MISMATCH");
    const request = input.requestId ? current.snapshot.assetRequests.find((entry) => entry.id === input.requestId) : undefined;
    if (input.requestId && (!request || request.status === "closed")) throw new DomainError("素材需求已关闭或不存在", "ASSET_REQUEST_NOT_FOUND");
    const adoption: MediaAdoption = { id: createId("media_adoption"), assetId: asset.id, sourceHash: hash, observationIds: input.observationIds, requestId: request?.id, requestVersion: request?.updatedAt, range, region, purpose: input.purpose.trim(), audioPolicy: input.audioPolicy, conditions: input.conditions, status: "current", createdAt: now() };
    return this.app.repository.commit(projectId, input.baseRevision, "确认素材范围及使用依据", (snapshot, impact) => {
      const duplicate = snapshot.mediaAdoptions?.find((entry) => digest({ ...entry, id: undefined, createdAt: undefined }) === digest({ ...adoption, id: undefined, createdAt: undefined }));
      if (duplicate) return;
      (snapshot.mediaAdoptions ??= []).push(adoption);
      impact.changed.push(adoption.id);
    });
  }
}
