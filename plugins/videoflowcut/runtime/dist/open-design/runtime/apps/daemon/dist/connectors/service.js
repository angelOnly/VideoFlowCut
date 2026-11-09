import fs from 'node:fs';
import path from 'node:path';
import { classifyConnectorToolSafety, connectorDefinitionToDetail, } from './catalog.js';
import { composioConnectorProvider } from './composio.js';
function publicComposioAuthStart(auth) {
    return {
        kind: auth.kind,
        ...(auth.redirectUrl === undefined ? {} : { redirectUrl: auth.redirectUrl }),
        ...(auth.providerConnectionId === undefined ? {} : { providerConnectionId: auth.providerConnectionId }),
        ...(auth.expiresAt === undefined ? {} : { expiresAt: auth.expiresAt }),
    };
}
function isMissingOrExpiredComposioOAuthState(error) {
    return error instanceof ConnectorServiceError
        && error.code === 'CONNECTOR_EXECUTION_FAILED'
        && error.message === 'Composio OAuth state is missing or expired';
}
function boundedJsonValueIncludesAuthStaleSignal(value) {
    if (value === undefined || value === null)
        return false;
    if (typeof value === 'number')
        return value === 401;
    if (typeof value === 'boolean')
        return false;
    if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        return normalized === '401'
            || /\bbad credentials\b/.test(normalized)
            || /\bunauthori[sz]ed\b/.test(normalized)
            || /\binvalid (?:access )?token\b/.test(normalized)
            || /\btoken (?:is )?expired\b/.test(normalized)
            || /\bexpired (?:access )?token\b/.test(normalized);
    }
    if (Array.isArray(value))
        return value.some(boundedJsonValueIncludesAuthStaleSignal);
    return Object.values(value).some(boundedJsonValueIncludesAuthStaleSignal);
}
function isConnectorAuthStaleError(error, request) {
    if (!(error instanceof ConnectorServiceError) || error.code !== 'CONNECTOR_EXECUTION_FAILED')
        return false;
    const details = error.details;
    return details?.connectorId === request.connectorId
        && details.toolName === request.toolName
        && boundedJsonValueIncludesAuthStaleSignal(details.error);
}
function connectorAuthExpiredMessage(definition) {
    return `${definition.name} authorization expired. Reconnect ${definition.name}.`;
}
function hasStoredComposioConnection(credential, providerConnectionId) {
    return credential?.credentials.provider === 'composio'
        && credential.credentials.providerConnectionId === providerConnectionId;
}
export class ConnectorServiceError extends Error {
    code;
    status;
    details;
    constructor(code, message, status, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = 'ConnectorServiceError';
    }
}
const LOCAL_CONNECTOR_ACCOUNT_LABELS = {};
function nowIso() {
    return new Date().toISOString();
}
function cloneCredentialMaterial(credentials) {
    return JSON.parse(JSON.stringify(credentials));
}
export class InMemoryConnectorCredentialStore {
    records = new Map();
    get(connectorId) {
        const record = this.records.get(connectorId);
        return record === undefined ? undefined : { ...record, credentials: cloneCredentialMaterial(record.credentials) };
    }
    set(record) {
        this.records.set(record.connectorId, { ...record, credentials: cloneCredentialMaterial(record.credentials) });
    }
    delete(connectorId) {
        this.records.delete(connectorId);
    }
    deleteByProvider(provider) {
        for (const [connectorId, record] of this.records.entries()) {
            if (record.credentials.provider === provider)
                this.records.delete(connectorId);
        }
    }
}
export class FileConnectorCredentialStore {
    filePath;
    constructor(dataDir) {
        this.filePath = path.join(dataDir, 'connectors', 'credentials.json');
    }
    get(connectorId) {
        return this.readRecords()[connectorId];
    }
    set(record) {
        const records = this.readRecords();
        records[record.connectorId] = { ...record, credentials: cloneCredentialMaterial(record.credentials) };
        this.writeRecords(records);
    }
    delete(connectorId) {
        const records = this.readRecords();
        if (records[connectorId] === undefined)
            return;
        delete records[connectorId];
        this.writeRecords(records);
    }
    deleteByProvider(provider) {
        const records = this.readRecords();
        let changed = false;
        for (const [connectorId, record] of Object.entries(records)) {
            if (record.credentials.provider === provider) {
                delete records[connectorId];
                changed = true;
            }
        }
        if (changed)
            this.writeRecords(records);
    }
    readRecords() {
        try {
            const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
                return {};
            const records = {};
            for (const [connectorId, value] of Object.entries(parsed)) {
                if (!value || typeof value !== 'object' || Array.isArray(value))
                    continue;
                const raw = value;
                if (raw.schemaVersion !== 1 || raw.connectorId !== connectorId || typeof raw.accountLabel !== 'string' || typeof raw.updatedAt !== 'string')
                    continue;
                if (!raw.credentials || typeof raw.credentials !== 'object' || Array.isArray(raw.credentials))
                    continue;
                records[connectorId] = {
                    schemaVersion: 1,
                    connectorId,
                    accountLabel: raw.accountLabel,
                    credentials: cloneCredentialMaterial(raw.credentials),
                    updatedAt: raw.updatedAt,
                };
            }
            return records;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
                return {};
            throw error;
        }
    }
    writeRecords(records) {
        const dir = path.dirname(this.filePath);
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(tempPath, `${JSON.stringify(records, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
        fs.renameSync(tempPath, this.filePath);
        fs.chmodSync(this.filePath, 0o600);
    }
}
function cloneStatus(status) {
    return {
        status: status.status,
        ...(status.accountLabel === undefined ? {} : { accountLabel: status.accountLabel }),
        ...(status.lastError === undefined ? {} : { lastError: status.lastError }),
    };
}
function isAutoConnectedConnector(definition) {
    const authentication = definition.authentication ?? (definition.provider === 'open-design' ? 'local' : 'oauth');
    return (authentication === 'local' || authentication === 'none') && definition.tools.every((tool) => tool.requiredScopes.length === 0);
}
function approvalRank(approval) {
    switch (approval) {
        case 'auto':
            return 0;
        case 'confirm':
            return 1;
        case 'disabled':
            return 2;
        default:
            return 2;
    }
}
function stricterApproval(left, right) {
    if (left === undefined)
        return right;
    if (right === undefined)
        return left;
    return approvalRank(left) >= approvalRank(right) ? left : right;
}
function runtimeSafetyForTool(tool) {
    const classified = classifyConnectorToolSafety(tool);
    if (classified.sideEffect !== 'read' || classified.approval !== 'auto')
        return classified;
    return tool.safety;
}
function assertJsonSchemaMatches(value, schema, path = 'input') {
    if (schema === undefined)
        return;
    const type = schema.type;
    if (typeof type === 'string') {
        const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
        if (type === 'number') {
            if (typeof value !== 'number')
                throw new Error(`${path} must be a number`);
        }
        else if (type === 'integer') {
            if (typeof value !== 'number' || !Number.isInteger(value))
                throw new Error(`${path} must be an integer`);
        }
        else if (type !== actualType) {
            throw new Error(`${path} must be a ${type}`);
        }
    }
    if (type === 'object') {
        if (value === null || typeof value !== 'object' || Array.isArray(value))
            throw new Error(`${path} must be an object`);
        const objectValue = value;
        const required = Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === 'string') : [];
        for (const key of required) {
            if (objectValue[key] === undefined)
                throw new Error(`${path}.${key} is required by connector input schema`);
        }
        const properties = schema.properties;
        const propertySchemas = properties !== null && typeof properties === 'object' && !Array.isArray(properties)
            ? properties
            : {};
        if (schema.additionalProperties === false) {
            for (const key of Object.keys(objectValue)) {
                if (propertySchemas[key] === undefined)
                    throw new Error(`${path}.${key} is not allowed by connector input schema`);
            }
        }
        for (const [key, childSchema] of Object.entries(propertySchemas)) {
            if (objectValue[key] !== undefined && childSchema !== null && typeof childSchema === 'object' && !Array.isArray(childSchema)) {
                assertJsonSchemaMatches(objectValue[key], childSchema, `${path}.${key}`);
            }
        }
    }
    if (type === 'string' && typeof value === 'string') {
        if (typeof schema.maxLength === 'number' && value.length > schema.maxLength)
            throw new Error(`${path} exceeds connector input schema maxLength`);
    }
    if ((type === 'number' || type === 'integer') && typeof value === 'number') {
        if (typeof schema.minimum === 'number' && value < schema.minimum)
            throw new Error(`${path} is below connector input schema minimum`);
        if (typeof schema.maximum === 'number' && value > schema.maximum)
            throw new Error(`${path} exceeds connector input schema maximum`);
    }
}
function defaultConnectedAccountLabel(definition) {
    return LOCAL_CONNECTOR_ACCOUNT_LABELS[definition.id] ?? definition.name;
}
export class ConnectorStatusService {
    statuses = new Map();
    credentialStore;
    constructor(options = {}) {
        this.credentialStore = options.credentialStore;
        for (const [connectorId, status] of Object.entries(options.initialStatuses ?? {})) {
            this.statuses.set(connectorId, { ...cloneStatus(status), updatedAt: nowIso() });
        }
    }
    setCredentialStore(credentialStore) {
        this.credentialStore = credentialStore;
    }
    deleteCredentialsByProvider(provider) {
        for (const [connectorId, status] of this.statuses.entries()) {
            if (status.status !== 'connected')
                continue;
            const credential = this.getCredential(connectorId);
            if (credential?.credentials.provider === provider)
                this.statuses.delete(connectorId);
        }
        this.credentialStore?.deleteByProvider(provider);
    }
    getStatus(definition) {
        if (definition.disabled)
            return { status: 'disabled' };
        const stored = this.statuses.get(definition.id);
        if (stored)
            return cloneStatus(stored);
        const credentialRecord = this.getCredential(definition.id);
        if (credentialRecord !== undefined) {
            return { status: 'connected', accountLabel: credentialRecord.accountLabel };
        }
        if (isAutoConnectedConnector(definition)) {
            return { status: 'connected', accountLabel: defaultConnectedAccountLabel(definition) };
        }
        return { status: 'available' };
    }
    listStatuses() {
        return Object.fromEntries(Array.from(this.statuses.entries()).map(([connectorId, status]) => [connectorId, cloneStatus(status)]));
    }
    connect(definition, accountLabel, credentials) {
        if (definition.disabled)
            return { status: 'disabled' };
        if (credentials !== undefined) {
            this.credentialStore?.set({
                schemaVersion: 1,
                connectorId: definition.id,
                accountLabel: accountLabel ?? defaultConnectedAccountLabel(definition),
                credentials,
                updatedAt: nowIso(),
            });
        }
        const next = {
            status: 'connected',
            accountLabel: accountLabel ?? defaultConnectedAccountLabel(definition),
            updatedAt: nowIso(),
        };
        this.statuses.set(definition.id, next);
        return cloneStatus(next);
    }
    getCredential(connectorId) {
        return this.credentialStore?.get(connectorId);
    }
    disconnect(definition) {
        if (definition.disabled)
            return { status: 'disabled' };
        this.credentialStore?.delete(definition.id);
        if (isAutoConnectedConnector(definition)) {
            this.statuses.delete(definition.id);
            return this.getStatus(definition);
        }
        const next = { status: 'available', updatedAt: nowIso() };
        this.statuses.set(definition.id, next);
        return cloneStatus(next);
    }
    setError(definition, lastError, accountLabel) {
        if (definition.disabled)
            return { status: 'disabled' };
        const next = {
            status: 'error',
            ...(accountLabel === undefined ? {} : { accountLabel }),
            lastError,
            updatedAt: nowIso(),
        };
        this.statuses.set(definition.id, next);
        return cloneStatus(next);
    }
    markAuthenticationExpired(definition, lastError, accountLabel) {
        this.credentialStore?.delete(definition.id);
        return this.setError(definition, lastError, accountLabel);
    }
    clear(connectorId) {
        this.statuses.delete(connectorId);
    }
}
export const CONNECTOR_MAX_OUTPUT_BYTES = 256 * 1024;
export const CONNECTOR_RUN_RATE_LIMIT_CALLS = 10;
export const CONNECTOR_RUN_RATE_LIMIT_WINDOW_MS = 60_000;
export const CONNECTOR_RUN_LIMIT_TTL_MS = 15 * 60_000;
export const CONNECTOR_RUN_TOTAL_CALL_LIMIT = 60;
const CONNECTOR_REDACTED_VALUE = '[redacted]';
const CONNECTOR_FORBIDDEN_OUTPUT_KEYS = new Set([
    'raw',
    'rawresponse',
    'payload',
    'body',
    'headers',
    'cookie',
    'authorization',
    'token',
    'secret',
    'credential',
    'password',
]);
function connectorRunLimitKey(context) {
    return `${context.projectId}\0${context.runId ?? `${context.purpose ?? 'agent_preview'}:no-run-id`}`;
}
function jsonSerializedBytes(value) {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
}
function isForbiddenConnectorOutputKey(key) {
    const normalized = key.toLowerCase();
    return CONNECTOR_FORBIDDEN_OUTPUT_KEYS.has(normalized) || /(?:token|secret|credential|password|authorization|cookie)/i.test(key);
}
function redactConnectorOutputValue(value) {
    if (Array.isArray(value)) {
        let redacted = false;
        const next = value.map((item) => {
            const child = redactConnectorOutputValue(item);
            redacted = child.redacted || redacted;
            return child.value;
        });
        return { value: next, redacted };
    }
    if (value !== null && typeof value === 'object') {
        let redacted = false;
        const next = {};
        for (const [key, child] of Object.entries(value)) {
            if (isForbiddenConnectorOutputKey(key)) {
                next[key] = CONNECTOR_REDACTED_VALUE;
                redacted = true;
                continue;
            }
            const redactedChild = redactConnectorOutputValue(child);
            next[key] = redactedChild.value;
            redacted = redactedChild.redacted || redacted;
        }
        return { value: next, redacted };
    }
    return { value, redacted: false };
}
export function protectConnectorOutput(output) {
    const redacted = redactConnectorOutputValue(output);
    const serializedBytes = jsonSerializedBytes(redacted.value);
    if (serializedBytes > CONNECTOR_MAX_OUTPUT_BYTES) {
        throw new ConnectorServiceError('CONNECTOR_OUTPUT_TOO_LARGE', 'connector output exceeds max serialized size', 502, {
            maxSerializedBytes: CONNECTOR_MAX_OUTPUT_BYTES,
            serializedBytes,
        });
    }
    return { output: redacted.value, redacted: redacted.redacted, serializedBytes };
}
export class ConnectorService {
    statusService;
    runLimits = new Map();
    constructor(statusService = new ConnectorStatusService()) {
        this.statusService = statusService;
    }
    setCredentialStore(credentialStore) {
        this.statusService.setCredentialStore(credentialStore);
    }
    deleteCredentialsByProvider(provider) {
        this.statusService.deleteCredentialsByProvider(provider);
    }
    async listDefinitions(signal) {
        return composioConnectorProvider.listDefinitions(signal);
    }
    async listHydratedDefinitions(signal) {
        return composioConnectorProvider.listDefinitions(signal, { hydrateTools: true });
    }
    listFastDefinitions() {
        return composioConnectorProvider.getFastDefinitions();
    }
    getFastDefinition(connectorId) {
        return this.listFastDefinitions().find((definition) => definition.id === connectorId);
    }
    async getDefinition(connectorId, signal) {
        return composioConnectorProvider.getDefinition(connectorId, signal);
    }
    async getHydratedDefinition(connectorId, signal) {
        return await composioConnectorProvider.getHydratedDefinition(connectorId, signal)
            ?? await this.getDefinition(connectorId, signal);
    }
    async getPreviewDefinition(connectorId, options) {
        return composioConnectorProvider.getPreviewDefinition(connectorId, options);
    }
    getStatus(definition) {
        return this.statusService.getStatus(definition);
    }
    getCredential(connectorId) {
        return this.statusService.getCredential(connectorId);
    }
    async listConnectors(signal) {
        return this.listFastDefinitions().map((definition) => this.toDetail(definition));
    }
    listConnectorStatuses() {
        return {
            ...this.statusService.listStatuses(),
            ...Object.fromEntries(this.listFastDefinitions().map((definition) => [definition.id, this.getStatus(definition)])),
        };
    }
    async listConnectorDiscovery(options = {}) {
        if (options.refresh)
            composioConnectorProvider.clearDiscoveryCache();
        const definitions = options.refresh && !options.hydrateTools
            ? await composioConnectorProvider.refreshCatalog(options.signal)
            : options.hydrateTools
                ? await this.listHydratedDefinitions(options.signal)
                : await this.listDefinitions(options.signal);
        return {
            connectors: definitions.map((definition) => this.toDetail(definition)),
            meta: {
                provider: 'composio',
                ...(options.refresh ? { refreshRequested: true } : {}),
            },
        };
    }
    async getConnector(connectorId, signal) {
        const definition = await this.getDefinition(connectorId, signal);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        return this.toDetail(definition);
    }
    async getHydratedConnector(connectorId, signal) {
        const definition = await this.getHydratedDefinition(connectorId, signal);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        return this.toDetail(definition);
    }
    async getPreviewConnector(connectorId, options) {
        const definition = await this.getPreviewDefinition(connectorId, options);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        return this.toDetail(definition);
    }
    async prepareAuthConfigs(connectorIds, signal) {
        const results = {};
        const uniqueConnectorIds = [...new Set(connectorIds.map((id) => id.trim()).filter(Boolean))];
        await Promise.all(uniqueConnectorIds.map(async (connectorId) => {
            const definition = this.getFastDefinition(connectorId) ?? await this.getDefinition(connectorId, signal);
            if (!definition) {
                results[connectorId] = { status: 'error', message: 'connector not found' };
                return;
            }
            if (definition.authentication !== 'composio') {
                results[connectorId] = { status: 'error', message: 'connector is not backed by Composio' };
                return;
            }
            results[connectorId] = await composioConnectorProvider.prepareAuthConfig(definition, signal);
        }));
        return { results };
    }
    async connect(connectorId, options = {}) {
        const definition = this.getFastDefinition(connectorId) ?? await this.getDefinition(connectorId, options.signal);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        let auth;
        let detailDefinition = definition;
        if (definition.authentication === 'composio' && options.credentials === undefined) {
            if (!options.callbackUrl) {
                throw new ConnectorServiceError('CONNECTOR_EXECUTION_FAILED', 'callbackUrl is required for Composio connectors', 400, { connectorId });
            }
            auth = await composioConnectorProvider.connect(definition, options.callbackUrl, options.signal);
            if (auth.kind === 'redirect_required' || auth.kind === 'pending') {
                return { connector: this.toDetail(detailDefinition), auth: publicComposioAuthStart(auth) };
            }
            if (auth.credentials !== undefined) {
                options = { ...options, ...(auth.accountLabel === undefined ? {} : { accountLabel: auth.accountLabel }), credentials: auth.credentials };
            }
        }
        const status = this.statusService.connect(detailDefinition, options.accountLabel, options.credentials);
        if (status.status === 'disabled') {
            throw new ConnectorServiceError('CONNECTOR_DISABLED', 'connector is disabled', 403);
        }
        return { connector: this.toDetail(detailDefinition), ...(auth === undefined ? {} : { auth: publicComposioAuthStart(auth) }) };
    }
    async disconnect(connectorId) {
        const definition = this.getFastDefinition(connectorId) ?? await this.getDefinition(connectorId);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        if (definition.authentication === 'composio') {
            await composioConnectorProvider.disconnect(this.getCredential(connectorId)?.credentials);
        }
        this.statusService.disconnect(definition);
        return this.toDetail(definition);
    }
    async cancelPendingAuthorization(connectorId) {
        const definition = this.getFastDefinition(connectorId) ?? await this.getDefinition(connectorId);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        if (definition.authentication === 'composio') {
            composioConnectorProvider.cancelPendingConnections(connectorId);
        }
        return this.toDetail(definition);
    }
    async completeComposioConnection(input) {
        const definition = await this.getDefinition(input.connectorId, input.signal);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        if (definition.authentication !== 'composio') {
            throw new ConnectorServiceError('CONNECTOR_EXECUTION_FAILED', 'connector is not backed by Composio', 400, { connectorId: input.connectorId });
        }
        try {
            const completed = await composioConnectorProvider.completeConnection({ definition, state: input.state, ...(input.providerConnectionId === undefined ? {} : { providerConnectionId: input.providerConnectionId }), ...(input.status === undefined ? {} : { status: input.status }), ...(input.signal === undefined ? {} : { signal: input.signal }) });
            this.statusService.connect(definition, completed.accountLabel, completed.credentials);
            return this.toDetail(definition);
        }
        catch (error) {
            if (input.providerConnectionId !== undefined
                && isMissingOrExpiredComposioOAuthState(error)
                && hasStoredComposioConnection(this.getCredential(input.connectorId), input.providerConnectionId)) {
                return this.toDetail(definition);
            }
            throw error;
        }
    }
    async execute(request, context) {
        const fastDefinition = this.listFastDefinitions().find((candidate) => (candidate.id === request.connectorId &&
            candidate.allowedToolNames.includes(request.toolName) &&
            candidate.tools.some((tool) => tool.name === request.toolName)));
        const definition = fastDefinition ?? await this.getHydratedDefinition(request.connectorId, context.signal);
        if (!definition) {
            throw new ConnectorServiceError('CONNECTOR_NOT_FOUND', 'connector not found', 404);
        }
        const connector = this.toDetail(definition);
        if (connector.status === 'disabled') {
            throw new ConnectorServiceError('CONNECTOR_DISABLED', 'connector is disabled', 403);
        }
        if (connector.status !== 'connected') {
            throw new ConnectorServiceError('CONNECTOR_NOT_CONNECTED', 'connector is not connected', 403, {
                connectorId: request.connectorId,
                status: connector.status,
            });
        }
        if (request.expectedAccountLabel !== undefined && connector.accountLabel !== request.expectedAccountLabel) {
            throw new ConnectorServiceError('CONNECTOR_NOT_CONNECTED', 'connector account changed since refresh approval', 409, {
                connectorId: request.connectorId,
                expectedAccountLabel: request.expectedAccountLabel,
                currentAccountLabel: connector.accountLabel ?? null,
            });
        }
        if (!definition.allowedToolNames.includes(request.toolName)) {
            throw new ConnectorServiceError('CONNECTOR_TOOL_NOT_FOUND', 'connector tool is not allowed', 404, {
                connectorId: request.connectorId,
                toolName: request.toolName,
            });
        }
        const tool = definition.tools.find((candidate) => candidate.name === request.toolName);
        if (!tool) {
            throw new ConnectorServiceError('CONNECTOR_TOOL_NOT_FOUND', 'connector tool not found', 404);
        }
        const runtimeSafety = runtimeSafetyForTool(tool);
        const effectiveApproval = stricterApproval(stricterApproval(definition.minimumApproval, tool.safety.approval), runtimeSafety.approval);
        if (effectiveApproval !== 'auto' || runtimeSafety.sideEffect !== 'read') {
            throw new ConnectorServiceError('CONNECTOR_SAFETY_DENIED', 'connector tool is not auto-approved read-only by current safety policy', 403, {
                connectorId: request.connectorId,
                toolName: request.toolName,
                approvalPolicy: effectiveApproval ?? null,
                safety: { ...runtimeSafety },
            });
        }
        try {
            assertJsonSchemaMatches(request.input, tool.inputSchemaJson);
        }
        catch (error) {
            throw new ConnectorServiceError('CONNECTOR_INPUT_SCHEMA_MISMATCH', error instanceof Error ? error.message : String(error), 400, {
                connectorId: request.connectorId,
                toolName: request.toolName,
            });
        }
        this.enforceRunLimits(context);
        let providerOutput;
        try {
            providerOutput = await this.executeConnectorProviderTool(request, context, definition, tool);
        }
        catch (error) {
            if (isConnectorAuthStaleError(error, request)) {
                this.statusService.markAuthenticationExpired(definition, connectorAuthExpiredMessage(definition), connector.accountLabel);
            }
            throw error;
        }
        const protectedOutput = protectConnectorOutput(providerOutput);
        const output = protectedOutput.output;
        const outputSummary = summarizeConnectorOutput(output);
        return {
            ok: true,
            connectorId: request.connectorId,
            ...(connector.accountLabel === undefined ? {} : { accountLabel: connector.accountLabel }),
            toolName: request.toolName,
            safety: { ...runtimeSafety },
            output,
            ...(outputSummary === undefined ? {} : { outputSummary }),
            metadata: {
                connectorId: request.connectorId,
                toolName: request.toolName,
                purpose: context.purpose ?? 'agent_preview',
                outputSerializedBytes: protectedOutput.serializedBytes,
                ...(protectedOutput.redacted ? { redacted: true } : {}),
                ...(context.runId === undefined ? {} : { runId: context.runId }),
            },
        };
    }
    async executeConnectorProviderTool(request, context, resolvedDefinition, resolvedTool) {
        const definition = resolvedDefinition ?? await this.getHydratedDefinition(request.connectorId, context.signal);
        const tool = resolvedTool ?? definition?.tools.find((candidate) => candidate.name === request.toolName);
        if (definition?.authentication === 'composio' && tool) {
            return composioConnectorProvider.execute(definition, tool, request.input, this.getCredential(request.connectorId)?.credentials, context.signal);
        }
        throw new ConnectorServiceError('CONNECTOR_EXECUTION_FAILED', 'connector provider is not implemented', 501, {
            connectorId: request.connectorId,
            toolName: request.toolName,
        });
    }
    enforceRunLimits(context) {
        if (context.runId === undefined)
            return;
        const now = Date.now();
        this.pruneRunLimits(now);
        const key = connectorRunLimitKey(context);
        const current = this.runLimits.get(key);
        const state = current === undefined || now - current.windowStartedAt >= CONNECTOR_RUN_RATE_LIMIT_WINDOW_MS
            ? { windowStartedAt: now, lastSeenAt: now, windowCalls: 0, totalCalls: current?.totalCalls ?? 0 }
            : current;
        if (state.totalCalls >= CONNECTOR_RUN_TOTAL_CALL_LIMIT) {
            throw new ConnectorServiceError('CONNECTOR_RATE_LIMITED', 'connector tool run call limit exceeded', 429, {
                runId: context.runId ?? null,
                totalCallLimit: CONNECTOR_RUN_TOTAL_CALL_LIMIT,
            });
        }
        if (state.windowCalls >= CONNECTOR_RUN_RATE_LIMIT_CALLS) {
            throw new ConnectorServiceError('CONNECTOR_RATE_LIMITED', 'connector tool rate limit exceeded', 429, {
                runId: context.runId ?? null,
                rateLimit: CONNECTOR_RUN_RATE_LIMIT_CALLS,
                windowMs: CONNECTOR_RUN_RATE_LIMIT_WINDOW_MS,
            });
        }
        state.windowCalls += 1;
        state.totalCalls += 1;
        state.lastSeenAt = now;
        this.runLimits.set(key, state);
    }
    pruneRunLimits(now = Date.now()) {
        for (const [key, state] of this.runLimits.entries()) {
            if (now - state.lastSeenAt >= CONNECTOR_RUN_LIMIT_TTL_MS)
                this.runLimits.delete(key);
        }
    }
    toDetail(definition) {
        const detail = connectorDefinitionToDetail(definition);
        const status = this.getStatus(definition);
        return {
            ...detail,
            status: status.status,
            ...(status.accountLabel === undefined ? {} : { accountLabel: status.accountLabel }),
            ...(status.lastError === undefined ? {} : { lastError: status.lastError }),
            ...(detail.auth === undefined ? {} : {
                auth: {
                    ...detail.auth,
                    configured: detail.auth.configured || (definition.authentication === 'composio' && composioConnectorProvider.isConfigured(definition)),
                },
            }),
        };
    }
}
export const connectorService = new ConnectorService();
export function configureConnectorCredentialStore(credentialStore) {
    connectorService.setCredentialStore(credentialStore);
}
export function deleteConnectorCredentialsByProvider(provider) {
    connectorService.deleteCredentialsByProvider(provider);
}
function summarizeConnectorOutput(output) {
    if (output === null || typeof output !== 'object' || Array.isArray(output))
        return undefined;
    const maybeToolName = output.toolName;
    if (typeof maybeToolName === 'string') {
        if (typeof output.count === 'number')
            return `${maybeToolName}: ${output.count} result${output.count === 1 ? '' : 's'}`;
        if (typeof output.path === 'string')
            return `${maybeToolName}: ${output.path}`;
        if (typeof output.isRepository === 'boolean')
            return `${maybeToolName}: ${output.isRepository ? 'repository found' : 'not a repository'}`;
        return maybeToolName;
    }
    return undefined;
}
//# sourceMappingURL=service.js.map