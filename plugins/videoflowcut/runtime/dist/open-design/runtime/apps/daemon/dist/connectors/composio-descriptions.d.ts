export interface ComposioToolkitMetadata {
    /** Human-authored description tailored to the SaaS/tool. */
    description: string;
    /** Preferred category tag for the connector card. */
    category: string;
    /** Snapshot count for first paint before live toolkit metadata loads. */
    toolCount?: number;
}
export declare const COMPOSIO_TOOLKIT_METADATA: Record<string, ComposioToolkitMetadata>;
/**
 * Resolve curated metadata for a toolkit slug. Returns undefined when the
 * toolkit has not been manually described yet — callers should fall back
 * to a generic description in that case.
 */
export declare function getComposioToolkitMetadata(slug: string): ComposioToolkitMetadata | undefined;
