import { resolveProviderConfig } from '../media/config.js';
import { tavilySearch, TavilyError } from './tavily.js';
const DEFAULT_MAX_SOURCES = 5;
const TAVILY_MAX_RESULTS_LIMIT = 20;
export class ResearchError extends Error {
    status;
    code;
    constructor(message, status = 400, code = 'RESEARCH_FAILED') {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'ResearchError';
    }
}
export async function searchResearch(input) {
    const query = (input.query?.trim() || '').slice(0, 1000);
    if (!query) {
        throw new ResearchError('query required', 400, 'QUERY_REQUIRED');
    }
    const depth = 'shallow';
    const requested = Array.isArray(input.providers) ? input.providers : [];
    const providers = requested.filter((p) => typeof p === 'string' && p.length > 0);
    const provider = providers[0] ?? 'tavily';
    const maxSources = clampMaxSources(input.maxSources);
    if (provider !== 'tavily') {
        throw new ResearchError(`provider "${provider}" not supported in Phase 1`, 400, 'UNSUPPORTED_RESEARCH_PROVIDER');
    }
    const cfg = await resolveProviderConfig(input.projectRoot, 'tavily');
    if (!cfg.apiKey) {
        throw new ResearchError('Tavily API key not configured (Settings -> Tavily Search)', 400, 'TAVILY_API_KEY_MISSING');
    }
    let answer = '';
    let sources = [];
    try {
        const out = await tavilySearch({
            apiKey: cfg.apiKey,
            query,
            searchDepth: 'basic',
            maxResults: maxSources,
            includeAnswer: true,
            ...(cfg.baseUrl ? { baseUrl: cfg.baseUrl } : {}),
            ...(input.requestInit ? { requestInit: input.requestInit } : {}),
            ...(input.signal ? { signal: input.signal } : {}),
        });
        answer = out.answer;
        sources = out.sources;
    }
    catch (err) {
        const message = err instanceof TavilyError
            ? err.message
            : `research failed: ${err.message || String(err)}`;
        throw new ResearchError(message, 502, 'RESEARCH_PROVIDER_FAILED');
    }
    if (sources.length === 0) {
        throw new ResearchError('no sources found', 404, 'NO_RESEARCH_SOURCES');
    }
    return {
        query,
        summary: answer || synthesizeFallbackSummary(sources),
        sources,
        provider,
        depth,
        fetchedAt: Date.now(),
    };
}
function synthesizeFallbackSummary(sources) {
    const lead = sources
        .slice(0, 5)
        .map((s, i) => `- [${i + 1}] ${s.title}: ${s.snippet.slice(0, 200)}`)
        .join('\n');
    return `(No provider summary; top snippets follow.)\n${lead}`;
}
function clampMaxSources(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return DEFAULT_MAX_SOURCES;
    }
    return Math.max(1, Math.min(Math.floor(value), TAVILY_MAX_RESULTS_LIMIT));
}
//# sourceMappingURL=index.js.map