import { NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA, NormalizedAgentObservationV1Schema, } from '@open-design/contracts';
import { buildSafeChildPromptTelemetry, } from '../prompt-telemetry.js';
export const VELA_CHILD_EVIDENCE_EXTENSION = 'vela.opencode.child_agent_lifecycle';
export const VELA_CHILD_EVIDENCE_SCHEMA_VERSION = 1;
export const VELA_CHILD_EVIDENCE_ADAPTER_VERSION = 'od-vela-opencode-child-evidence/v1';
/**
 * Coverage `source` discriminator for this runtime, alongside the sibling
 * runtimes' `opencode_json_event_stream` and `claude_stream_json`. Downstream
 * aggregation reads it to attribute a coverage gap to the producing runtime.
 */
export const VELA_CHILD_EVIDENCE_COVERAGE_SOURCE = 'vela_opencode_acp';
/**
 * Review pin for the candidate wire fixture, carried into every observation as
 * `candidateCommit` so evidence stays attributable to the producer that emitted
 * it.
 *
 * `published` stays false: the producer lives on an unmerged Vela branch, so a
 * build carrying it is not something a user can install. `verifiedRuntimeSupport`
 * is now true — a local Vela built from that branch negotiated the extension and
 * drove a complex OD Next task to `availability: complete` with three observed
 * Children, which is the claim this flag makes. Flip `published` and re-pin the
 * commit once the producer lands on Vela's main.
 */
export const VELA_CHILD_EVIDENCE_CANDIDATE = Object.freeze({
    repository: 'PowerformerAI/vela',
    commit: 'c833b74e82e31c89414b7eaf01edabab1e2d0b06',
    fixture: 'apps/cli/internal/agent/testdata/opencode_child_evidence_wire_v1.golden.json',
    published: false,
    bestEffortEvidenceVerified: true,
    verifiedOpenCodeVersion: '1.18.18',
    verifiedRuntimeSupport: true,
});
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function safeString(value, maxLength = 256) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > maxLength || /[\u0000-\u001f\u007f]/u.test(trimmed)) {
        return undefined;
    }
    return trimmed;
}
function nonNegativeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? value
        : undefined;
}
function nonNegativeInteger(value) {
    const parsed = nonNegativeNumber(value);
    return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}
