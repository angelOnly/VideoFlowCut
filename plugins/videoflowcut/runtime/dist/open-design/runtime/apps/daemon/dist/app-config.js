// Daemon-backed app preferences (onboarding state, agent/skill/DS selection).
//
// The web frontend pushes preferences here via PUT /api/app-config; the
// daemon persists them to <dataDir>/app-config.json (where dataDir defaults
// to <projectRoot>/.od but follows OD_DATA_DIR when set, keeping test and
// multi-namespace runs isolated). This survives browser storage resets and
// origin changes so onboarding and agent selection don't reappear unexpectedly.
//
// `agentCliEnv` is intentionally limited by allowlist below. It is the
// explicit low-level launch environment for Local CLI runs, separate from
// provider BYOK. API-key entries here configure the underlying CLI itself;
// BASE_URL is optional and, when omitted, the CLI uses its default endpoint.
// `agentCliEnvIntent` records when API-key entries were saved under that new
// CLI-override contract. Older builds labeled the same fields as proxy-only,
// so legacy standalone keys without a base URL are dropped unless this marker
// or a matching base URL proves that the user intended to activate them.
// These values are local-only and should not be logged or returned outside
// this machine.
import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { expandHomePrefix } from './home-expansion.js';
import { readInstallationFile, readInstallationFileSync, resolveInstallationDir, writeInstallationFile, } from './installation.js';
function intFromEnv(key, fallback) {
    const raw = process.env[key];
    if (typeof raw !== 'string' || raw.trim().length === 0)
        return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0)
        return fallback;
    return Math.floor(parsed);
}
function nullableIntFromEnv(key) {
    const raw = process.env[key];
    if (typeof raw !== 'string' || raw.trim().length === 0)
        return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0)
        return null;
    return Math.floor(parsed);
}
export function readPluginEnvKnobs() {
    return {
        maxDevloopIterations: intFromEnv('OD_MAX_DEVLOOP_ITERATIONS', 10),
        snapshotUnreferencedTtlDays: intFromEnv('OD_SNAPSHOT_UNREFERENCED_TTL_DAYS', 30),
        snapshotRetentionDays: nullableIntFromEnv('OD_SNAPSHOT_RETENTION_DAYS'),
        snapshotGcIntervalMs: intFromEnv('OD_SNAPSHOT_GC_INTERVAL_MS', 6 * 60 * 60 * 1000),
    };
}
// Cap on how many recent working directories we remember. Keeps the picker's
// "Recent" submenu short and the config file bounded.
export const RECENT_LINKED_DIRS_MAX = 5;
const ALLOWED_KEYS = new Set([
    'onboardingCompleted',
    'agentId',
    'agentModels',
    'agentCliEnv',
    'agentCliEnvIntent',
    'skillId',
    'designSystemId',
    'disabledSkills',
    'disabledDesignSystems',
    'installationId',
    'telemetry',
    'privacyDecisionAt',
    'allowSilentUpdates',
    'orbit',
    'customInstructions',
    'projectLocations',
    'defaultProjectLocationId',
    'odNextStrategyMode',
    'recentLinkedDirs',
]);
function configFile(dataDir) {
    return path.join(dataDir, 'app-config.json');
}
export function appConfigDir(projectRoot, env = process.env) {
    const raw = env.OD_DATA_DIR;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        return path.join(projectRoot, '.od');
    }
    const expanded = expandHomePrefix(raw.trim());
    return path.isAbsolute(expanded) ? expanded : path.resolve(projectRoot, expanded);
}
const AGENT_MODEL_KEYS = new Set([
    'model',
    'reasoning',
    'serviceTier',
]);
const RETIRED_AGENT_IDS = new Set(['gemini']);
const TELEMETRY_KEYS = new Set([
    'metrics',
    'content',
    'artifactManifest',
]);
function validateTelemetry(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const result = Object.create(null);
    for (const [k, v] of Object.entries(raw)) {
        if (k === '__proto__' || k === 'constructor')
            continue;
        if (!TELEMETRY_KEYS.has(k))
            continue;
        if (typeof v === 'boolean')
            result[k] = v;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
const AGENT_CLI_ENV_KEYS = new Map([
    ['amr', new Set([
            'VELA_BIN',
            'VELA_API_URL',
            'VELA_LINK_URL',
            'VELA_RUNTIME_KEY',
            'VELA_OPENCODE_BIN',
            'OPEN_DESIGN_AMR_PROFILE',
            'OPENCODE_TEST_HOME',
        ])],
    ['aider', new Set(['AIDER_BIN'])],
    ['claude', new Set(['CLAUDE_CONFIG_DIR', 'CLAUDE_BIN', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'MMD_MODEL_ROUTES_FILE'])],
    ['codex', new Set(['CODEX_HOME', 'CODEX_BIN', 'OPENAI_BASE_URL', 'CODEX_API_KEY', 'OPENAI_API_KEY'])],
    ['copilot', new Set(['COPILOT_BIN'])],
    ['cursor-agent', new Set(['CURSOR_AGENT_BIN'])],
    ['deepseek', new Set(['DEEPSEEK_BIN'])],
    ['devin', new Set(['DEVIN_BIN'])],
    ['mimo', new Set(['MIMO_BIN'])],
    ['hermes', new Set(['HERMES_BIN'])],
    ['kimi', new Set(['KIMI_BIN'])],
    ['kiro', new Set(['KIRO_BIN'])],
    ['kilo', new Set(['KILO_BIN'])],
    ['opencode', new Set(['OPENCODE_BIN'])],
    // PI_CODING_AGENT_DIR is pi's own config-directory override (default
    // `~/.pi/agent`), the same contract CLAUDE_CONFIG_DIR and CODEX_HOME carry
    // for their CLIs. Without it here, a user isolating pi's config had the key
    // dropped on every save and no way to keep it but a wrapper script that sets
    // the variable and is pointed at by PI_BIN (issue #8093).
    ['pi', new Set(['PI_BIN', 'PI_CODING_AGENT_DIR'])],
    ['qoder', new Set(['QODER_BIN'])],
    ['qwen', new Set(['QWEN_BIN'])],
    ['trae-cli', new Set(['TRAE_CLI_BIN'])],
    ['vibe', new Set(['VIBE_BIN'])],
]);
const AGENT_CLI_AUTH_ENV_KEYS = new Map([
    ['claude', {
            auth: new Set(['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']),
            baseUrl: new Set(['ANTHROPIC_BASE_URL']),
        }],
    ['codex', {
            auth: new Set(['CODEX_API_KEY', 'OPENAI_API_KEY']),
            baseUrl: new Set(['OPENAI_BASE_URL']),
        }],
]);
function isValidAgentModelEntry(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        return false;
    const obj = v;
    for (const k of Object.keys(obj)) {
        if (!AGENT_MODEL_KEYS.has(k))
            return false;
        if (obj[k] !== undefined && typeof obj[k] !== 'string')
            return false;
    }
    return true;
}
function validateAgentModels(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const result = Object.create(null);
    for (const [k, v] of Object.entries(raw)) {
        if (k === '__proto__' || k === 'constructor')
            continue;
        if (isValidAgentModelEntry(v)) {
            result[k] = v;
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
export function validateAgentCliEnv(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const result = Object.create(null);
    for (const [agentId, value] of Object.entries(raw)) {
        if (agentId === '__proto__' || agentId === 'constructor')
            continue;
        const allowed = AGENT_CLI_ENV_KEYS.get(agentId);
        if (!allowed || typeof value !== 'object' || value === null || Array.isArray(value)) {
            continue;
        }
        const env = Object.create(null);
        for (const [envKey, envValue] of Object.entries(value)) {
            if (!allowed.has(envKey))
                continue;
            if (typeof envValue !== 'string')
                continue;
            const trimmed = envValue.trim();
            if (!trimmed)
                continue;
            env[envKey] = trimmed;
        }
        if (Object.keys(env).length > 0)
            result[agentId] = env;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
export function validateAgentCliEnvIntent(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const result = Object.create(null);
    for (const [agentId, value] of Object.entries(raw)) {
        if (agentId === '__proto__' || agentId === 'constructor')
            continue;
        if (!AGENT_CLI_ENV_KEYS.has(agentId))
            continue;
        if (!value || typeof value !== 'object' || Array.isArray(value))
            continue;
        const obj = value;
        if (obj.apiKeyOverride === true) {
            result[agentId] = { apiKeyOverride: true };
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
function isValidOrbitTime(time) {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match)
        return false;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}
function validateOrbit(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (typeof raw !== 'object' || Array.isArray(raw))
        return undefined;
    const obj = raw;
    const enabled = typeof obj.enabled === 'boolean' ? obj.enabled : false;
    const time = typeof obj.time === 'string' && isValidOrbitTime(obj.time)
        ? obj.time
        : '08:00';
    const orbit = { enabled, time };
    if (Object.hasOwn(obj, 'templateSkillId')) {
        orbit.templateSkillId = typeof obj.templateSkillId === 'string' && obj.templateSkillId.trim()
            ? obj.templateSkillId.trim()
            : null;
    }
    if (Object.hasOwn(obj, 'workspaceScope')) {
        const rawScope = obj.workspaceScope;
        if (rawScope && typeof rawScope === 'object' && !Array.isArray(rawScope)) {
            const workspaceId = typeof rawScope.workspaceId === 'string'
                ? rawScope.workspaceId.trim()
                : '';
            const workspaceMemberId = typeof rawScope.workspaceMemberId === 'string'
                ? rawScope.workspaceMemberId.trim()
                : '';
            orbit.workspaceScope =
                workspaceId && workspaceMemberId ? { workspaceId, workspaceMemberId } : null;
        }
        else {
            orbit.workspaceScope = null;
        }
    }
    return orbit;
}
function normalizeLocationId(raw, fallback) {
    const trimmed = raw.trim();
    if (/^[A-Za-z0-9._-]{1,128}$/.test(trimmed) && trimmed !== 'default') {
        return trimmed;
    }
    return fallback;
}
function autoProjectLocationId(pathKey) {
    return `loc_${createHash('sha256').update(pathKey).digest('base64url').slice(0, 16)}`;
}
function validateProjectLocations(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    if (!Array.isArray(raw))
        return undefined;
    const result = [];
    const seenIds = new Set();
    const seenPaths = new Set();
    for (const item of raw) {
        if (!item || typeof item !== 'object' || Array.isArray(item))
            continue;
        const obj = item;
        if (typeof obj.path !== 'string')
            continue;
        const expanded = expandHomePrefix(obj.path.trim());
        if (!expanded || !path.isAbsolute(expanded))
            continue;
        const normalizedPath = path.normalize(expanded);
        const pathKey = process.platform === 'win32' ? normalizedPath.toLowerCase() : normalizedPath;
        if (seenPaths.has(pathKey))
            continue;
        const id = normalizeLocationId(typeof obj.id === 'string' ? obj.id : '', autoProjectLocationId(pathKey));
        if (seenIds.has(id))
            continue;
        const rawName = typeof obj.name === 'string' ? obj.name.trim() : '';
        result.push({ id, name: rawName || path.basename(normalizedPath) || normalizedPath, path: normalizedPath });
        seenIds.add(id);
        seenPaths.add(pathKey);
    }
    return result;
}
export function agentCliEnvForAgent(prefs, agentId) {
    if (!prefs || typeof agentId !== 'string')
        return {};
    const env = prefs[agentId === 'byok-opencode' ? 'opencode' : agentId];
    if (!env || typeof env !== 'object' || Array.isArray(env))
        return {};
    return { ...env };
}
function normalizeAgentCliEnvPrefs(prefs) {
    const agentCliEnv = prefs.agentCliEnv;
    if (!agentCliEnv) {
        if (!prefs.agentCliEnvIntent)
            return prefs;
        const next = { ...prefs };
        delete next.agentCliEnvIntent;
        return next;
    }
    let nextAgentCliEnv = agentCliEnv;
    let changed = false;
    for (const [agentId, keys] of AGENT_CLI_AUTH_ENV_KEYS) {
        const env = nextAgentCliEnv[agentId];
        if (!env)
            continue;
        const hasBaseUrl = Object.keys(env).some((key) => keys.baseUrl.has(key));
        const hasExplicitApiKeyIntent = prefs.agentCliEnvIntent?.[agentId]?.apiKeyOverride === true;
        if (hasBaseUrl || hasExplicitApiKeyIntent)
            continue;
        let nextEnv = env;
        for (const authKey of keys.auth) {
            if (!Object.prototype.hasOwnProperty.call(nextEnv, authKey))
                continue;
            if (nextEnv === env)
                nextEnv = { ...env };
            delete nextEnv[authKey];
            changed = true;
        }
        if (nextEnv === env)
            continue;
        nextAgentCliEnv = { ...nextAgentCliEnv };
        if (Object.keys(nextEnv).length > 0) {
            nextAgentCliEnv[agentId] = nextEnv;
        }
        else {
            delete nextAgentCliEnv[agentId];
        }
    }
    let nextAgentCliEnvIntent = prefs.agentCliEnvIntent;
    if (nextAgentCliEnvIntent) {
        for (const agentId of Object.keys(nextAgentCliEnvIntent)) {
            if (nextAgentCliEnv[agentId])
                continue;
            nextAgentCliEnvIntent = { ...nextAgentCliEnvIntent };
            delete nextAgentCliEnvIntent[agentId];
            changed = true;
        }
    }
    const normalizedAgentCliEnv = Object.keys(nextAgentCliEnv).length > 0 ? nextAgentCliEnv : undefined;
    const normalizedIntent = nextAgentCliEnvIntent && Object.keys(nextAgentCliEnvIntent).length > 0
        ? nextAgentCliEnvIntent
        : undefined;
    if (!changed &&
        normalizedAgentCliEnv === prefs.agentCliEnv &&
        normalizedIntent === prefs.agentCliEnvIntent) {
        return prefs;
    }
    const next = { ...prefs };
    if (normalizedAgentCliEnv) {
        next.agentCliEnv = normalizedAgentCliEnv;
    }
    else {
        delete next.agentCliEnv;
    }
    if (normalizedIntent) {
        next.agentCliEnvIntent = normalizedIntent;
    }
    else {
        delete next.agentCliEnvIntent;
    }
    return next;
}
function normalizeRetiredAgentPrefs(prefs) {
    let changed = false;
    let next = prefs;
    if (typeof next.agentId === 'string' && RETIRED_AGENT_IDS.has(next.agentId)) {
        next = { ...next };
        delete next.agentId;
        changed = true;
    }
    if (next.agentModels) {
        let nextAgentModels = next.agentModels;
        for (const agentId of RETIRED_AGENT_IDS) {
            if (!Object.prototype.hasOwnProperty.call(nextAgentModels, agentId))
                continue;
            if (nextAgentModels === next.agentModels)
                nextAgentModels = { ...next.agentModels };
            delete nextAgentModels[agentId];
            changed = true;
        }
        const normalizedAgentModels = Object.keys(nextAgentModels).length > 0 ? nextAgentModels : undefined;
        if (normalizedAgentModels !== next.agentModels) {
            next = next === prefs ? { ...next } : next;
            if (normalizedAgentModels) {
                next.agentModels = normalizedAgentModels;
            }
            else {
                delete next.agentModels;
            }
        }
    }
    return changed ? next : prefs;
}
function inferAgentCliEnvIntentForExplicitEnvWrite(prefs) {
    if (!prefs.agentCliEnv)
        return prefs;
    let nextAgentCliEnvIntent = prefs.agentCliEnvIntent;
    let changed = false;
    for (const [agentId, keys] of AGENT_CLI_AUTH_ENV_KEYS) {
        const env = prefs.agentCliEnv[agentId];
        if (!env)
            continue;
        const hasBaseUrl = Object.keys(env).some((key) => keys.baseUrl.has(key));
        if (hasBaseUrl)
            continue;
        const hasAuthKey = Object.keys(env).some((key) => keys.auth.has(key));
        if (!hasAuthKey)
            continue;
        if (nextAgentCliEnvIntent?.[agentId]?.apiKeyOverride === true)
            continue;
        nextAgentCliEnvIntent = {
            ...(nextAgentCliEnvIntent ?? {}),
            [agentId]: { apiKeyOverride: true },
        };
        changed = true;
    }
    if (!changed || !nextAgentCliEnvIntent)
        return prefs;
    return { ...prefs, agentCliEnvIntent: nextAgentCliEnvIntent };
}
function applyConfigValue(target, key, value) {
    if (key === 'onboardingCompleted') {
        if (typeof value === 'boolean')
            target[key] = value;
        return;
    }
    if (key === 'agentId' || key === 'skillId' || key === 'designSystemId') {
        if (typeof value === 'string' || value === null)
            target[key] = value;
        return;
    }
    if (key === 'agentModels') {
        const validated = validateAgentModels(value);
        if (validated !== undefined) {
            target[key] = validated;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'agentCliEnv') {
        const validated = validateAgentCliEnv(value);
        if (validated !== undefined) {
            target[key] = validated;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'agentCliEnvIntent') {
        const validated = validateAgentCliEnvIntent(value);
        if (validated !== undefined) {
            target[key] = validated;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'disabledSkills' || key === 'disabledDesignSystems') {
        if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
            target[key] = value;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'installationId') {
        if (typeof value === 'string' || value === null)
            target[key] = value;
        return;
    }
    if (key === 'telemetry') {
        const validated = validateTelemetry(value);
        if (validated !== undefined) {
            target[key] = validated;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'privacyDecisionAt') {
        if (value === null ||
            (typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
            target[key] = value;
        }
        else {
            delete target[key];
        }
        return;
    }
    if (key === 'allowSilentUpdates') {
        if (typeof value === 'boolean') {
            target[key] = value;
        }
        else {
            delete target[key];
        }
        return;
    }
    if (key === 'orbit') {
        const validated = validateOrbit(value);
        if (validated !== undefined) {
            const existingOrbit = target[key];
            if (value
                && typeof value === 'object'
                && !Array.isArray(value)
                && !Object.hasOwn(value, 'workspaceScope')
                && existingOrbit?.workspaceScope) {
                // Older clients do not know this field. Editing Orbit time/enabled
                // must not silently convert an already-scoped unattended automation
                // back into an ambient/unbound one. An explicit null still clears it.
                validated.workspaceScope = existingOrbit.workspaceScope;
            }
            target[key] = validated;
        }
        else {
            delete target[key];
        }
    }
    if (key === 'customInstructions') {
        if (typeof value === 'string') {
            target[key] = value.slice(0, 5000);
        }
        else if (value === null) {
            target[key] = value;
        }
        return;
    }
    if (key === 'projectLocations') {
        const validated = validateProjectLocations(value);
        if (validated !== undefined) {
            target[key] = validated;
        }
        else {
            delete target[key];
        }
        return;
    }
    if (key === 'defaultProjectLocationId') {
        if (typeof value === 'string') {
            target[key] = normalizeLocationId(value, 'default');
        }
        else if (value === null) {
            target[key] = null;
        }
        else {
            delete target[key];
        }
        return;
    }
    if (key === 'odNextStrategyMode') {
        // Reached with a non-mode value only on the READ path — a truncated file, a
        // hand edit, a value written by some other version. It must not take the
        // daemon down, and it must not read as unconfigured either: see
        // OD_NEXT_MODE_WHEN_CONFIG_UNREADABLE. `null` is different and stays a
        // delete, because clearing the key IS the deliberate way back to the
        // default. The WRITE path never reaches here with a bad value —
        // `assertWritableControlValues` refuses it first.
        if (value === 'off' || value === 'observe' || value === 'active') {
            target[key] = value;
        }
        else if (value === null || value === undefined) {
            delete target[key];
        }
        else {
            target[key] = OD_NEXT_MODE_WHEN_CONFIG_UNREADABLE;
        }
        return;
    }
    if (key === 'recentLinkedDirs') {
        if (Array.isArray(value)) {
            // Keep non-empty strings, trim, de-dupe preserving most-recent-first
            // order, and cap the list. Path existence/safety is enforced later by
            // validateLinkedDirs when the dir is actually attached to a project, so
            // a folder that was since deleted simply drops out at use time rather
            // than corrupting the whole config write here.
            const seen = new Set();
            const cleaned = [];
            for (const entry of value) {
                if (typeof entry !== 'string')
                    continue;
                const trimmed = entry.trim();
                if (!trimmed || seen.has(trimmed))
                    continue;
                seen.add(trimmed);
                cleaned.push(trimmed);
                if (cleaned.length >= RECENT_LINKED_DIRS_MAX)
                    break;
            }
            target[key] = cleaned;
        }
        else {
            delete target[key];
        }
        return;
    }
}
/** Legacy field normalization retained for config compatibility.
 * OD Next rollout ignores this retired Labs preference, including normalized off.
 * Operator environment controls remain the supported rollout override.
 */
const OD_NEXT_MODE_WHEN_CONFIG_UNREADABLE = 'off';
function filterAllowedKeys(obj) {
    const result = Object.create(null);
    for (const key of Object.keys(obj)) {
        if (ALLOWED_KEYS.has(key)) {
            applyConfigValue(result, key, obj[key]);
        }
    }
    return normalizeRetiredAgentPrefs(normalizeAgentCliEnvPrefs(result));
}
// Fill in telemetry defaults when the saved config has no `telemetry`
// field at all (fresh install, pre-disclosure). `metrics` / `content`
// default to true so onboarding-funnel events emit from the first
// render — without these defaults the gate at
// `analytics.ts` (`if (cfg.telemetry?.metrics !== true) return`)
// dropped every event a user fired before the post-onboarding
// disclosure modal had a chance to set them. An EXPLICIT `false`
// the user previously saved is preserved (only `undefined` gets
// the new default), so opt-out users stay opted out across the
// 0.7.x → 0.8.0 upgrade.
function applyTelemetryDefaults(prefs) {
    if (prefs.telemetry === undefined) {
        return {
            ...prefs,
            telemetry: { metrics: true, content: true },
        };
    }
    return prefs;
}
/** Unlike general config hydration, consent must distinguish a fresh install
 * from damaged/unreadable saved preferences. Never recover a lost opt-out by
 * silently defaulting a corrupt file to an empty config. */
export async function readMetricsConsent(dataDir) {
    try {
        const raw = JSON.parse(await readFile(configFile(dataDir), 'utf8'));
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return { status: 'unavailable', metrics: false };
        }
        const telemetry = raw.telemetry;
        if (telemetry !== undefined) {
            if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) {
                return { status: 'unavailable', metrics: false };
            }
            const metrics = telemetry.metrics;
            if (typeof metrics !== 'boolean')
                return { status: 'unavailable', metrics: false };
            return { status: 'available', metrics };
        }
        return { status: 'available', metrics: applyTelemetryDefaults({}).telemetry?.metrics === true };
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return { status: 'missing', metrics: applyTelemetryDefaults({}).telemetry?.metrics === true };
        }
        return { status: 'unavailable', metrics: false };
    }
}
export async function readAppConfig(dataDir) {
    const base = await readAppConfigFileOnly(dataDir);
    // Channel-root installation file is the new authoritative source for the
    // identity bits that must survive a namespace-scoped data-dir wipe. It
    // lives outside `<namespace>/data/` so a reinstall of the same channel
    // (which might churn the namespace token, or eventually clear per-
    // namespace data) keeps the same id.
    //
    // Migration: when this daemon is the first to boot with installation.json
    // support and finds an existing installationId in the legacy app-config
    // path, mirror it forward exactly once so PostHog continues to see the
    // same person across the 0.7.x → 0.8.0 upgrade. Without this mirror, the
    // user count would double when 0.8.0 ships.
    const installationDir = resolveInstallationDir(dataDir);
    const installation = await readInstallationFile(installationDir);
    if (typeof installation.installationId === 'string' && installation.installationId.length > 0) {
        return applyTelemetryDefaults({ ...base, installationId: installation.installationId });
    }
    if (typeof base.installationId === 'string' && base.installationId.length > 0) {
        // Best-effort migration. A write failure here doesn't break the read —
        // we still serve the legacy id. The next write through writeAppConfig
        // will retry the mirror.
        try {
            await writeInstallationFile(installationDir, { installationId: base.installationId });
        }
        catch {
            // swallow — observability beats correctness on this path
        }
    }
    return applyTelemetryDefaults(base);
}
// Synchronous mirror of readAppConfig for callers that cannot await — e.g.
// building the spawn env for the vela CLI inside the synchronous
// spawnEnvForAgent. It reuses the exact same parsing, validation and telemetry
// defaulting as the async path, so the consent decision and installationId can
// never drift from what the rest of the daemon (and the web analytics config)
// sees. The only intentional difference is that it skips the best-effort
// legacy→channel-root migration *write*, which is a side effect rather than
// part of the read result.
export function readAppConfigSync(dataDir) {
    const base = readAppConfigFileOnlySync(dataDir);
    const installation = readInstallationFileSync(resolveInstallationDir(dataDir));
    if (typeof installation.installationId === 'string' &&
        installation.installationId.length > 0) {
        return applyTelemetryDefaults({
            ...base,
            installationId: installation.installationId,
        });
    }
    return applyTelemetryDefaults(base);
}
function readAppConfigFileOnlySync(dataDir) {
    try {
        const parsed = JSON.parse(readFileSync(configFile(dataDir), 'utf8'));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return filterAllowedKeys(parsed);
        }
        return {};
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT')
            return {};
        if (e.name === 'SyntaxError')
            return {};
        throw err;
    }
}
async function readAppConfigFileOnly(dataDir) {
    try {
        const raw = await readFile(configFile(dataDir), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return filterAllowedKeys(parsed);
        }
        console.warn('[app-config] Invalid shape in config file, returning empty');
        return {};
    }
    catch (err) {
        const e = err;
        if (e.code === 'ENOENT')
            return {};
        if (e.name === 'SyntaxError') {
            console.error('[app-config] Corrupted JSON, returning empty:', e.message);
            return {};
        }
        throw err;
    }
}
// Serialize concurrent writes to the same dataDir so the read-modify-write
// cycle doesn't lose updates when two PUT requests overlap.
const writeLocks = new Map();
const configObservers = new Map();
export function observeAppConfig(dataDir, observer) {
    const observers = configObservers.get(dataDir) ?? new Set();
    observers.add(observer);
    configObservers.set(dataDir, observers);
    return () => { observers.delete(observer); if (!observers.size)
        configObservers.delete(dataDir); };
}
/** Automatic content upload must fail closed on corrupt preferences instead of applying defaults. */
export function automaticDiagnosticsConsent(dataDir) {
    try {
        const raw = JSON.parse(readFileSync(configFile(dataDir), 'utf8'));
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            return false;
        const telemetry = raw.telemetry;
        if (telemetry !== undefined && (telemetry === null || typeof telemetry !== 'object' || Array.isArray(telemetry)))
            return false;
        if (telemetry !== undefined) {
            const value = telemetry;
            return value.metrics === true && value.content === true;
        }
        const prefs = applyTelemetryDefaults(filterAllowedKeys(raw));
        return prefs.telemetry?.metrics === true && prefs.telemetry?.content === true;
    }
    catch (error) {
        // A new installation has the same defaults as the existing telemetry settings.
        return error.code === 'ENOENT';
    }
}
export async function writeAppConfig(dataDir, partial) {
    const prev = writeLocks.get(dataDir) ?? Promise.resolve();
    const task = prev.catch(() => { }).then(() => doWrite(dataDir, partial));
    writeLocks.set(dataDir, task);
    try {
        return await task;
    }
    finally {
        if (writeLocks.get(dataDir) === task)
            writeLocks.delete(dataDir);
    }
}
/** Thrown by `writeAppConfig` when a control key is handed a value it cannot mean. */
export class InvalidAppConfigValueError extends Error {
    key;
    code = 'INVALID_APP_CONFIG_VALUE';
    constructor(key, message) {
        super(message);
        this.key = key;
        this.name = 'InvalidAppConfigValueError';
    }
}
/** Keep the legacy stored-value contract for older callers. The current rollout
 * ignores this user preference; only an engineering environment override can
 * change the new active default. Invalid legacy writes still fail explicitly.
 */
function assertWritableControlValues(partial) {
    if (!Object.prototype.hasOwnProperty.call(partial, 'odNextStrategyMode'))
        return;
    const value = partial.odNextStrategyMode;
    if (value === null || value === 'off' || value === 'observe' || value === 'active')
        return;
    throw new InvalidAppConfigValueError('odNextStrategyMode', 'odNextStrategyMode must be one of "off", "observe", "active", or null');
}
async function doWrite(dataDir, partial) {
    assertWritableControlValues(partial);
    const existing = await readAppConfig(dataDir);
    const next = { ...existing };
    for (const key of Object.keys(partial)) {
        if (!ALLOWED_KEYS.has(key))
            continue;
        applyConfigValue(next, key, partial[key]);
    }
    const nextWithInferredIntent = Object.prototype.hasOwnProperty.call(partial, 'agentCliEnv')
        ? inferAgentCliEnvIntentForExplicitEnvWrite(next)
        : next;
    const normalizedNext = normalizeAgentCliEnvPrefs(nextWithInferredIntent);
    const normalizedNextWithoutRetiredAgents = normalizeRetiredAgentPrefs(normalizedNext);
    const file = configFile(dataDir);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.' + randomBytes(4).toString('hex') + '.tmp';
    await writeFile(tmp, JSON.stringify(normalizedNextWithoutRetiredAgents, null, 2), 'utf8');
    await rename(tmp, file);
    for (const observer of configObservers.get(dataDir) ?? []) {
        try {
            observer();
        }
        catch { /* preference persistence must not depend on background consumers */ }
    }
    const installationIdWasExplicitlyReset = Object.prototype.hasOwnProperty.call(partial, 'installationId')
        && (partial.installationId == null || (typeof existing.installationId === 'string'
            && typeof normalizedNextWithoutRetiredAgents.installationId === 'string'
            && existing.installationId !== normalizedNextWithoutRetiredAgents.installationId));
    const metricsWereExplicitlyDisabled = isMetricsExplicitlyDisabled(partial.telemetry);
    const shouldClearAttribution = installationIdWasExplicitlyReset || metricsWereExplicitlyDisabled;
    // Mirror the identity bits to the channel-root installation file so they
    // survive a namespace-scoped data-dir wipe. Only fires when the caller
    // explicitly touches installation identity or consent lifecycle state
    // (avoiding noisy writes on every unrelated app-config update). A write
    // failure here doesn't roll back the app-config write — the next read
    // merges them transparently.
    if (Object.prototype.hasOwnProperty.call(partial, 'installationId') || shouldClearAttribution) {
        const id = normalizedNextWithoutRetiredAgents.installationId;
        // Caller explicitly touched installationId — mirror the outcome
        // (including the clear case) to installation.json so a future read
        // doesn't keep serving the old value out of the channel-root file.
        // "Delete my data" relies on this clear path.
        const installPatch = {
            ...(Object.prototype.hasOwnProperty.call(partial, 'installationId')
                ? { installationId: typeof id === 'string' && id.length > 0 ? id : null }
                : {}),
            ...(shouldClearAttribution
                ? {
                    pendingAttribution: null,
                    attributionClaimedAt: null,
                    attributionClaimResultAt: null,
                }
                : {}),
        };
        try {
            await writeInstallationFile(resolveInstallationDir(dataDir), installPatch);
        }
        catch {
            // swallow — install file mirroring is best-effort; the canonical
            // app-config write already succeeded.
        }
    }
    return normalizedNextWithoutRetiredAgents;
}
function isMetricsExplicitlyDisabled(value) {
    return value != null
        && typeof value === 'object'
        && !Array.isArray(value)
        && value.metrics === false;
}
//# sourceMappingURL=app-config.js.map