import { createHash } from 'node:crypto';
import { NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA, NormalizedAgentObservationV1Schema, } from '@open-design/contracts';
import { buildSafeChildPromptTelemetry, } from '../prompt-telemetry.js';
import { execAgentFile } from './invocation.js';
export const OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION = 'od-opencode-child-evidence/v1';
export const OPENCODE_CHILD_EVIDENCE_CLI_VERSION = '1.18.18';
// The post-run export runs on the Run's close path, so every dimension of it is
// bounded: one child cannot stall the close with a hung CLI, a corrupt session
// cannot exhaust memory through stdout, and a Run that spawned an unbounded
// number of native Tasks cannot turn close into an unbounded fan-out. Exhausting
// any bound degrades to the L1 candidate rather than delaying the Run.
export const OPENCODE_CHILD_EXPORT_TIMEOUT_MS = 10_000;
export const OPENCODE_CHILD_EXPORT_MAX_BYTES = 8 * 1024 * 1024;
export const OPENCODE_CHILD_EXPORT_TOTAL_BUDGET_MS = 20_000;
export const OPENCODE_MAX_RETAINED_CHILD_CANDIDATES = 64;
// Child ids reach `opencode export` as argv. Only an id shaped like a native
// OpenCode session id is forwarded, so a hostile or corrupt stream value can
// never be read as a flag, a path, or a second argument.
const OPENCODE_CHILD_SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u;
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function nonEmptyString(value) {
    return typeof value === 'string' && value.trim() ? value : undefined;
}
function nonNegativeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : undefined;
}
function promptIdentity(value) {
    if (typeof value !== 'string')
        return undefined;
    const safe = buildSafeChildPromptTelemetry([value]);
    return {
        hash: createHash('sha256').update(value, 'utf8').digest('hex'),
        bytes: Buffer.byteLength(value, 'utf8'),
        safePayload: safe.safePayload,
    };
}
function terminalStateFromTaskTool(state) {
    if (state.status === 'completed')
        return 'completed';
    if (state.status !== 'error')
        return undefined;
    const error = typeof state.error === 'string' ? state.error.trim().toLowerCase() : '';
    if (error === 'cancelled' || error === 'canceled' || error === 'task cancelled' || error === 'task canceled') {
        return 'canceled';
    }
    // OpenCode 1.18.18 has no stable native Task timeout terminal shape. Do not
    // relabel a timeout-looking error as either cancellation or failure.
    if (error.includes('timeout') || error.includes('timed out'))
        return undefined;
    return error ? 'failed' : undefined;
}
/**
 * Observe only terminal native Task parts from the root OpenCode JSON stream.
 *
 * The verified OpenCode adapter family filters child-session events out of
 * `run --format json`.
 * The terminal root Task part nevertheless carries a child `sessionId`, a
 * `parentSessionId`, and the root tool call id. The raw Prompt is reduced to a
 * hash and byte count synchronously and is never retained in a fact.
 */
