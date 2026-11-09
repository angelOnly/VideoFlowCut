import { type DeliverableSyntaxSafeFixRule } from '@open-design/contracts';
import type { DeliverableSyntaxResult } from './deliverable-syntax.js';
export interface DeliverableSyntaxSafeFixPatch {
    content: string;
    expectedDiskContent: string;
    file: string;
    mode: number;
    rule: DeliverableSyntaxSafeFixRule;
    targetPath: string;
    /** Inserted/replaced characters in this local proposal, not its file size. */
    editCount: number;
    /** Valid only for these exact staged bytes; never persisted or shared across Runs. */
    sourceSegment: SourceSegment;
}
export type DeliverableSyntaxSafeFixProposal = {
    action: 'proposed';
    patch: DeliverableSyntaxSafeFixPatch;
} | {
    action: 'none';
    reason: 'ambiguous_diagnostic' | 'file_unreadable' | 'path_outside_project' | 'unsupported_syntax_error';
};
export type DeliverableSyntaxSafeFixCommitResult = {
    action: 'committed';
} | {
    action: 'none';
    reason: 'concurrent_modification' | 'write_failed';
};
interface SourceSegment {
    end: number;
    start: number;
}
/**
 * Propose one syntax-only patch without mutating the project. Unsupported or
 * ambiguous diagnostics return `none`, and callers can validate the staged
 * content before committing it.
 */
export declare function proposeDeliverableSyntaxSafeFix(input: {
    contentOverrides?: ReadonlyMap<string, string>;
    previousPatch?: DeliverableSyntaxSafeFixPatch;
    projectRoot: string;
    result: Extract<DeliverableSyntaxResult, {
        status: 'repairable';
    }>;
}): Promise<DeliverableSyntaxSafeFixProposal>;
/**
 * Commit a fully verified staged patch using two content checks around a
 * sibling fsynced temporary file, followed by an atomic rename. This narrows
 * the concurrent-edit window without claiming an OS-level compare-and-swap.
 */
export declare function commitDeliverableSyntaxSafeFix(patch: DeliverableSyntaxSafeFixPatch): Promise<DeliverableSyntaxSafeFixCommitResult>;
export {};
