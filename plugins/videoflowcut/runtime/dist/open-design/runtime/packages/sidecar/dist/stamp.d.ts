import type { ProcessStampContract } from "@open-design/platform";
export declare const SIDECAR_STAMP_FIELDS: readonly ["channel", "namespace", "source", "mode", "app"];
export type SidecarStampField = (typeof SIDECAR_STAMP_FIELDS)[number];
export type SidecarStamp = {
    channel: string;
    namespace: string;
    source: string;
    mode: string;
    app: string;
};
export declare const SIDECAR_STAMP_FLAGS: Readonly<Record<SidecarStampField, string>>;
/** Internal argv marker for a client-side launch attempt that has not claimed generation ownership. */
export declare const SIDECAR_LIFECYCLE_FLAG = "--od-sidecar-lifecycle";
export declare const SIDECAR_LAUNCHER_LIFECYCLE = "launcher";
export declare const SIDECAR_SUPERVISED_CONTEXT_ENV = "OD_SIDECAR_SUPERVISED_CONTEXT";
export type SupervisedSidecarContext = Readonly<{
    generationPid: number;
    resources: unknown;
    stamp: SidecarStamp;
}>;
export declare function normalizeSidecarStamp(input: unknown): SidecarStamp;
export declare const SIDECAR_STAMP_CONTRACT: ProcessStampContract<SidecarStamp, SidecarStamp>;
export declare function readCurrentSidecarArgvStamp(): SidecarStamp;
/** Read the resource identity supplied by either a launcher argv or its committed supervisor. */
export declare function readCurrentSidecarStamp(): SidecarStamp;
export declare function serializeSupervisedSidecarContext(stampInput: SidecarStamp, generationPid: number, resources: unknown): string;
export declare function readSupervisedSidecarContext(env?: NodeJS.ProcessEnv): SupervisedSidecarContext | null;
export declare function isCurrentSidecarLauncher(): boolean;
export declare function isSidecarLauncherCommand(command: string): boolean;
export declare function createSidecarLauncherArgs(stamp: SidecarStamp): string[];
export declare function removeSidecarLauncherArgs(args: readonly string[]): string[];
export declare function sidecarStampKey(stamp: SidecarStamp): string;
/**
 * The client endpoint for `stamp`, resolved with this process's environment.
 * The value is opaque; hand it to another process verbatim (for example in an
 * MCP registration) instead of a stamp, because the receiver may resolve a
 * different temporary directory.
 */
export declare function resolveSidecarClientEndpoint(stamp: SidecarStamp): string;
export declare function resolvePrivateIpcPath(stamp: SidecarStamp, platform?: NodeJS.Platform): string;
//# sourceMappingURL=stamp.d.ts.map