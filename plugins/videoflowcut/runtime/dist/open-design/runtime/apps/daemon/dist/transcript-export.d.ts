import Database from 'better-sqlite3';
type Db = Database.Database;
export interface TranscriptExportOptions {
    now?: () => Date;
    /**
     * When set, restricts the export to a single conversation. The handoff
     * flow scopes to the one conversation the user is resuming; project-wide
     * consumers (finalize) omit this and export every conversation.
     */
    conversationId?: string;
}
export interface TranscriptExportResult {
    path: string;
    conversationCount: number;
    messageCount: number;
    bytesWritten: number;
}
export declare class TranscriptExportLockedError extends Error {
    constructor(message: string);
}
export declare function exportProjectTranscript(db: Db, projectsRoot: string, projectId: string, options?: TranscriptExportOptions): TranscriptExportResult;
export {};
