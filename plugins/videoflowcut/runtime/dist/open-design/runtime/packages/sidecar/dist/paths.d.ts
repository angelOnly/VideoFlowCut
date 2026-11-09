/**
 * @module paths
 *
 * Namespace and runtime-path resolution for a sidecar. Derives the effective
 * namespace, the project/source runtime roots, the sidecar base, the
 * namespace/runtime roots and their pointer/manifest/log paths, per-app runtime
 * dirs/files, and the app IPC socket/pipe path — all from a host contract so no
 * OpenDesign-specific strings are hardcoded here. Depends on `node:path` and the
 * public types.
 */
import type { AppIpcPathRequest, AppRuntimePathRequest, BaseResolutionOptions, NamespaceResolutionOptions, ProjectRuntimePathRequest, RuntimePathRequest, RuntimeRootRequest, SidecarContractDescriptor, SidecarRuntimeContext, RuntimeLayoutStampShape } from "./types.js";
/**
 * Resolve the effective namespace from an explicit value, the env var named by
 * the contract, or the contract default — then normalize it.
 * @returns The normalized namespace.
 */
export declare function resolveNamespace<TStamp extends RuntimeLayoutStampShape>(options: NamespaceResolutionOptions<TStamp>): string;
/**
 * Validate and resolve a project root to an absolute path.
 * @returns The resolved absolute project root.
 */
export declare function resolveProjectRoot(projectRoot: string): string;
/**
 * Resolve the project's tmp root (`<projectRoot>/<projectTmpDirName>`).
 * @returns The resolved tmp root path.
 */
export declare function resolveProjectTmpRoot<TStamp extends RuntimeLayoutStampShape>({ contract, projectRoot, }: {
    contract: SidecarContractDescriptor<TStamp>;
    projectRoot: string;
}): string;
/**
 * Resolve the source-scoped runtime root (`<projectTmpRoot>/<source>`).
 * @returns The resolved source runtime root path.
 */
export declare function resolveSourceRuntimeRoot<TStamp extends RuntimeLayoutStampShape>({ contract, projectRoot, source, }: ProjectRuntimePathRequest<TStamp>): string;
/**
 * Resolve the sidecar base from an explicit value, the env var named by the
 * contract, or the source runtime root.
 * @returns The resolved absolute base path.
 */
export declare function resolveSidecarBase<TStamp extends RuntimeLayoutStampShape>({ base, contract, env, projectRoot, source, }: BaseResolutionOptions<TStamp>): string;
/**
 * Resolve the namespace root (`<base>/<namespace>`).
 * @returns The resolved namespace root path.
 */
export declare function resolveNamespaceRoot<TStamp extends RuntimeLayoutStampShape>({ base, contract, namespace, }: RuntimePathRequest<TStamp>): string;
/**
 * Resolve the namespace root (the directory that holds `logs/`, `runs/`,
 * `current.json`, …) from a *live* {@link SidecarRuntimeContext}.
 *
 * `resolveNamespaceRoot` alone is not enough here because the sidecar `base`
 * carries a different meaning depending on how the process was launched:
 *
 * - **dev (`tools-dev`):** every child is launched with `base` set to the
 *   pre-namespace source runtime root (see `tools/dev/src/config.ts`), so the
 *   namespace root is `base/<namespace>` — exactly what `resolveNamespaceRoot`
 *   computes.
 * - **packaged (runtime mode):** the orchestrator launches every child with
 *   `base = <namespaceRoot>/runtime` (see `apps/packaged/src/paths.ts` →
 *   `runtimeRoot`, wired in `apps/packaged/src/sidecars.ts`), while the actual
 *   logs live as a sibling at `<namespaceRoot>/logs`. Re-appending the
 *   namespace via `resolveNamespaceRoot` would yield
 *   `<namespaceRoot>/runtime/<namespace>`, so every daemon/web log file
 *   resolved that way is an ENOENT — which is why packaged diagnostics bundles
 *   used to capture none of them.
 *
 * Callers pass their contract's runtime-mode constant (e.g.
 * `SIDECAR_MODES.RUNTIME`) so this generic helper does not have to hardcode
 * OpenDesign's mode strings.
 */
export declare function resolveRuntimeNamespaceRoot<TStamp extends RuntimeLayoutStampShape>({ contract, runtime, runtimeMode, }: {
    contract: SidecarContractDescriptor<TStamp>;
    runtime: Pick<SidecarRuntimeContext<TStamp>, "base" | "mode" | "namespace">;
    runtimeMode: TStamp["mode"] | string;
}): string;
/**
 * Resolve a per-run runtime root (`<namespaceRoot>/runs/<runId>`).
 * @returns The resolved run runtime root path.
 */
export declare function resolveRuntimeRoot<TStamp extends RuntimeLayoutStampShape>({ base, contract, namespace, runId, }: RuntimeRootRequest<TStamp>): string;
/**
 * Resolve the namespace pointer file (`<namespaceRoot>/current.json`).
 * @returns The resolved pointer path.
 */
export declare function resolvePointerPath<TStamp extends RuntimeLayoutStampShape>({ base, contract, namespace }: RuntimePathRequest<TStamp>): string;
/**
 * Resolve a run's manifest file (`<runtimeRoot>/manifest.json`).
 * @returns The resolved manifest path.
 */
export declare function resolveManifestPath({ runtimeRoot }: {
    runtimeRoot: string;
}): string;
/**
 * Resolve an app's logs directory (`<runtimeRoot>/logs/<app>`).
 * @returns The resolved logs directory path.
 */
export declare function resolveLogsDir<TStamp extends RuntimeLayoutStampShape>({ app, contract, runtimeRoot, }: {
    app: TStamp["app"] | string;
    contract: SidecarContractDescriptor<TStamp>;
    runtimeRoot: string;
}): string;
/**
 * Resolve an app's log file (`<logsDir>/<fileName>`, default `latest.log`).
 * @returns The resolved log file path.
 */
export declare function resolveLogFilePath<TStamp extends RuntimeLayoutStampShape>({ app, contract, fileName, runtimeRoot, }: {
    app: TStamp["app"] | string;
    contract: SidecarContractDescriptor<TStamp>;
    fileName?: string;
    runtimeRoot: string;
}): string;
/**
 * Resolve an app's runtime dir under a namespace root (`<namespaceRoot>/<app>`).
 * @returns The resolved app runtime directory path.
 */
export declare function resolveAppRuntimeDir<TStamp extends RuntimeLayoutStampShape>({ app, contract, namespaceRoot, }: AppRuntimePathRequest<TStamp>): string;
/**
 * Resolve a file inside an app's runtime dir, rejecting non-simple file names.
 * @returns The resolved app runtime file path.
 */
export declare function resolveAppRuntimePath<TStamp extends RuntimeLayoutStampShape>({ app, contract, fileName, namespaceRoot, }: AppRuntimePathRequest<TStamp> & {
    fileName: string;
}): string;
/**
 * Resolve an app's IPC endpoint: a Windows named pipe, or a unix socket under
 * `<ipcBase>/<namespace>/<app>.sock`.
 * @returns The resolved IPC socket/pipe path.
 */
export declare function resolveAppIpcPath<TStamp extends RuntimeLayoutStampShape>({ app, contract, env, namespace, }: AppIpcPathRequest<TStamp>): string;
//# sourceMappingURL=paths.d.ts.map