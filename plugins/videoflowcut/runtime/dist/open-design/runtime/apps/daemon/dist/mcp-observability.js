import { createHash } from 'node:crypto';
export const OPEN_DESIGN_PLUGIN_ID = 'open-design';
export const PLUGIN_TELEMETRY_SCHEMA_VERSION = 3;
const MIN_PLUGIN_GENERATION_SLO_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_PLUGIN_GENERATION_SLO_WINDOW_MS = 45 * 60 * 1000;
const MAX_PLUGIN_GENERATION_SLO_WINDOW_MS = 24 * 60 * 60 * 1000;
const PLUGIN_GENERATION_TERMINAL_BUFFER_MS = 60 * 1000;
const ALLOWED_CONTEXT_KEYS = new Set([
    'id',
    'version',
    'distributionMechanism',
    'publisherClass',
]);
const ALLOWED_DISTRIBUTION = new Set([
    'git_marketplace',
    'local_repo',
    'manual',
    'unknown',
]);
const ALLOWED_PUBLISHER = new Set([
    'open_design_first_party',
    'third_party',
    'unknown',
]);
const ALLOWED_HOST_PRODUCT = new Set([
    'codex_desktop',
    'codex_cli',
    'codex_unknown',
    'claude_code',
    'unknown',
]);
const EXTERNAL_PLUGIN_RUN_HINT_KEYS = new Set([
    'entrySurface',
    'hostProduct',
    'externalPluginId',
    'externalPluginVersion',
    'distributionMechanism',
    'publisherClass',
    'attributionQuality',
    'pluginWorkflowId',
    'logicalRequestDigest',
    'logicalRequestDigestVersion',
    'briefState',
]);
const EXTERNAL_PLUGIN_RUN_RESERVED_KEY = /^(?:entrySurface|hostProduct|externalPlugin|distributionMechanism|publisherClass|attributionQuality|pluginWorkflow|logicalRequest|generationSlo)/u;
const VERSION_PATTERN = /^[0-9]+(?:\.[0-9]+){2}(?:-[0-9A-Za-z.-]+)?$/u;
const WORKFLOW_ID_PATTERN = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9A-HJKMNP-TV-Z]{26})$/iu;
export function pluginContractError(message) {
    const error = new Error(`PLUGIN_CONTRACT_REJECTED: ${message}`);
    Object.assign(error, { code: 'PLUGIN_CONTRACT_REJECTED' });
    return error;
}
export function validateExternalPluginContext(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw pluginContractError('externalPluginContext must be an object');
    }
    const input = value;
    const extra = Object.keys(input).filter((key) => !ALLOWED_CONTEXT_KEYS.has(key));
    if (extra.length > 0) {
        throw pluginContractError(`unsupported externalPluginContext field: ${extra[0]}`);
    }
    if (input.id !== OPEN_DESIGN_PLUGIN_ID) {
        throw pluginContractError(`id must be ${OPEN_DESIGN_PLUGIN_ID}`);
    }
    if (typeof input.version !== 'string'
        || !VERSION_PATTERN.test(input.version)
        || input.version.length > 64) {
        throw pluginContractError('version must be a bounded semver string');
    }
    if (typeof input.distributionMechanism !== 'string'
        || !ALLOWED_DISTRIBUTION.has(input.distributionMechanism)) {
        throw pluginContractError('distributionMechanism is invalid');
    }
    if (typeof input.publisherClass !== 'string'
        || !ALLOWED_PUBLISHER.has(input.publisherClass)) {
        throw pluginContractError('publisherClass is invalid');
    }
    return {
        id: OPEN_DESIGN_PLUGIN_ID,
        version: input.version,
        distributionMechanism: input.distributionMechanism,
        publisherClass: input.publisherClass,
    };
}
function validateCanonicalPluginCorrelationId(value, fieldName) {
    if (typeof value !== 'string'
        || value.length > 64
        || !WORKFLOW_ID_PATTERN.test(value)) {
        throw pluginContractError(`${fieldName} must be a canonical UUID or ULID`);
    }
    return value;
}
export function validatePluginWorkflowId(value) {
    return validateCanonicalPluginCorrelationId(value, 'pluginWorkflowId');
}
export function validatePluginRequestId(value) {
    return validateCanonicalPluginCorrelationId(value, 'requestId');
}
export function mapMcpHostProduct(clientInfo) {
    const name = typeof clientInfo?.name === 'string'
        ? clientInfo.name.trim().toLowerCase()
        : '';
    if (name.includes('claude'))
        return 'claude_code';
    if (name.includes('codex'))
        return 'codex_unknown';
    return 'unknown';
}
export function logicalPluginRequestDigest(requestId) {
    return {
        version: 1,
        digest: createHash('sha256')
            .update(`od-plugin-logical-request:v1:${requestId}`)
            .digest('hex'),
    };
}
export function normalizeExternalPluginRunAnalyticsHints(value, input) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw pluginContractError('analyticsHints must be an object');
    }
    const hints = value;
    for (const key of Object.keys(hints)) {
        if (EXTERNAL_PLUGIN_RUN_RESERVED_KEY.test(key)
            && !EXTERNAL_PLUGIN_RUN_HINT_KEYS.has(key)) {
            throw pluginContractError(`unsupported external plugin analytics field: ${key}`);
        }
    }
    if (hints.entrySurface !== 'external_mcp') {
        throw pluginContractError('entrySurface must be external_mcp');
    }
    if (typeof hints.hostProduct !== 'string'
        || !ALLOWED_HOST_PRODUCT.has(hints.hostProduct)) {
        throw pluginContractError('hostProduct is invalid');
    }
    const context = validateExternalPluginContext({
        id: hints.externalPluginId,
        version: hints.externalPluginVersion,
        distributionMechanism: hints.distributionMechanism,
        publisherClass: hints.publisherClass,
    });
    if (hints.attributionQuality !== undefined
        && hints.attributionQuality !== 'self_reported'
        && hints.attributionQuality !== 'session_correlated') {
        throw pluginContractError('attributionQuality is invalid');
    }
    const pluginWorkflowId = validatePluginWorkflowId(hints.pluginWorkflowId);
    if (hints.briefState !== 'confirmed'
        && hints.briefState !== 'skipped'
        && hints.briefState !== 'not_applicable') {
        throw pluginContractError('briefState is invalid');
    }
    if (typeof input.clientRequestId !== 'string'
        || input.clientRequestId.length === 0) {
        throw pluginContractError('clientRequestId is required for plugin runs');
    }
    const expectedLogical = logicalPluginRequestDigest(input.clientRequestId);
    if (hints.logicalRequestDigestVersion !== expectedLogical.version
        || hints.logicalRequestDigest !== expectedLogical.digest) {
        throw pluginContractError('logical request digest does not match clientRequestId');
    }
    const analyticsContext = input.analyticsContext;
    const sessionCorrelated = analyticsContext?.clientType === 'external_mcp'
        && analyticsContext.entrySurface === 'external_mcp'
        && analyticsContext.hostProduct === hints.hostProduct
        && analyticsContext.externalPluginId === context.id
        && analyticsContext.externalPluginVersion === context.version
        && analyticsContext.distributionMechanism === context.distributionMechanism
        && analyticsContext.publisherClass === context.publisherClass;
    return {
        entrySurface: 'external_mcp',
        hostProduct: hints.hostProduct,
        externalPluginId: context.id,
        externalPluginVersion: context.version,
        distributionMechanism: context.distributionMechanism,
        publisherClass: context.publisherClass,
        attributionQuality: sessionCorrelated
            ? 'session_correlated'
            : 'self_reported',
        pluginWorkflowId,
        logicalRequestDigest: expectedLogical.digest,
        logicalRequestDigestVersion: expectedLogical.version,
        briefState: hints.briefState,
    };
}
export function resolvePluginGenerationSloWindowMs(input) {
    const configured = Number(input.configuredValue);
    const requested = Number.isFinite(configured)
        ? Math.floor(configured)
        : DEFAULT_PLUGIN_GENERATION_SLO_WINDOW_MS;
    const boundedRequested = Math.min(MAX_PLUGIN_GENERATION_SLO_WINDOW_MS, Math.max(MIN_PLUGIN_GENERATION_SLO_WINDOW_MS, requested));
    const runtimeFloor = Math.min(MAX_PLUGIN_GENERATION_SLO_WINDOW_MS, Math.max(MIN_PLUGIN_GENERATION_SLO_WINDOW_MS, Math.floor(input.inactivityTimeoutMs) + PLUGIN_GENERATION_TERMINAL_BUFFER_MS));
    return Math.max(boundedRequested, runtimeFloor);
}
//# sourceMappingURL=mcp-observability.js.map