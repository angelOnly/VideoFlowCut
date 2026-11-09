import type { Readable } from 'node:stream';
import type { Context } from '@deepseek-ai/cordis';
import { type AgentHandle } from '@deepseek-ai/dsh-agent';
import { type ContentBlock } from '@deepseek-ai/dsh-llm';
import { type SessionEvent, type TurnEndReason } from '@deepseek-ai/dsh-session';
import { type ExecuteCommand, type ModelCatalogEntry } from './protocol.js';
export declare const name = "open-design-runtime";
export declare const inject: string[];
type Output = {
    write(chunk: string): unknown;
};
type ExitFallbackTimer = {
    unref(): unknown;
};
type ExitFallbackScheduler = (callback: () => void, delayMs: number) => ExitFallbackTimer;
type CancellationLatch = {
    activate(requestId: string, controller: AbortController): void;
    cancel(requestId: string): void;
};
declare function errorFacts(error: unknown, fallbackCode: string): {
    code: string;
    message: string;
};
declare function contentText(content: readonly ContentBlock[]): string;
declare function resultStatus(reason: TurnEndReason | undefined): 'completed' | 'cancelled' | 'failed';
declare function resultError(reason: TurnEndReason | undefined): {
    code: string;
    message: string;
} | undefined;
declare function terminalOutput(output: string): {
    output: string;
} | Record<string, never>;
declare function requestProfileExit(exit: (code: number) => void, forceExit?: () => void, schedule?: ExitFallbackScheduler): void;
declare function createCancellationLatch(cancelActiveAgent: () => void): CancellationLatch;
declare function listModelCatalog(ctx: Context): Promise<ModelCatalogEntry[]>;
declare function emitSessionEvent(output: Output, request: ExecuteCommand, provider: string, model: string, event: SessionEvent): void;
declare function execute(ctx: Context, request: ExecuteCommand, output: Output, onHandle: (handle: AgentHandle | undefined) => void, signal: AbortSignal): Promise<void>;
declare function serve(ctx: Context, output: Output, exit: (code: number) => void, input?: Readable, finishProfile?: (exitCallback: (code: number) => void) => void): Promise<void>;
export declare function apply(ctx: Context): void;
export declare const internals: {
    contentText: typeof contentText;
    createCancellationLatch: typeof createCancellationLatch;
    errorFacts: typeof errorFacts;
    emitSessionEvent: typeof emitSessionEvent;
    execute: typeof execute;
    listModelCatalog: typeof listModelCatalog;
    requestProfileExit: typeof requestProfileExit;
    resultStatus: typeof resultStatus;
    resultError: typeof resultError;
    serve: typeof serve;
    terminalOutput: typeof terminalOutput;
};
export {};
