import type Database from 'better-sqlite3';
import type { AppliedPluginSnapshot, ApplyResult, InstalledPluginRecord, PluginConnectorBinding, ProjectScenarioBindingProvenance, ProjectScenarioTaskProfile } from '@open-design/contracts';
import { type ConnectorProbe } from './connector-gate.js';
import type { RegistryView } from '@open-design/plugin-runtime';
import { type SelectableStrategyTaskTypeV2 } from './strategy-package.js';
type SqliteDb = Database.Database;
export interface ResolveSnapshotInput {
    db: SqliteDb;
    body: Record<string, unknown> | null | undefined;
    projectId: string;
    conversationId?: string | null | undefined;
    runId?: string | null | undefined;
    registry: RegistryView;
    /** Exact already-local record selected by a record-aware caller. */
    plugin?: InstalledPluginRecord | undefined;
    connectorProbe?: ConnectorProbe | undefined;
    activeProjectDesignSystem?: {
        id: string;
        title?: string;
    } | undefined;
    /**
     * Run creation may only reuse a snapshot already pinned to the same
     * project. Project creation deliberately leaves this false because it can
     * create a fresh snapshot, while run routes set it after project authority
     * has been established.
     */
    requireSnapshotProjectMatch?: boolean | undefined;
    /**
     * Whether a request that names no plugin or snapshot may implicitly reuse
     * the project's durable pin. Run creation normally enables this behavior;
     * callers that have rejected a stale daemon-owned selection can disable it
     * so that rejection cannot fall through to an unrelated historical pin.
     */
    allowProjectPinFallback?: boolean | undefined;
    /**
     * Internal Coordinator-only activation. This is not parsed from an HTTP or
     * CLI request body, so ordinary catalog/apply paths stay fail closed.
     */
    internalStrategyActivation?: {
        taskType: SelectableStrategyTaskTypeV2;
        /** Trusted record resolved directly from the hidden bundled resource. */
        plugin: InstalledPluginRecord;
    } | undefined;
    /**
     * Apply an exact daemon-selected plugin for this Run without replacing the
     * project's or conversation's durable plugin pin. The Run route links the
     * resulting immutable snapshot after it claims the Run.
     */
    runScopedActivation?: boolean | undefined;
    /**
     * Daemon-owned provenance to stamp when this call changes the durable
     * project pin. Omit for fallback reuse; explicit request fields default to
     * `explicit_user`.
     */
    projectBinding?: {
        provenance: ProjectScenarioBindingProvenance;
        taskProfile?: ProjectScenarioTaskProfile | null;
    } | undefined;
}
export interface ResolveSnapshotOk {
    ok: true;
    snapshotId: string;
    snapshot: AppliedPluginSnapshot;
    applyResult?: ApplyResult;
    created: boolean;
}
export interface ResolveSnapshotError {
    ok: false;
    status: number;
    exitCode: number;
    body: {
        error: {
            code: string;
            message: string;
            data?: Record<string, unknown>;
        };
    };
}
export type ResolveSnapshotResult = ResolveSnapshotOk | ResolveSnapshotError | null;
export declare function resolvePluginSnapshot(input: ResolveSnapshotInput): ResolveSnapshotResult;
export declare function capabilitiesRequiredError(args: {
    pluginId: string;
    pluginVersion: string;
    required: string[];
    granted: string[];
    missing: string[];
}): ResolveSnapshotError;
export type { PluginConnectorBinding };
