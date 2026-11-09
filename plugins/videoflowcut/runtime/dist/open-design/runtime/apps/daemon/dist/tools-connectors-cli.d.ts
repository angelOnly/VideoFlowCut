interface ToolCliResult {
    exitCode: number;
}
export type DesignSystemAuditSeverity = 'error' | 'warning';
export interface DesignSystemAuditIssue {
    severity: DesignSystemAuditSeverity;
    code: string;
    message: string;
    path?: string;
}
export interface DesignSystemPackageAudit {
    ok: boolean;
    projectPath: string;
    filesInspected: number;
    errors: DesignSystemAuditIssue[];
    warnings: DesignSystemAuditIssue[];
}
export declare function scoreDesignFile(repoPath: string): number;
export declare function shouldSkipRepoPath(normalizedPath: string): boolean;
export declare function isTextSnapshotPath(normalizedPath: string): boolean;
export declare function auditDesignSystemPackage(projectPath: string, options?: {
    referencePackage?: boolean;
}): Promise<DesignSystemPackageAudit>;
export declare function runConnectorsToolCli(args: string[]): Promise<ToolCliResult>;
export {};
