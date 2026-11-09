/**
 * Loose descriptor for a single MCP server entry as supplied by a caller.
 * All fields are typed `unknown` so the builder can safely normalise them
 * without trusting the caller's type discipline.
 */
export interface AcpMcpServerInput {
    type?: unknown;
    name?: unknown;
    command?: unknown;
    args?: unknown;
    env?: unknown;
}
/**
 * Options accepted by `buildAcpSessionNewParams` controlling optional MCP
 * server injection and the env-field wire format used by the target agent.
 */
export interface AcpSessionOptions {
    mcpServers?: AcpMcpServerInput[];
    envFormat?: 'array' | 'map';
}
/**
 * Builds the params object for an ACP `session/new` JSON-RPC call. Resolves
 * `cwd` to an absolute path and normalises each MCP server entry's `env` field
 * between `'array'` format (`[{name, value}]`, default, used by Hermes/Kimi)
 * and `'map'` format (`{"KEY": "val"}`, used by reasonix and standard MCP).
 *
 * MCP is optional — omit `mcpServers` to run without it. Never auto-installs
 * or mutates user/global MCP config.
 *
 * @param cwd - The working directory to pass to the ACP agent subprocess.
 * @param options - Optional MCP server list and env-format selector.
 * @returns The `session/new` params object ready for JSON-RPC serialisation.
 */
export declare function buildAcpSessionNewParams(cwd: string, { mcpServers, envFormat }?: AcpSessionOptions): {
    cwd: string;
    mcpServers: {
        type: string;
        name: string;
        command: string;
        args: any[];
        env: any;
    }[];
};
/**
 * Assembles the `prompt` array for a `session/prompt` ACP call. Always
 * includes a leading `{ type: 'text', text: prompt }` block, followed by
 * one `{ type: 'resource_link', uri: resourcePath }` block per non-empty
 * attachment path. Empty and non-string paths are skipped. Duplicate paths
 * retain their caller-provided order for ordinary ACP compatibility.
 *
 * @param prompt - The text prompt to send as the first block.
 * @param resourcePaths - Optional file/image attachment paths to append.
 * @returns An array of prompt blocks ready for inclusion in `session/prompt` params.
 */
export declare function buildPromptBlocks(prompt: string, resourcePaths: string[]): Array<Record<string, string>>;
