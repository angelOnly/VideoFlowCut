import type { CodexClosedThreadCleanup } from './session.js';
/** Same measured compatibility floor used by the live session's archive path. */
export declare function codexHistoryCapabilities(userAgent: unknown): {
    paginated: boolean;
    legacy: boolean;
};
export interface CodexThreadCleanupOptions {
    receipt: CodexClosedThreadCleanup | null;
    /** The original resolved app-server invocation, including platform wrapper arguments. */
    command: string;
    args: readonly string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    windowsVerbatimArguments?: boolean;
}
export type CodexThreadCleanupResult = {
    status: 'archived';
    treeVerified?: false;
} | {
    status: 'skipped';
    reason: 'no-owned-closed-thread' | 'unverified-writer-lock';
} | {
    status: 'failed';
    message: string;
    remainingPids?: number[];
    treeVerified?: boolean;
};
/**
 * Best-effort cleanup after the original writer has closed. This process never
 * loads/resumes a thread: archive itself arbitrates any other active writer.
 * The caller reports failures separately and must not delay run finalization.
 */
export declare function cleanupClosedCodexThread(opts: CodexThreadCleanupOptions): Promise<CodexThreadCleanupResult>;
