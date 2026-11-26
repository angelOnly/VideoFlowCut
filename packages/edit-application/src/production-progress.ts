import type { JobRecord, ProductionCompletionEvaluation, ProductionCompletionScope, ProductionCoordinationIssue, ProjectSnapshot, SkillExecutionReport } from "@videocut/contracts";
import type { EditingApplication } from "./index.js";
import { assignmentScopesOverlap } from "./production-coordination.js";
import type { readUnitHandoffs } from "./production-unit-handoff.js";

type Action = {
  code: string;
  scope: ProductionCompletionScope;
  revision: number;
  nextAction: string;
  assignmentId?: string;
  agentId?: string;
  sceneId?: string;
  unitId?: string;
  jobId?: string;
};

/** 下一步只从当前制作记录推导，未登记依赖的后台任务不阻塞其他场面。 */
export function productionProgress(input: {
  snapshot: ProjectSnapshot;
  revision: number;
  run: SkillExecutionReport;
  scope: ProductionCompletionScope;
  completion: ProductionCompletionEvaluation;
  preparationIssues: ProductionCoordinationIssue[];
  directWholeFilm: Awaited<ReturnType<EditingApplication["readDirectWholeFilmPreparation"]>>;
  unitHandoffs: ReturnType<typeof readUnitHandoffs>;
  jobs: JobRecord[];
  productionJobs: JobRecord[];
  coveragePending: boolean;
}) {
  const { snapshot, revision, run, scope, completion, unitHandoffs, jobs, productionJobs, coveragePending } = input;
  const action = (value: Omit<Action, "revision" | "agentId">): Action => ({ ...value, revision,
    ...(value.assignmentId ? { agentId: run.assignments.find(assignment => assignment.assignmentId === value.assignmentId)?.agentId } : {}) });
  const watched = (run.watchedJobs ?? []).map(entry => {
    let job = jobs.find(candidate => candidate.id === entry.jobId);
    const visited = new Set<string>();
    while (job && !visited.has(job.id)) {
      visited.add(job.id);
      const child = jobs.find(candidate => candidate.payload.retryOfJobId === job!.id);
      if (!child) break;
      job = child;
    }
    return { ...entry, originalJobId: entry.jobId, jobId: job?.id ?? entry.jobId,
      status: job?.status ?? "missing", kind: job?.kind, error: job?.error };
  });
  if (run.status === "abandoned") return { state: "abandoned" as const, actionable: [], waiting: [], blocked: [] };
  if (run.status === "completed") return completion.ready
    ? { state: "completed" as const, actionable: [], waiting: [], blocked: [] }
    : { state: "blocked" as const, actionable: [], waiting: [], blocked: [{ reason: "原制作任务已完成，但当前版本的交付条件已变化，请核对实际范围后建立续作。" }] };
  const waiting = watched.filter(entry => ["queued", "running"].includes(entry.status));
  const runnable: Action[] = watched.filter(entry => !["queued", "running", "cancelled"].includes(entry.status)).map(entry => action({
    code: entry.status === "succeeded" ? "COLLECT_JOB" : "RECONCILE_JOB", scope: entry.scope,
    jobId: entry.jobId, assignmentId: entry.assignmentId,
    nextAction: entry.status === "succeeded" ? entry.nextAction : `核对原任务状态和恢复依据后继续：${entry.nextAction}`
  }));
  const activeProductionJobs = productionJobs.filter(job => ["queued", "running"].includes(job.status));
  if (!activeProductionJobs.length && coveragePending) {
    for (const job of productionJobs.filter(entry => ["failed", "unknown", "cancelled"].includes(entry.status)
      || (entry.result?.continuation as { status?: string } | undefined)?.status === "needs_reconfirmation"
      || (entry.result?.authoring as { status?: string } | undefined)?.status === "incomplete")) {
      runnable.push(action({ code: "RECONCILE_PRODUCTION_JOB", scope, jobId: job.id,
        nextAction: "读回原制作任务和采用回执，处理失败或受影响范围后续接" }));
    }
    for (const handoff of unitHandoffs.filter(entry => entry.status !== "accepted")) {
      runnable.push(action({ code: `UNIT_${handoff.status.toUpperCase()}`, scope: { kind: "objects", objectIds: [handoff.sceneId] },
        sceneId: handoff.sceneId, unitId: handoff.unitId, assignmentId: handoff.assignmentId, nextAction: handoff.nextAction }));
    }
    for (const issue of input.preparationIssues) {
      const sceneId = issue.relatedObjectIds.find(id => snapshot.scenes.some(scene => scene.id === id));
      if (issue.code === "VISUAL_DESIGN_PENDING" && sceneId
        && unitHandoffs.some(entry => entry.sceneId === sceneId && entry.status !== "accepted")) continue;
      runnable.push(action({ code: issue.code, scope: issue.scope, assignmentId: issue.assignmentId, sceneId, nextAction: issue.nextAction }));
    }
    if (!input.preparationIssues.length && unitHandoffs.every(entry => entry.status === "accepted")) {
      if (input.directWholeFilm.ready && !productionJobs.length) runnable.push(action({ code: "SUBMIT_WHOLE_FILM", scope,
        nextAction: "按视觉作者选择的路线提交同版整片首版" }));
      else if (input.directWholeFilm.ready && !runnable.some(entry => entry.code === "RECONCILE_PRODUCTION_JOB")) {
        runnable.push(action({ code: "INSPECT_PRODUCTION_RECEIPT", scope, jobId: productionJobs[0]?.id,
          nextAction: "读回原制作回执，接回尚未覆盖的场面" }));
      }
      else for (const issue of input.directWholeFilm.issues) runnable.push(action({ code: issue.code, scope: issue.scope,
        assignmentId: issue.assignmentId, nextAction: issue.nextAction }));
    }
  }
  if (!coveragePending) {
    const actions = completion.nextActions ?? [];
    // 审阅和返修先于选定交付文件，避免把尚未制作的成片列为当前动作。
    const reviewIssues = new Set(completion.coordinationIssues.map(issue => issue.code));
    const priorities = ["FINDING_PENDING", ...reviewIssues, "OBSERVATION_PENDING", "EVENT_REVIEW_PENDING", "DELIVERY_ARTIFACT_PENDING", "DELIVERY_REVIEW_PENDING", "PRODUCTION_BLOCKER"];
    const first = priorities.find(code => actions.some(entry => entry.code === code));
    for (const entry of actions.filter(entry => entry.code === first)) runnable.push(action({ code: entry.code,
      scope: entry.scope, assignmentId: entry.assignmentId, nextAction: entry.nextAction }));
    if (completion.ready) runnable.push(action({ code: "COMPLETE_RUN", scope,
      nextAction: "完成本次制作并读回最终文件及审核结果" }));
  }
  const requiredWaits = waiting.filter(entry => entry.required);
  const actionable = runnable.filter(entry => !requiredWaits.some(wait => assignmentScopesOverlap(snapshot, entry.scope, wait.scope)));
  const unique = [...new Map(actionable.map(entry => [JSON.stringify(entry), entry])).values()];
  return {
    state: unique.length ? "actionable" as const
        : activeProductionJobs.length || requiredWaits.length ? "waiting" as const : "blocked" as const,
    actionable: unique,
    waiting: [...waiting, ...activeProductionJobs.filter(job => !waiting.some(entry => entry.jobId === job.id))
      .map(job => ({ jobId: job.id, status: job.status, kind: job.kind, scope, required: true,
        nextAction: "跟踪原制作任务并接回实际回件" }))],
    blocked: watched.filter(entry => entry.status === "missing" || entry.required && entry.status === "cancelled")
  };
}
