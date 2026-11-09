import type { MemoryVerifyResult, MemoryVerifyRecord } from '@open-design/contracts';
export interface ActiveRuleForVerify {
    name: string;
    /** The rule's Check line — the rubric a scorecard row should address. */
    check?: string;
}
export interface EnforceVerifyInput {
    /** The assistant's full turn text (reassembled from the event stream). */
    assistantOutput: string;
    /** Active `rule` memories at enforcement time. */
    activeRules: ActiveRuleForVerify[];
    /** Whether the turn produced an artifact — enforcement scopes to those. */
    hadArtifact: boolean;
    /** The master `verifyEnabled` hook. When false, enforcement is skipped. */
    verifyEnabled: boolean;
}
export declare function enforceVerify(input: EnforceVerifyInput): MemoryVerifyResult;
export declare function recordVerify(result: MemoryVerifyResult, meta?: {
    runId?: string;
    projectId?: string | null;
}): MemoryVerifyRecord | null;
export declare function listVerifications(): MemoryVerifyRecord[];
export declare function removeVerification(id: string): number;
export declare function clearVerifications(): number;
export declare function __resetVerificationsForTests(): void;
