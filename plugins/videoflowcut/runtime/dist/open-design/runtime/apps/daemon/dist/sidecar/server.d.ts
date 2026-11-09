import { type DaemonStatusSnapshot, type DesktopStatusSnapshot, type MintImportTokenResult } from "@open-design/sidecar-proto";
/**
 * PR #974 round 6 (mrcfps): pure wrapper that overlays the live
 * `desktopAuthGateActive` flag on a cached startup snapshot. The
 * STATUS IPC handler and the public `status()` method both call this
 * so the gate flag is always read fresh (it flips after
 * REGISTER_DESKTOP_AUTH and stays sticky), even though the rest of
 * the snapshot is captured once at boot. Exported so the daemon
 * test suite can pin the wiring without booting a real IPC server.
 */
export declare function withCurrentDesktopAuthGate(snapshot: DaemonStatusSnapshot): DaemonStatusSnapshot;
export type DaemonSidecarHandle = {
    invoke(action: string, input: unknown): Promise<unknown>;
    status(): Promise<DaemonStatusSnapshot>;
    stop(): Promise<void>;
    waitUntilStopped(): Promise<void>;
};
export type DaemonSidecarRuntime = {
    base: string;
    mode?: string;
    namespace: string;
    source?: string;
    [field: string]: unknown;
};
export declare function mintImportTokenForCli(baseDir: string): MintImportTokenResult;
export declare function startDaemonSidecar(runtime: DaemonSidecarRuntime, options?: {
    inheritedEnvironment?: (baseEnv?: NodeJS.ProcessEnv) => Record<string, string>;
    invokeDesktop?: <TResult>(action: string, input: unknown, timeoutMs: number) => Promise<TResult>;
    port?: number;
    statusDesktop?: (timeoutMs: number) => Promise<DesktopStatusSnapshot>;
}): Promise<DaemonSidecarHandle>;
