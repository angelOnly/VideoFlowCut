/** @module agent-protocol/dsh-profile/session
 * One-run controller for `dsh --profile open-design --stdio`.
 */
import type { ChildProcess } from 'node:child_process';
import type { DshProfileResultStatus } from './types.js';
export type AttachDshProfileSessionOptions = {
    child: ChildProcess;
    requestId: string;
    prompt: string;
    cwd: string;
    model?: string | null;
    reasoningEffort?: string | null;
    resumeSessionId?: string | null;
    send: (event: string, payload: unknown) => void;
    onReady?: () => void;
    onSession?: () => void;
    onComplete?: () => void;
};
export declare function attachDshProfileSession({ child, requestId, prompt, cwd, model, reasoningEffort, resumeSessionId, send, onReady, onSession, onComplete, }: AttachDshProfileSessionOptions): {
    abort(): void;
    hasFatalError(): boolean;
    completedSuccessfully(): boolean;
    getDurableSessionId(): string | null;
    getTerminalStatus(): DshProfileResultStatus | null;
    ignoredRequestFrameCount(): number;
    executeWasSent(): boolean;
};
