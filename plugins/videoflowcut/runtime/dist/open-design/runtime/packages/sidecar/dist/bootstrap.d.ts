/**
 * @module bootstrap
 *
 * Sidecar launch-env composition and runtime bootstrap. `createSidecarLaunchEnv`
 * builds the env a child sidecar is spawned with (base/ipc/namespace/source);
 * `bootstrapSidecarRuntime` validates the incoming stamp against the resolved
 * app/ipc/env, writes the canonical env back, and returns the live runtime
 * context. Depends on the path resolvers and the public types.
 */
import type { BootstrapSidecarRuntimeOptions, SidecarLaunchEnvRequest, SidecarRuntimeContext, RuntimeLayoutStampShape } from "./types.js";
/**
 * Compose the environment a child sidecar is launched with: the resolved base,
 * the stamp's ipc path, namespace, and source, layered over `extraEnv`.
 * @returns The launch environment.
 */
export declare function createSidecarLaunchEnv<TStamp extends RuntimeLayoutStampShape>({ base, contract, extraEnv, stamp, }: SidecarLaunchEnvRequest<TStamp>): NodeJS.ProcessEnv;
/**
 * Bootstrap a sidecar runtime from an incoming stamp and env: validate app and
 * ipc path, confirm no conflicting env, write the canonical env back, and return
 * the resolved live runtime context.
 * @returns The resolved {@link SidecarRuntimeContext}.
 */
export declare function bootstrapSidecarRuntime<TStamp extends RuntimeLayoutStampShape>(stampInput: unknown, env: NodeJS.ProcessEnv, options: BootstrapSidecarRuntimeOptions<TStamp>): SidecarRuntimeContext<TStamp>;
//# sourceMappingURL=bootstrap.d.ts.map