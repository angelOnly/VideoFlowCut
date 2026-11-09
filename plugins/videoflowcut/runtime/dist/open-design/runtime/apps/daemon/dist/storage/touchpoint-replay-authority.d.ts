/**
 * POSIX directory synchronization errors fail closed. Windows has no portable
 * directory fsync: its journal contract covers process crashes, not power loss.
 */
export declare function syncAuthorityDirectory(directory: string): void;
/** Flush the file before rename; also flush its directory entry on POSIX. */
export declare function writeAuthorityFile(file: string, data: string | Buffer): void;
/**
 * One owner per account, enforced by SQLite's OS lock, released on process death.
 * The transaction is never committed and contains no authority data. The separate
 * synchronized journal survives SIGKILL; no PID/lease/stale-file reclamation exists.
 * Requires reliable local filesystem locking and file fsync. POSIX additionally
 * requires directory fsync; Windows guarantees process-crash ordering only and
 * makes no power-loss durability claim. Other synchronization errors fail closed.
 */
export declare class TouchpointReplayAuthority {
    private lock;
    private journal;
    private readonly file;
    private closed;
    constructor(directory: string);
    get generation(): string | null;
    begin(): string | null;
    settle(token: string): boolean;
    close(): void;
}