export function createOpenCodeRootTaskEvidenceCollector(input) {
    const now = input.now ?? Date.now;
    const emitted = new Set();
    const knownChildIds = new Set();
    const knownTaskToolCallIds = new Set();
    const retained = [];
    let rootSessionId = input.rootSessionId;
    function observe(value) {
        if (!isRecord(value))
            return;
        if (value.type === 'step_start' &&
            !rootSessionId &&
            typeof value.sessionID === 'string' &&
            value.sessionID.trim()) {
            rootSessionId = value.sessionID;
            return;
        }
        if (value.type !== 'tool_use' || !rootSessionId)
            return;
        if (value.sessionID !== rootSessionId || !isRecord(value.part))
            return;
        const part = value.part;
        if (part.type !== 'tool' || part.tool !== 'task')
            return;
        const toolCallId = nonEmptyString(part.callID);
        const state = isRecord(part.state) ? part.state : undefined;
        if (!toolCallId || !state)
            return;
        const metadata = isRecord(state.metadata) ? state.metadata : undefined;
        const metadataParentSessionId = nonEmptyString(metadata?.parentSessionId);
        const childSessionId = nonEmptyString(metadata?.sessionId);
        if (metadataParentSessionId !== rootSessionId || !childSessionId)
            return;
        knownChildIds.add(childSessionId);
        knownTaskToolCallIds.add(toolCallId);
        const terminal = terminalStateFromTaskTool(state);
        if (!terminal || emitted.has(toolCallId))
            return;
        // A foreground Task promoted to background and an explicitly background
        // Task both return a completed root tool part while the Child is still
        // running. The native metadata is the only reliable discriminator here.
        if (metadata?.background === true)
            return;
        const time = isRecord(state.time) ? state.time : undefined;
        const model = isRecord(metadata?.model) ? metadata.model : undefined;
        const providerId = nonEmptyString(model?.providerID);
        const modelId = nonEmptyString(model?.modelID);
        const taskInput = isRecord(state.input) ? state.input : undefined;
        const prompt = promptIdentity(taskInput?.prompt);
        const startedAtMs = nonNegativeNumber(time?.start);
        const reportedEndedAtMs = nonNegativeNumber(time?.end);
        const endedAtMs = reportedEndedAtMs !== undefined &&
            (startedAtMs === undefined || reportedEndedAtMs >= startedAtMs)
            ? reportedEndedAtMs
            : undefined;
        emitted.add(toolCallId);
        const candidate = {
            adapterVersion: OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION,
            cliVersion: input.cliVersion,
            rootSessionId,
            childSessionId,
            toolCallId,
            state: terminal,
            observedAtMs: now(),
            ...(startedAtMs === undefined ? {} : { startedAtMs }),
            ...(endedAtMs === undefined ? {} : { endedAtMs }),
            ...(prompt
                ? {
                    promptHash: prompt.hash,
                    promptBytes: prompt.bytes,
                    promptSafePayload: prompt.safePayload,
                }
                : {}),
            ...(providerId && modelId ? { model: { providerId, modelId } } : {}),
        };
        // Retained before the callback so a throwing observer still leaves the
        // post-run export path with the candidate it needs.
        if (retained.length < OPENCODE_MAX_RETAINED_CHILD_CANDIDATES)
            retained.push(candidate);
        try {
            input.onCandidate(candidate);
        }
        catch {
            // Evidence is a side channel. Observer failures must not affect the
            // existing main OpenCode parser or Run outcome.
        }
    }
    function coverage(streamComplete) {
        const knownChildCount = knownChildIds.size;
        const missingTerminalCount = [...knownTaskToolCallIds]
            .filter((toolCallId) => !emitted.has(toolCallId)).length;
        if (streamComplete && rootSessionId && missingTerminalCount === 0) {
            return {
                availability: 'complete',
                source: 'opencode_json_event_stream',
                knownChildCount,
                explicitZero: knownChildCount === 0,
                limitations: [],
                diagnosticCounts: [],
            };
        }
        const limitation = !rootSessionId
            ? 'opencode_root_session_unavailable'
            : missingTerminalCount > 0
                ? 'opencode_child_terminal_unobserved'
                : 'opencode_child_stream_incomplete';
        const diagnosticCode = !rootSessionId
            ? 'root_session_unavailable'
            : missingTerminalCount > 0
                ? 'child_terminal_unobserved'
                : 'stream_incomplete';
        return {
            availability: knownChildCount > 0 ? 'partial' : 'unavailable',
            source: 'opencode_json_event_stream',
            knownChildCount,
            explicitZero: false,
            limitations: [limitation],
            diagnosticCounts: [{
                    code: diagnosticCode,
                    count: diagnosticCode === 'child_terminal_unobserved' ? missingTerminalCount : 1,
                }],
        };
    }
    function candidates() {
        return retained;
    }
    return { observe, coverage, candidates };
}
function addUsageValue(values, key, value) {
    const parsed = nonNegativeNumber(value);
    if (parsed !== undefined)
        values[key] = (values[key] ?? 0) + parsed;
}
function childUsageFromSanitizedExport(value, candidate) {
    if (candidate.startedAtMs === undefined || candidate.endedAtMs === undefined)
        return undefined;
    if (!Array.isArray(value.messages))
        return undefined;
    const usage = {};
    for (const message of value.messages) {
        if (!isRecord(message) || !isRecord(message.info) || message.info.role !== 'assistant')
            continue;
        if (message.info.sessionID !== candidate.childSessionId)
            continue;
        const time = isRecord(message.info.time) ? message.info.time : undefined;
        const createdAtMs = nonNegativeNumber(time?.created);
        if (createdAtMs === undefined ||
            createdAtMs < candidate.startedAtMs ||
            createdAtMs > candidate.endedAtMs) {
            continue;
        }
        const tokens = isRecord(message.info.tokens) ? message.info.tokens : undefined;
        if (!tokens)
            continue;
        addUsageValue(usage, 'inputTokens', tokens.input);
        addUsageValue(usage, 'outputTokens', tokens.output);
        addUsageValue(usage, 'thoughtTokens', tokens.reasoning);
        if (isRecord(tokens.cache)) {
            addUsageValue(usage, 'cacheReadTokens', tokens.cache.read);
            addUsageValue(usage, 'cacheWriteTokens', tokens.cache.write);
        }
    }
    return Object.keys(usage).length ? usage : undefined;
}
/**
 * Bind one root Task candidate to one explicitly requested sanitized child
 * export. The caller chooses the child id from the candidate; this function
 * never lists or scans unrelated OpenCode sessions.
 */
