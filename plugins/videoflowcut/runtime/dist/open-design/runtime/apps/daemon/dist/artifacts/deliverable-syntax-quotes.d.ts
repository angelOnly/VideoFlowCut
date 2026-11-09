import type { DeliverableSyntaxSafeFixRule } from '@open-design/contracts';
export interface LocalStringQuotePatch {
    content: string;
    rule: DeliverableSyntaxSafeFixRule;
    editCount: number;
}
/**
 * A bounded local correction, not general error recovery or a semantic proof.
 * Acorn must agree with the strict checker's first failure. A candidate must
 * become exactly one string token with the intended static payload, preserve
 * every preceding token, and parse past its closing boundary. Later original
 * errors may remain; the caller still requires a full strict recheck before
 * any bytes reach disk. Multiple eligible candidates are refused.
 */
export declare function proposeLocalStringQuotePatch(source: string, offset: number, diagnosticCode: string): LocalStringQuotePatch | null;
