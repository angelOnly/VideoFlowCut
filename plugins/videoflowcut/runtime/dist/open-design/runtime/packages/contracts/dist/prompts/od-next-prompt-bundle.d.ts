import type { StrategyInputStageV2 } from '../plugins/strategy-v2.js';
export declare const OD_NEXT_PROMPT_BUNDLE_SCHEMA_V1: 'open-design.od-next-prompt-bundle/v1';
export declare const OD_NEXT_REQUEST_TURN_SCHEMA_V1: 'open-design.od-next-request-turn/v1';
export interface OdNextPromptBundleV1 {
    systemPrompt: string;
    userPrompt: string;
    taskConfig: string;
    context: string;
}
export type OdNextRequestTurnStageV1 = Exclude<StrategyInputStageV2, 'request'>;
export interface OdNextRequestTurnV1 {
    taskExecutionId: string;
    stage: OdNextRequestTurnStageV1;
    taskRunIndex: number;
    payload: string;
}
export declare function serializeOdNextPromptBundleV1(input: OdNextPromptBundleV1): string;
export declare function parseOdNextPromptBundleV1(source: string): OdNextPromptBundleV1;
export declare function serializeOdNextRequestTurnV1(input: OdNextRequestTurnV1): string;
export declare function parseOdNextRequestTurnV1(source: string): OdNextRequestTurnV1;
//# sourceMappingURL=od-next-prompt-bundle.d.ts.map