function safeSha256(value) {
    return typeof value === 'string' && /^[a-f0-9]{64}$/iu.test(value)
        ? value.toLowerCase()
        : undefined;
}
function safeProducerIdentity(value) {
    return safeString(value, 128);
}
function observableProducerVersion(value) {
    const version = safeProducerIdentity(value);
    // Vela versions before the candidate fix advertised this literal ACP
    // placeholder even though the root CLI already exposed its real build via
    // `--version`. Treat the placeholder as absent so telemetry can fall back to
    // the independently probed executable instead of publishing false identity.
    return version === '0.0.0' ? undefined : version;
}
export function negotiateVelaChildEvidence(initializeResult) {
    const result = isRecord(initializeResult) ? initializeResult : undefined;
    const agentInfo = isRecord(result?.agentInfo) ? result.agentInfo : undefined;
    const capabilities = isRecord(result?.agentCapabilities)
        ? result.agentCapabilities
        : undefined;
    const extensions = isRecord(capabilities?.extensions)
        ? capabilities.extensions
        : undefined;
    const extension = isRecord(extensions?.[VELA_CHILD_EVIDENCE_EXTENSION])
        ? extensions[VELA_CHILD_EVIDENCE_EXTENSION]
        : undefined;
    const schemaVersion = nonNegativeInteger(extension?.schemaVersion);
    const producerName = safeProducerIdentity(agentInfo?.name);
    const producerVersion = safeProducerIdentity(agentInfo?.version);
    const identity = {
        ...(producerName ? { producerName } : {}),
        ...(producerVersion ? { producerVersion } : {}),
        candidatePublished: false,
        candidateCommit: VELA_CHILD_EVIDENCE_CANDIDATE.commit,
    };
    if (!extension) {
        return {
            ...identity,
            advertised: false,
            supported: false,
            reason: 'extension_missing',
        };
    }
    if (schemaVersion !== VELA_CHILD_EVIDENCE_SCHEMA_VERSION) {
        return {
            ...identity,
            advertised: true,
            supported: false,
            ...(schemaVersion === undefined ? {} : { schemaVersion }),
            reason: 'unsupported_schema_version',
        };
    }
    return {
        ...identity,
        advertised: true,
        supported: true,
        schemaVersion,
        reason: 'supported_candidate',
    };
}
const SOURCE_EVIDENCE = new Set([
    'root_task_metadata',
    'session.created',
    'child_session_status',
    'child_session_error',
    'root_task_tool',
    'parent_prompt_cancelled',
    'parent_prompt_timeout',
    'opencode_export_step_finish',
    'opencode_export_message_snapshot',
    'opencode_export_unavailable',
]);
const TERMINAL_SOURCE_EVIDENCE = new Set([
    'child_session_status',
    'child_session_error',
    'root_task_tool',
    'parent_prompt_cancelled',
    'parent_prompt_timeout',
]);
function terminalSourceIsCoherent(status, completeness, sources) {
    const terminalSources = sources.filter((source) => TERMINAL_SOURCE_EVIDENCE.has(source));
    if (terminalSources.length !== 1)
        return false;
    const source = terminalSources[0];
    if (source === 'parent_prompt_timeout') {
        return status === 'timed_out' && completeness === 'partial';
    }
    if (source === 'parent_prompt_cancelled') {
        return status === 'cancelled' && completeness === 'partial';
    }
    if (completeness !== 'complete')
        return false;
    if (source === 'child_session_error') {
        return status === 'failed' || status === 'timed_out';
    }
    if (source === 'child_session_status') {
        return status === 'completed' || status === 'cancelled';
    }
    return source === 'root_task_tool' && status !== 'running';
}
function sourceEvidence(value) {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.flatMap((candidate) => (typeof candidate === 'string' && SOURCE_EVIDENCE.has(candidate)
            ? [candidate]
            : [])))];
}
function parsePrompt(value) {
    if (!isRecord(value) || value.availability !== 'hash_only')
        return undefined;
    const sha256 = safeSha256(value.sha256);
    const bytes = nonNegativeInteger(value.bytes);
    if (!sha256 || bytes === undefined)
        return undefined;
    const safe = typeof value.text === 'string'
        ? buildSafeChildPromptTelemetry([value.text]).safePayload
        : undefined;
    return { sha256, bytes, ...(safe ? { safePayload: safe } : {}) };
}
const USAGE_SOURCES = new Set([
    'child_step_finish',
    'opencode_export_step_finish',
    'opencode_export_message_snapshot',
]);
function usageWireShapeIsCoherent(value) {
    if (!isRecord(value))
        return false;
    if (value.availability === 'unavailable') {
        return value.completeness === 'unavailable' &&
            value.source === undefined &&
            [
                value.inputTokens,
                value.outputTokens,
                value.totalTokens,
                value.reasoningTokens,
                value.cacheReadTokens,
                value.cacheWriteTokens,
            ].every((candidate) => candidate === undefined);
    }
    if (value.availability !== 'available' || typeof value.source !== 'string') {
        return false;
    }
    if (value.source === 'opencode_export_message_snapshot') {
        return value.completeness === 'partial';
    }
    if (value.source === 'child_step_finish' || value.source === 'opencode_export_step_finish') {
        return value.completeness === 'complete';
    }
    return false;
}
function parseUsage(value) {
    if (!isRecord(value) || value.availability !== 'available')
        return undefined;
    if (value.completeness !== 'complete' && value.completeness !== 'partial')
        return undefined;
    if (typeof value.source !== 'string' ||
        !USAGE_SOURCES.has(value.source)) {
        return undefined;
    }
    const values = {
        inputTokens: nonNegativeNumber(value.inputTokens),
        outputTokens: nonNegativeNumber(value.outputTokens),
        totalTokens: nonNegativeNumber(value.totalTokens),
        thoughtTokens: nonNegativeNumber(value.reasoningTokens),
        cacheReadTokens: nonNegativeNumber(value.cacheReadTokens),
        cacheWriteTokens: nonNegativeNumber(value.cacheWriteTokens),
    };
    if (!Object.values(values).some((candidate) => candidate !== undefined))
        return undefined;
    return {
        completeness: value.completeness,
        source: value.source,
        ...Object.fromEntries(Object.entries(values).filter((entry) => entry[1] !== undefined)),
    };
}
function parseWireFact(update, now) {
    if (update.extension !== VELA_CHILD_EVIDENCE_EXTENSION ||
        update.schemaVersion !== VELA_CHILD_EVIDENCE_SCHEMA_VERSION) {
        return undefined;
    }
    const evidenceId = safeString(update.evidenceId);
    const childSessionId = safeString(update.childSessionId);
    const rootSessionId = safeString(update.parentSessionId);
    const toolCallId = safeString(update.toolCallId);
    const startedAtMs = nonNegativeNumber(update.startedAtMs);
    const endedAtMs = nonNegativeNumber(update.endedAtMs);
    const phase = update.phase === 'start' || update.phase === 'end'
        ? update.phase
        : undefined;
    const status = (update.status === 'running' ||
        update.status === 'completed' ||
        update.status === 'failed' ||
        update.status === 'cancelled' ||
        update.status === 'timed_out') ? update.status : undefined;
    const timingEvidence = update.timingEvidence === 'source_timestamp' ||
        update.timingEvidence === 'bridge_observed'
        ? update.timingEvidence
        : undefined;
    const lifecycleCompleteness = update.lifecycleCompleteness === 'complete' ||
        update.lifecycleCompleteness === 'partial'
        ? update.lifecycleCompleteness
        : undefined;
    if (!evidenceId || !childSessionId || !rootSessionId || !toolCallId ||
        startedAtMs === undefined || !phase || !status || !timingEvidence ||
        !lifecycleCompleteness ||
        (phase === 'start' && status !== 'running') ||
        (phase === 'start' && endedAtMs !== undefined) ||
        (phase === 'end' && status === 'running') ||
        (phase === 'end' && (endedAtMs === undefined || endedAtMs < startedAtMs))) {
        return undefined;
    }
    const prompt = parsePrompt(update.prompt);
    if (!usageWireShapeIsCoherent(update.usage))
        return undefined;
    const usage = parseUsage(update.usage);
    const sources = sourceEvidence(update.sourceEvidence);
    const hostIncompleteTerminal = sources.includes('parent_prompt_cancelled') ||
        sources.includes('parent_prompt_timeout');
    const exportUsageSource = usage?.source === 'opencode_export_step_finish' ||
        usage?.source === 'opencode_export_message_snapshot'
        ? usage.source
        : undefined;
    if (!sources.includes('root_task_metadata') ||
        !sources.includes('session.created') ||
        (phase === 'start' && sources.some((source) => TERMINAL_SOURCE_EVIDENCE.has(source))) ||
        (phase === 'end' && !terminalSourceIsCoherent(status, lifecycleCompleteness, sources)) ||
        (hostIncompleteTerminal && usage !== undefined) ||
        (exportUsageSource !== undefined && !sources.includes(exportUsageSource))) {
        return undefined;
    }
    const role = safeString(update.role, 128);
    const provider = safeString(update.provider, 128);
    const model = safeString(update.model, 256);
    const limitations = [
        'Consumed from the versioned ACP extension without Vela private I/O.',
        'Producer candidate is not published and is not production capability proof.',
        ...(prompt
            ? ['Only Prompt hash and byte length are retained.']
            : ['Child Prompt identity was unavailable or invalid.']),
        ...(usage
            ? []
            : ['Independent child usage was unavailable or invalid.']),
        ...(sources.length === (Array.isArray(update.sourceEvidence) ? update.sourceEvidence.length : 0)
            ? []
            : ['Unknown source-evidence labels were discarded.']),
        'L3 remains unavailable until one closed model-turn accounting group proves ownership and inherited-copy exclusion.',
    ];
    return {
        adapterVersion: VELA_CHILD_EVIDENCE_ADAPTER_VERSION,
        schemaVersion: VELA_CHILD_EVIDENCE_SCHEMA_VERSION,
        evidenceId,
        state: status,
        phase,
        rootSessionId,
        childSessionId,
        toolCallId,
        observedAtMs: now(),
        startedAtMs,
        ...(endedAtMs === undefined ? {} : { endedAtMs }),
        timingEvidence,
        lifecycleCompleteness,
        sourceEvidence: sources,
        ...(role ? { role } : {}),
        ...(provider ? { provider } : {}),
        ...(model ? { model } : {}),
        ...(prompt ? { prompt } : {}),
        ...(usage ? { usage } : {}),
        evidenceLevel: phase === 'end' && lifecycleCompleteness === 'complete' ? 'L2' : 'L1',
        l3Eligible: false,
        limitations,
    };
}
function factSignature(fact) {
    return JSON.stringify({
        evidenceId: fact.evidenceId,
        phase: fact.phase,
        state: fact.state,
        rootSessionId: fact.rootSessionId,
        childSessionId: fact.childSessionId,
        toolCallId: fact.toolCallId,
        startedAtMs: fact.startedAtMs,
        endedAtMs: fact.endedAtMs,
    });
}
/**
 * Stateful, per-ACP-run consumer. It never lists sessions or reads Vela
 * storage. The first accepted root id is bound to this ACP run and every
 * later fact must remain in that flat root/child graph.
 */
