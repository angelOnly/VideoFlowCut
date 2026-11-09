import { type DiagnosticFailureCode, type DiagnosticProxyEnvironment, type SystemEnvironmentSnapshot } from './diagnostics-environment.js';
type Source = 'workspace-directory' | 'workspace-context' | 'team-projects' | 'shared-resources' | 'local-api';
type Workspace = {
    workspaceId: string | null;
    memberId: string | null;
    workspaceType: 'team' | 'personal' | null;
};
export type FailureInput = {
    source: Source;
    operation?: string;
    requestId?: unknown;
    error?: unknown;
    timedOut?: boolean;
    status?: number;
    workspaceId?: unknown;
    memberId?: unknown;
    workspaceType?: unknown;
    /** Already-used child env, only summarized on a new group or once per minute. */
    env?: NodeJS.ProcessEnv;
};
export declare function diagnosticsEvidencePaths(dataRoot: string): {
    directory: string;
    current: string;
    previous: string;
};
/** One bounded checkpoint, plus the preceding process's checkpoint. No growing log or write queue. */
export declare function createEvidenceCheckpointWriter(dataRoot: string): (content: string) => Promise<void>;
export declare function createDiagnosticsEvidence(options?: {
    collect?: () => Promise<SystemEnvironmentSnapshot>;
    write?: (content: string) => Promise<void>;
    now?: () => number;
}): {
    refresh: () => Promise<void>;
    flush: () => Promise<void>;
    snapshot: () => ReturnType<() => {
        schemaVersion: number;
        exportedAt: string;
        limits: {
            failures: number;
            bytes: number;
            sampleIntervalMs: number;
            flushIntervalMs: number;
        };
        coverage: {
            actualNetworkRoute: string;
            vpn: string;
            workspaceContext: string;
            failureEnvironment: string;
            persistence: string;
            droppedGroups: number;
            environmentCollection: "collecting" | "not-requested" | "settled" | "unavailable";
        };
        directory: {
            observedAt: string;
            truncated: boolean;
            items: Workspace[];
        } | null;
        context: (Workspace & {
            observedAt: string;
        }) | null;
        environments: SystemEnvironmentSnapshot[];
        failures: {
            workspaceId: string | null;
            memberId: string | null;
            workspaceType: 'team' | 'personal' | null;
            source: Source;
            code: DiagnosticFailureCode;
            status: number | null;
            operation: string | null;
            requestId: string | null;
            proxySampledAt: string | null;
            firstAt: string;
            lastAt: string;
            count: number;
            firstEnvironmentAt: string | null;
            lastEnvironmentAt: string | null;
            proxyConfiguration: DiagnosticProxyEnvironment | null;
        }[];
    }>;
    record(input: FailureInput): void;
    observeDirectory(items: readonly {
        workspaceId?: unknown;
        memberId?: unknown;
        workspaceType?: unknown;
        workspaceMemberId?: unknown;
    }[]): void;
    observeContext(value: {
        workspaceId?: unknown;
        memberId?: unknown;
        workspaceType?: unknown;
    } | null): void;
    close(): void;
};
export type DiagnosticsEvidence = ReturnType<typeof createDiagnosticsEvidence>;
/** Configure once with the daemon's resolved data root; readers never guess it. */
export declare function configureDiagnosticsEvidence(dataRoot: string): void;
export declare function getDiagnosticsEvidence(): DiagnosticsEvidence | null;
export declare function recordDiagnosticFailure(input: FailureInput): void;
export {};
