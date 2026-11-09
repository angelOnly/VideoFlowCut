import { createHash } from 'node:crypto';
import { resolveProviderConfig } from '../media/config.js';
const ELEVENLABS_DEFAULT_BASE_URL = 'https://api.elevenlabs.io';
const ELEVENLABS_DEFAULT_VOICE_LIMIT = 100;
const ELEVENLABS_MAX_VOICE_LIMIT = 100;
const ELEVENLABS_VOICE_CACHE_TTL_MS = 10 * 60 * 1000;
const voiceOptionsCache = new Map();
function isRecord(value) {
    return value !== null && typeof value === 'object';
}
function readString(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
}
function readLabels(value) {
    if (!isRecord(value))
        return undefined;
    const labels = {};
    for (const [key, raw] of Object.entries(value)) {
        const normalized = readString(raw);
        if (normalized)
            labels[key] = normalized;
    }
    return Object.keys(labels).length > 0 ? labels : undefined;
}
function clampLimit(limit) {
    if (typeof limit !== 'number' || !Number.isFinite(limit)) {
        return ELEVENLABS_DEFAULT_VOICE_LIMIT;
    }
    return Math.min(ELEVENLABS_MAX_VOICE_LIMIT, Math.max(1, Math.floor(limit)));
}
function normalizeVoice(value) {
    if (!isRecord(value))
        return null;
    const voiceId = readString(value.voice_id);
    if (!voiceId)
        return null;
    const name = readString(value.name) || voiceId;
    const category = readString(value.category);
    const previewUrl = readString(value.preview_url);
    const labels = readLabels(value.labels);
    return {
        voiceId,
        name,
        ...(category ? { category } : {}),
        ...(labels ? { labels } : {}),
        ...(previewUrl ? { previewUrl } : {}),
    };
}
function cacheCredentialFingerprint(apiKey) {
    return createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
}
function voiceCacheKey(input) {
    return [
        input.projectRoot,
        input.baseUrl,
        input.pageSize,
        cacheCredentialFingerprint(input.apiKey),
    ].join('\0');
}
function cloneVoiceOptions(voices) {
    return voices.map((voice) => ({
        ...voice,
        ...(voice.labels ? { labels: { ...voice.labels } } : {}),
    }));
}
export async function listElevenLabsVoiceOptions(projectRoot, options = {}) {
    const credentials = await resolveProviderConfig(projectRoot, 'elevenlabs');
    if (!credentials.apiKey) {
        throw new Error('no ElevenLabs API key - configure it in Settings or set OD_ELEVENLABS_API_KEY');
    }
    const baseUrl = (credentials.baseUrl || ELEVENLABS_DEFAULT_BASE_URL).replace(/\/$/, '');
    const pageSize = clampLimit(options.limit);
    const cacheKey = voiceCacheKey({
        projectRoot,
        baseUrl,
        apiKey: credentials.apiKey,
        pageSize,
    });
    const cached = voiceOptionsCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
        return cloneVoiceOptions(cached.voices);
    }
    const resp = await fetch(`${baseUrl}/v2/voices?page_size=${pageSize}`, {
        ...options.requestInit,
        method: 'GET',
        headers: {
            'xi-api-key': credentials.apiKey,
            accept: 'application/json',
        },
    });
    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`elevenlabs voices ${resp.status}: ${errText.slice(0, 240)}`);
    }
    const payload = await resp.json();
    const rawVoices = isRecord(payload) && Array.isArray(payload.voices)
        ? payload.voices
        : [];
    const voices = rawVoices
        .map((voice) => normalizeVoice(voice))
        .filter((voice) => voice !== null);
    voiceOptionsCache.set(cacheKey, {
        expiresAt: now + ELEVENLABS_VOICE_CACHE_TTL_MS,
        voices: cloneVoiceOptions(voices),
    });
    return voices;
}
//# sourceMappingURL=elevenlabs-voices.js.map