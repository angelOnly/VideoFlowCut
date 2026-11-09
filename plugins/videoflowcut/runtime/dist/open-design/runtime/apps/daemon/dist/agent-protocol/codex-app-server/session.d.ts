type JsonObject = Record<string, unknown>;
export type CodexSandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';
declare const closedThreadProof: unique symbol;
/** Issued only by this session after its child closes; never reconstructed from a user ID. */
export interface CodexClosedThreadCleanup {
    readonly threadId: string;
    readonly historyMode: 'paginated' | 'legacy';
    readonly [closedThreadProof]: true;
}
export interface CodexAppServerSessionOptions {
    child: {
        once?(event: 'close', listener: () => void): unknown;
        stdout: {
            on(event: 'data', listener: (chunk: unknown) => void): unknown;
        };
        stdin: {
            write(chunk: string, cb?: (err?: Error | null) => void): unknown;
            end(): unknown;
            destroyed?: boolean;
        } | null;
        killed?: boolean;
    };
    prompt: string;
    cwd: string;
    model?: string | null;
    reasoning?: string | null;
    serviceTier?: string | null;
    sandboxMode: CodexSandboxMode;
    resumeSessionId?: string | null;
    /** Internal daemon policy; never infer ownership from a thread title. */
    manageThreadVisibility?: boolean;
    /** The daemon validated this resume handle against its captured session record. */
    resumeSessionOwned?: boolean;
    imagePaths?: string[];
    clientVersion?: string;
    onAgentEvent: (event: JsonObject) => void;
    onCliReady?: () => void;
    onSessionReady?: () => void;
    onPromptSendStart?: () => void;
    onPromptSendEnd?: () => void;
    onTurnComplete?: () => void;
}
export interface CodexAppServerSession {
    abort(): void;
    steer(text: string, expectedTurnId?: string, feedbackId?: string): Promise<CodexSteerResult>;
    /**
     * True once codex reported a turn that ended without failing. The run's close
     * classifier reads this so a shutdown that produces no exit code (a signalled
     * kill during teardown) is still recorded as a success.
     */
    completedSuccessfully(): boolean;
    getDurableSessionId(): string | null;
    getLastSessionPath(): string | null;
    /** Once-only cleanup authority, unavailable until this exact child has closed. */
    takeClosedThreadCleanup(): CodexClosedThreadCleanup | null;
    stats(): {
        unknownNotifications: number;
        unknownItems: number;
    };
}
export type CodexSteerResult = {
    ok: true;
    threadId: string;
    turnId: string;
} | {
    ok: false;
    refusal: 'turn_not_ready' | 'run_terminal' | 'turn_mismatch' | 'delivery_unknown' | 'rpc_rejected';
    detail?: string;
};
export declare function attachCodexAppServerSession(opts: CodexAppServerSessionOptions): CodexAppServerSession;
export {};
