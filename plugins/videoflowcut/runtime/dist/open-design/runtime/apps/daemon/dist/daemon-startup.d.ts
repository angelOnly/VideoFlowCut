import type { Server } from 'node:http';
import type { StartServerOptions } from './server.js';
type StartedServer = {
    server: Server;
    url: string;
    shutdown?: () => Promise<void>;
};
export type StartedDaemonRuntime = StartedServer & {
    stop(): Promise<void>;
};
type DaemonRuntimeOptions = Omit<StartServerOptions, 'returnServer'> & {
    openBrowser?: boolean;
    logListening?: boolean;
};
export type DaemonCliStartupConfig = {
    host: string;
    open: boolean;
    port: number;
};
export type DaemonCliStartupParseResult = {
    ok: true;
    config: DaemonCliStartupConfig;
} | {
    ok: false;
    kind: 'help';
} | {
    ok: false;
    kind: 'error';
    message: string;
};
export declare const DEFAULT_DAEMON_BIND_HOST = "127.0.0.1";
export declare function normalizeDaemonBindHost(input: unknown): string;
export declare function parseDaemonCliStartupArgs(argv: string[], env?: NodeJS.ProcessEnv): DaemonCliStartupParseResult;
export declare function closeHttpServer(server: Server, { closeTimeoutMs, idleCloseMs }?: {
    closeTimeoutMs?: number | undefined;
    idleCloseMs?: number | undefined;
}): Promise<void>;
export declare function startDaemonRuntime(options?: DaemonRuntimeOptions): Promise<StartedDaemonRuntime>;
export declare function runDaemonCliStartup(argv: string[], options?: {
    printHelp?: () => void;
}): Promise<void>;
export {};