export function verifyOpenCodeChildExport(input) {
    if (input.candidate.adapterVersion !== OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION)
        return [];
    if (!isRecord(input.sanitizedExport) || !isRecord(input.sanitizedExport.info))
        return [];
    const info = input.sanitizedExport.info;
    if (info.id !== input.candidate.childSessionId ||
        info.parentID !== input.candidate.rootSessionId) {
        return [];
    }
    const common = {
        ...input.candidate,
        source: 'opencode_root_task_tool_and_sanitized_export',
        limitations: [
            'Child identity requires both root Task metadata and sanitized export parentID.',
            'OpenCode root JSON does not stream child-session events in real time.',
        ],
    };
    const facts = [];
    if (input.candidate.startedAtMs !== undefined) {
        facts.push({
            ...common,
            state: 'started',
            sourceEventType: 'root_task_tool_terminal',
        });
    }
    const usage = childUsageFromSanitizedExport(input.sanitizedExport, input.candidate);
    facts.push({
        ...common,
        state: input.candidate.state,
        sourceEventType: 'sanitized_child_export',
        ...(usage ? { usage } : {}),
    });
    return facts;
}
/**
 * Run the post-run lookup through an injected, exact-id loader. Query failures
 * deliberately degrade to no facts and never escape into the parent Run.
 */
export async function collectOpenCodeChildRuntimeFacts(input) {
    if (input.candidate.adapterVersion !== OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION)
        return [];
    try {
        const sanitizedExport = await input.loadSanitizedExport(input.candidate.childSessionId);
        return verifyOpenCodeChildExport({
            candidate: input.candidate,
            sanitizedExport,
        });
    }
    catch {
        return [];
    }
}
/**
 * Read one child session through `opencode export <id> --sanitize`, the only
 * OpenCode surface that emits a child transcript together with the `parentID`
 * the two-sided verification needs, and with transcript and file bytes already
 * redacted by the CLI itself.
 *
 * `--pure` keeps a user-installed OpenCode plugin from executing inside the
 * evidence path, and `execAgentFile` supplies a neutral working directory so
 * the bun-based CLI cannot drop a lockfile into the user's project (see
 * `invocation.ts`). The env must be the one the Run was spawned with: it
 * carries the `XDG_DATA_HOME` / `HOME` that decide which session store the
 * spawned CLI actually wrote to.
 */
export function createOpenCodeSanitizedExportLoader(input) {
    return async (childSessionId) => {
        if (!OPENCODE_CHILD_SESSION_ID.test(childSessionId)) {
            throw new TypeError(`Unsupported OpenCode child session id: ${childSessionId}`);
        }
        const { stdout } = await execAgentFile(input.launchPath, ['export', childSessionId, '--sanitize', '--pure'], {
            env: input.env,
            timeout: input.timeoutMs ?? OPENCODE_CHILD_EXPORT_TIMEOUT_MS,
            maxBuffer: input.maxBytes ?? OPENCODE_CHILD_EXPORT_MAX_BYTES,
        });
        // `opencode export` writes its progress line to stderr, so stdout is the
        // session document alone.
        return JSON.parse(typeof stdout === 'string' ? stdout : String(stdout));
    };
}
/**
 * Resolve every observed candidate against its own sanitized export.
 *
 * A child whose export is missing, unrelated, or malformed contributes no
 * facts at all, so the caller keeps that child's L1 candidate instead of
 * publishing a half-built lifecycle that would fail the evidence graph on
 * `child_started_missing`. Exports run one at a time under a shared wall-clock
 * budget: this executes on the Run's close path, where added latency is
 * user-visible, and a Run that outruns the budget degrades to L1 rather than
 * holding the close open.
 */
