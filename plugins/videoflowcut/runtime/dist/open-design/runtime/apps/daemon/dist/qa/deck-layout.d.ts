/** Severity of a finding. `error` blocks the brand-system rebuild. */
export type DeckLayoutSeverity = 'error' | 'warning';
export interface DeckLayoutIssue {
    /** Stable machine code for the finding. */
    code: 'no-slides' | 'frame-not-size-container' | 'fit-runtime-missing' | 'fit-layer-missing' | 'headline-truncation' | 'funnel-label-clipped';
    severity: DeckLayoutSeverity;
    /** One-sentence English description, suitable for a build error / warning UI. */
    message: string;
}
export interface DeckLayoutReport {
    issues: DeckLayoutIssue[];
    /** Number of `.slide` sections found. */
    slideCount: number;
}
/**
 * Parse a rendered deck artifact and return layout-robustness findings.
 *
 * Deterministic and side-effect free. An empty (no-slide) document yields a
 * single `no-slides` error so a malformed deck cannot pass silently.
 */
export declare function analyseDeckLayout(html: string): DeckLayoutReport;
/**
 * Throw when the deck has any blocking (`error`) layout issue. Used as a hard
 * guard in the brand-system rebuild so a clipping deck cannot be written.
 */
export declare function assertDeckLayoutSafe(html: string): void;
