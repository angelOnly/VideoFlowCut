import { SidecarFactory } from "@open-design/sidecar";
export declare const DEFAULT_DAEMON_URL = "http://127.0.0.1:7456";
export interface ResolveDaemonUrlOptions {
    /** MCP must discover an endpoint; a guessed default could belong to another runtime. */
    allowLegacyDefault?: boolean;
    connectInherited?: typeof SidecarFactory.connectInherited;
    /** Value passed via `--daemon-url`. Empty string is treated as unset. */
    flagUrl?: string | null;
    /** Defaults to `process.env`; injected for tests. */
    env?: NodeJS.ProcessEnv;
    /** IPC discovery timeout. Short by default so an absent daemon does not stall CLI startup. */
    timeoutMs?: number;
}
/**
 * Resolve the daemon HTTP base URL for `od` client commands.
 *
 * Spawn order: explicit `--daemon-url` flag, `OD_DAEMON_URL` env, then
 * inherited sidecar client status, then the default
 * `tools-dev status --json` runtime in a verified source checkout only.
 * Discovery never invokes a package manager. Falls back to the legacy default
 * for direct `od` launches that do not run as a sidecar.
 */
export declare function resolveDaemonUrl(options?: ResolveDaemonUrlOptions): Promise<string>;
