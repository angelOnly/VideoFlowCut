import type { RuntimeExecOptions } from './types.js';
export declare function execAgentFile(command: string, args: string[], options?: RuntimeExecOptions): import("child_process").PromiseWithChild<{
    stdout: string | NonSharedBuffer;
    stderr: string | NonSharedBuffer;
}>;
