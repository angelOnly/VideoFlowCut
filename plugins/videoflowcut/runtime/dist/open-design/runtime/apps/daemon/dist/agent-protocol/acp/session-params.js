/** @module agent-protocol/acp/session-params
 * Builds the `session/new` parameter object and prompt blocks sent to an ACP
 * agent subprocess at session start. Handles MCP server descriptor normalisation
 * and env-format conversion (array vs map). Consumed by acp/session.ts and
 * acp/models.ts; depends only on Node path.
 */
import path from 'node:path';
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
export function buildAcpSessionNewParams(cwd, { mcpServers, envFormat = 'array' } = {}) {
    const servers = Array.isArray(mcpServers) ? mcpServers : [];
    const wantsMap = envFormat === 'map';
    return {
        cwd: path.resolve(cwd),
        // MCP is an optional compatibility layer. Default to no MCP servers so ACP
        // agents can run through the skill + CLI path without MCP support. Do not
        // auto-install or mutate user/global MCP config; callers must pass an
        // explicit per-session MCP descriptor when a compatible agent supports it.
        mcpServers: servers.map((s) => {
            const rawEnv = s?.env;
            // Already a plain object — pass through in map mode, convert to
            // array in array mode (e.g. live-artifacts MCP from
            // buildLiveArtifactsMcpServersForAgent which already respects
            // acpMcpEnvFormat).
            const isPlainObject = rawEnv && typeof rawEnv === 'object' && !Array.isArray(rawEnv);
            if (wantsMap && isPlainObject) {
                return {
                    type: typeof s?.type === 'string' ? s.type : 'stdio',
                    name: typeof s?.name === 'string' ? s.name : '',
                    command: typeof s?.command === 'string' ? s.command : '',
                    args: Array.isArray(s?.args) ? s.args : [],
                    env: rawEnv,
                };
            }
            const envArr = Array.isArray(rawEnv) ? rawEnv : [];
            const env = wantsMap
                ? Object.fromEntries(envArr.map((e) => [e?.name ?? '', e?.value ?? '']))
                : isPlainObject
                    ? Object.entries(rawEnv).map(([name, value]) => ({ name, value }))
                    : envArr;
            return {
                type: typeof s?.type === 'string' ? s.type : 'stdio',
                name: typeof s?.name === 'string' ? s.name : '',
                command: typeof s?.command === 'string' ? s.command : '',
                args: Array.isArray(s?.args) ? s.args : [],
                env,
            };
        }),
    };
}
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
export function buildPromptBlocks(prompt, resourcePaths) {
    const blocks = [{ type: 'text', text: prompt }];
    for (const resourcePath of resourcePaths) {
        if (typeof resourcePath !== 'string' || resourcePath.trim().length === 0)
            continue;
        blocks.push({ type: 'resource_link', uri: resourcePath });
    }
    return blocks;
}
//# sourceMappingURL=session-params.js.map