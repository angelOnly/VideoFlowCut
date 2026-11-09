// AIHubMix BYOK provider — shared identity + outbound header helper.
//
// AIHubMix (https://aihubmix.com) is an OpenAI-wire-compatible aggregator
// gateway: a single API key fronts OpenAI / Anthropic / Gemini models, routed
// by model name on the upstream side (`claude*` → Anthropic, `gemini*/imagen*`
// → Gemini, everything else → OpenAI). Because the wire shape is identical to
// OpenAI's, the chat proxy, connection test, model discovery and media
// renderers all reuse the OpenAI call shape — the ONLY thing that differs is
// the outbound headers, which is why every outbound call point funnels through
// `aihubmixHeaders()` rather than hand-building `Authorization` inline.
//
// The distinctive AIHubMix detail is the `APP-Code` attribution header: a
// fixed per-integration code that grants a usage discount (the same mechanism
// cherry-studio and the dify plugin use). Injecting it in one helper keeps the
// invariant "every AIHubMix request carries our APP-Code" enforceable in one
// place instead of being re-derived at each call site.
// Fixed App Code for this integration (from https://aihubmix.com/appstore).
// Sent as the APP-Code attribution header on every AIHubMix request to grant
// the integration's usage discount. When empty, the header is omitted and the
// integration still works (just without the discount).
export const AIHUBMIX_APP_CODE = 'DMCY9912';
// Default base URL the daemon assumes when the BYOK form leaves the field
// blank. Kept here as the single source of truth so the chat proxy, media
// renderers and connection test all default to the same origin.
export const AIHUBMIX_DEFAULT_BASE_URL = 'https://aihubmix.com/v1';
/**
 * Build the outbound header set for an AIHubMix request: Bearer auth plus the
 * fixed `APP-Code` attribution header (omitted when unset). Callers spread the
 * result into their `fetch` headers and may add `content-type` etc. on top.
 */
export function aihubmixHeaders(apiKey) {
    const headers = {
        authorization: `Bearer ${apiKey}`,
    };
    if (AIHUBMIX_APP_CODE) {
        headers['APP-Code'] = AIHUBMIX_APP_CODE;
    }
    return headers;
}
/**
 * The APP-Code attribution header on its own (no auth). For the Anthropic /
 * Gemini routes, which carry their own auth header (`x-api-key` /
 * `x-goog-api-key`) — spread this alongside it so every AIHubMix request,
 * whatever the wire protocol, still carries APP-Code.
 */
export function aihubmixAppCodeHeader() {
    return AIHUBMIX_APP_CODE ? { 'APP-Code': AIHUBMIX_APP_CODE } : {};
}
export function classifyAIHubMixModel(model) {
    const m = (model || '').trim().toLowerCase();
    // Gemini: gemini*/imagen*, excluding the `-nothink`/`-search` suffixes and
    // any embedding model (those stay on the OpenAI-compatible path per §4.1).
    if ((m.startsWith('gemini') || m.startsWith('imagen'))
        && !/-(nothink|search)$/.test(m)
        && !m.includes('embedding')) {
        return 'gemini';
    }
    if (m.startsWith('claude'))
        return 'anthropic';
    return 'openai';
}
/**
 * Origin of the configured AIHubMix base URL — the three protocol clients all
 * derive their endpoint from it:
 *   openai    → `${origin}/v1`
 *   anthropic → `${origin}` (+ /v1/messages)
 *   gemini    → `${origin}/gemini` (+ /v1beta/models/{model}:...)
 */
export function aihubmixOriginFromBase(baseUrl) {
    try {
        return new URL(baseUrl || AIHUBMIX_DEFAULT_BASE_URL).origin;
    }
    catch {
        return 'https://aihubmix.com';
    }
}
/** Gemini-native generateContent endpoint for an AIHubMix image model. */
export function aihubmixGeminiImageUrl(baseUrl, wireModel) {
    return (`${aihubmixOriginFromBase(baseUrl)}/gemini/v1beta/models/`
        + `${encodeURIComponent(wireModel)}:generateContent`);
}
/**
 * Generate an image through AIHubMix's Gemini-native `generateContent` wire and
 * return the decoded image bytes.
 *
 * gemini/imagen-family image models reject the OpenAI `/images/generations`
 * shape ("Unknown name prompt/n/size"), so both the in-chat tool
 * (`executeAIHubMixGenerateImage`) and the Home/New Project/CLI media renderer
 * (`renderAIHubMixImage`) route those models here. This helper owns the single
 * source of truth for the request body and the inline-image response parse;
 * `doFetch` lets each caller apply its own request-init wrapper (proxy
 * dispatcher, abort signal, redirect policy). Throws on a non-OK status or a
 * response without inline image data.
 */
