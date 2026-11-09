export type TokenLayer = "A1-identity" | "A1-structure" | "A2" | "B-slot";
export type TokenSpec = {
    /** CSS custom property name including the `--` prefix. */
    readonly name: string;
    readonly layer: TokenLayer;
    /** One-line description for documentation generators. */
    readonly description: string;
    /**
     * A2 only. The default value the derive script inlines when a
     * brand's DESIGN.md does not specify one. Must stay byte-equivalent
     * to the matching declaration in `_schema/defaults.css`.
     */
    readonly fallback?: string;
    /**
     * B-slot only. Sibling token to alias to when the brand has no
     * richer tier (e.g. `--fg-2` aliases to `--fg`). The aliasTo string
     * is a CSS expression, typically `var(--name)`.
     */
    readonly aliasTo?: string;
};
/**
 * Every brand's tokens.css must declare every entry in this list.
 *
 * Order is meaningful for human review — tokens are grouped by intent
 * rather than by layer so reviewers can scan the visual stack from
 * surface → text → border → accent → semantic → typography → spacing
 * → radius → elevation → focus → motion → layout.
 */
export declare const TOKEN_SCHEMA: readonly TokenSpec[];
/**
 * Brand-specific tokens (Layer C) that are not part of the shared
 * schema but are explicitly allowed for the named brand.
 *
 * Adding a name here means: "this token exists only in this brand's
 * tokens.css; cross-brand components must not reference it." When a
 * second brand adopts the same name, promote the entry into
 * TOKEN_SCHEMA (typically as a B-slot or A2) and remove it here.
 */
export declare const BRAND_EXTENSIONS: Readonly<Record<string, readonly string[]>>;
/**
 * Prefixes that match any token starting with the given string. Use
 * for whole families of brand-specific tokens (e.g. kami's pre-blended
 * tag tints `--tag-bg-faint / --tag-bg-soft / ...`) where the
 * individual member tokens shouldn't have to be enumerated.
 *
 * A prefix in this list applies to *any* brand. To restrict a prefix
 * to one brand, list each member name in BRAND_EXTENSIONS instead.
 */
export declare const BRAND_EXTENSION_PREFIXES: readonly string[];
/**
 * Names that are intentionally absent from the shared schema and not
 * tracked per-brand: `--leading-display`, `--leading-dense`, etc.
 * begin life in BRAND_EXTENSIONS[brand] and graduate to the schema
 * once a second brand adopts them.
 */
export declare function getRequiredA1Names(): readonly string[];
export declare function getRequiredA2Names(): readonly string[];
export declare function getBSlotNames(): readonly string[];
export declare function getAllSchemaNames(): readonly string[];
export declare function isAllowedExtension(brand: string, name: string): boolean;
//# sourceMappingURL=token-schema.d.ts.map