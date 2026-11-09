// Brand validation + normalization, including the optional authored seed
// overrides that drive deterministic system generation.
import { BRAND_COLOR_ROLES, } from '@open-design/contracts';
import { sanitizeSeedOverrides } from './schema.js';
const isStr = (v) => typeof v === 'string';
const strArr = (v) => (Array.isArray(v) ? v.filter(isStr) : []);
/** Parse the optional `imagery.samples` array. Each entry needs a `file`
 *  string; `kind`/`caption` are optional. Anything malformed is dropped so a
 *  sloppy agent output still validates (backward compatible). */
function imagerySamples(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object')
            continue;
        const o = item;
        if (!isStr(o.file) || !o.file.trim())
            continue;
        out.push({
            file: o.file.trim(),
            ...(isStr(o.kind) && o.kind ? { kind: o.kind } : {}),
            ...(isStr(o.caption) && o.caption ? { caption: o.caption } : {}),
        });
    }
    return out;
}
function fontSpec(raw, fallbackFamily) {
    const o = (raw ?? {});
    return {
        family: isStr(o.family) && o.family ? o.family : fallbackFamily,
        fallbacks: strArr(o.fallbacks),
        weights: Array.isArray(o.weights) ? o.weights.filter((w) => typeof w === 'number') : [400, 700],
        ...(isStr(o.googleFontsUrl) && o.googleFontsUrl ? { googleFontsUrl: o.googleFontsUrl } : {}),
        ...(isStr(o.notes) && o.notes ? { notes: o.notes } : {}),
    };
}
/**
 * Validate + normalize a brand object. Throws with a precise message on
 * unrecoverable problems (missing name/colors); fills sensible defaults for
 * everything optional so a slightly-sloppy input still renders.
 */
export function validateBrand(raw, sourceUrl) {
    if (!raw || typeof raw !== 'object')
        throw new Error('brand is not a JSON object');
    const o = raw;
    if (!isStr(o.name) || !o.name.trim())
        throw new Error('brand: missing required `name`');
    const rawColors = Array.isArray(o.colors) ? o.colors : [];
    const colors = [];
    for (const c of rawColors) {
        if (!c || typeof c !== 'object')
            continue;
        const co = c;
        const role = BRAND_COLOR_ROLES.includes(co.role)
            ? co.role
            : null;
        const hex = isStr(co.hex) && /^#[0-9a-fA-F]{6}$/.test(co.hex) ? co.hex.toLowerCase() : null;
        if (!role || !hex)
            continue;
        colors.push({
            role,
            hex,
            oklch: isStr(co.oklch) ? co.oklch : '',
            name: isStr(co.name) ? co.name : role,
            usage: isStr(co.usage) ? co.usage : '',
        });
    }
    const roles = new Set(colors.map((c) => c.role));
    if (!roles.has('accent') || !roles.has('background') || !roles.has('foreground')) {
        throw new Error('brand: `colors` must include at least the background, foreground and accent roles, each with a #rrggbb hex');
    }
    const logoRaw = (o.logo ?? {});
    const voiceRaw = (o.voice ?? {});
    const vocabRaw = (voiceRaw.vocabulary ?? {});
    const imageryRaw = (o.imagery ?? {});
    const layoutRaw = (o.layout ?? {});
    const typoRaw = (o.typography ?? {});
    const seed = sanitizeSeedOverrides(o.seed);
    return {
        name: o.name.trim(),
        tagline: isStr(o.tagline) ? o.tagline : '',
        description: isStr(o.description) ? o.description : '',
        sourceUrl,
        ...(seed ? { seed } : {}),
        logo: {
            primary: isStr(logoRaw.primary) && logoRaw.primary ? logoRaw.primary : null,
            alternates: strArr(logoRaw.alternates),
            notes: isStr(logoRaw.notes) ? logoRaw.notes : '',
        },
        colors,
        typography: {
            display: fontSpec(typoRaw.display, 'Inter'),
            body: fontSpec(typoRaw.body, 'Inter'),
            ...(typoRaw.mono ? { mono: fontSpec(typoRaw.mono, 'JetBrains Mono') } : {}),
        },
        voice: {
            adjectives: strArr(voiceRaw.adjectives),
            tone: isStr(voiceRaw.tone) ? voiceRaw.tone : '',
            messagingPillars: strArr(voiceRaw.messagingPillars),
            vocabulary: { use: strArr(vocabRaw.use), avoid: strArr(vocabRaw.avoid) },
        },
        imagery: {
            style: isStr(imageryRaw.style) ? imageryRaw.style : '',
            subjects: strArr(imageryRaw.subjects),
            treatment: isStr(imageryRaw.treatment) ? imageryRaw.treatment : '',
            avoid: strArr(imageryRaw.avoid),
            ...(imagerySamples(imageryRaw.samples).length
                ? { samples: imagerySamples(imageryRaw.samples) }
                : {}),
        },
        layout: {
            radius: isStr(layoutRaw.radius) ? layoutRaw.radius : '8px',
            borderWeight: isStr(layoutRaw.borderWeight) ? layoutRaw.borderWeight : '1px',
            spacing: isStr(layoutRaw.spacing) ? layoutRaw.spacing : '8px baseline grid',
            postureRules: strArr(layoutRaw.postureRules),
        },
    };
}
/** Pull the last ```json fenced block (or bare top-level object) out of text —
 *  the fallback path when a brand object arrives inline instead of as JSON. */
export function extractJsonBlock(text) {
    const fences = [...text.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g)];
    for (let i = fences.length - 1; i >= 0; i--) {
        try {
            return JSON.parse(fences[i]?.[1] ?? '');
        }
        catch {
            /* try earlier fence */
        }
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last > first) {
        try {
            return JSON.parse(text.slice(first, last + 1));
        }
        catch {
            /* give up */
        }
    }
    return null;
}
//# sourceMappingURL=validate.js.map