export async function aihubmixGeminiImageBytes(req, doFetch) {
    const url = aihubmixGeminiImageUrl(req.baseUrl, req.wireModel);
    const resp = await doFetch(url, {
        method: 'POST',
        redirect: 'error',
        headers: {
            'content-type': 'application/json',
            'x-goog-api-key': req.apiKey,
            ...aihubmixAppCodeHeader(),
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: req.aspect },
            },
        }),
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`aihubmix image (gemini) ${resp.status}: ${text.slice(0, 240)}`);
    }
    const data = (await resp.json());
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const b64 = parts
        .map((p) => p?.inlineData?.data || p?.inline_data?.data)
        .find((d) => typeof d === 'string' && d);
    if (!b64) {
        throw new Error(`aihubmix gemini image response had no inline image data: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return Buffer.from(b64, 'base64');
}
// Catalogue ids vs wire names. The media registry requires globally-unique
// model ids, but `gpt-image-1` / `dall-e-3` / `tts-1` are already owned by the
// `openai` provider. So AIHubMix's models are registered with an `aihubmix-`
// prefix and mapped back to the real upstream name here. A plain prefix strip
// is the fallback so adding a new `aihubmix-<wire>` entry needs no edit here.
const AIHUBMIX_WIRE_MODELS = {
    'aihubmix-gpt-image-1': 'gpt-image-1',
    'aihubmix-dall-e-3': 'dall-e-3',
    'aihubmix-tts-1': 'tts-1',
};
export function aihubmixWireModel(catalogId) {
    return AIHUBMIX_WIRE_MODELS[catalogId] ?? catalogId.replace(/^aihubmix-/, '');
}
// AIHubMix's unified /videos API uses a single `seconds` (string) field for
// every model family, but the *valid values* differ per family — an
// out-of-set duration 400s (e.g. Veo rejects 5; only 4/6/8 are allowed, which
// AIHubMix forwards to Google's native `durationSeconds`). Snap the requested
// duration to the family's nearest allowed value (ties prefer the shorter one).
//   veo:  4, 6, 8   (default 8)
//   sora: 4, 8, 12  (default 4)
//   wan:  5, 10     (default 5)
//   seedance/doubao + unknown: accepts a range — clamp to 3–12.
// `wireModel` is the upstream name (prefix already stripped).
export function aihubmixVideoSeconds(wireModel, requested) {
    const m = (wireModel || '').toLowerCase();
    const req = Number.isFinite(requested) ? requested : 5;
    let allowed = null;
    if (m.startsWith('veo'))
        allowed = [4, 6, 8];
    else if (m.startsWith('sora'))
        allowed = [4, 8, 12];
    else if (m.startsWith('wan'))
        allowed = [5, 10];
    if (!allowed) {
        // Seedance/doubao and unknown families take a continuous range.
        return String(Math.min(12, Math.max(3, Math.round(req))));
    }
    // Nearest allowed value; strict `<` keeps the first (smaller) on a tie.
    const snapped = allowed.reduce((best, v) => (Math.abs(v - req) < Math.abs(best - req) ? v : best), allowed[0]);
    return String(snapped);
}
export function aihubmixCatalogUrl(baseUrl, type) {
    let origin;
    try {
        origin = new URL(baseUrl || AIHUBMIX_DEFAULT_BASE_URL).origin;
    }
    catch {
        origin = 'https://aihubmix.com';
    }
    return `${origin}/api/v1/models?type=${type}`;
}
// AIHubMix tags every catalogue row with a comma-separated `types` field
// (e.g. "llm", "llm,search", "image_generation,llm"). These are the
// media-generation capabilities that belong to the dedicated image/video/audio
// pickers — NOT the chat model picker.
const AIHUBMIX_MEDIA_GENERATION_TYPES = new Set(['image_generation', 'video', 'tts']);
function aihubmixRowTypes(row) {
    const raw = row?.types;
    if (typeof raw !== 'string')
        return [];
    return raw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
}
/** Parse the AIHubMix catalogue envelope into { id, label } options. Reads
 *  `model_id` (the wire name sent as `model`) and `model_name` (display). */
export function parseAIHubMixCatalog(data, options) {
    const rows = data?.data;
    if (!Array.isArray(rows))
        return [];
    const seen = new Set();
    const out = [];
    for (const row of rows) {
        const id = typeof row?.model_id === 'string'
            ? row.model_id
            : '';
        if (!id || seen.has(id))
            continue;
        if (options?.chatOnly &&
            aihubmixRowTypes(row).some((t) => AIHUBMIX_MEDIA_GENERATION_TYPES.has(t))) {
            continue;
        }
        seen.add(id);
        const name = typeof row?.model_name === 'string'
            ? row.model_name
            : '';
        out.push({ id, label: name || id });
    }
    return out;
}
// Aspect → pixel size for the chat `generate_image` tool. Tuned for the
// default model (gpt-image-1, which accepts 1024×1024 / 1536×1024 /
// 1024×1536). The CLI/media renderer path uses media.ts's model-aware
// `openaiSizeFor` instead; this conservative table keeps the tool call from
// 400-ing on an unsupported size.
export const AIHUBMIX_IMAGE_ASPECT_TO_SIZE = {
    '1:1': '1024x1024',
    '16:9': '1536x1024',
    '9:16': '1024x1536',
    '4:3': '1536x1024',
    '3:4': '1024x1536',
};
//# sourceMappingURL=aihubmix.js.map