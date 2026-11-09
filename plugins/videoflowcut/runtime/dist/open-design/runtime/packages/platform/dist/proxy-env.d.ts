export type SystemProxyCommandRunner = (command: string, args: string[]) => string;
export type ResolveSystemProxyEnvOptions = {
    platform?: NodeJS.Platform;
    runCommand?: SystemProxyCommandRunner;
};
/**
 * Merge multiple env sources into one proxy-consistent environment. Proxy
 * variables are collapsed to their canonical spelling (preferring lowercase
 * inputs), non-proxy keys pass through, and `NODE_USE_ENV_PROXY=1` is set when
 * a proxy endpoint is present but the flag is not.
 *
 * @param platform - Target platform, controlling lowercase-alias emission.
 * @param sources - Env sources merged left-to-right (later sources win).
 * @returns A new merged environment with normalized proxy variables.
 */
export declare function mergeProxyAwareEnv(platform: NodeJS.Platform, ...sources: Array<NodeJS.ProcessEnv | Record<string, string | undefined>>): NodeJS.ProcessEnv;
/**
 * Parse macOS `scutil --proxy` output into a normalized proxy environment.
 * Honors the HTTP/HTTPS/SOCKS enable flags, exception list, and the
 * "exclude simple hostnames" toggle.
 *
 * @param stdout - Raw `scutil --proxy` output.
 * @param platform - Target platform for env normalization (defaults to `"darwin"`).
 * @returns A normalized proxy environment (empty when no proxy is enabled).
 */
export declare function parseMacosScutilProxyOutput(stdout: string, platform?: NodeJS.Platform): NodeJS.ProcessEnv;
/**
 * Parse Windows Internet Settings proxy registry output into a normalized proxy
 * environment. Handles both the per-protocol (`http=…;https=…`) and shared
 * single-endpoint `ProxyServer` forms, and the `ProxyOverride` bypass list.
 *
 * @param input - Raw `reg query` output for `ProxyEnable`, and optionally `ProxyServer` / `ProxyOverride`.
 * @param platform - Target platform for env normalization (defaults to `"win32"`).
 * @returns A normalized proxy environment (empty when proxying is disabled or unset).
 */
export declare function parseWindowsInternetSettingsProxyOutput(input: {
    proxyEnable: string;
    proxyOverride?: string;
    proxyServer?: string;
}, platform?: NodeJS.Platform): NodeJS.ProcessEnv;
/**
 * Resolve the OS-level proxy configuration into a normalized proxy environment.
 * Shells out to `scutil` on macOS and `reg query` on Windows (swallowing per-
 * command failures), and returns an empty env on other platforms or on error.
 *
 * @param options - Optional platform override and command runner (for testing).
 * @returns A normalized proxy environment, or `{}` when no proxy is configured.
 */
export declare function resolveSystemProxyEnv(options?: ResolveSystemProxyEnvOptions): NodeJS.ProcessEnv;
//# sourceMappingURL=proxy-env.d.ts.map