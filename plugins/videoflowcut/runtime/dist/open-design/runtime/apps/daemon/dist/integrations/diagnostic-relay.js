import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeOpenDesignTelemetryRelayUrl } from './telemetry-relay.js';
export class DiagnosticRelayError extends Error {
    code;
    retryAfterMs;
    permanent;
    constructor(code, retryAfterMs = 0, permanent = false) {
        super(code);
        this.code = code;
        this.retryAfterMs = retryAfterMs;
        this.permanent = permanent;
    }
}
export function diagnosticRelayUrl(env) {
    const raw = env.OPEN_DESIGN_OBJECT_RELAY_URL?.trim() || env.OPEN_DESIGN_TELEMETRY_RELAY_URL?.trim();
    if (!raw)
        return null;
    try {
        const url = new URL(normalizeOpenDesignTelemetryRelayUrl(raw));
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
            return null;
        if (!/^\/api\/(langfuse|objects\/batch)\/?$/.test(url.pathname) || url.username || url.password || url.search)
            return null;
        return url.origin;
    }
    catch {
        return null;
    }
}
export class DiagnosticRelay {
    origin;
    allowed;
    fetcher;
    constructor(origin, allowed, fetcher = fetch) {
        this.origin = origin;
        this.allowed = allowed;
        this.fetcher = fetcher;
    }
    async post(path, body, signal, credential) {
        if (!this.allowed())
            throw new DiagnosticRelayError('consent_disabled', 0, true);
        signal.throwIfAborted();
        const response = await this.fetcher(new URL(path, this.origin), {
            method: 'POST', redirect: 'error', signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
            headers: { 'Content-Type': 'application/json', 'X-Open-Design-Telemetry': 'object-ingestion-v1',
                ...(credential ? { Authorization: `Bearer ${credential}` } : {}) }, body: JSON.stringify(body),
        });
        if (!response.ok) {
            const retry = response.headers.get('Retry-After');
            const delay = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
            // 401/403 require fresh short-lived authority; the durable queue keeps the same incident.
            throw new DiagnosticRelayError(`relay_${response.status}`, Number.isFinite(delay) ? Math.max(0, delay) : 0, [400, 413, 422].includes(response.status));
        }
        // Bound even successful responses; a relay must never make us buffer arbitrary data.
        const reader = response.body?.getReader();
        let text = '';
        let size = 0;
        const decoder = new TextDecoder();
        if (!reader)
            throw new DiagnosticRelayError('relay_empty_response');
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                size += value.byteLength;
                if (size > 64 * 1024)
                    throw new DiagnosticRelayError('relay_response_too_large');
                text += decoder.decode(value, { stream: true });
            }
        }
        finally {
            await reader.cancel().catch(() => { });
        }
        const parsed = JSON.parse(text + decoder.decode());
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            throw new DiagnosticRelayError('relay_invalid_response');
        return parsed;
    }
    async register(signal) {
        const response = await this.post('/api/objects/devices/register', {}, signal);
        if (typeof response.device_id !== 'string' || !/^[a-f0-9-]{36}$/.test(response.device_id) ||
            typeof response.device_token !== 'string' || !response.device_token.startsWith(`${response.device_id}.`) ||
            !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(response.device_token))
            throw new DiagnosticRelayError('invalid_device_response');
        return { device_id: response.device_id, device_token: response.device_token };
    }
    async upload(device, manifest, directory, signal) {
        const grant = await this.post('/api/objects/authorize', { kind: 'diagnostic_bundle', manifest }, signal, device.device_token);
        const prefix = grant.object_prefix;
        if (typeof grant.upload_token !== 'string' || typeof prefix !== 'string' ||
            !prefix.startsWith(`diagnostics/v1/devices/${device.device_id}/incidents/${manifest.incidentId}/bundles/`)) {
            throw new DiagnosticRelayError('invalid_diagnostic_grant');
        }
        const authority = { kind: 'diagnostic_bundle', upload_token: grant.upload_token };
        for (const chunk of manifest.chunks) {
            signal.throwIfAborted();
            const bytes = await readFile(join(directory, String(chunk.index)));
            if (bytes.length !== chunk.sizeBytes || createHash('sha256').update(bytes).digest('hex') !== chunk.sha256) {
                throw new DiagnosticRelayError('local_chunk_corrupt', 0, true);
            }
            const result = await this.post('/api/objects/batch', { ...authority, chunk_index: chunk.index, content_base64: bytes.toString('base64') }, signal);
            if (result.object_key !== `${prefix}/chunks/${chunk.index}` || result.sha256 !== `sha256:${chunk.sha256}` || result.size_bytes !== chunk.sizeBytes) {
                throw new DiagnosticRelayError('invalid_chunk_receipt');
            }
        }
        const receipt = await this.post('/api/objects/batch', { ...authority, complete: true }, signal);
        if (receipt.status !== 'available' || receipt.object_key !== `${prefix}/manifest.json` || receipt.storage_ref !== `od://objects/${prefix}/manifest.json`) {
            throw new DiagnosticRelayError('invalid_bundle_receipt');
        }
        return JSON.stringify(receipt);
    }
}
//# sourceMappingURL=diagnostic-relay.js.map