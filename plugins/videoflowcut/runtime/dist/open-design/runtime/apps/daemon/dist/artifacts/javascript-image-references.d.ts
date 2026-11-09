export type JavaScriptImageReference = {
    ref: string;
    line: number | undefined;
    /** DOM image strings use the document URL, not the containing script URL. */
    relativeTo: 'document' | 'script';
};
/** Discover literal image URLs without executing code or treating arbitrary text
 * as HTML/CSS. Computed paths are deliberately not evaluated; callers can still
 * declare those assets through the existing manifest supportingFiles contract.
 * Authored JavaScript is never rewritten by this dependency-only scanner. */
export declare function javascriptImageReferences(source: string): JavaScriptImageReference[];
