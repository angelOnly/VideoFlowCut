import fs from 'node:fs';
import path from 'node:path';
let configFilePath = path.join(process.cwd(), '.od', 'connectors', 'composio-config.json');
export function configureComposioConfigStore(dataDir) {
    configFilePath = path.join(dataDir, 'connectors', 'composio-config.json');
}
export function readComposioConfig() {
    const raw = readRawConfig();
    return normalizeComposioConfig(raw);
}
export function readPublicComposioConfig() {
    const config = readComposioConfig();
    return {
        configured: Boolean(config.apiKey),
        apiKeyTail: config.apiKey ? config.apiKey.slice(-4) : '',
    };
}
export function writeComposioConfig(input) {
    const prior = readComposioConfig();
    const record = input && typeof input === 'object' && !Array.isArray(input)
        ? input
        : {};
    const hasApiKey = Object.prototype.hasOwnProperty.call(record, 'apiKey');
    const hasAuthConfigIds = Object.prototype.hasOwnProperty.call(record, 'authConfigIds');
    const apiKeyInput = normalizeOptionalString(record.apiKey) ?? '';
    const nextApiKey = hasApiKey ? apiKeyInput : prior.apiKey;
    const apiKeyChanged = prior.apiKey !== nextApiKey;
    const next = normalizeComposioConfig({
        apiKey: nextApiKey,
        authConfigIds: apiKeyChanged ? {} : hasAuthConfigIds ? record.authConfigIds : prior.authConfigIds,
    });
    writeRawConfig(next);
    return readPublicComposioConfig();
}
export function setComposioAuthConfigId(connectorId, authConfigId) {
    const normalizedConnectorId = normalizeOptionalString(connectorId);
    const normalizedAuthConfigId = normalizeOptionalString(authConfigId);
    if (!normalizedConnectorId || !normalizedAuthConfigId)
        return;
    const prior = readComposioConfig();
    writeRawConfig(normalizeComposioConfig({
        apiKey: prior.apiKey,
        authConfigIds: {
            ...prior.authConfigIds,
            [normalizedConnectorId]: normalizedAuthConfigId,
        },
    }));
}
export function deleteComposioAuthConfigId(connectorId) {
    const normalizedConnectorId = normalizeOptionalString(connectorId);
    if (!normalizedConnectorId)
        return;
    const prior = readComposioConfig();
    if (prior.authConfigIds[normalizedConnectorId] === undefined)
        return;
    const authConfigIds = { ...prior.authConfigIds };
    delete authConfigIds[normalizedConnectorId];
    writeRawConfig(normalizeComposioConfig({ apiKey: prior.apiKey, authConfigIds }));
}
function readRawConfig() {
    try {
        return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
            return {};
        throw error;
    }
}
function writeRawConfig(config) {
    fs.mkdirSync(path.dirname(configFilePath), { recursive: true, mode: 0o700 });
    const tempPath = `${configFilePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tempPath, configFilePath);
    fs.chmodSync(configFilePath, 0o600);
}
function normalizeComposioConfig(value) {
    const raw = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
    return {
        apiKey: normalizeOptionalString(raw.apiKey) ?? '',
        authConfigIds: normalizeAuthConfigIds(raw.authConfigIds),
    };
}
function normalizeOptionalString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
function normalizeAuthConfigIds(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return {};
    const next = {};
    for (const [connectorId, authConfigId] of Object.entries(value)) {
        const normalizedConnectorId = normalizeOptionalString(connectorId);
        const normalizedAuthConfigId = normalizeOptionalString(authConfigId);
        if (normalizedConnectorId && normalizedAuthConfigId)
            next[normalizedConnectorId] = normalizedAuthConfigId;
    }
    return next;
}
//# sourceMappingURL=composio-config.js.map