export declare const AGENT_SLUGS: readonly ['claude', 'codex', 'reasonix', 'raven', 'cursor', 'copilot', 'openclaw', 'antigravity', 'pi', 'vibe', 'hermes', 'cline', 'kimi', 'kiro', 'trae', 'opencode', 'claude-desktop'];
export type AgentSlug = (typeof AGENT_SLUGS)[number];
export declare function isAgentSlug(value: string): value is AgentSlug;
/** The resolved stdio launch spec — mirrors the relevant fields of
 *  McpInstallPayload (command/args/env). */
export interface McpLaunchSpec {
    command: string;
    args: string[];
    env: Record<string, string>;
}
export interface PlanContext {
    /** Absolute home directory (os.homedir()). Injected for testability. */
    home: string;
    /** Node platform — selects per-OS config paths (cline / trae). */
    platform: NodeJS.Platform;
    /** MCP server name as it appears in the agent config. */
    serverName: string;
}
/** Agent owns a `<bin> mcp add/remove/get`; we drive it. */
export interface CliInstallPlan {
    kind: 'cli';
    slug: AgentSlug;
    bin: string;
    addArgv: string[];
    removeArgv: string[];
    /** Argv that exits 0 iff the server is already registered. */
    getArgv: string[];
}
/** Agent reads a JSON config file with a known schema. */
export interface JsonInstallPlan {
    kind: 'json';
    slug: AgentSlug;
    /** Absolute path to the config file we merge into. */
    configPath: string;
    /** Nested object path to the server map, e.g. ['mcpServers'] or
     *  ['mcp', 'servers'] or ['mcp']. */
    keyPath: string[];
    serverKey: string;
    /** Value stored under keyPath → serverKey. */
    entry: unknown;
}
/** Unverified format — print a snippet, never write. */
export interface ManualInstallPlan {
    kind: 'manual';
    slug: AgentSlug;
    format: 'json' | 'yaml' | 'toml';
    /** Best-known config location, or null when even that is unknown. */
    configPath: string | null;
    snippet: string;
    reason: string;
}
export type InstallPlan = CliInstallPlan | JsonInstallPlan | ManualInstallPlan;
/**
 * Build the registration plan for one agent. Pure — all IO happens in the
 * executor. Throws on an unknown slug so callers surface a clear error.
 */
export declare function planAgentInstall(slug: AgentSlug, spec: McpLaunchSpec, ctx: PlanContext): InstallPlan;
/**
 * Merge one server entry into existing config text without disturbing the
 * rest. Missing intermediate objects are created. Returns pretty JSON with
 * a trailing newline. Throws if existing text is non-empty but unparseable
 * (caller decides whether to bail or back up).
 */
export declare function applyJsonInstall(existingText: string | null, plan: JsonInstallPlan): string;
/**
 * Remove the server entry. Returns the new text, or null when the file did
 * not exist / had nothing to remove (caller treats null as a no-op).
 */
export declare function removeJsonInstall(existingText: string | null, plan: JsonInstallPlan): string | null;