export function createVelaChildEvidenceConsumer(input = {}) {
    const now = input.now ?? Date.now;
    let negotiation = negotiateVelaChildEvidence(undefined);
    let rootSessionId;
    const childBindings = new Map();
    const toolBindings = new Map();
    const evidenceSignatures = new Map();
    const rejectionCounts = new Map();
    /**
     * Every rejected frame is a hole in the child graph, so the reason has to
     * survive past the per-run diagnostic emit cap in the ACP session. Coverage
     * reads these counts; without them a run that dropped a malformed or
     * out-of-order child frame would be indistinguishable from a run that
     * genuinely had no Child agents.
     */
    function reject(reason) {
        rejectionCounts.set(reason, (rejectionCounts.get(reason) ?? 0) + 1);
        return { handled: true, accepted: false, reason };
    }
    /**
     * One limitation is recorded for every reason this ACP run could have missed
     * a Child agent. `complete` is therefore reserved for a negotiated producer,
     * a cleanly closed turn, no still-open child, and no rejected frame — the
     * only state in which `knownChildCount === 0` is a real observation rather
     * than a blind spot.
     */
    function childEvidenceCoverage({ sessionComplete }) {
        const limitations = [];
        const diagnostics = new Map();
        const note = (code, count) => {
            limitations.push(`vela_${code}`);
            diagnostics.set(code, (diagnostics.get(code) ?? 0) + count);
        };
        if (!negotiation.supported) {
            // The common AMR case: the installed Vela never advertised the
            // extension, so no child frame could ever be consumed. Claiming
            // `complete` here would assert "this run provably had no Child agents"
            // when the daemon simply had no producer to observe.
            note(negotiation.advertised
                ? 'child_evidence_schema_unsupported'
                : 'child_evidence_capability_not_negotiated', 1);
        }
        const openChildCount = [...childBindings.values()]
            .filter((binding) => !binding.terminal).length;
        if (openChildCount > 0)
            note('child_terminal_unobserved', openChildCount);
        if (!sessionComplete)
            note('child_stream_incomplete', 1);
        for (const [reason, count] of rejectionCounts) {
            note(`child_evidence_rejected_${reason}`, count);
        }
        const knownChildCount = childBindings.size;
        const complete = limitations.length === 0;
        return {
            availability: complete
                ? 'complete'
                : knownChildCount > 0
                    ? 'partial'
                    : 'unavailable',
            source: VELA_CHILD_EVIDENCE_COVERAGE_SOURCE,
            knownChildCount,
            explicitZero: complete && knownChildCount === 0,
            limitations,
            diagnosticCounts: [...diagnostics.entries()]
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([code, count]) => ({ code, count })),
        };
    }
    return {
        negotiate(initializeResult) {
            negotiation = negotiateVelaChildEvidence(initializeResult);
            return negotiation;
        },
        getNegotiation() {
            return negotiation;
        },
        childEvidenceCoverage,
        observe({ expectedAcpSessionId, envelopeAcpSessionId, update }) {
            if (!isRecord(update) || update.sessionUpdate !== 'child_agent_lifecycle') {
                return { handled: false, accepted: false };
            }
            if (!negotiation.supported) {
                return reject(negotiation.advertised
                    ? 'unsupported_schema_version'
                    : 'capability_not_negotiated');
            }
            if (!expectedAcpSessionId ||
                envelopeAcpSessionId !== expectedAcpSessionId) {
                return reject('acp_session_mismatch');
            }
            const parsedFact = parseWireFact(update, now);
            if (!parsedFact)
                return reject('invalid_wire_shape');
            const producerVersion = observableProducerVersion(negotiation.producerVersion);
            const fact = {
                ...parsedFact,
                ...(producerVersion ? { producerVersion } : {}),
            };
            if (fact.childSessionId === fact.rootSessionId) {
                return reject('parent_cycle');
            }
            const evidenceSignature = factSignature(fact);
            const knownEvidence = evidenceSignatures.get(fact.evidenceId);
            if (knownEvidence) {
                return knownEvidence === evidenceSignature
                    ? { handled: true, accepted: false }
                    : reject('evidence_id_conflict');
            }
            const childBinding = childBindings.get(fact.childSessionId);
            if (fact.phase === 'end' && !childBinding) {
                return reject('status_regression');
            }
            if (childBinding?.rootSessionId !== undefined && childBinding.rootSessionId !== fact.rootSessionId) {
                return reject('parent_conflict');
            }
            if (rootSessionId && fact.rootSessionId !== rootSessionId) {
                return reject('root_session_conflict');
            }
            if (childBinding?.toolCallId !== undefined && childBinding.toolCallId !== fact.toolCallId) {
                return reject('tool_call_rebound');
            }
            const toolChild = toolBindings.get(fact.toolCallId);
            if (toolChild && toolChild !== fact.childSessionId) {
                return reject('tool_call_rebound');
            }
            if (fact.phase === 'start' && childBinding) {
                return reject('status_regression');
            }
            if (childBinding?.terminal) {
                return reject(childBinding.terminal === fact.state ? 'status_regression' : 'terminal_conflict');
            }
            rootSessionId ??= fact.rootSessionId;
            childBindings.set(fact.childSessionId, {
                rootSessionId: fact.rootSessionId,
                toolCallId: fact.toolCallId,
                ...(fact.phase === 'end' ? { terminal: fact.state } : {}),
            });
            toolBindings.set(fact.toolCallId, fact.childSessionId);
            evidenceSignatures.set(fact.evidenceId, evidenceSignature);
            try {
                input.onFact?.(fact);
            }
            catch {
                // Evidence is a best-effort side channel and cannot fail the parent Run.
            }
            return { handled: true, accepted: true, fact };
        },
    };
}
function normalizedUsage(usage) {
    if (!usage) {
        return {
            availability: 'unavailable',
            source: 'unknown',
            accountingMode: 'unknown',
            limitations: ['Vela child lifecycle did not report valid independent usage.'],
        };
    }
    const values = {
        ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
        ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
        ...(usage.totalTokens === undefined ? {} : { totalTokens: usage.totalTokens }),
        ...(usage.thoughtTokens === undefined ? {} : { thoughtTokens: usage.thoughtTokens }),
        ...(usage.cacheReadTokens === undefined ? {} : { cacheReadTokens: usage.cacheReadTokens }),
        ...(usage.cacheWriteTokens === undefined ? {} : { cacheWriteTokens: usage.cacheWriteTokens }),
    };
    const valueSources = Object.fromEntries(Object.keys(values).map((key) => [key, 'acp']));
    const complete = usage.completeness === 'complete' &&
        usage.inputTokens !== undefined && usage.outputTokens !== undefined;
    return {
        availability: complete ? 'complete' : 'partial',
        source: 'acp',
        accountingMode: 'additive',
        values,
        valueSources,
        limitations: complete
            ? []
            : ['Vela reported only a partial independent child-usage snapshot.'],
    };
}
/** Map one accepted, allowlisted wire fact without consulting Vela state. */
export function adaptVelaChildRuntimeFactV1(input) {
    const fact = input.fact;
    if (fact.adapterVersion !== VELA_CHILD_EVIDENCE_ADAPTER_VERSION ||
        fact.schemaVersion !== VELA_CHILD_EVIDENCE_SCHEMA_VERSION) {
        throw new TypeError('Unsupported Vela child evidence adapter/schema version.');
    }
    const probedAgentCliVersion = safeProducerIdentity(input.agentCliVersion);
    const producerVersion = observableProducerVersion(fact.producerVersion);
    if (probedAgentCliVersion &&
        producerVersion &&
        probedAgentCliVersion !== producerVersion) {
        throw new TypeError(`Vela CLI version mismatch: probe=${probedAgentCliVersion} ACP=${producerVersion}`);
    }
    const agentCliVersion = producerVersion ?? probedAgentCliVersion;
    const runtimeCompanionVersion = safeProducerIdentity(input.runtimeCompanionVersion);
    const prompt = fact.prompt
        ? {
            availability: 'partial',
            source: 'acp',
            hash: fact.prompt.sha256,
            bytes: fact.prompt.bytes,
            ...(fact.prompt.safePayload ? { safePayload: fact.prompt.safePayload } : {}),
            limitations: fact.prompt.safePayload
                ? ['Vela Child Prompt text was re-redacted and bounded by Open Design.']
                : ['Only Prompt hash and byte length are retained from Vela.'],
        }
        : {
            availability: 'unavailable',
            source: 'unknown',
            limitations: ['Vela child Prompt identity was unavailable.'],
        };
    const terminal = fact.phase === 'end';
    const timingEvidence = {
        source: 'runtime',
        clockDomain: fact.timingEvidence === 'source_timestamp'
            ? 'opencode_unix_epoch_ms'
            : 'vela_bridge_unix_epoch_ms',
        startedAtMs: fact.startedAtMs,
        ...(terminal && fact.endedAtMs !== undefined
            ? {
                endedAtMs: fact.endedAtMs,
                durationMs: fact.endedAtMs - fact.startedAtMs,
            }
            : {}),
    };
    const status = fact.state === 'running'
        ? 'running'
        : fact.state === 'cancelled'
            ? 'canceled'
            : fact.state === 'timed_out'
                ? 'failed'
                : fact.state;
    const observationId = `vela-child:${input.runId}:${fact.childSessionId}`;
    return NormalizedAgentObservationV1Schema.parse({
        schema: NORMALIZED_AGENT_OBSERVATION_V1_SCHEMA,
        identity: {
            observationId,
            taskExecutionId: input.taskExecutionId,
            runId: input.runId,
            taskRunIndex: input.taskRunIndex,
            parentObservationId: input.taskRunObservationId,
            runtimeSessionId: fact.childSessionId,
        },
        kind: 'child_agent',
        stage: input.stage,
        status,
        prompt: {
            hostComposed: {
                availability: 'unobservable',
                limitations: ['The daemon does not compose Vela native child Prompts.'],
            },
            childInjected: prompt,
            agentEffectiveContext: {
                availability: 'unobservable',
                limitations: ['Vela does not expose effective child context in this extension.'],
            },
        },
        usage: normalizedUsage(terminal ? fact.usage : undefined),
        timing: {
            availability: terminal ? 'complete' : 'partial',
            evidence: [timingEvidence],
            limitations: terminal
                ? []
                : ['The child is running, so terminal timing is not available yet.'],
        },
        limitations: [
            ...fact.limitations,
            ...(fact.state === 'timed_out'
                ? ['Producer timed_out is normalized to failed; timeout identity remains in attributes.']
                : []),
        ],
        attributes: {
            runtimeAdapterVersion: fact.adapterVersion,
            ...(agentCliVersion ? { agentCliVersion } : {}),
            ...(runtimeCompanionVersion ? { runtimeCompanionVersion } : {}),
            wireSchemaVersion: fact.schemaVersion,
            producerCandidateCommit: VELA_CHILD_EVIDENCE_CANDIDATE.commit,
            producerCandidatePublished: false,
            nativeEvidenceId: fact.evidenceId,
            nativeRootSessionId: fact.rootSessionId,
            nativeToolCallId: fact.toolCallId,
            nativeStatus: fact.state,
            timingEvidence: fact.timingEvidence,
            lifecycleCompleteness: fact.lifecycleCompleteness,
            sourceEvidence: fact.sourceEvidence,
            evidenceLevel: fact.evidenceLevel,
            l3Eligible: fact.l3Eligible,
            ...(fact.role ? { role: fact.role } : {}),
            ...(fact.provider ? { provider: fact.provider } : {}),
            ...(fact.model ? { model: fact.model } : {}),
            ...(fact.usage ? { producerUsageSource: fact.usage.source } : {}),
        },
    });
}
//# sourceMappingURL=vela-child-evidence.js.map