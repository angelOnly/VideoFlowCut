export type McpTransport = 'stdio' | 'sse' | 'http';
export type McpAuthMode = 'none' | 'oauth';
export interface McpServerConfig {
    id: string;
    label?: string;
    templateId?: string;
    transport: McpTransport;
    enabled: boolean;
    authMode?: McpAuthMode;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}
export interface McpConfig {
    servers: McpServerConfig[];
}
export interface McpTemplateField {
    key: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    secret?: boolean;
}
export type McpTemplateCategory = 'image-generation' | 'image-editing' | 'web-capture' | 'design-systems' | 'ui-components' | 'data-viz' | 'publishing' | 'utilities';
export interface McpTemplate {
    id: string;
    label: string;
    description: string;
    transport: McpTransport;
    authMode?: McpAuthMode;
    category: McpTemplateCategory;
    homepage?: string;
    example?: string;
    command?: string;
    args?: string[];
    envFields?: McpTemplateField[];
    url?: string;
    headerFields?: McpTemplateField[];
}
export declare function inferMcpAuthModeForUrl(rawUrl: string | undefined): McpAuthMode;
/**
 * Validate a single user-supplied entry. Drops invalid fields so a typo in
 * one server doesn't tank the whole config. Returns null when the entry is
 * unsalvageable (no id, or no transport-required fields).
 */
export declare function sanitizeMcpServer(raw: unknown): McpServerConfig | null;
export declare function sanitizeMcpConfig(raw: unknown): McpConfig;
export declare function readMcpConfig(dataDir: string): Promise<McpConfig>;
export declare function writeMcpConfig(dataDir: string, body: unknown): Promise<McpConfig>;
/**
 * True when `cwd` is a daemon-managed project directory under PROJECTS_DIR
 * (= safe to write `.mcp.json` into without risk of clobbering a user-owned
 * file). Git-linked projects whose cwd points at the user's own repo, and
 * the no-project fallback that resolves to PROJECT_ROOT, both return false
 * — the daemon must NOT write external-MCP config into either of those.
 */
export declare function isManagedProjectCwd(cwd: string | null | undefined, projectsDir: string): boolean;
/**
 * Project-cwd `.mcp.json` shape that Claude Code auto-loads on spawn (the
 * same format Claude Desktop and Cursor use). Returns null when the user
 * has no enabled servers — in that case the caller should NOT write the
 * file (and should clean up any stale one).
 *
 * `tokens` is an optional map of `serverId -> bearer access token`, used
 * for HTTP/SSE servers that completed the daemon's web OAuth flow. When a
 * token is present we inject `Authorization: Bearer <token>` into the
 * server's headers — this is what bypasses the per-spawn `mcp-remote`
 * dance and lets Claude Code talk directly to the upstream MCP using
 * pre-authenticated credentials. User-supplied headers always win on
 * conflict so they can pin a specific token if they really want to.
 */
export declare function buildClaudeMcpJson(servers: McpServerConfig[], tokens?: Record<string, string>): unknown | null;
/**
 * Convert user-configured external MCP servers into the ACP `mcpServers`
 * shape that Hermes/Kimi accept (already in use by buildLiveArtifactsMcpServersForAgent).
 * SSE/HTTP servers are dropped — ACP currently models stdio only — but we
 * surface a warning so the UI can hint at it.
 */
export interface AcpMcpServer {
    type: 'stdio';
    name: string;
    command: string;
    args: string[];
    env: Array<{
        name: string;
        value: string;
    }>;
}
export declare function buildAcpMcpServers(servers: McpServerConfig[]): AcpMcpServer[];
/**
 * OpenCode merges its config from multiple sources at boot — global
 * `~/.config/opencode/opencode.json`, the `OPENCODE_CONFIG` file path, the
 * project `opencode.json`, and the `OPENCODE_CONFIG_CONTENT` env var (an
 * inline JSON string). The env-var path is what lets a launcher like the
 * OpenDesign daemon hand servers to a single `opencode run` invocation
 * without writing into the user's global config or leaving a temp file
 * around on crash. We also use the same payload to grant `external_directory`
 * access to daemon-selected absolute paths (project cwd, staged skill dirs,
 * etc.) so headless OpenCode runs do not auto-reject them.
 *
 * Schema (verified against the dev branch of `sst/opencode`'s
 * `packages/opencode/src/config/config.ts` and the public docs at
 * <https://opencode.ai/docs/mcp-servers>):
 *
 *   {
 *     "mcp": {
 *       "<id>": {
 *         "type": "local",
 *         "command": ["<cmd>", "<arg1>", ...],
 *         "environment"?: { ... },
 *         "enabled": true
 *       },
 *       "<id>": {
 *         "type": "remote",
 *         "url": "...",
 *         "headers"?: { ... },
 *         "enabled": true
 *       }
 *     }
 *   }
 *
 * Returns `null` when nothing would be emitted — the caller must NOT set
 * `OPENCODE_CONFIG_CONTENT` to `null`/empty in that case, because doing so
 * would override the user's saved global config with an empty object. A
 * null return means "leave the env untouched and let OpenCode read the
 * user's home-dir config as-is."
 *
 * The OAuth Bearer merge mirrors `buildClaudeMcpJson` so a remote MCP
 * server the daemon already authenticated against (Higgsfield etc.)
 * works the same way for OpenCode users without forcing them to
 * re-authenticate inside OpenCode.
 */
export interface OpenCodeConfigBuildOptions {
    allowedDirectories?: string[];
    extraConfig?: Record<string, unknown>;
}
export declare function buildOpenCodeMcpConfigContent(servers: McpServerConfig[], tokens?: Record<string, string>, options?: OpenCodeConfigBuildOptions): string | null;
export declare const MCP_TEMPLATES: McpTemplate[];
