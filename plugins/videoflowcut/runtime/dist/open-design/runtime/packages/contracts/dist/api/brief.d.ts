export declare const OPEN_DESIGN_BRIEF_ARTIFACT_TYPES: readonly ['website', 'product-prototype', 'presentation', 'document', 'image', 'video', 'audio', 'design-system'];
export type OpenDesignBriefArtifactType = (typeof OPEN_DESIGN_BRIEF_ARTIFACT_TYPES)[number];
export interface OpenDesignBriefOption {
    /** Stable, unlocalized value submitted by Desktop and CLI hosts. */
    id: string;
    label: string;
    description: string;
}
export interface OpenDesignBriefQuestion {
    /** Stable, artifact-qualified decision id. */
    id: string;
    label: string;
    description: string;
    type: 'radio';
    required: true;
    allowCustom: false;
    defaultOptionId: string;
    options: readonly OpenDesignBriefOption[];
}
export type OpenDesignBriefAnswers = Readonly<Record<string, readonly string[]>>;
export interface OpenDesignBriefDecision {
    artifactType: OpenDesignBriefArtifactType;
    decisionSource: 'open-design-shared-brief-v1';
    questions: readonly OpenDesignBriefQuestion[];
    answers: OpenDesignBriefAnswers;
    summary: string;
    complete: boolean;
}
export interface CollectOpenDesignBriefInput {
    artifactType: OpenDesignBriefArtifactType;
    previousArtifactType?: OpenDesignBriefArtifactType;
    knownAnswers?: Readonly<Record<string, unknown>>;
    /**
     * Explicit "use recommended defaults" path. This is the deterministic
     * counterpart of the product's "don't ask, generate" Brief exception.
     */
    skip?: boolean;
}
export type OpenDesignBriefCatalog = Readonly<Record<OpenDesignBriefArtifactType, readonly OpenDesignBriefQuestion[]>>;
/**
 * Canonical V1 decision catalog shared by the local OpenDesign MCP, Codex
 * Desktop widget, and structured CLI representation. Visible copy may be
 * localized later, but ids, ordering, defaults, and skip behavior are product
 * protocol.
 */
export declare const openDesignBriefCatalog: OpenDesignBriefCatalog;
export declare function validateOpenDesignBriefCatalog(catalog: OpenDesignBriefCatalog): void;
export declare function collectOpenDesignBrief(input: CollectOpenDesignBriefInput): OpenDesignBriefDecision;
export declare function summarizeOpenDesignBrief(artifactType: OpenDesignBriefArtifactType, answers: OpenDesignBriefAnswers): string;
export declare function formatOpenDesignBriefForCli(brief: OpenDesignBriefDecision, displayArtifactType?: string): string;
//# sourceMappingURL=brief.d.ts.map