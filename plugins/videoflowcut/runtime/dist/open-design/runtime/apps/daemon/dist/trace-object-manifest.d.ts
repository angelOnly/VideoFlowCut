import { type OdNextTaskInputSnapshotDescriptor } from './strategies/od-next/task-input-snapshot.js';
import type { ArtifactManifestEntry, ArtifactSummary, AttachmentManifestEntry, InputTextSnapshotManifestEntry, ObjectManifestCompleteness } from './langfuse-trace.js';
type ObjectClass = 'attachment' | 'artifact' | 'input_text_snapshot';
export interface TraceObjectUploadManifests {
    attachmentManifest?: AttachmentManifestEntry[];
    artifactManifest?: ArtifactManifestEntry[];
    inputTextSnapshotManifest?: InputTextSnapshotManifestEntry[];
    completeness: ObjectManifestCompleteness;
}
export interface TraceObjectSource {
    redacted?: boolean;
    sourcePathHash?: string;
    objectClass: ObjectClass;
    id: string;
    filename: string;
    mime: string;
    type?: string;
    body?: Buffer;
    sizeBytes?: number;
    reason?: string;
    source: string;
    truncated?: boolean;
}
export interface BuildTraceObjectManifestsOptions {
    /** Already policy-redacted complete Run evidence, frozen with the other Run objects. */
    runEvidence?: string;
    installationId: string | null;
    projectId: string;
    runId: string;
    projectsRoot: string;
    projectMetadata?: Record<string, unknown> | null;
    attachmentPaths?: string[];
    artifacts?: TraceArtifactObjectSource[];
    prompt: string;
    prefs: {
        metrics?: boolean;
        content?: boolean;
        artifactManifest?: boolean;
    };
    fetchImpl?: typeof fetch;
    env?: NodeJS.ProcessEnv;
    now?: () => Date;
    uploadMode?: 'manifest-only' | 'upload';
    /** Frozen sources supplied by the durable outbox; never re-read live paths. */
    frozenSources?: TraceObjectSource[];
    snapshotMaxBytes?: number;
    runScopedIds?: boolean;
    taskInputSnapshot?: {
        descriptor: OdNextTaskInputSnapshotDescriptor;
        snapshotsRoot: string;
    };
}
export interface TraceArtifactObjectSource {
    summary: ArtifactSummary;
    sourcePath?: string;
}
export declare function buildTraceObjectManifests(opts: BuildTraceObjectManifestsOptions): Promise<TraceObjectUploadManifests | undefined>;
/** Capture once before enqueue; all retry/registration/upload passes reuse these bytes. */
export declare function freezeTraceObjectSources(opts: BuildTraceObjectManifestsOptions): Promise<TraceObjectSource[]>;
export {};
