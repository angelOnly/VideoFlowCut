import { type DesignExtractReport, type DesignTokenEntry, type DesignTokenKind } from '../../design-systems/token-evidence.js';
export type { DesignExtractReport, DesignTokenEntry, DesignTokenKind, };
export interface DesignExtractOptions {
    cwd: string;
    repoPath: string;
    largeFileBytes?: number;
}
export declare function runDesignExtract(opts: DesignExtractOptions): Promise<DesignExtractReport>;
