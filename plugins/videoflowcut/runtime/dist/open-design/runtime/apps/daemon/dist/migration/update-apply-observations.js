import { UPDATE_LIFECYCLE_STAGES, parseUpdateLifecycleObservation } from '@open-design/contracts/analytics';
import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isReleaseChannel, releaseChannelFromVersion, } from '@open-design/release';
import { buildClientTelemetryParams, parseClientMetricEvent, UPDATE_METRIC_STAGES, updateStageMetricSchema } from '@open-design/contracts/analytics';
import { readPosthogConfig } from '../analytics.js';
import { readAppConfig, readMetricsConsent } from '../app-config.js';
const INSTALLER_OBSERVATION_SCHEMA_VERSION = 1;
const INSTALLER_OBSERVATION_KIND = 'installer_apply_observation';
const INSTALLER_OBSERVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function isRecord(value) {
    return typeof value === 'object' && value != null && !Array.isArray(value);
}
function isSafeFlowId(flowId) {
    return (flowId.length > 0 &&
        flowId.length <= 128 &&
        flowId !== '.' &&
        flowId !== '..' &&
        /^[A-Za-z0-9._-]+$/.test(flowId));
}
function isInstallerObservationSummary(value) {
    if (!isRecord(value))
        return false;
    const artifactType = value.artifactType;
    const channel = value.channel;
    const result = value.result;
    return (value.schemaVersion === INSTALLER_OBSERVATION_SCHEMA_VERSION &&
        value.kind === INSTALLER_OBSERVATION_KIND &&
        typeof value.flowId === 'string' &&
        isSafeFlowId(value.flowId) &&
        typeof value.namespace === 'string' &&
        isReleaseChannel(channel) &&
        typeof value.platform === 'string' &&
        typeof value.arch === 'string' &&
        (artifactType === 'dmg' || artifactType === 'installer' || artifactType === 'payload') &&
        typeof value.fromVersion === 'string' &&
        typeof value.toVersion === 'string' &&
        typeof value.attemptedAt === 'string' &&
        typeof value.updatedAt === 'string' &&
        (result === 'pending' || result === 'success' || result === 'not_applied' || result === 'unknown') &&
        typeof value.reason === 'string');
}
export function installerObservationRoot(dataRoot) {
    return path.join(dataRoot, 'observations', 'installer');
}
function summaryPath(root, flowId) {
    if (!isSafeFlowId(flowId))
        throw new Error(`unsafe installer observation flow_id: ${flowId}`);
    return path.join(root, flowId, 'summary.json');
}
async function readSummary(filePath) {
    try {
        const parsed = JSON.parse(await readFile(filePath, 'utf8'));
        return isInstallerObservationSummary(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
async function writeSummary(filePath, summary) {
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    await rename(tmpPath, filePath);
}
export function normalizeUpdateObservationChannel(version, explicit) {
    if (explicit != null && explicit.startsWith('beta'))
        return 'beta';
    if (explicit != null && explicit.startsWith('preview'))
        return 'preview';
    if (explicit != null && explicit.startsWith('prerelease'))
        return 'prerelease';
    if (isReleaseChannel(explicit))
        return explicit;
    const cleaned = version.trim().replace(/^v/i, '');
    const prerelease = cleaned.split('-', 2)[1] ?? '';
    const channel = releaseChannelFromVersion(version);
    if (channel != null)
        return channel;
    if (prerelease.length > 0 && /\.[0-9]+$/.test(prerelease))
        return 'beta';
    return 'stable';
}
export function elapsedBucket(elapsedMs) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
        return 'unknown';
    if (elapsedMs < 5 * 60 * 1000)
        return 'lt_5m';
    if (elapsedMs < 60 * 60 * 1000)
        return '5m_1h';
    if (elapsedMs < 6 * 60 * 60 * 1000)
        return '1h_6h';
    if (elapsedMs < 24 * 60 * 60 * 1000)
        return '6h_24h';
    if (elapsedMs < INSTALLER_OBSERVATION_TTL_MS)
        return '1d_7d';
    return 'gt_7d';
}
export function classifyInstallerObservation(summary, options) {
    const attemptedAtMs = Date.parse(summary.attemptedAt);
    const elapsedMs = Number.isFinite(attemptedAtMs) ? options.now.getTime() - attemptedAtMs : Number.NaN;
    const bucket = elapsedBucket(elapsedMs);
    if (summary.namespace !== options.namespace || summary.channel !== options.currentChannel) {
        return { elapsedBucket: bucket, result: 'unknown', reason: 'identity_mismatch' };
    }
    if (options.currentVersion === summary.toVersion) {
        return { elapsedBucket: bucket, result: 'success', reason: 'app_version_matches' };
    }
    if (options.currentVersion === summary.fromVersion) {
        return { elapsedBucket: bucket, result: 'not_applied', reason: 'app_version_unchanged' };
    }
    if (!Number.isFinite(elapsedMs) || elapsedMs >= (options.ttlMs ?? INSTALLER_OBSERVATION_TTL_MS)) {
        return { elapsedBucket: bucket, result: 'unknown', reason: 'expired' };
    }
    return { elapsedBucket: bucket, result: 'unknown', reason: 'identity_mismatch' };
}
function eventProperties(summary, classification) {
    const props = {
        flow_id: summary.flowId,
        channel: summary.channel,
        namespace: summary.namespace,
        platform: summary.platform,
        arch: summary.arch,
        artifact_type: summary.artifactType,
        from_version: summary.fromVersion,
        to_version: summary.toVersion,
        result: classification.result,
        reason: classification.reason,
        elapsed_bucket: classification.elapsedBucket,
    };
    return props;
}
function deliveryForConfig(appConfig, env, updatedAt) {
    if (appConfig.telemetry?.metrics !== true) {
        return { delivery: { eventName: 'update_apply_observed', status: 'skipped_no_consent', updatedAt } };
    }
    if (readPosthogConfig(env) == null) {
        return { delivery: { eventName: 'update_apply_observed', status: 'skipped_analytics_disabled', updatedAt } };
    }
    const deviceId = typeof appConfig.installationId === 'string' && appConfig.installationId.length > 0
        ? appConfig.installationId
        : null;
    if (deviceId == null) {
        return { delivery: { eventName: 'update_apply_observed', status: 'skipped_missing_identity', updatedAt } };
    }
    return {
        context: {
            deviceId,
            sessionId: deviceId,
            clientType: 'desktop',
            locale: 'en',
            requestId: null,
        },
        delivery: { eventName: 'update_apply_observed', status: 'submitted', updatedAt },
    };
}
export async function observePendingInstallerApplyAttempts(options) {
    const now = options.now?.() ?? new Date();
    const observedAt = now.toISOString();
    const root = installerObservationRoot(options.dataRoot);
    let entries;
    try {
        entries = await readdir(root, { withFileTypes: true });
    }
    catch {
        return { observed: 0 };
    }
    const summaries = [];
    for (const entry of entries) {
        if (!entry.isDirectory() || !isSafeFlowId(entry.name))
            continue;
        const filePath = summaryPath(root, entry.name);
        const summary = await readSummary(filePath);
        if (summary == null || summary.result !== 'pending' || summary.delivery != null)
            continue;
        if (summary.flowId !== entry.name)
            continue;
        summaries.push({ filePath, summary });
    }
    if (summaries.length === 0)
        return { observed: 0 };
    const appConfig = await (options.readConfig ?? readObservationConfig)(options.dataRoot).catch(() => ({}));
    const currentChannel = normalizeUpdateObservationChannel(options.currentVersion, options.currentChannel);
    let observed = 0;
    for (const { filePath, summary } of summaries) {
        const classification = classifyInstallerObservation(summary, {
            currentChannel,
            currentVersion: options.currentVersion,
            namespace: options.namespace,
            now,
        });
        const insertId = `update_apply_observed:${summary.flowId}`;
        const deliveryDecision = deliveryForConfig(appConfig, options.env ?? process.env, observedAt);
        const next = {
            ...summary,
            delivery: {
                ...deliveryDecision.delivery,
                ...(deliveryDecision.delivery.status === 'submitted' ? { insertId } : {}),
            },
            elapsedBucket: classification.elapsedBucket,
            observedAt,
            reason: classification.reason,
            result: classification.result,
            updatedAt: observedAt,
        };
        if (deliveryDecision.context != null && next.delivery?.status === 'submitted') {
            try {
                options.analytics.capture({
                    eventName: 'update_apply_observed',
                    context: deliveryDecision.context,
                    appVersion: options.appVersion,
                    properties: eventProperties(summary, classification),
                    insertId,
                });
            }
            catch (error) {
                options.logger?.warn?.('[open-design updater] failed to submit update apply observation', error);
                next.delivery = { eventName: 'update_apply_observed', status: 'failed', updatedAt: observedAt };
            }
        }
        await writeSummary(filePath, next);
        observed += 1;
    }
    return { observed };
}
/** Replay immutable stage records independently of version-apply classification. */
export async function observeUpdateLifecycleStages(options) {
    const root = installerObservationRoot(options.dataRoot);
    const now = options.now?.() ?? new Date();
    let entries;
    try {
        entries = await readdir(root, { withFileTypes: true });
    }
    catch {
        return { queued: 0 };
    }
    const config = await (options.readConfig ?? readObservationConfig)(options.dataRoot).catch(() => ({}));
    const decision = deliveryForConfig(config, options.env ?? process.env, now.toISOString());
    const channel = normalizeUpdateObservationChannel(options.currentVersion, options.currentChannel);
    let queued = 0;
    for (const entry of entries) {
        if (!entry.isDirectory() || !isSafeFlowId(entry.name))
            continue;
        const summary = await readSummary(summaryPath(root, entry.name));
        if (summary == null || summary.flowId !== entry.name || summary.namespace !== options.namespace || summary.channel !== channel)
            continue;
        const age = now.getTime() - Date.parse(summary.attemptedAt);
        if (!Number.isFinite(age) || age < 0 || age > INSTALLER_OBSERVATION_TTL_MS)
            continue;
        for (const stage of UPDATE_LIFECYCLE_STAGES) {
            const file = path.join(root, entry.name, 'lifecycle', `${stage}.json`);
            const receipt = `${file}.receipt`;
            try {
                const prior = JSON.parse(await readFile(receipt, 'utf8'));
                if (prior.status === 'queued' || String(prior.status).startsWith('skipped_'))
                    continue;
            }
            catch { /* No receipt: retry an unsubmitted stage. */ }
            try {
                const raw = JSON.parse(await readFile(file, 'utf8'));
                const observation = parseUpdateLifecycleObservation(raw);
                const occurredAt = Date.parse(raw.occurred_at);
                if (raw.observation_version !== 1 || raw.flow_id !== summary.flowId || observation?.stage !== stage ||
                    !Number.isFinite(occurredAt) || occurredAt < Date.parse(summary.attemptedAt) || occurredAt > now.getTime())
                    continue;
                let status = decision.delivery.status;
                const insertId = `update_lifecycle_observed:${summary.flowId}:${stage}`;
                if (decision.context != null) {
                    const properties = {
                        ...observation, flow_id: summary.flowId, from_version: summary.fromVersion,
                        to_version: summary.toVersion, channel: summary.channel, platform: summary.platform,
                        arch: summary.arch, occurred_at: new Date(occurredAt).toISOString(), observation_version: 1,
                    };
                    const capture = await options.analytics.capture({
                        eventName: 'update_lifecycle_observed', context: decision.context,
                        appVersion: options.appVersion, properties, insertId,
                    });
                    // Queue acknowledgement is not remote ingestion acknowledgement.
                    if (capture?.status !== 'queued')
                        continue;
                    status = 'queued';
                    queued += 1;
                }
                const temporary = `${receipt}.${process.pid}.tmp`;
                await writeFile(temporary, JSON.stringify({ status, insertId, updatedAt: now.toISOString() }));
                await rename(temporary, receipt);
            }
            catch { /* Offline, malformed, or unavailable observations never fail startup. */ }
        }
    }
    queued += await replayUpdateStageMetrics(options, entries.map(entry => entry.isDirectory() ? entry.name : ""), now);
    return { queued };
}
async function readObservationConfig(dataRoot) {
    if (!(await readMetricsConsent(dataRoot)).metrics)
        return {};
    return await readAppConfig(dataRoot);
}
/** Fixed names only; no arbitrary local properties reach the network. */
let metricScanOffset = 0;
async function replayUpdateStageMetrics(options, entries, now) {
    let queued = 0;
    const root = installerObservationRoot(options.dataRoot);
    const currentChannel = normalizeUpdateObservationChannel(options.currentVersion, options.currentChannel);
    const candidates = entries.filter(isSafeFlowId).sort();
    const batch = Array.from({ length: Math.min(64, candidates.length) }, (_, index) => candidates[(metricScanOffset + index) % candidates.length]);
    metricScanOffset = candidates.length === 0 ? 0 : (metricScanOffset + batch.length) % candidates.length;
    for (const flowId of batch) {
        if (!isSafeFlowId(flowId))
            continue;
        for (const stage of UPDATE_METRIC_STAGES)
            for (const phase of ['started', 'result']) {
                const file = path.join(root, flowId, 'stages', `${stage}-${phase}.json`);
                const receipt = `${file}.receipt`;
                try {
                    try {
                        const prior = JSON.parse(await readFile(receipt, 'utf8'));
                        // Old consent/identity skips are not safety-channel delivery receipts.
                        if (prior.status === 'queued' || prior.status === 'skipped_analytics_disabled')
                            continue;
                    }
                    catch { /* Unacknowledged records may retry with the same ID. */ }
                    const raw = JSON.parse(await readFile(file, 'utf8'));
                    const parsed = updateStageMetricSchema.safeParse(raw);
                    const at = Date.parse(raw.occurred_at);
                    if (!parsed.success || raw.metric_schema_version !== 1 || parsed.data.stage !== stage || parsed.data.flow_id !== flowId ||
                        (parsed.data.result === 'started') !== (phase === 'started') ||
                        raw.namespace !== options.namespace || raw.channel !== currentChannel ||
                        !Number.isFinite(at) || at > now.getTime() || now.getTime() - at > INSTALLER_OBSERVATION_TTL_MS)
                        continue;
                    const insertId = `update_stage:${flowId}:${stage}:${phase}`;
                    let status = 'skipped_analytics_disabled';
                    if (readPosthogConfig(options.env ?? process.env) != null) {
                        const properties = parseClientMetricEvent('client_update_stage_result', {
                            ...parsed.data, metric_schema_version: 1, telemetry_capability: 'supported',
                            ...buildClientTelemetryParams({ ...raw, occurred_at: new Date(at).toISOString() }, { eventId: insertId, deviceId: null,
                                clientType: 'desktop', captureSource: 'desktop/updater', env: 'unknown',
                                appVersion: null, platform: null, arch: null, reportedAt: now.toISOString() }),
                        });
                        if (properties == null)
                            continue;
                        await options.analytics.captureSafety({ eventName: 'client_update_stage_result',
                            appVersion: options.appVersion, properties, insertId });
                        status = 'queued';
                        queued += 1;
                    }
                    const temporary = `${receipt}.${process.pid}.tmp`;
                    await writeFile(temporary, JSON.stringify({ status, insertId, updatedAt: now.toISOString() }));
                    await rename(temporary, receipt);
                }
                catch { /* Telemetry cannot break startup or the periodic scanner. */ }
            }
    }
    return queued;
}
//# sourceMappingURL=update-apply-observations.js.map