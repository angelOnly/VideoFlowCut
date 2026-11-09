import type { StrategyTaskExecutionRecord } from '../task-store.js';
export declare function usesProductionMarker(task: Pick<StrategyTaskExecutionRecord, 'promptBundle'>): boolean;
/** 原生续作只传变更模块，并明确替换或清除旧规则。 */
export declare function composeResumedRequest(task: Pick<StrategyTaskExecutionRecord, 'promptBundle' | 'taskExecutionId'>, previous: Pick<StrategyTaskExecutionRecord, 'promptBundle'>): string | null;