export async function collectOpenCodeChildEvidenceFacts(input) {
    const now = input.now ?? Date.now;
    const deadline = now() + (input.totalBudgetMs ?? OPENCODE_CHILD_EXPORT_TOTAL_BUDGET_MS);
    const requested = new Set();
    const facts = [];
    for (const candidate of input.candidates) {
        if (now() >= deadline)
            break;
        // One child session can back several native Task calls (a resumed Task
        // reuses the same child). Its export is identical, so read it once.
        if (requested.has(candidate.childSessionId))
            continue;
        requested.add(candidate.childSessionId);
        facts.push(...await collectOpenCodeChildRuntimeFacts({
            candidate,
            loadSanitizedExport: input.loadSanitizedExport,
        }));
    }
    return facts;
}
/**
 * Map the root Task terminal candidate when post-run child export is not yet
 * available. This is deliberately L1/partial: it is sufficient to expose the
 * bounded childInjected Prompt, but never substitutes for the two-sided L2
 * parent/child verification used by capability enforcement.
 */
export function adaptOpenCodeTaskCandidateV1(input) {
    const fact = input.candidate;
    const startedAtMs = fact.startedAtMs ?? fact.observedAtMs;
    const endedAtMs = fact.endedAtMs ?? fact.observedAtMs;
    return NormalizedAgentObservationV1Schema.parse({
        schema: NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA,
        identity: {
            observationId: `opencode-child-candidate:${input.runId}:${fact.childSessionId}`,
            taskExecutionId: input.taskExecutionId,
            runId: input.runId,
            taskRunIndex: input.taskRunIndex,
            parentObservationId: input.taskRunObservationId,
            runtimeSessionId: fact.childSessionId,
        },
        kind: 'child_agent',
        stage: input.stage,
        status: fact.state,
        prompt: {
            hostComposed: {
                availability: 'unobservable',
                limitations: ['The daemon did not compose the native OpenCode Child Prompt.'],
            },
            childInjected: fact.promptHash !== undefined && fact.promptBytes !== undefined
                ? {
                    availability: fact.promptSafePayload ? 'exact' : 'partial',
                    source: 'runtime',
                    hash: fact.promptHash,
                    bytes: fact.promptBytes,
                    ...(fact.promptSafePayload ? { safePayload: fact.promptSafePayload } : {}),
                    limitations: fact.promptSafePayload
                        ? ['child_prompt_safe_payload_redacted']
                        : ['child_prompt_hash_only'],
                }
                : {
                    availability: 'unavailable',
                    source: 'unknown',
                    limitations: ['child_prompt_not_observed'],
                },
            agentEffectiveContext: {
                availability: 'unobservable',
                limitations: ['OpenCode does not expose effective Child context in this boundary.'],
            },
        },
        usage: {
            availability: 'unavailable',
            source: 'unknown',
            accountingMode: 'unknown',
            limitations: ['child_usage_requires_sanitized_export'],
        },
        timing: {
            availability: fact.startedAtMs !== undefined && fact.endedAtMs !== undefined
                ? 'complete'
                : 'partial',
            evidence: [{
                    source: 'runtime',
                    clockDomain: 'unix_epoch_ms',
                    startedAtMs,
                    endedAtMs,
                    durationMs: Math.max(0, endedAtMs - startedAtMs),
                }],
            limitations: ['root_task_terminal_boundary_not_child_export'],
        },
        limitations: [
            'opencode_root_task_candidate_only',
            'child_export_required_for_l2_parent_verification',
        ],
        attributes: {
            runtimeAdapterVersion: fact.adapterVersion,
            agentCliVersion: fact.cliVersion,
            nativeTaskToolCallId: fact.toolCallId,
            rootSessionId: fact.rootSessionId,
            evidenceLevel: 'L1',
            ...(fact.model ? { model: fact.model.modelId, provider: fact.model.providerId } : {}),
        },
    });
}
function observationId(runId, childSessionId) {
    return `opencode-child:${runId}:${childSessionId}`;
}
function normalizedUsage(usage) {
    if (!usage) {
        return {
            availability: 'unavailable',
            source: 'unknown',
            accountingMode: 'unknown',
            limitations: ['Sanitized child export did not report independent usage.'],
        };
    }
    const values = {
        ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
        ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
        ...(usage.thoughtTokens === undefined ? {} : { thoughtTokens: usage.thoughtTokens }),
        ...(usage.cacheReadTokens === undefined ? {} : { cacheReadTokens: usage.cacheReadTokens }),
        ...(usage.cacheWriteTokens === undefined ? {} : { cacheWriteTokens: usage.cacheWriteTokens }),
    };
    const valueSources = Object.fromEntries(Object.keys(values).map((key) => [key, 'runtime']));
    const complete = usage.inputTokens !== undefined && usage.outputTokens !== undefined;
    return {
        availability: complete ? 'complete' : 'partial',
        source: 'runtime',
        accountingMode: 'additive',
        values,
        valueSources,
        limitations: complete
            ? []
            : ['Sanitized child export reported only a subset of usage fields.'],
    };
}
/** Convert one verified, provider-shaped fact without consulting any store. */
export function adaptOpenCodeChildRuntimeFactV1(input) {
    const fact = input.fact;
    if (fact.adapterVersion !== OPENCODE_CHILD_EVIDENCE_ADAPTER_VERSION) {
        throw new TypeError(`Unsupported OpenCode child evidence adapter: ${fact.adapterVersion}`);
    }
    const promptObserved = fact.promptHash !== undefined && fact.promptBytes !== undefined;
    const timingEvidence = fact.startedAtMs === undefined
        ? undefined
        : [{
                source: 'runtime',
                clockDomain: 'opencode_unix_epoch_ms',
                startedAtMs: fact.startedAtMs,
                ...(fact.state === 'started' || fact.endedAtMs === undefined
                    ? {}
                    : {
                        endedAtMs: fact.endedAtMs,
                        durationMs: fact.endedAtMs - fact.startedAtMs,
                    }),
            }];
    const observation = {
        schema: NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA,
        identity: {
            observationId: observationId(input.runId, fact.childSessionId),
            taskExecutionId: input.taskExecutionId,
            runId: input.runId,
            taskRunIndex: input.taskRunIndex,
            parentObservationId: input.taskRunObservationId,
            runtimeSessionId: fact.childSessionId,
        },
        kind: 'child_agent',
        stage: input.stage,
        status: fact.state === 'started' ? 'running' : fact.state,
        prompt: {
            hostComposed: {
                availability: 'unobservable',
                limitations: ['The daemon does not compose OpenCode native Child Prompts.'],
            },
            childInjected: promptObserved
                ? {
                    availability: 'partial',
                    source: 'runtime',
                    hash: fact.promptHash,
                    bytes: fact.promptBytes,
                    ...(fact.promptSafePayload ? { safePayload: fact.promptSafePayload } : {}),
                    limitations: fact.promptSafePayload
                        ? ['Child Prompt text is redacted and bounded before observation storage.']
                        : ['Only hash and byte length are retained from native Task input.'],
                }
                : {
                    availability: 'unavailable',
                    source: 'unknown',
                    limitations: ['Native Task Prompt was not present in the root terminal part.'],
                },
            agentEffectiveContext: {
                availability: 'unobservable',
                limitations: ['OpenCode does not expose effective Child context in this boundary.'],
            },
        },
        usage: normalizedUsage(fact.state === 'started' ? undefined : fact.usage),
        timing: timingEvidence
            ? {
                availability: 'partial',
                evidence: timingEvidence,
                limitations: ['Timestamps are read post-run from the root terminal Task part.'],
            }
            : {
                availability: 'unavailable',
                limitations: ['Root terminal Task part did not report native timing.'],
            },
        limitations: fact.limitations,
        attributes: {
            runtimeAdapterVersion: fact.adapterVersion,
            agentCliVersion: fact.cliVersion,
            nativeTaskToolCallId: fact.toolCallId,
            rootSessionId: fact.rootSessionId,
            source: fact.source,
            sourceEventType: fact.sourceEventType,
            ...(fact.model ? { model: fact.model } : {}),
        },
    };
    return NormalizedAgentObservationV1Schema.parse(observation);
}
//# sourceMappingURL=opencode-child-evidence.js.map