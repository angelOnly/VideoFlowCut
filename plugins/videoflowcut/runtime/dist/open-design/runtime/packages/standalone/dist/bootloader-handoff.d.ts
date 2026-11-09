import { type StandaloneScope, type StandaloneShellIdentity } from "./protocol.js";
import type { GenerationRecord } from "./store.js";
export declare const STANDALONE_BOOTLOADER_HANDOFF_SCHEMA: 1;
export declare const STANDALONE_LAUNCHER_PROTOCOL: "standalone-launcher-v1";
export type StandaloneGenerationBinding = Readonly<{
    schemaVersion: typeof STANDALONE_BOOTLOADER_HANDOFF_SCHEMA;
    protocol: typeof STANDALONE_LAUNCHER_PROTOCOL;
    scope: StandaloneScope;
    generationId: string;
    launcher: Readonly<{
        resourceId: string;
        blobSha256: string;
        entrypoint: string;
        path: string;
    }>;
    minimumShellVersions: Readonly<Record<string, string>>;
    digest: string;
}>;
export type StandaloneHandoffAttachment = Readonly<{
    id: string;
    shell: StandaloneShellIdentity;
}>;
export type StandaloneShellCapabilityRequest = Readonly<{
    requestId: string;
    attachmentId: string;
    bindingDigest: string;
    capability: string;
    input?: unknown;
}>;
export type StandaloneShellCapabilityResult = Readonly<{
    requestId: string;
    attachmentId: string;
    bindingDigest: string;
    outcome: "accepted" | "unsupported" | "failed";
    output?: unknown;
    error?: Readonly<{
        code: string;
        message?: string;
    }>;
}>;
export interface StandaloneShellCapabilityPort {
    invoke(request: StandaloneShellCapabilityRequest): Promise<StandaloneShellCapabilityResult>;
}
export type StandaloneHandoffRequest = Readonly<{
    binding: StandaloneGenerationBinding;
    attachment: StandaloneHandoffAttachment;
    capabilities: StandaloneShellCapabilityPort;
}>;
export type StandaloneRuntimeStatus = Readonly<{
    bindingDigest: string;
    generationId: string;
    instanceId: string;
    state: "running" | "stopped" | "failed";
    references: number;
}>;
export type StandaloneRuntimeCommand = Readonly<{
    requestId: string;
    attachmentId: string;
    bindingDigest: string;
    command: string;
    input?: unknown;
}>;
export type StandaloneRuntimeCommandResult = Readonly<{
    requestId: string;
    attachmentId: string;
    bindingDigest: string;
    outcome: "accepted" | "unsupported" | "failed";
    output?: unknown;
    error?: Readonly<{
        code: string;
        message?: string;
    }>;
}>;
export interface StandaloneRuntimeHandle {
    readStatus(): Promise<StandaloneRuntimeStatus>;
    invoke(request: StandaloneRuntimeCommand): Promise<StandaloneRuntimeCommandResult>;
    close(): Promise<StandaloneRuntimeStatus>;
    waitForTerminal(): Promise<StandaloneRuntimeStatus>;
}
export type StandaloneGenerationHandoff = (request: StandaloneHandoffRequest) => Promise<StandaloneRuntimeHandle>;
export declare class StandaloneHandoffError extends Error {
    readonly code: "attachment-conflict" | "handoff-conflict" | "launcher-invalid" | "runtime-invalid" | "shell-incompatible";
    constructor(code: "attachment-conflict" | "handoff-conflict" | "launcher-invalid" | "runtime-invalid" | "shell-incompatible", message: string, options?: ErrorOptions);
}
export declare function createStandaloneGenerationBinding(generation: GenerationRecord, scope: StandaloneScope): StandaloneGenerationBinding;
/**
 * Immutable fossil handoff. Selection and import are sticky for the lifetime
 * of this host: the selected launcher may fail, but it is never replaced by a
 * baseline or another generation in-process.
 */
export declare class FossilHandoffHost {
    private readonly load;
    private selectedDigest;
    private launcherTask;
    private readonly attachments;
    constructor(load: (binding: StandaloneGenerationBinding) => Promise<StandaloneGenerationHandoff>);
    handoff(request: StandaloneHandoffRequest): Promise<StandaloneRuntimeHandle>;
}
/** Create one generation body and multiplex compatible Shell attachments over it. */
export declare function createStandaloneGenerationBootloader(startBody: (request: StandaloneHandoffRequest) => Promise<StandaloneRuntimeHandle>): StandaloneGenerationHandoff;
//# sourceMappingURL=bootloader-handoff.d.ts.map