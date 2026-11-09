import type Database from 'better-sqlite3';
import type { ProjectMetadata, ProjectScenarioBinding, ProjectScenarioBindingProvenance, ProjectScenarioTaskProfile } from '@open-design/contracts';
type SqliteDb = Database.Database;
export declare function isProjectScenarioBinding(value: unknown): value is ProjectScenarioBinding;
/**
 * Return the only OD Next profile a daemon-owned automatic binding may carry.
 * The decision is based on exact product metadata plus the exact bundled
 * default plugin; broad project kinds such as `image` are intentionally not
 * sufficient.
 */
export declare function automaticScenarioTaskProfile(input: {
    metadata: ProjectMetadata | null | undefined;
    pluginId: string;
}): ProjectScenarioTaskProfile | null;
/**
 * One-way migration for projects created before exact provenance existed.
 * Existing pins are deliberately labelled `legacy_unknown`; this migration
 * never guesses that a historical binding came from the automatic router.
 */
export declare function migrateProjectScenarioBindings(db: SqliteDb): void;
export declare function writeProjectScenarioBinding(db: SqliteDb, input: {
    projectId: string;
    snapshotId: string;
    pluginId: string;
    provenance: ProjectScenarioBindingProvenance;
    taskProfile?: ProjectScenarioTaskProfile | null;
    boundAt?: number;
}): ProjectScenarioBinding;
export declare function readVerifiedProjectScenarioBinding(db: SqliteDb, input: {
    projectId: string;
    appliedPluginSnapshotId: string | null | undefined;
    metadata: ProjectMetadata | null | undefined;
}): ProjectScenarioBinding | null;
export {};
