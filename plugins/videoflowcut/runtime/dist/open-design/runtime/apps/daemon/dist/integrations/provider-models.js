import { isLoopbackApiHost } from '@open-design/contracts/api/connectionTest';
import { redactSecrets, validateUserProviderBaseUrl } from '../connectionTest.js';
import { googleProviderModelsUrl, normalizeGoogleModelId } from './google-models.js';
import { aihubmixHeaders, aihubmixCatalogUrl, parseAIHubMixCatalog } from './aihubmix.js';
const PROVIDER_MODELS_TIMEOUT_MS = 12_000;
const BEDROCK_MODEL_OPTIONS = [
    { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2' },
    { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude 3.5 Haiku' },
    { id: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
    { id: 'amazon.nova-pro-v1:0', label: 'Amazon Nova Pro' },
    { id: 'amazon.nova-lite-v1:0', label: 'Amazon Nova Lite' },
    { id: 'amazon.nova-micro-v1:0', label: 'Amazon Nova Micro' },
];
function appendVersionedApiPath(baseUrl, suffix) {
    const url = new URL(baseUrl);
    const pathname = url.pathname.replace(/\/+$/, '');
    url.pathname = /\/v\d+(\/|$)/.test(pathname)
        ? `${pathname}${suffix}`
        : `${pathname}/v1${suffix}`;
    return url.toString();
}
function statusToKind(status) {
    if (status === 401)
        return 'auth_failed';
    if (status === 403)
        return 'forbidden';
    if (status === 404)
        return 'invalid_base_url';
    if (status === 429)
        return 'rate_limited';
    if (status >= 500)
        return 'upstream_unavailable';
    return 'unknown';
}
function extractProviderErrorDetail(data, rawText) {
    const obj = data && typeof data === 'object' ? data : null;
    const error = obj ? obj.error : null;
    if (typeof error === 'string')
        return error;
    if (error && typeof error === 'object') {
        const message = error.message;
        if (typeof message === 'string' && message.trim())
            return message;
    }
    const message = obj ? obj.message : null;
    if (typeof message === 'string' && message.trim())
        return message;
    return rawText.trim().slice(0, 240);
}
function networkErrorToKind(err) {
    if (err instanceof Error) {
        if (err.name === 'AbortError')
            return 'timeout';
        const cause = err.cause;
        const code = cause?.code;
        if (code === 'ENOTFOUND' ||
            code === 'EAI_AGAIN' ||
            code === 'ECONNREFUSED' ||
            code === 'ECONNRESET' ||
            code === 'ETIMEDOUT' ||
            code === 'EHOSTUNREACH' ||
            code === 'ENETUNREACH' ||
            code === 'CERT_HAS_EXPIRED' ||
            code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            return 'invalid_base_url';
        }
    }
    return 'unknown';
}
function uniqueModels(models) {
    const seen = new Set();
    const out = [];
    for (const model of models) {
        const id = model.id.trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        const label = model.label.trim() || id;
        out.push({ ...model, id, label });
    }
    return out;
}
function isOpenAiChatModelId(id) {
    const normalized = id.trim().toLowerCase();
    if (!normalized)
        return false;
    if (normalized.includes('embedding') ||
        normalized.includes('moderation') ||
        normalized.includes('rerank') ||
        normalized.includes('whisper') ||
        normalized.includes('tts') ||
        normalized.includes('transcribe') ||
        normalized.includes('speech') ||
        normalized.includes('image') ||
        normalized.includes('video') ||
        normalized.includes('dall-e') ||
        normalized.includes('stable-diffusion') ||
        normalized.includes('flux') ||
        // BAAI's BGE embedding family (e.g. `BAAI/bge-large-en-v1.5`, served by
        // gateways like SiliconFlow) doesn't match any of the substrings above —
        // `bge-reranker-*` variants are already caught by the `rerank` check, but
        // the plain embedding models slip through and 404 when a chat-completion
        // test is run against them (issue #5367).
        /(?:^|[/_-])bge(?:[-_]|$)/u.test(normalized) ||
        (normalized.includes('wan') &&
            /(?:^|[-_.:])(?:t2v|i2v|v2v)(?:[-_.:]|$)/u.test(normalized))) {
        return false;
    }
    return !/(?:^|[-_.:])(?:t2i|i2i|t2v|i2v|v2v|tts|asr|ocr)(?:[-_.:]|$)/u.test(normalized);
}
function extractOpenAiModels(data) {
    const items = data.data;
    if (!Array.isArray(items))
        return [];
    return uniqueModels(items
        .map(openAiModelOption)
        .filter((model) => model != null));
}
function openAiModelOption(item) {
    if (!item || typeof item !== 'object')
        return null;
    const obj = item;
    const id = typeof obj?.id === 'string' ? obj.id : '';
    if (!id || !isOpenAiChatModelId(id))
        return null;
    const metadata = extractModelMetadata(obj.metadata);
    return {
        id,
        label: id,
        ...(metadata ? { metadata } : {}),
    };
}
function extractModelMetadata(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const metadata = value;
    const cost = parseModelCost(metadata.cost);
    const capability = parseModelCapability(metadata.capability);
    if (!cost && !capability)
        return null;
    return {
        ...(cost ? { cost } : {}),
        ...(capability ? { capability } : {}),
    };
}
function parseModelCost(value) {
    return value === 'low' ||
        value === 'medium' ||
        value === 'high' ||
        value === 'very_high'
        ? value
        : null;
}
function parseModelCapability(value) {
    return value === 'standard' ||
        value === 'advanced' ||
        value === 'best_quality'
        ? value
        : null;
}
function extractAnthropicModels(data) {
    const items = data.data;
    if (!Array.isArray(items))
        return [];
    return uniqueModels(items
        .map((item) => {
        const obj = item && typeof item === 'object'
            ? item
            : null;
        const id = typeof obj?.id === 'string' ? obj.id : '';
        const label = typeof obj?.display_name === 'string'
            ? obj.display_name
            : typeof obj?.displayName === 'string'
                ? obj.displayName
                : id;
        return id ? { id, label } : null;
    })
        .filter((item) => item != null));
}
function googleModelId(rawName, rawBaseModelId) {
    if (typeof rawBaseModelId === 'string' && rawBaseModelId.trim()) {
        return normalizeGoogleModelId(rawBaseModelId);
    }
    if (typeof rawName !== 'string')
        return '';
    return normalizeGoogleModelId(rawName);
}
function supportsGoogleGenerateContent(item) {
    const methods = item
        ?.supportedGenerationMethods
        ?? item?.supported_actions;
    return Array.isArray(methods) && methods.includes('generateContent');
}
function extractGoogleModels(data) {
    const items = data.models;
    if (!Array.isArray(items))
        return [];
    return uniqueModels(items
        .filter(supportsGoogleGenerateContent)
        .map((item) => {
        const obj = item && typeof item === 'object'
            ? item
            : null;
        const id = googleModelId(obj?.name, obj?.baseModelId);
        const label = typeof obj?.displayName === 'string' && obj.displayName.trim()
            ? obj.displayName
            : id;
        return id ? { id, label } : null;
    })
        .filter((item) => item != null));
}
function providerModelsUrl(protocol, baseUrl, apiKey) {
    if (protocol === 'aihubmix') {
        // AIHubMix exposes its chat catalogue on a dedicated endpoint
        // (GET /api/v1/models?type=llm), not the OpenAI /v1/models route.
        return aihubmixCatalogUrl(baseUrl, 'llm');
    }
    if (protocol === 'openai' || protocol === 'senseaudio') {
        return appendVersionedApiPath(baseUrl, '/models');
    }
    if (protocol === 'anthropic') {
        const url = new URL(appendVersionedApiPath(baseUrl, '/models'));
        url.searchParams.set('limit', '1000');
        return url.toString();
    }
    if (protocol === 'google') {
        return googleProviderModelsUrl(baseUrl, apiKey);
    }
    throw new Error(`Unsupported protocol: ${protocol}`);
}
function providerModelsHeaders(protocol, apiKey) {
    if (protocol === 'openai' || protocol === 'senseaudio') {
        return { authorization: `Bearer ${apiKey}` };
    }
    if (protocol === 'aihubmix') {
        // The catalogue is public — only attach Bearer auth (+ APP-Code) when the
        // user actually supplied a key. An empty `Bearer ` would be rejected by
        // some gateways, so send no headers when the key is blank.
        return apiKey.trim() ? aihubmixHeaders(apiKey) : {};
    }
    if (protocol === 'anthropic') {
        return {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        };
    }
    return {};
}
function extractModels(protocol, data) {
    // SenseAudio's /v1/models response follows the OpenAI envelope
    // (`{ data: [{ id, ... }] }`), so the same extractor handles both.
    // Chat picker: drop media-generation rows. AIHubMix's `?type=llm` matches any
    // model whose `types` merely contains `llm`, so dual-tagged image models
    // (e.g. gpt-image-2 → "image_generation,llm") would otherwise leak in. Those
    // belong to the dedicated image/video/audio pickers.
    if (protocol === 'aihubmix')
        return parseAIHubMixCatalog(data, { chatOnly: true });
    if (protocol === 'openai' || protocol === 'senseaudio')
        return extractOpenAiModels(data);
    if (protocol === 'anthropic')
        return extractAnthropicModels(data);
    if (protocol === 'google')
        return extractGoogleModels(data);
    return [];
}
export async function listProviderModels(input) {
    const start = Date.now();
    if (input.protocol === 'azure') {
        return {
            ok: false,
            kind: 'unsupported_protocol',
            latencyMs: Date.now() - start,
            detail: 'Azure OpenAI deployment discovery is not supported from the inference endpoint.',
        };
    }
    const validated = await validateUserProviderBaseUrl(input.baseUrl);
    if (validated.error || !validated.parsed) {
        return {
            ok: false,
            kind: validated.forbidden ? 'forbidden' : 'invalid_base_url',
            latencyMs: Date.now() - start,
            detail: validated.error ?? '',
        };
    }
    if (input.protocol === 'bedrock') {
        return {
            ok: true,
            kind: 'success',
            latencyMs: Date.now() - start,
            models: BEDROCK_MODEL_OPTIONS,
            detail: 'AWS Bedrock uses a static seed until AWS credential-backed discovery is available.',
        };
    }
    let url;
    try {
        url = providerModelsUrl(input.protocol, input.baseUrl, input.apiKey);
    }
    catch (err) {
        return {
            ok: false,
            kind: 'unsupported_protocol',
            latencyMs: Date.now() - start,
            detail: err instanceof Error ? err.message : String(err),
        };
    }
    const controller = new AbortController();
    const abortFromParent = () => controller.abort();
    if (input.signal?.aborted) {
        controller.abort();
    }
    else {
        input.signal?.addEventListener('abort', abortFromParent, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), PROVIDER_MODELS_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: providerModelsHeaders(input.protocol, input.apiKey),
            ...input.requestInit,
            signal: controller.signal,
            redirect: 'error',
        });
        const latencyMs = Date.now() - start;
        const rawText = await response.text();
        let data = {};
        let parseError;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        }
        catch (err) {
            parseError = err instanceof Error ? err.message : String(err);
        }
        if (!response.ok) {
            const detail = parseError
                ? rawText.trim().slice(0, 240) || parseError
                : extractProviderErrorDetail(data, rawText);
            return {
                ok: false,
                kind: statusToKind(response.status),
                latencyMs,
                status: response.status,
                detail: redactSecrets(detail, [input.apiKey]),
            };
        }
        if (parseError) {
            return {
                ok: false,
                kind: 'unknown',
                latencyMs,
                status: response.status,
                detail: redactSecrets(parseError, [input.apiKey]),
            };
        }
        const models = extractModels(input.protocol, data);
        console.log(`[provider:models] ${input.protocol} ${validated.parsed.hostname} → ${models.length} models in ${latencyMs}ms`);
        if (models.length === 0) {
            return {
                ok: false,
                kind: 'no_models',
                latencyMs,
                status: response.status,
                detail: 'Provider returned no usable text-generation models.',
            };
        }
        return {
            ok: true,
            kind: 'success',
            latencyMs,
            status: response.status,
            models,
        };
    }
    catch (err) {
        const latencyMs = Date.now() - start;
        const kind = networkErrorToKind(err);
        const message = err instanceof Error ? err.message : String(err);
        const host = validated.parsed.hostname;
        const scope = isLoopbackApiHost(host) ? 'local' : 'remote';
        console.warn(`[provider:models] ${input.protocol} ${scope} ${host} → ${kind} in ${latencyMs}ms ${redactSecrets(message, [input.apiKey])}`);
        return {
            ok: false,
            kind,
            latencyMs,
            detail: redactSecrets(message, [input.apiKey]),
        };
    }
    finally {
        clearTimeout(timer);
        input.signal?.removeEventListener('abort', abortFromParent);
    }
}
//# sourceMappingURL=provider-models.js.map