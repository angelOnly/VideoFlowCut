import { type RegistryView } from '@open-design/plugin-runtime';
import type { InstalledPluginRecord, PluginManifest } from '@open-design/contracts';
import type Database from 'better-sqlite3';
import { type ConnectorProbe } from './connector-gate.js';
type SqliteDb = Database.Database;
export type DiagnosticSeverity = 'error' | 'warning' | 'info';
export interface Diagnostic {
    severity: DiagnosticSeverity;
    code: string;
    message: string;
    field?: string;
}
export interface DoctorReport {
    pluginId: string;
    ok: boolean;
    issues: Diagnostic[];
    freshDigest: string;
}
export declare function doctorPlugin(plugin: InstalledPluginRecord, registry: RegistryView, options?: {
    warnOnMissingRefs?: boolean;
    connectorProbe?: ConnectorProbe | undefined;
}): DoctorReport;
export declare function markStaleSnapshotsForProject(db: SqliteDb, projectId: string, resolveDigest: (snapshot: {
    pluginId: string;
    manifestSourceDigest: string;
}) => string | null): string[];
export declare function summarizeDoctor(report: DoctorReport): string;
export declare function buildRegistryViewFromManifest(_manifest: PluginManifest, fallback: RegistryView): RegistryView;
export {};
