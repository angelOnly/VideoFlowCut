export interface CtaHierarchyIssue {
    /** Category of the finding; the UI may surface different copy per kind. */
    kind: 'multiple-primary' | 'ambiguous-weight' | 'misleading-prominence';
    /** Short CSS-like selector for the offending element, e.g. `a.btn.btn-primary`. */
    selector: string;
    /** One-sentence English description of the issue, suitable for a warning UI. */
    message: string;
}
export interface CtaHierarchyReport {
    issues: CtaHierarchyIssue[];
    primaryCount: number;
    secondaryCount: number;
}
/**
 * Parse the rendered HTML and return CTA-hierarchy findings.
 *
 * The function is deterministic and side-effect free. Returns an empty
 * report (no issues, zero counts) when the document has no CTA-shaped
 * elements. The set of rules is intentionally narrow — see the issue list
 * in this file for the categories we currently surface.
 */
export declare function analyseCtaHierarchy(html: string): CtaHierarchyReport;
