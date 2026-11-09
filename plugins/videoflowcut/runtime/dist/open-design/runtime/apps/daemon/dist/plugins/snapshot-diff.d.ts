import type { AppliedPluginSnapshot } from '@open-design/contracts';
export interface SnapshotDiffEntry {
    field: string;
    kind: 'added' | 'removed' | 'changed';
    before?: string;
    after?: string;
    summary?: string;
}
export interface SnapshotDiffReport {
    pluginId?: string;
    digestEqual: boolean;
    entries: SnapshotDiffEntry[];
    added: number;
    removed: number;
    changed: number;
}
export interface DiffSnapshotsInput {
    a: AppliedPluginSnapshot;
    b: AppliedPluginSnapshot;
}
export declare function diffSnapshots(input: DiffSnapshotsInput): SnapshotDiffReport;
