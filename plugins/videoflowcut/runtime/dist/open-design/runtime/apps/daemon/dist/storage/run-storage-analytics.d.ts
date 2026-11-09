import type Database from 'better-sqlite3';
import type { RunFinishedProps } from '@open-design/contracts/analytics';
type SqliteDb = Database.Database;
export type RunStorageAnalytics = Pick<RunFinishedProps, 'storage_schema_version' | 'storage_events_json_bytes' | 'storage_content_bytes' | 'storage_pending_batch_count' | 'storage_pending_batch_bytes' | 'storage_prompt_bundle_bytes'>;
export declare function readRunStorageAnalytics(db: SqliteDb, input: {
    runId: string;
    assistantMessageId: string | null | undefined;
}): RunStorageAnalytics;
export {};
