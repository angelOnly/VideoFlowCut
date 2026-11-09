import { type ExecFileOptions } from 'node:child_process';
export interface BufferedCommandResult {
    ok: boolean;
    code: string | number | null | undefined;
    stdout: string;
    stderr: string;
    error: Error | null;
}
export declare function execFileBuffered(command: string, args: readonly string[], opts?: ExecFileOptions): Promise<BufferedCommandResult>;
export declare function execGhBuffered(args: readonly string[], opts?: ExecFileOptions): Promise<BufferedCommandResult>;
export declare function execCommandViaLoginShell(command: string, args: readonly string[], opts?: ExecFileOptions): Promise<BufferedCommandResult>;
