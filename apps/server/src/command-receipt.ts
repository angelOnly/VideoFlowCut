import type { ProjectState } from "@videocut/application";
import type { CommandReceipt, JobRecord } from "@videocut/contracts";

/** 写入只回传实际变化和继续工作所需对象；完整工程仍由read_project取得。 */
export function commandReceipt(state: ProjectState, result?: unknown, reviewOnly = false): CommandReceipt<unknown> {
  const impact = state.revision.impact;
  const changedIds = reviewOnly ? [] : [...new Set(impact.changed)];
  const objects: Array<{ collection: string; value: unknown }> = [];
  for (const [key, value] of Object.entries(state.snapshot)) {
    const entries = Array.isArray(value) ? value : key === "story" ? state.snapshot.story.beats
      : value && typeof value === "object" && "id" in value ? [value] : [];
    for (const entry of entries) if (typeof entry.id === "string" && changedIds.includes(entry.id)) objects.push({ collection: key, value: entry });
  }
  for (const [key, entries] of [["items", state.snapshot.timeline.items], ["captions", state.snapshot.timeline.captions]] as const) {
    for (const entry of entries) if (changedIds.includes(entry.id)) objects.push({ collection: key, value: entry });
  }
  return { projectId: state.snapshot.project.id, revision: state.revision.number, changedIds,
    staleIds: reviewOnly ? [] : [...new Set(impact.stale)], dirtyRanges: reviewOnly ? [] : impact.dirtyRanges,
    warnings: reviewOnly ? [] : impact.warnings, result: result ?? { objects } };
}

export function projectCommandResult(value: unknown): unknown {
  if (value && typeof value === "object" && "snapshot" in value && "revision" in value && "reviews" in value) return commandReceipt(value as ProjectState);
  if (value && typeof value === "object" && "state" in value) return { ...value, state: projectCommandResult(value.state) };
  return value;
}

/** 提交与轮询不携带大份源码；完整输入只在受管固定定义中保存。 */
export function motionJobReceipt(job: JobRecord) {
  const { work: _work, boundImages: _images, boundVideos: _videos, boundFonts: _fonts, reusableAsset: _reuse, ...payload } = job.payload;
  return { ...job, payload };
}
