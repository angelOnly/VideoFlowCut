import path from 'node:path';
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGBA_COLOR_RE = /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/g;
const HSLA_COLOR_RE = /hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+)?\s*\)/g;
const CUSTOM_PROPERTY_RE = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;{}\n]+);/g;
const FONT_FAMILY_RE = /font-family\s*:\s*([^;\n]+)/g;
const SPACING_PX_RE = /\b(?:padding|margin|gap|inset|top|left|right|bottom)\s*:\s*(\d+(?:\.\d+)?(?:px|rem|em))/g;
const RADIUS_RE = /border-radius\s*:\s*([^;\n]+)/g;
const SHADOW_RE = /box-shadow\s*:\s*([^;\n]+)/g;
const TAILWIND_HEX_RE = /['"]#[0-9a-fA-F]{3,8}['"]/g;
export function createDesignTokenEvidenceCollector() {
    const colors = new Map();
    const typography = new Map();
    const spacing = new Map();
    const radius = new Map();
    const shadow = new Map();
    const scannedFiles = [];
    return {
        scannedFiles,
        scanText({ text, file, language }) {
            scannedFiles.push(file);
            extractColors(text, file, colors);
            extractCSSCustomProperties(text, file, { colors, typography, spacing, radius, shadow });
            extractTypography(text, file, typography);
            extractSpacing(text, file, spacing);
            extractRadius(text, file, radius);
            extractShadow(text, file, shadow);
            if (language === 'js' || language === 'ts')
                extractTailwindHexes(text, file, colors);
        },
        toReport({ warnings, endedAt }) {
            return {
                colors: [...colors.values()].sort(byNameOrValue),
                typography: [...typography.values()].sort(byNameOrValue),
                spacing: [...spacing.values()].sort(byNameOrValue),
                radius: [...radius.values()].sort(byNameOrValue),
                shadow: [...shadow.values()].sort(byNameOrValue),
                scannedFiles,
                warnings,
                endedAt,
            };
        },
    };
}
export function extractCssCustomProperties(text, file) {
    const tokens = [];
    CUSTOM_PROPERTY_RE.lastIndex = 0;
    let match;
    while ((match = CUSTOM_PROPERTY_RE.exec(text)) !== null) {
        const name = match[1];
        const value = match[2]?.trim();
        if (name === undefined || value === undefined)
            continue;
        if (value.length === 0 || value.length > 120)
            continue;
        tokens.push({ name, value, source: file, line: lineNumberAt(text, match.index) });
    }
    return tokens;
}
export function lineNumberAt(text, index) {
    let line = 1;
    for (let offset = 0; offset < index && offset < text.length; offset += 1) {
        if (text.charCodeAt(offset) === 10)
            line += 1;
    }
    return line;
}
function extractColors(text, file, out) {
    for (const re of [HEX_COLOR_RE, RGBA_COLOR_RE, HSLA_COLOR_RE]) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(text)) !== null) {
            const value = match[0];
            const line = lineNumberAt(text, match.index);
            pushSource(out, `c:${value.toLowerCase()}`, 'color', value, `${file}:${line}`);
        }
    }
}
function extractCSSCustomProperties(text, file, out) {
    for (const token of extractCssCustomProperties(text, file)) {
        const name = token.name.toLowerCase();
        const source = `${file}:${token.line}`;
        if (isColorValue(token.value) || colorNameHint(name)) {
            pushSource(out.colors, `cv:${token.name}`, 'color', token.value, source, token.name);
        }
        if (fontNameHint(name) || (name.includes('font') && /[A-Za-z]/.test(token.value))) {
            pushSource(out.typography, `fv:${token.name}`, 'typography', token.value.replace(/['"]/g, '').trim(), source, token.name);
        }
        if (spacingNameHint(name) && isLengthLike(token.value)) {
            pushSource(out.spacing, `sv:${token.name}`, 'spacing', token.value, source, token.name);
        }
        if (name.includes('radius') && isLengthLike(token.value)) {
            pushSource(out.radius, `rv:${token.name}`, 'radius', token.value, source, token.name);
        }
        if ((name.includes('shadow') || name.includes('elev')) && token.value.trim().length > 0) {
            pushSource(out.shadow, `shv:${token.name}`, 'shadow', token.value, source, token.name);
        }
    }
}
function extractTypography(text, file, out) {
    FONT_FAMILY_RE.lastIndex = 0;
    let match;
    while ((match = FONT_FAMILY_RE.exec(text)) !== null) {
        const value = (match[1] ?? '').replace(/['"]/g, '').trim();
        if (!value)
            continue;
        const line = lineNumberAt(text, match.index);
        pushSource(out, `f:${value.toLowerCase()}`, 'typography', value, `${file}:${line}`);
    }
}
function extractSpacing(text, file, out) {
    SPACING_PX_RE.lastIndex = 0;
    let match;
    while ((match = SPACING_PX_RE.exec(text)) !== null) {
        const value = match[1] ?? '';
        if (!value)
            continue;
        const line = lineNumberAt(text, match.index);
        pushSource(out, `s:${value}`, 'spacing', value, `${file}:${line}`);
    }
}
function extractRadius(text, file, out) {
    RADIUS_RE.lastIndex = 0;
    let match;
    while ((match = RADIUS_RE.exec(text)) !== null) {
        const value = (match[1] ?? '').trim();
        if (!value)
            continue;
        const line = lineNumberAt(text, match.index);
        pushSource(out, `r:${value}`, 'radius', value, `${file}:${line}`);
    }
}
function extractShadow(text, file, out) {
    SHADOW_RE.lastIndex = 0;
    let match;
    while ((match = SHADOW_RE.exec(text)) !== null) {
        const value = (match[1] ?? '').trim();
        if (!value)
            continue;
        const line = lineNumberAt(text, match.index);
        pushSource(out, `sh:${value}`, 'shadow', value, `${file}:${line}`);
    }
}
function extractTailwindHexes(text, file, out) {
    TAILWIND_HEX_RE.lastIndex = 0;
    let match;
    while ((match = TAILWIND_HEX_RE.exec(text)) !== null) {
        const raw = match[0];
        const value = raw.slice(1, -1);
        const line = lineNumberAt(text, match.index);
        pushSource(out, `c:${value.toLowerCase()}`, 'color', value, `${file}:${line}`);
    }
}
function pushSource(map, key, kind, value, source, name) {
    let entry = map.get(key);
    if (!entry) {
        entry = { kind, value, sources: [], usage: [] };
        if (name)
            entry.name = name;
        map.set(key, entry);
    }
    if (!entry.sources.includes(source))
        entry.sources.push(source);
    const basename = path.basename(source.split(':')[0] ?? source);
    if (!entry.usage.includes(basename))
        entry.usage.push(basename);
}
function byNameOrValue(a, b) {
    if (a.name && b.name && a.name !== b.name)
        return a.name.localeCompare(b.name);
    return a.value.localeCompare(b.value);
}
function colorNameHint(name) {
    return ['color', 'fg', 'bg', 'accent', 'primary', 'secondary', 'surface', 'border', 'muted'].some((needle) => name.includes(needle));
}
function fontNameHint(name) {
    return ['font', 'typeface'].some((needle) => name.includes(needle));
}
function spacingNameHint(name) {
    return ['space', 'spacing', 'gap', 'gutter', 'padding', 'margin'].some((needle) => name.includes(needle));
}
function isColorValue(value) {
    return /^(#(?:[0-9a-f]{3,8})|rgb[a]?\(|hsl[a]?\(|oklch\(|color-mix\(|var\()/i.test(value.trim());
}
function isLengthLike(value) {
    return /^(?:\d+(?:\.\d+)?(?:px|rem|em|ch|vw|vh|%)|clamp\(|calc\(|var\()/i.test(value.trim());
}
//# sourceMappingURL=token-evidence.js.map