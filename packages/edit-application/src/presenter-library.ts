import { createHash } from "node:crypto";
import { createReadStream, copyFileSync, mkdirSync, statSync } from "node:fs";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { extname, join } from "node:path";
import { createId, createMediaAsset, createVoiceReference, DomainError, now } from "@videocut/domain";
import type { Asset, PresenterLibrary, PresenterLibraryEntry, PresenterMediaKind, PresenterSelection } from "@videocut/contracts";
import { probeMedia } from "@videocut/speech";
import type { EditingApplication } from "./index.js";
import { RevisionConflictError } from "./persistence/index.js";

/** 只管理人物照片与音色；正式项目变更仍在同一个 Revision 中提交。 */
export class PresenterLibraryService {
  readonly directory: string;
  constructor(private readonly application: EditingApplication) {
    this.directory = join(application.repository.workspaceRoot, "presenter-library");
  }
  read(): PresenterLibrary { return this.application.repository.readPresenterLibrary(); }
  file(id: string): { entry: PresenterLibraryEntry; path: string } {
    const entry = this.read().entries.find(item => item.id === id);
    if (!entry) throw new DomainError("人物或音色条目不存在，请重新读取列表", "PRESENTER_ENTRY_NOT_FOUND");
    const path = join(this.directory, entry.fileName);
    if (!statSync(path, { throwIfNoEntry: false })?.isFile()) throw new DomainError("保存的参考文件不存在，请重新添加", "PRESENTER_FILE_MISSING");
    return { entry, path };
  }
  async import(input: { kind: PresenterMediaKind; name: string; sourcePath: string; replaceId?: string; setDefault?: boolean }): Promise<PresenterLibrary> {
    const name = input.name.trim();
    if (!name) throw new DomainError("请填写人物或音色名称", "PRESENTER_NAME_REQUIRED");
    if (input.replaceId && this.file(input.replaceId).entry.kind !== input.kind) throw new DomainError("只能替换同类条目", "PRESENTER_KIND_MISMATCH");
    await mkdir(this.directory, { recursive: true });
    const temporary = join(this.directory, `${createId("upload")}${extname(input.sourcePath).toLowerCase()}`);
    try {
      // 先固定文件再分析和计算哈希，避免外部源文件变化造成身份与内容不一致。
      await copyFile(input.sourcePath, temporary);
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(temporary)) hash.update(chunk);
      const contentHash = hash.digest("hex");
      const metadata = await probeMedia(temporary);
      if (input.kind === "photo" && (!metadata.width || !metadata.height || !/\.(png|jpe?g|webp)$/i.test(temporary))) throw new DomainError("人物照片请选择可解码的 PNG、JPEG 或 WebP", "PRESENTER_PHOTO_INVALID");
      if (input.kind === "voice" && (!metadata.hasAudio || metadata.videoCodec || metadata.durationMs <= 0)) throw new DomainError("音色样本必须是可播放的纯音频", "PRESENTER_VOICE_INVALID");
      const fileName = `${contentHash}${extname(temporary)}`;
      await copyFile(temporary, join(this.directory, fileName));
      // 异步文件处理后再读设置，避免覆盖期间新增的其他条目。
      const library = this.read();
      const previous = input.replaceId ? library.entries.find(item => item.id === input.replaceId) : undefined;
      if (input.replaceId && !previous) throw new DomainError("待替换条目已移除", "PRESENTER_ENTRY_NOT_FOUND");
      const entry: PresenterLibraryEntry = { id: previous?.id ?? createId("presenter_media"), kind: input.kind, name, fileName, contentHash, metadata, createdAt: previous?.createdAt ?? now(), updatedAt: now() };
      library.entries = [...library.entries.filter(item => item.id !== entry.id), entry];
      if (input.setDefault) library.defaults[input.kind === "photo" ? "photoId" : "voiceId"] = entry.id;
      return this.application.repository.savePresenterLibrary(library);
    } finally { await rm(temporary, { force: true }); }
  }
  update(input: { action: "rename" | "remove" | "set_default"; id: string; name?: string }): PresenterLibrary {
    const library = this.read();
    const entry = library.entries.find(item => item.id === input.id);
    if (!entry) throw new DomainError("条目不存在", "PRESENTER_ENTRY_NOT_FOUND");
    if (input.action === "rename") {
      if (!input.name?.trim()) throw new DomainError("请填写名称", "PRESENTER_NAME_REQUIRED");
      entry.name = input.name.trim(); entry.updatedAt = now();
    } else if (input.action === "set_default") {
      library.defaults[entry.kind === "photo" ? "photoId" : "voiceId"] = entry.id;
    } else {
      library.entries = library.entries.filter(item => item.id !== entry.id);
      for (const key of ["photoId", "voiceId"] as const) if (library.defaults[key] === entry.id) delete library.defaults[key];
      // 文件可能被在途选用操作读取；移除发现入口，不删除已经固定的项目副本。
    }
    return this.application.repository.savePresenterLibrary(library);
  }
  apply(input: { projectId: string; baseRevision: number; photoId?: string; voiceId?: string }) {
    const current = this.application.readProject(input.projectId);
    if (current.revision.number !== input.baseRevision) throw new RevisionConflictError(input.baseRevision, current.revision.number);
    const library = this.read();
    const previous = current.snapshot.presenter ?? {};
    const selection: PresenterSelection = structuredClone(previous);
    const assets: Asset[] = [];
    const references = [...current.snapshot.voiceReferences];
    for (const kind of ["photo", "voice"] as const) {
      const id = input[kind === "photo" ? "photoId" : "voiceId"] ?? (previous[kind] ? undefined : library.defaults[kind === "photo" ? "photoId" : "voiceId"]);
      if (!id) continue;
      const { entry, path } = this.file(id);
      if (entry.kind !== kind) throw new DomainError("人物照片与音色类型不匹配", "PRESENTER_KIND_MISMATCH");
      if (previous[kind]?.contentHash === entry.contentHash) {
        // 内容不变时只更新明确选用的名称和来源，不重生成媒体。
        Object.assign(selection[kind]!, { entryId: entry.id, name: entry.name });
        continue;
      }
      const managedPath = join("assets", "presenter", entry.fileName);
      mkdirSync(join(current.snapshot.project.rootPath, "assets", "presenter"), { recursive: true });
      copyFileSync(path, join(current.snapshot.project.rootPath, managedPath));
      const asset = createMediaAsset({ name: `${entry.name}${extname(entry.fileName)}`, kind: kind === "photo" ? "image" : "audio", managedPath, sourceHash: entry.contentHash, tags: ["presenter-library", entry.id] });
      asset.status = "ready"; asset.metadata = entry.metadata;
      assets.push(asset);
      const chosen = { entryId: entry.id, name: entry.name, assetId: asset.id, contentHash: entry.contentHash };
      if (kind === "photo") selection.photo = chosen;
      else {
        const reference = createVoiceReference({ assetId: asset.id, label: entry.name, usageNote: "本片固定的音色样本", recommendedRange: { startMs: 0, endMs: Math.min(entry.metadata.durationMs, 15_000) }, quality: "warning", usable: true });
        references.push(reference);
        selection.voice = { ...chosen, voiceReferenceId: reference.id };
      }
    }
    if (!selection.photo && !selection.voice) throw new DomainError("请先保存人物照片或音色并设置默认，或明确选择条目", "PRESENTER_SELECTION_MISSING");
    if (!assets.length && JSON.stringify(selection) === JSON.stringify(previous)) return current;
    const photoChanged = previous.photo?.contentHash !== selection.photo?.contentHash;
    const voiceChanged = previous.voice?.contentHash !== selection.voice?.contentHash;
    const state = this.application.repository.commit(input.projectId, input.baseRevision, "应用本片人物与音色", (snapshot, impact) => {
      snapshot.assets.push(...assets); snapshot.voiceReferences = references; snapshot.presenter = selection;
      if (voiceChanged) {
        // 文字未变也必须重新配音；版本用于阻止在途旧音色结果回写。
        snapshot.speechInputVersion = (snapshot.speechInputVersion ?? 0) + 1;
        for (const segment of snapshot.speechSegments) segment.status = "stale";
        if (snapshot.speechAsset) impact.stale.push(snapshot.speechAsset.id);
        if (snapshot.speechAlignment) impact.stale.push(snapshot.speechAlignment.id);
        snapshot.speechAsset = undefined;
        snapshot.speechAlignment = undefined;
        snapshot.speechSegmentAssets = [];
        const dialogue = snapshot.timeline.tracks.find(track => track.name === "Dialogue");
        for (const item of snapshot.timeline.items) if (item.trackId === dialogue?.id && snapshot.assets.some(asset => asset.id === item.assetId && asset.kind === "speech")) item.disabled = true;
        snapshot.timeline.captions = snapshot.timeline.captions.filter(card => card.sourceKind === "source_audio" || card.sourceKind === "user_srt");
        for (const cue of snapshot.audioCues) {
          cue.status = "stale"; impact.stale.push(cue.id);
          const item = snapshot.timeline.items.find(item => item.id === cue.timelineItemId);
          if (item) item.disabled = true;
        }
        impact.stale.push(...snapshot.speechSegments.map(segment => segment.id));
        impact.warnings.push("音色已更换：请重新配音、生成口型，并按新声音校准字幕、画面与声音接点。");
      }
      if (photoChanged || voiceChanged) for (const performance of snapshot.actorPerformances) {
        if (performance.source !== "generated") continue;
        performance.status = "stale"; impact.stale.push(performance.id);
      }
      impact.changed.push(...assets.map(asset => asset.id));
      impact.dirtyRanges.push({ startFrame: 0, endFrame: snapshot.timeline.durationInFrames, reason: "本片人物或音色已更换" });
      if (photoChanged) impact.warnings.push("人物照片已更换：相关人物镜头需要重新生成并复核构图。");
    });
    this.application.publish({ projectId: input.projectId, revision: state.revision.number, type: "revision" });
    return state;
  }
}
