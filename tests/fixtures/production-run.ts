import { randomUUID } from "node:crypto";
import type { EditingApplication } from "../../packages/edit-application/src/index.js";
import type { ProductionCompletionScope, ResponsibilityReview, VisualResponsibility } from "@videocut/contracts";

export async function assignVisualResponsibilities(app: EditingApplication, projectId: string, runId: string,
  scope: ProductionCompletionScope, objectIds: string[]): Promise<ResponsibilityReview[]> {
  const revision = app.readProject(projectId).revision.number;
  const run = await app.readSkillExecutionReport({ projectId, runId });
  await app.updateProductionRun({ projectId, runId, expectedAuditVersion: run.auditVersion, operationId: randomUUID(),
    action: "add_assignment", assignment: { assignmentId: "visual", agentId: "test-visual",
      responsibilities: ["creative_research", "motion_research", "visual_design"],
      skillIds: ["creative-sequence-design", "motion-case-library", "visual-treatment-planning", "creative-reference-to-sequence"],
      scope, inputRevision: revision } });
  const ids: string[] = [];
  const reviews: ResponsibilityReview[] = [];
  for (const phase of ["creative_research", "motion_research", "visual_design"] as VisualResponsibility[]) {
    const result = await app.recordCreativeDecision({ projectId, runId, operationId: randomUUID(), category: "visual",
      phase, assignmentId: "visual", inputRevision: revision, objectIds, decision: `测试${phase}判断`,
      rationale: "针对隔离场面检查", evidence: ["隔离测试中的场面依据"],
      ...(phase === "visual_design" ? { inputDecisionIds: [...ids] } : { researchOutcome: "researched" as const }) });
    const id = result.creativeDecisions.at(-1)!.id;
    ids.push(id);
    reviews.push({ responsibility: phase, assignmentId: "visual", decisionIds: [id], outcome: "confirmed", observation: `检查${phase}的实际结果` });
  }
  return reviews;
}

/** 隔离测试中的局部制作沿正式职责和判断链进入。 */
export async function localProductionRun(app: EditingApplication, projectId: string, objectId: string): Promise<string> {
  const revision = app.readProject(projectId).revision.number;
  const run = await app.startProductionRun({ projectId, baseRevision: revision, intent: "local_edit",
    completionScope: { kind: "objects", objectIds: [objectId] }, operationId: randomUUID(), loadedSkills: ["production-coordinator"] });
  await assignVisualResponsibilities(app, projectId, run.id, { kind: "objects", objectIds: [objectId] }, [objectId]);
  return run.id;
}
