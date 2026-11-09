import { type SignedStandaloneMetadata, type StandaloneMaterialization, type StandaloneShellIdentity, type StandaloneTrustedKeyRing } from "./protocol.js";
import { type StandaloneBlobCandidate } from "./blob.js";
import { type StandaloneFeedbackHandler } from "./feedback.js";
import { type ActivationAuthority, type ActivationCause, type ActivationIntent, type ActivationLaunchProof, type GenerationState } from "./state-machine.js";
export type { ActivationAuthority, ActivationCause, ActivationIntent, ActivationLaunchProof, GenerationState } from "./state-machine.js";
export type StandalonePrepareOptions = Readonly<{
    candidates?: Readonly<Record<string, readonly StandaloneBlobCandidate[]>>;
    feedback?: StandaloneFeedbackHandler;
    fetch?: typeof globalThis.fetch;
    signal?: AbortSignal;
}>;
export type GenerationRecord = {
    schemaVersion: 4;
    id: string;
    channel: string;
    releaseVersion: string;
    standaloneVersion: string;
    sourceCommit: string;
    minimumShellVersions: Record<string, string>;
    launcher: Readonly<{
        protocol: "standalone-launcher-v1";
        resourceId: string;
        blobSha256: string;
        entrypoint: string;
        path: string;
    }>;
    resources: Record<string, {
        component: "standalone.launcher" | "standalone.resource";
        blobSha256: string;
        entrypoint: string;
        materialization: StandaloneMaterialization;
        mediaType: string;
        path: string;
        size: number;
        sync: true;
    }>;
};
export declare function replaceFile(from: string, to: string): Promise<void>;
export declare class StandaloneStore {
    readonly root: string;
    readonly channel: string;
    readonly namespace: string;
    constructor(root: string, scope: Readonly<{
        channel: string;
        namespace: string;
    }>);
    private get namespaceRoot();
    private get statePath();
    private get stateLockPath();
    private generationPath;
    private withStateTransaction;
    readState(): Promise<GenerationState>;
    private applyStateCommand;
    readGeneration(id: string): Promise<GenerationRecord>;
    prepare(envelope: SignedStandaloneMetadata, trustedKeys: StandaloneTrustedKeyRing, options?: StandalonePrepareOptions): Promise<GenerationRecord>;
    private prepareVerified;
    authorizePrepared(expectedGenerationId: string, authority: ActivationAuthority, cause: ActivationCause, expectedRevision: number): Promise<ActivationIntent>;
    revokeSilentAuthorization(expectedGenerationId: string, expectedRevision: number): Promise<GenerationState>;
    activatePrepared(expectedGenerationId: string, shell: StandaloneShellIdentity, expectedRevision: number): Promise<GenerationRecord>;
    beginActiveAttempt(shell: StandaloneShellIdentity): Promise<{
        proof: ActivationLaunchProof | null;
        generation: GenerationRecord;
        attempted: boolean;
    }>;
    confirmAttempt(proof: ActivationLaunchProof): Promise<void>;
    recoverInterruptedAttempt(): Promise<GenerationRecord | null>;
    rollbackFailedAttempt(proof: ActivationLaunchProof): Promise<GenerationRecord | null>;
    preparedGeneration(): Promise<GenerationRecord | null>;
    activeGeneration(): Promise<GenerationRecord>;
    lastHealthyGeneration(): Promise<GenerationRecord | null>;
    resolveResource(name: string): Promise<string>;
}
//# sourceMappingURL=store.d.ts.map