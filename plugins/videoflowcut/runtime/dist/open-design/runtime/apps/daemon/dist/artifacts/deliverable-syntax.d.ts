import { type DeliverableSyntaxCheckResult as ContractDeliverableSyntaxResult, type DeliverableSyntaxDiagnostic as ContractDeliverableSyntaxDiagnostic } from '@open-design/contracts';
export declare const DELIVERABLE_SYNTAX_CHECKER: "web-syntax@1";
export interface DeliverableSyntaxLimits {
    maxFiles: number;
    maxBytesPerFile: number;
    maxTotalBytes: number;
}
export type DeliverableSyntaxDiagnostic = ContractDeliverableSyntaxDiagnostic;
export type DeliverableSyntaxResult = ContractDeliverableSyntaxResult;
export interface CheckDeliverableSyntaxInput {
    projectRoot: string;
    entryFile?: string | null;
    /** Code files that participate in rendering this canonical entry. The run
     * finalizer should normally pass `artifactOutcome.diff.renderDependencyTouchedPaths`. */
    relatedPaths?: readonly string[];
    /** In-memory staged file contents used by the host safe-fixer. Keys are
     * project-relative portable paths. Overrides never bypass containment or
     * readability checks for the real target file. */
    contentOverrides?: ReadonlyMap<string, string | Buffer>;
    limits?: Partial<DeliverableSyntaxLimits>;
}
/**
 * Conditionally validate the syntax of one canonical Web deliverable.
 *
 * The canonical entry controls applicability. A PDF/DOCX/media delivery is
 * skipped even if its run happened to touch a JS build helper. This function
 * only reads bounded files under `projectRoot`; retry policy belongs to the
 * caller.
 */
export declare function checkDeliverableSyntax(input: CheckDeliverableSyntaxInput): Promise<DeliverableSyntaxResult>;
