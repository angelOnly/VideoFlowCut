/**
 * Codex 0.146+ keeps archived rollouts in a flat directory. Its state_5.sqlite
 * primary-key index resolves only the known thread, independently of archive
 * size. The index is optional: callers retain their bounded directory fallback
 * for older, missing, busy, or incompatible native databases.
 */
export declare function findIndexedCodexArchivedRolloutPath(codexHome: string, sessionId: string): Promise<string | null>;
