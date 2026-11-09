export interface BuildMcpInstallPayloadInputs {
    cliPath: string;
    cliExists: boolean;
    execPath: string;
    nodeExists: boolean;
    port: number;
    platform: NodeJS.Platform;
    dataDir: string;
    electronAsNode: boolean;
    /** True when the daemon was bootstrapped as a sidecar and the
     *  spawned `od mcp` should discover the live URL through its inherited
     *  sidecar client instead of a baked --daemon-url. */
    isSidecarMode: boolean;
    /** Opaque sidecar client env entries the
     *  caller wants propagated into the snippet. The caller decides
     *  what's worth propagating; this builder just merges. */
    sidecarEnv: Record<string, string>;
    /** Browser-facing OpenDesign studio base URL (e.g.
     *  `http://127.0.0.1:65321`). Used by MCP clients to build deep
     *  links to `/projects/.../conversations/.../files/...` so the
     *  outer agent can suggest a URL that shows both the file preview
     *  and the chat history for the run. Null when the daemon was
     *  launched without a known web port (CLI-only / headless). */
    webBaseUrl?: string | null;
}
export interface McpInstallPayload {
    command: string;
    args: string[];
    env: Record<string, string>;
    daemonUrl: string;
    /** Browser-facing studio base URL the daemon is paired with, when
     *  known. MCP clients use this plus run/project context to build a
     *  studio deep link the outer agent can hand back to the user. */
    webBaseUrl: string | null;
    platform: NodeJS.Platform;
    cliExists: boolean;
    nodeExists: boolean;
    buildHint: string | null;
}
export declare function buildMcpInstallPayload(inputs: BuildMcpInstallPayloadInputs): McpInstallPayload;
