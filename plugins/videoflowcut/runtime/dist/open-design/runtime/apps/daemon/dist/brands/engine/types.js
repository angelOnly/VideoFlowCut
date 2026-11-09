// @ts-nocheck
/**
 * FROZEN CONTRACT for the brand engine. Every engine module imports its types
 * and the css-var helpers from here, so the independently-built modules
 * (palette / seed / derive / export / kit / artifacts) stay coherent.
 *
 * Pipeline:  URL ──prefetch──▶ material ──synthesize──▶ SeedToken
 *            SeedToken ──derive(algorithm)──▶ DesignTokens   (the "style system")
 *            DesignTokens ──export──▶ tokens.json / variables.css / theme.json
 *            DesignTokens ──kit──▶ themed components (HTML)
 *            kit + Brand ──artifacts──▶ products (landing / email / poster …)
 *
 * Design choices that make this a *minimal* Ant-Design-style engine:
 *  - The brand is reduced to a tiny SeedToken (~20 fields); everything else is
 *    deterministically DERIVED. This is why one URL yields a whole system.
 *  - Variants (light / dark / compact) are the SAME seed run through a
 *    different algorithm — never hand-authored.
 */
// ─────────────────────────── CSS-var helpers (single source of truth) ───────
export const CSS_VAR_PREFIX = "brand";
/** "colorPrimaryBg" → "--brand-color-primary-bg"; "fontSizeHeading1" → "--brand-font-size-heading-1". */
export function cssVar(tokenKey) {
    const kebab = tokenKey
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Za-z])([0-9])/g, "$1-$2")
        .toLowerCase();
    return `--${CSS_VAR_PREFIX}-${kebab}`;
}
/** Convenience for kit/artifacts: `varRef("colorPrimary")` → "var(--brand-color-primary)". */
export function varRef(tokenKey, fallback) {
    return fallback ? `var(${cssVar(tokenKey)}, ${fallback})` : `var(${cssVar(tokenKey)})`;
}
/**
 * True when a scraped font family name is safe to embed in a CSS font stack.
 *
 * Extractors sometimes capture CSS *source text* instead of a real family —
 * e.g. Tailwind v4's `--theme(--default-font-family` — and one unbalanced
 * parenthesis inside the emitted `--brand-font-family` value swallows every
 * later `:root` declaration, unstyling the whole kit. A real family name
 * (including CJK names) never needs CSS syntax characters, so reject any
 * candidate that carries them or reads as a custom property reference.
 */
export function isRenderableFontFamily(raw) {
    const fam = raw.trim().replace(/^["']|["']$/g, "").trim();
    if (!fam)
        return false;
    if (fam.startsWith("--"))
        return false;
    return !/[(){}[\];:,"'\\/<>=@!]/.test(fam);
}
const PX_TOKEN = /^(fontSize|size|borderRadius|lineWidth|controlHeight)/;
const UNITLESS_TOKEN = /^(lineHeight|fontWeight)/;
/** Format a single token value into a CSS-ready string (adds px / leaves unitless / passes strings through). */
export function formatTokenValue(key, value) {
    if (typeof value === "string")
        return value;
    if (UNITLESS_TOKEN.test(key))
        return String(value);
    if (PX_TOKEN.test(key))
        return `${value}px`;
    return String(value);
}
/**
 * Flatten DesignTokens into ordered { cssVarName → css-ready value } pairs.
 * Arrays (palettes) expand to `<name>-<1-based-index>`. Objects (presets)
 * expand to `<name>-<key>-<1-based-index>`. `algorithm` is skipped.
 */
export function flattenTokens(tokens) {
    const out = [];
    for (const [key, value] of Object.entries(tokens)) {
        if (key === "algorithm" || value == null)
            continue;
        if (Array.isArray(value)) {
            value.forEach((v, i) => out.push({ name: `${cssVar(key)}-${i + 1}`, value: String(v) }));
        }
        else if (typeof value === "object") {
            for (const [sub, arr] of Object.entries(value)) {
                (arr ?? []).forEach((v, i) => out.push({ name: `${cssVar(key)}-${sub}-${i + 1}`, value: String(v) }));
            }
        }
        else {
            out.push({ name: cssVar(key), value: formatTokenValue(key, value) });
        }
    }
    return out;
}
//# sourceMappingURL=types.js.map