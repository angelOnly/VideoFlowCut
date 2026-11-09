export { ensureSpawnHelperExecutable, spawnHelperCandidatePaths, } from './services/node-pty.js';
/**
 * In-memory interactive Terminal session manager. Mirrors the chat-run
 * lifecycle in `runs.ts`: each session keeps a bounded event ring-buffer so a
 * reattaching SSE client can replay recent scrollback after its
 * `Last-Event-ID`, then fans out live PTY output to every attached client.
 * Sessions are process-local and never persisted — closing the daemon kills
 * the PTYs (see `shutdownActive`).
 */
export declare const TERMINAL_SESSION_TERMINAL_STATUSES: Set<string>;
/**
 * Resolve the shell binary for a new PTY. Honors an explicit request override,
 * then the user's environment (SHELL on posix, ComSpec on win32), and finally
 * falls back to a per-platform default.
 */
export declare function resolveShell(requested?: string | null): string;
export interface CreateTerminalMeta {
    projectId?: string | null;
    cwd: string;
    cols?: number;
    rows?: number;
    shell?: string | null;
}
export declare function createTerminalService({ maxEvents, maxBufferBytes, exitTailBytes, flushIntervalMs, flushThresholdBytes, ttlMs, shutdownGraceMs, }?: {
    exitTailBytes?: number | undefined;
    flushIntervalMs?: number | undefined;
    flushThresholdBytes?: number | undefined;
    maxBufferBytes?: number | undefined;
    maxEvents?: number | undefined;
    shutdownGraceMs?: number | undefined;
    ttlMs?: number | undefined;
}): {
    create: (meta: CreateTerminalMeta) => Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        projectId: string | null;
        cwd: string;
        shell: string;
        cols: number;
        rows: number;
        status: 'running' | 'exited';
        createdAt: number;
        updatedAt: number;
        exitCode: number | null;
        signal: string | null;
        events: Array<{
            id: number;
            event: string;
            data: any;
            timestamp: number;
            byteLength: number;
        }>;
        nextEventId: number;
        clients: Set<any>;
        pty: import("node-pty").IPty;
        bufferedBytes: number;
        pendingData: string;
        flushTimer: ReturnType<typeof setTimeout> | null;
    }>;
    get: (id: string) => any;
    list: ({ projectId }?: {
        projectId?: string | null;
    }) => any[];
    stream: (session: any, req: any, res: any, createSseResponse: (res: any) => any) => void;
    write: (session: any, input: string) => boolean;
    resize: (session: any, cols: number, rows: number) => boolean;
    kill: (session: any, signal?: string) => boolean;
    shutdownActive: ({ graceMs }?: {
        graceMs?: number;
    }) => Promise<void>;
    statusBody: (session: any) => {
        id: any;
        projectId: any;
        cwd: any;
        shell: any;
        cols: any;
        rows: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        exitCode: any;
        signal: any;
    };
    isTerminal(status: string): boolean;
};
