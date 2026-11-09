import type { AnnotationDistillInput, RuleProposalDraft } from '@open-design/contracts';
import { suggestWithLLM } from './memory-llm.js';
interface DistillOptions {
    projectRoot?: string | null;
    chatAgentId?: string | null;
    chatModel?: string | null;
    chatProvider?: unknown;
    suggest?: typeof suggestWithLLM;
}
export interface DistillResult {
    proposals: RuleProposalDraft[];
    attemptedLLM: boolean;
    source: 'heuristic' | 'llm' | 'mixed';
}
export declare function parseRuleBody(body: string): {
    assertion: string;
    check: string;
    rationale: string;
};
export declare function distillRulesFromAnnotations(dataDir: string, input: {
    annotations: AnnotationDistillInput[];
}, options?: DistillOptions): Promise<DistillResult>;
export {};
