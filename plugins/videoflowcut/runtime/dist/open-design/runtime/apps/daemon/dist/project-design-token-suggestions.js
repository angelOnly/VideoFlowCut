import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readDesignSystem } from './design-systems/index.js';
const DEFAULT_PROPS = [
    'color',
    'backgroundColor',
    'borderColor',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'width',
    'height',
    'gap',
    'padding',
    'margin',
    'borderRadius',
    'borderWidth',
];
const MAX_TEXT_FILE_BYTES = 512 * 1024;
const MAX_CANDIDATES_PER_FILE = 400;
const MAX_SUGGESTIONS = 80;
export async function buildProjectDesignTokenSuggestions(options) {
    const props = normalizeProps(options.query.props);
    const values = normalizeQueryValues(options.query.values ?? {});
    const candidates = await collectProjectTokenCandidates(options);
    const designSystemId = typeof options.project?.designSystemId === 'string'
        ? options.project.designSystemId
        : null;
    if (designSystemId) {
        const body = await readDesignSystem(options.designSystemsRoot, designSystemId)
            ?? await readDesignSystem(options.userDesignSystemsRoot, designSystemId)
            ?? await readDesignSystem(options.userDesignSystemsRoot, designSystemId, { idPrefix: 'user:' });
        if (body) {
            candidates.push(...extractTokenCandidates(body, `design-system:${designSystemId}/DESIGN.md`));
        }
    }
    const suggestions = rankTokenCandidates(candidates, props, values);
    return {
        projectId: options.projectId,
        query: {
            ...options.query,
            props,
            values,
        },
        suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    };
}
async function collectProjectTokenCandidates(options) {
    const files = await options.listFiles(options.projectsRoot, options.projectId, {
        metadata: options.projectMetadata,
    });
    const root = options.resolveProjectDir(options.projectsRoot, options.projectId, options.projectMetadata);
    const candidates = [];
    for (const file of files) {
        if (!isTokenSearchTextFile(file))
            continue;
        if (typeof file.size === 'number' && file.size > MAX_TEXT_FILE_BYTES)
            continue;
        let content = '';
        try {
            content = await readFile(path.join(root, file.name), 'utf8');
        }
        catch {
            continue;
        }
        candidates.push(...extractTokenCandidates(content, file.name).slice(0, MAX_CANDIDATES_PER_FILE));
    }
    return candidates;
}
function isTokenSearchTextFile(file) {
    const name = file.name.toLowerCase();
    if (/\.(css|scss|sass|less|html?|tsx?|jsx?|json|md|mdx)$/u.test(name))
        return true;
    const mime = file.mime ?? '';
    return /^text\//iu.test(mime) || /^application\/(?:json|javascript|typescript)\b/iu.test(mime);
}
export function extractTokenCandidates(content, sourceFile) {
    const out = [];
    const lines = content.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        const lineNo = index + 1;
        pushCssCustomProperties(out, line, sourceFile, lineNo);
        pushJsonTokens(out, line, sourceFile, lineNo);
        pushNamedCssDeclarations(out, line, sourceFile, lineNo);
        pushMarkdownTokens(out, line, sourceFile, lineNo);
    }
    return dedupeCandidates(out);
}
function pushCssCustomProperties(out, line, sourceFile, lineNo) {
    const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}{]+)/gu;
    for (const match of line.matchAll(re)) {
        addCandidate(out, match[1], match[2], sourceFile, lineNo);
    }
}
function pushJsonTokens(out, line, sourceFile, lineNo) {
    const re = /"([A-Za-z0-9_.-]*(?:color|font|size|space|spacing|gap|radius|border|shadow|weight|lineHeight|letterSpacing)[A-Za-z0-9_.-]*)"\s*:\s*"([^"]+)"/giu;
    for (const match of line.matchAll(re)) {
        addCandidate(out, match[1], match[2], sourceFile, lineNo);
    }
}
function pushNamedCssDeclarations(out, line, sourceFile, lineNo) {
    const re = /\b(color|background(?:-color)?|border(?:-[a-z]+)?|font(?:-size|-weight|-family)?|line-height|letter-spacing|gap|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|border-radius)\s*:\s*([^;}{]+)/giu;
    for (const match of line.matchAll(re)) {
        addCandidate(out, match[1], match[2], sourceFile, lineNo);
    }
}
function pushMarkdownTokens(out, line, sourceFile, lineNo) {
    const re = /`?([A-Za-z0-9_.-]*(?:color|font|size|space|spacing|gap|radius|border|weight)[A-Za-z0-9_.-]*)`?\s*(?:=|:|->|→)\s*`?((?:#[0-9a-f]{3,8})|(?:-?\d+(?:\.\d+)?(?:px|rem|em|%)?)|(?:[A-Za-z][A-Za-z0-9 ,'"-]+))`?/giu;
    for (const match of line.matchAll(re)) {
        addCandidate(out, match[1], match[2], sourceFile, lineNo);
    }
}
function addCandidate(out, token, value, sourceFile, line) {
    const cleanToken = (token ?? '').trim();
    const cleanValue = normalizeTokenValue(value ?? '');
    if (!cleanToken || !cleanValue)
        return;
    if (!looksUsefulTokenValue(cleanValue))
        return;
    out.push({ token: cleanToken, value: cleanValue, sourceFile, line });
}
function normalizeTokenValue(value) {
    return value
        .replace(/!important\b/giu, '')
        .replace(/[,;]+$/gu, '')
        .trim();
}
function looksUsefulTokenValue(value) {
    return /#[0-9a-f]{3,8}\b/iu.test(value)
        || /\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/iu.test(value)
        || /\b-?\d+(?:\.\d+)?(?:px|rem|em|%)?\b/u.test(value)
        || /\b(?:Inter|Roboto|Arial|Helvetica|Georgia|serif|sans-serif|monospace)\b/iu.test(value)
        || /var\(--[A-Za-z0-9_-]+\)/u.test(value);
}
function dedupeCandidates(candidates) {
    const seen = new Set();
    const out = [];
    for (const candidate of candidates) {
        const key = `${candidate.token}\0${candidate.value}\0${candidate.sourceFile}\0${candidate.line}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(candidate);
    }
    return out;
}
function normalizeProps(props) {
    if (!Array.isArray(props) || props.length === 0)
        return DEFAULT_PROPS;
    const allowed = new Set(DEFAULT_PROPS);
    const next = props.filter((prop) => allowed.has(prop));
    return next.length > 0 ? Array.from(new Set(next)) : DEFAULT_PROPS;
}
function normalizeQueryValues(values) {
    const normalized = {};
    for (const prop of DEFAULT_PROPS) {
        const value = values[prop]?.trim();
        if (value)
            normalized[prop] = value;
    }
    return normalized;
}
function rankTokenCandidates(candidates, props, values) {
    const suggestions = [];
    for (const prop of props) {
        for (const candidate of candidates) {
            const score = scoreCandidate(prop, values[prop] ?? '', candidate);
            if (score <= 0)
                continue;
            suggestions.push({
                prop,
                token: candidate.token,
                value: candidate.value,
                sourceFile: candidate.sourceFile,
                line: candidate.line,
                matchReason: matchReason(prop, values[prop] ?? '', candidate, score),
                score,
            });
        }
    }
    return dedupeSuggestions(suggestions)
        .sort((a, b) => b.score - a.score || a.sourceFile.localeCompare(b.sourceFile) || a.line - b.line);
}
function scoreCandidate(prop, queryValue, candidate) {
    const token = candidate.token.toLowerCase();
    const value = candidate.value.toLowerCase();
    let score = propNameScore(prop, token);
    if (score === 0 && !queryValue)
        return 0;
    const normalizedQuery = normalizeComparableValue(queryValue);
    const normalizedCandidate = normalizeComparableValue(value);
    if (normalizedQuery && normalizedCandidate) {
        if (normalizedQuery === normalizedCandidate)
            score += 120;
        else {
            const qn = numericValue(normalizedQuery);
            const cn = numericValue(normalizedCandidate);
            if (qn !== null && cn !== null) {
                const delta = Math.abs(qn - cn);
                if (delta <= 1)
                    score += 90;
                else if (delta <= 4)
                    score += 60;
                else if (delta <= 8)
                    score += 30;
            }
        }
    }
    if (value.includes('var(--'))
        score += 12;
    if (/design-system:/u.test(candidate.sourceFile))
        score += 10;
    return score;
}
function propNameScore(prop, token) {
    const groups = {
        color: /color|foreground|text|fg|ink/u,
        backgroundColor: /background|surface|bg|fill|panel/u,
        borderColor: /border|stroke|outline/u,
        fontFamily: /font|family|typeface/u,
        fontSize: /font.*size|text.*size|type.*size|size/u,
        fontWeight: /weight|bold|regular|medium/u,
        lineHeight: /line.*height|leading/u,
        letterSpacing: /letter.*spacing|tracking/u,
        width: /width|size|measure/u,
        height: /height|size|measure/u,
        gap: /gap|space|spacing/u,
        padding: /padding|space|spacing/u,
        margin: /margin|space|spacing/u,
        borderRadius: /radius|rounded/u,
        borderWidth: /border.*width|stroke.*width/u,
    };
    return groups[prop].test(token) ? 60 : 0;
}
function normalizeComparableValue(value) {
    const clean = value.trim().toLowerCase();
    const hex = clean.match(/#[0-9a-f]{3,8}\b/u)?.[0];
    if (hex)
        return expandShortHex(hex);
    const num = clean.match(/-?\d+(?:\.\d+)?(?:px|rem|em|%)?/u)?.[0];
    if (num)
        return num;
    return clean.replace(/\s+/gu, ' ');
}
function expandShortHex(value) {
    if (/^#[0-9a-f]{3}$/iu.test(value)) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
    }
    return value.toLowerCase();
}
function numericValue(value) {
    const match = value.match(/^-?\d+(?:\.\d+)?/u);
    if (!match)
        return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? n : null;
}
function matchReason(prop, queryValue, candidate, score) {
    const normalizedQuery = normalizeComparableValue(queryValue);
    const normalizedCandidate = normalizeComparableValue(candidate.value);
    if (normalizedQuery && normalizedCandidate && normalizedQuery === normalizedCandidate) {
        return `Exact ${prop} value match`;
    }
    if (score >= 100)
        return `Close ${prop} value match`;
    if (propNameScore(prop, candidate.token.toLowerCase()) > 0)
        return `Token name matches ${prop}`;
    return `Similar ${prop} value`;
}
function dedupeSuggestions(suggestions) {
    const best = new Map();
    for (const suggestion of suggestions) {
        const key = `${suggestion.prop}\0${suggestion.token}\0${suggestion.value}\0${suggestion.sourceFile}\0${suggestion.line}`;
        const current = best.get(key);
        if (!current || suggestion.score > current.score)
            best.set(key, suggestion);
    }
    return Array.from(best.values());
}
//# sourceMappingURL=project-design-token-suggestions.js.map