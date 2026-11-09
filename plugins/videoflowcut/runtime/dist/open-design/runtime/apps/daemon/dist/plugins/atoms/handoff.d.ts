import type { ArtifactDeployTarget, ArtifactExportTarget, ArtifactManifest, ArtifactProvenanceHandoffKind } from '@open-design/contracts';
export interface RecordHandoffInput {
    manifest: ArtifactManifest;
    exportTarget?: ArtifactExportTarget;
    deployTarget?: ArtifactDeployTarget;
    handoffKind?: ArtifactProvenanceHandoffKind;
    enforceMonotonicHandoff?: boolean;
}
export interface RecordHandoffResult {
    manifest: ArtifactManifest;
    changed: Array<'exportTargets' | 'deployTargets' | 'handoffKind'>;
}
export declare function recordHandoff(input: RecordHandoffInput): RecordHandoffResult;
export declare function isDeployableAppEligible(args: {
    manifest: ArtifactManifest;
    buildPassing?: boolean;
    testsPassing?: boolean;
}): boolean;
export interface RunHandoffAtomInput {
    cwd: string;
    manifest: ArtifactManifest;
    exportTarget?: ArtifactExportTarget;
    exportTargets?: ArtifactExportTarget[];
    deployTarget?: ArtifactDeployTarget;
    deployTargets?: ArtifactDeployTarget[];
}
export interface RunHandoffAtomResult {
    manifest: ArtifactManifest;
    changed: Array<'exportTargets' | 'deployTargets' | 'handoffKind'>;
    signals: {
        decision?: 'accept' | 'reject' | 'partial';
        buildPassing?: boolean;
        testsPassing?: boolean;
        deployable: boolean;
    };
}
export declare function runHandoffAtom(input: RunHandoffAtomInput): Promise<RunHandoffAtomResult>;
export interface RunAndPersistHandoffInput {
    cwd: string;
    manifestSeed?: ArtifactManifest;
    exportTarget?: ArtifactExportTarget;
    exportTargets?: ArtifactExportTarget[];
    deployTarget?: ArtifactDeployTarget;
    deployTargets?: ArtifactDeployTarget[];
}
export interface RunAndPersistHandoffResult extends RunHandoffAtomResult {
    manifestPath: string;
    persistMode: 'created' | 'updated' | 'skipped';
}
export declare function runAndPersistHandoff(input: RunAndPersistHandoffInput): Promise<RunAndPersistHandoffResult>;
