import type { ExportPurpose, QualityIssue, QualityReport } from "@videocut/contracts";

/** 正式文件生成前检查可观察的作品，文件本身的独立审片仍在导出后进行。 */
export function exportDeliveryBlockingIssues(report: QualityReport, input: { referenceGaps: string[]; wholeFilmObserved: boolean }): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (code: string, message: string, objectId?: string) => issues.push({
    id: `${code}:${issues.length}`, level: "blocking", code, message, objectId, blockingPurposes: ["delivery"]
  });
  for (const entry of report.productionReconciliation ?? []) for (const gap of entry.structuralGaps) {
    add("DELIVERY_STRUCTURE_INCOMPLETE", gap.message, gap.objectIds[0]);
  }
  for (const gap of input.referenceGaps) add("DELIVERY_REFERENCE_REVIEW_PENDING", gap);
  if (!input.wholeFilmObserved) add("DELIVERY_AV_REVIEW_PENDING", "当前版本缺少一次从头到尾的连续声画观察。");
  for (const finding of report.editorial.openFindings ?? []) {
    if (["blocking", "major", "inconclusive"].includes(finding.severity)) add("DELIVERY_EDITORIAL_UNRESOLVED", `审片问题尚未复查关闭：${finding.summary}`, finding.id);
  }
  return issues;
}

/** 浏览器、MCP 和 Worker 共用用途门槛；草稿只检查技术条件。 */
export function exportBlockingIssues(report: Pick<QualityReport, "technical"> & Partial<Pick<QualityReport, "deliveryQualityIssues">>, purpose: ExportPurpose) {
  return [...report.technical.filter(entry => entry.level === "blocking" && (!entry.blockingPurposes || entry.blockingPurposes.includes(purpose))),
    ...(purpose === "delivery" ? report.deliveryQualityIssues ?? [] : [])];
}
