import { type SidecarStamp } from '@open-design/sidecar';
import { type ManagedMcpDiscovery } from './mcp-bootstrap.js';
export declare function buildManagedMcpDiscovery(stamp: SidecarStamp, resolveEndpoint?: (stamp: SidecarStamp) => string): ManagedMcpDiscovery;
/** Registration env to add for a managed launch; empty otherwise. */
export declare function managedMcpRegistrationEnv(env?: NodeJS.ProcessEnv, readStamp?: () => SidecarStamp): Record<string, string>;
/**
 * True when `existing` is this install's own registration: it serves the same
 * daemon data root (scoped by channel and namespace) and bootstraps the same
 * installed app. The Codex registration name is shared by every install on the
 * machine, so anything else (another channel, a local build, a copy of the app
 * elsewhere) belongs to someone else. A registration from before the managed
 * contract still matches: the managed marker is ignored when comparing.
 */
export declare function isCodexRegistrationOwnedBy(existing: {
    env: Record<string, string>;
}, current: {
    env: Record<string, string>;
}): boolean;
