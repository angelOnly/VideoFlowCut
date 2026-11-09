import type { ChildProcess } from 'node:child_process';
import type { CodexAppServerSession } from './session.js';
import { type CodexThreadCleanupOptions, type CodexThreadCleanupResult } from './thread-cleanup.js';
export type CodexCleanupInvocation = Omit<CodexThreadCleanupOptions, 'receipt'>;
type Child = Pick<ChildProcess, 'once' | 'removeListener'>;
/** Own the original child-close boundary independently of mutable run attempts. */
export declare function createCodexThreadCleanupOwner(): {
    bind(child: Child, session: CodexAppServerSession, invocation: CodexCleanupInvocation, report: (result: CodexThreadCleanupResult) => void, evidenceCollected?: Promise<void>): void;
    drain(timeoutMs: number): Promise<{
        pending: number;
    }>;
};
export {};
