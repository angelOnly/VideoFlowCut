import type { ProductionCoordinationIssue } from "@videocut/contracts";
import { DomainError } from "@videocut/domain";

/** 制作前拒绝发生在创建 Job 之前，保留具体范围和续接责任。 */
export class MotionAuthoringCoordinationError extends DomainError {
  constructor(public readonly issues: ProductionCoordinationIssue[]) {
    super("当前目标尚未满足正式制作条件，请按诊断续接对应负责人", "MOTION_AUTHORING_COORDINATION_BLOCKED");
  }
}

/** 导演采用前拒绝不完整的参考研究，保留范围和续接责任。 */
export class ProductionReferenceResearchError extends DomainError {
  constructor(public readonly issues: ProductionCoordinationIssue[]) {
    super("采用参考尚未关联完整研究，请按诊断续接对应负责人", "PRODUCTION_REFERENCE_RESEARCH_INVALID");
  }
}
