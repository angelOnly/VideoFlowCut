import { SidecarFactory } from "@open-design/sidecar";
export type McpDaemonBootstrapPlan = {
    action: "none";
    reason: "daemon-ready" | "explicit-daemon-url" | "bootstrap-unavailable" | "invalid-bootstrap-command" | "invalid-bootstrap-args";
} | {
    action: "spawn";
    args: string[];
    command: string;
    env: NodeJS.ProcessEnv;
};
export interface PlanMcpDaemonBootstrapOptions {
    daemonReachable: boolean;
    env: NodeJS.ProcessEnv;
    explicitDaemonUrl: boolean;
}
export declare function planMcpDaemonBootstrap(options: PlanMcpDaemonBootstrapOptions): McpDaemonBootstrapPlan;
interface EnsureMcpDaemonUrlOptions {
    connectInherited?: typeof SidecarFactory.connectInherited;
    discoverTargetDaemonUrl?: (env: NodeJS.ProcessEnv, timeoutMs: number) => Promise<string | null>;
    env?: NodeJS.ProcessEnv;
    flagUrl?: string | null;
    probeDaemon?: (url: string) => Promise<boolean>;
    resolveDaemonUrl?: (options: {
        allowLegacyDefault?: boolean;
        env: NodeJS.ProcessEnv;
        flagUrl?: string | null;
        timeoutMs?: number;
    }) => Promise<string>;
    sleep?: (milliseconds: number) => Promise<void>;
    spawnBootstrap?: (plan: Extract<McpDaemonBootstrapPlan, {
        action: "spawn";
    }>) => Promise<void>;
    /** Reads STATUS at an absolute sidecar client endpoint (managed registrations). */
    statusAtEndpoint?: SidecarEndpointStatusReader;
    timeoutMs?: number;
}
type SidecarEndpointStatusReader = <T>(endpoint: string, app: string, timeoutMs: number) => Promise<T | null>;
/** Absolute client endpoints of every mode of the registering namespace. */
export type ManagedMcpDiscovery = {
    daemon: string[];
    desktop: string[];
};
/** True when the registration was written under a managed outer. */
export declare function isManagedMcpBootstrapEnv(env: NodeJS.ProcessEnv): boolean;
/**
 * The discovery endpoints of a managed registration, or null when the
 * registration is not managed or is malformed; either way the caller keeps
 * the unmanaged bootstrap path.
 */
export declare function parseManagedMcpDiscovery(env: NodeJS.ProcessEnv): ManagedMcpDiscovery | null;
export declare function ensureMcpDaemonUrl(options?: EnsureMcpDaemonUrlOptions): Promise<string>;
export {};
