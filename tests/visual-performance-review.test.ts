import assert from "node:assert/strict";
import test from "node:test";
import type { EditorialQualityReview, EditorialReviewEvidence, QualityReport, ReferenceReviewRef } from "@videocut/contracts";
import { performanceErrors, type ReferenceScene } from "../packages/edit-application/src/opendesign-reference-package.mjs";
import { visualReferenceReviewCoverage } from "../packages/quality-system/src/editorial-review.js";
import { exportBlockingIssues, exportDeliveryBlockingIssues } from "../packages/quality-system/src/export-policy.js";

test("动态演出按实际角色、单元帧段和观看方式准入", () => {
  type Unit = NonNullable<NonNullable<ReferenceScene["visualPlan"]>["units"]>[number];
  const unit: Unit = { id: "u1", title: "主体接管", mode: "full_reference", startFrame: 10, endFrame: 30,
    performance: { mode: "continuous_motion", openingState: "旧主体留在画面", primaryRole: "主体", retainedRoles: ["背景"], respondingRoles: [],
      stages: ["entry", "build", "result", "exit"].map((phase, index) => ({
        phase: phase as "entry" | "build" | "result" | "exit", startFrame: 10 + index * 5, endFrame: 15 + index * 5,
        action: "主体和背景共同变化", visibleRoles: ["主体", "背景"]
      })) } };
  const roles = [{ role: "主体" }, { role: "背景" }];
  assert.deepEqual(performanceErrors(unit, roles), []);
  const missing = structuredClone(unit); delete missing.performance;
  assert.match(performanceErrors(missing, roles).join(), /缺少动态演出设计/u);
  const invalid = structuredClone(unit); invalid.performance!.stages![1]!.endFrame = 31;
  invalid.performance!.stages![2]!.visibleRoles = ["未登记"];
  assert.match(performanceErrors(invalid, roles).join(), /帧段、动作或可见角色无效/u);
  const partial = structuredClone(unit); partial.performance!.stages = partial.performance!.stages!.filter(stage => stage.phase !== "result");
  assert.match(performanceErrors(partial, roles).join(), /缺少入口、发展、结果或出口/u);
  assert.match(performanceErrors({ ...unit, performance: { mode: "quiet_observation", openingState: "主体", primaryRole: "主体", retainedRoles: [], respondingRoles: [] } }, roles).join(), /观看目的/u);
  assert.match(performanceErrors({ ...unit, performance: { mode: "direct_cut", openingState: "主体", primaryRole: "主体", retainedRoles: [], respondingRoles: [] } }, roles).join(), /接续目的/u);
});

test("每项参考需同版连续观察，待核和问题会撤销对应范围的通过", () => {
  const ref = (id: string): ReferenceReviewRef => ({ productionRunId: "run", decisionId: "adoption", sceneId: "scene", referenceKind: "creative",
    referenceId: id, sourceSha256: id, targetRole: "主体", startMs: 0, endMs: 1000 });
  const targets = [ref("a"), ref("b")].map(identity => ({ identity, targetRange: { startFrame: 0, endFrame: 20 } }));
  const evidence = (id: string, reference: ReferenceReviewRef, revision: number, startFrame: number, endFrame: number,
    outcome: "confirmed" | "inconclusive" | "issue", method: EditorialReviewEvidence["method"] = "continuous_video"): EditorialReviewEvidence => ({
    id, revision, source: "workbench", pass: "mute_visual", method, startFrame, endFrame, observation: "实际观察",
    recordedAt: `2026-01-01T00:00:0${id.length}.000Z`, referenceReviews: [{ ...reference, outcome,
      originalRelation: "旧主体保持", actualImplementation: "真实主体接管", difference: "保留空间关系" }]
  });
  const old = evidence("x", targets[0]!.identity, 1, 0, 20, "confirmed");
  const still = evidence("xx", targets[1]!.identity, 2, 0, 20, "confirmed", "frames");
  const review: EditorialQualityReview = { revision: 2, passes: [], previewEvidence: [], findings: [], reviewedAt: "2026-01-01",
    evidenceRecords: [old, still], applicableEvidence: [old, still].map(item => ({ evidenceId: item.id, targetRevision: 2, startFrame: 0, endFrame: 20 })) };
  assert.deepEqual(visualReferenceReviewCoverage(targets, review, 2).map(item => item.missingRanges),
    [[{ startFrame: 0, endFrame: 20 }], [{ startFrame: 0, endFrame: 20 }]]);
  const first = evidence("xxx", targets[0]!.identity, 2, 0, 20, "confirmed");
  const second = evidence("xxxx", targets[1]!.identity, 2, 0, 20, "confirmed");
  second.source = "preview";
  const uncertain = evidence("xxxxx", targets[0]!.identity, 2, 5, 12, "inconclusive");
  for (const item of [first, second, uncertain]) {
    review.evidenceRecords!.push(item);
    review.applicableEvidence!.push({ evidenceId: item.id, targetRevision: 2, startFrame: item.startFrame, endFrame: item.endFrame });
  }
  assert.deepEqual(visualReferenceReviewCoverage(targets, review, 2).map(item => item.missingRanges), [[{ startFrame: 5, endFrame: 12 }], []]);
  const fixed = evidence("xxxxxx", targets[0]!.identity, 2, 5, 12, "confirmed");
  review.evidenceRecords!.push(fixed);
  review.applicableEvidence!.push({ evidenceId: fixed.id, targetRevision: 2, startFrame: 5, endFrame: 12 });
  assert.deepEqual(visualReferenceReviewCoverage(targets, review, 2).map(item => item.missingRanges), [[], []]);
});

test("正式交付阻断缺失观察及必修问题，草稿不受审核门槛阻断", () => {
  const report = { technical: [], productionReconciliation: [{ structuralGaps: [{ code: "missing_implementation", objectIds: ["scene"], message: "画面缺失" }] }],
    editorial: { openFindings: [{ id: "finding", severity: "major", summary: "关键中途缺失" }] } } as unknown as QualityReport;
  const deliveryQualityIssues = exportDeliveryBlockingIssues(report, { referenceGaps: ["参考未复查"], wholeFilmObserved: false });
  assert.deepEqual(deliveryQualityIssues.map(item => item.code), ["DELIVERY_STRUCTURE_INCOMPLETE", "DELIVERY_REFERENCE_REVIEW_PENDING", "DELIVERY_AV_REVIEW_PENDING", "DELIVERY_EDITORIAL_UNRESOLVED"]);
  assert.equal(exportBlockingIssues({ ...report, deliveryQualityIssues }, "delivery").length, 4);
  assert.deepEqual(exportBlockingIssues({ ...report, deliveryQualityIssues }, "draft"), []);
});
