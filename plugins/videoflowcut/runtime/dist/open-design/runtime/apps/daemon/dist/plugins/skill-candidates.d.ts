import type Database from 'better-sqlite3';
import type { SkillPluginCandidate } from '@open-design/contracts';
type SqliteDb = Database.Database;
export interface DetectSkillPluginCandidateInput {
    projectId: string;
    runId?: string | null;
    conversationId?: string | null;
    assistantMessageId?: string | null;
    message?: unknown;
    attachments?: unknown;
    projectRoot: string;
    now?: number;
}
export interface SkillPluginDraftGenerationResult {
    ok: boolean;
    candidate: SkillPluginCandidate;
    draftPath: string;
    folder: string;
    validation: {
        ok: boolean;
        diagnostics: Array<{
            severity: 'error' | 'warning' | 'info';
            code: string;
            message: string;
        }>;
    };
}
export declare function detectSkillPluginCandidate(input: DetectSkillPluginCandidateInput): Promise<(Omit<SkillPluginCandidate, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    fingerprint: string;
}) | null>;
export declare function insertSkillPluginCandidate(db: SqliteDb, candidate: Omit<SkillPluginCandidate, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    fingerprint: string;
}, now?: number): SkillPluginCandidate | null;
export declare function listSkillPluginCandidates(db: SqliteDb, projectId: string, includeDismissed?: boolean): SkillPluginCandidate[];
export declare function getSkillPluginCandidate(db: SqliteDb, id: string): SkillPluginCandidate | null;
export declare function dismissSkillPluginCandidate(db: SqliteDb, projectId: string, id: string, now?: number): SkillPluginCandidate | null;
export declare function generateSkillPluginDraft(db: SqliteDb, projectRoot: string, projectId: string, id: string, now?: number): Promise<SkillPluginDraftGenerationResult | null>;
export {};
