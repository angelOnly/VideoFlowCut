export declare const ARTIFACT_PUBLICATION_BLOCKED_CODE: 'ARTIFACT_PUBLICATION_BLOCKED';
export declare const PUBLICATION_GUARDED_ARTIFACT_KINDS: ReadonlySet<string>;
export declare const UNRESOLVED_ARTIFACT_PLACEHOLDERS: readonly ['Name to confirm', '$X.XM', 'Replace this panel with', 'Replace role placeholders', 'Your form answer only said'];
export declare class ArtifactPublicationBlockedError extends Error {
    readonly code: "ARTIFACT_PUBLICATION_BLOCKED";
    readonly placeholders: string[];
    constructor(placeholders: string[]);
}
export declare function isPublicationGuardedArtifactKind(kind: unknown): boolean;
export declare function findUnresolvedArtifactPlaceholders(value: unknown): string[];
export declare function shouldBlockArtifactPublication(value: unknown): boolean;
export declare function buildArtifactPublicationBlockedMessage(placeholders: readonly string[]): string;
export declare function assertArtifactPublicationAllowed(value: unknown): void;
