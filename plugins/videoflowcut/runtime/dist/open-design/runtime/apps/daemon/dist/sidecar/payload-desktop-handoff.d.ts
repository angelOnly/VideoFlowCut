import { type LauncherDesktopHandoffDescriptor, type LauncherPaths, type LauncherVersionPointer } from "@open-design/launcher-proto";
import { spawnSidecar } from "@open-design/sidecar";
import { type DesktopStatusSnapshot, type SidecarSource } from "@open-design/sidecar-proto";
declare function writeJsonFile(filePath: string, value: unknown): Promise<void>;
export type PreparedLegacyPayloadDesktopHandoff = {
    dataRoot: string;
    descriptor: LauncherDesktopHandoffDescriptor;
    kind: "prepared";
    launcherPaths: LauncherPaths;
    runtimeRoot: string;
    source: SidecarSource;
};
export type LegacyPayloadDesktopHandoffPreparation = PreparedLegacyPayloadDesktopHandoff | {
    kind: "none";
    reason: "already-armed" | "desktop-identity-mismatch" | "invalid-install-anchor" | "invalid-launcher-state" | "invalid-payload" | "invalid-runtime" | "launcher-state-not-eligible" | "missing-environment" | "not-packaged" | "payload-desktop-active" | "unsupported-platform";
};
export type LegacyPayloadDesktopHandoffResult = {
    kind: "aborted";
    reason: "outer-not-confirmed" | "payload-desktop-active" | "shutdown-failed" | "spawn-failed";
} | {
    kind: "scheduled";
    target: LauncherVersionPointer;
};
export declare function prepareLegacyPayloadDesktopHandoff(options: {
    dataRoot: string;
    env?: NodeJS.ProcessEnv;
    namespace: string;
    now?: () => Date;
    outerPid: number | null;
    platform?: NodeJS.Platform;
    randomId?: () => string;
    requestDesktopStatus?: () => Promise<DesktopStatusSnapshot>;
    runtimeRoot: string;
    source: SidecarSource;
}): Promise<LegacyPayloadDesktopHandoffPreparation>;
export declare function executeLegacyPayloadDesktopHandoff(prepared: PreparedLegacyPayloadDesktopHandoff, options?: {
    confirmTimeoutMs?: number;
    env?: NodeJS.ProcessEnv;
    now?: () => Date;
    requestDesktop?: (message: "shutdown" | "status") => Promise<unknown>;
    sleep?: (durationMs: number) => Promise<unknown>;
    spawn?: typeof spawnSidecar;
    writeJsonFile?: typeof writeJsonFile;
}): Promise<LegacyPayloadDesktopHandoffResult>;
export {};
