import { projectKindFromMetadataToTracking } from '@open-design/contracts/analytics';
import { countDesignSystemPreviewModules, countNewArtifacts, countWrittenFiles, didRunCreateDesignSystemFile, extractToolFilePath, isArtifactPath, isDesignSystemFile, isPreviewModulePath, readToolResultId, readToolResultIsError, readToolUseId, WRITE_OR_EDIT_TOOL_NAMES, } from './run-artifacts.js';
import { scanRunEventsForUsageAnalytics } from '../run-analytics-observability.js';
import { runResultFromStatus } from '../run-result.js';
function isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
export function resolveRunProjectKindForAnalytics({ hintProjectKind, projectMetadata, }) {
    if (typeof hintProjectKind === 'string')
        return hintProjectKind;
    if (projectMetadata?.importedFrom === 'design-system')
        return 'design_system';
    // Brand-extraction backing projects (kind:'brand', importedFrom:
    // 'brand-extraction') ARE design systems — a brand is one source for a DS,
    // not a separate object. Report them as design_system so DS-project runs
    // (creation + later edits) drill down cleanly. See design-system tracking spec §1.
    if (projectMetadata?.importedFrom === 'brand-extraction')
        return 'design_system';
    // Derive straight from the persisted metadata: videoModel splits HyperFrames
    // (kind=video) out of generic video, and the prototype/other subtype fields
    // (fidelity / intent / platform) split wireframe/mobile/live_artifact/document
    // out so the run's project_kind matches the Home card the user picked. The
    // web-supplied `hintProjectKind` already encodes all of this when set.
    return projectKindFromMetadataToTracking(projectMetadata);
}
// Scans run.events newest→oldest to extract usage token counts and the
// agent-reported model name. The scan must not short-circuit on usage
// before reaching the model signal: usage is a terminal event while
// status:initializing/model is emitted at the very start of the run.
export function scanRunEventsForFinishedProps(events, reqBodyModel) {
    const usage = scanRunEventsForUsageAnalytics(events, reqBodyModel, 0);
    return {
        ...(usage.input_tokens !== undefined ? { inputTokens: usage.input_tokens } : {}),
        ...(usage.output_tokens !== undefined ? { outputTokens: usage.output_tokens } : {}),
        agentReportedModel: usage.agent_reported_model,
    };
}
export function scanRunEventsForRetrySideEffects(events) {
    const sideEffects = {
        userVisibleOutputSeen: false,
        toolCallSeen: false,
        artifactWriteSeen: false,
        liveArtifactSeen: false,
    };
    const records = Array.isArray(events) ? events : [];
    for (const rec of records) {
        if (!isRecord(rec))
            continue;
        if (rec.event === 'stdout') {
            const data = isRecord(rec.data) ? rec.data : {};
            const chunk = data.chunk;
            if (typeof chunk === 'string' ? chunk.length > 0 : chunk !== undefined) {
                sideEffects.userVisibleOutputSeen = true;
            }
        }
        const data = isRecord(rec.data) ? rec.data : null;
        if (!data)
            continue;
        if (data.type === 'text_delta' || data.type === 'thinking_delta') {
            const delta = typeof data.delta === 'string' ? data.delta : '';
            if (delta.length > 0)
                sideEffects.userVisibleOutputSeen = true;
        }
        if (data.type === 'tool_use')
            sideEffects.toolCallSeen = true;
        if (data.type === 'artifact')
            sideEffects.artifactWriteSeen = true;
        if (data.type === 'live_artifact' || rec.event === 'live_artifact') {
            sideEffects.liveArtifactSeen = true;
        }
    }
    if (countNewArtifacts(records) > 0 ||
        didRunCreateDesignSystemFile(records) ||
        countDesignSystemPreviewModules(records) > 0) {
        sideEffects.artifactWriteSeen = true;
    }
    return sideEffects;
}
function emptyRunAdmissionEvidence() {
    return {
        attemptStarted: false,
        acp: false,
        promptSent: false,
        executionEvidenceSeen: false,
        terminalSeen: false,
    };
}
export function createRunSideEffectLedger() {
    return {
        userVisibleOutputSeen: false,
        toolCallSeen: false,
        directArtifactEventSeen: false,
        liveArtifactSeen: false,
        artifactPaths: new Set(),
        writtenFilePaths: new Set(),
        designSystemFileWritten: false,
        previewModulePaths: new Set(),
        pendingWritePathById: new Map(),
        admissionEvidence: emptyRunAdmissionEvidence(),
    };
}
function foldEventIntoRunAdmissionEvidence(ledger, record) {
    const event = record.event;
    const data = isRecord(record.data) ? record.data : null;
    if (event === 'run_retry_attempted' || event === 'run_resume_attempted') {
        ledger.admissionEvidence = emptyRunAdmissionEvidence();
        return;
    }
    if (event === 'start') {
        const acp = data?.agentId === 'amr' || data?.streamFormat === 'acp-json-rpc';
        ledger.admissionEvidence = {
            attemptStarted: true,
            acp,
            promptSent: !acp,
            executionEvidenceSeen: false,
            terminalSeen: false,
        };
        return;
    }
    const evidence = ledger.admissionEvidence;
    if (!evidence.attemptStarted || evidence.terminalSeen)
        return;
    if (event === 'error' || event === 'end') {
        evidence.terminalSeen = true;
        return;
    }
    if (data?.hostSynthesized === true)
        return;
    if (event === 'stdout') {
        if (evidence.promptSent && typeof data?.chunk === 'string' && data.chunk.length > 0) {
            evidence.executionEvidenceSeen = true;
        }
        return;
    }
    if (event === 'live_artifact') {
        if (evidence.promptSent)
            evidence.executionEvidenceSeen = true;
        return;
    }
    if (event !== 'agent' || !data)
        return;
    if (data.type === 'error') {
        evidence.terminalSeen = true;
        return;
    }
    if (data.type === 'status' && data.label === 'waiting_for_first_output') {
        evidence.promptSent = true;
        return;
    }
    if (!evidence.promptSent)
        return;
    if ((data.type === 'text_delta' || data.type === 'thinking_delta')
        && typeof data.delta === 'string' && data.delta.trim().length > 0) {
        evidence.executionEvidenceSeen = true;
    }
    if (data.type === 'status'
        && (data.label === 'tool_call' || data.label === 'tool_call_update')) {
        evidence.executionEvidenceSeen = true;
    }
    if (data.type === 'artifact' || data.type === 'live_artifact') {
        evidence.executionEvidenceSeen = true;
    }
    if (!evidence.acp && data.type === 'tool_use')
        evidence.executionEvidenceSeen = true;
}
export function foldEventIntoRunSideEffectLedger(ledger, record) {
    foldEventIntoRunAdmissionEvidence(ledger, record);
    const event = record?.event;
    const data = isRecord(record?.data) ? record.data : null;
    if (event === 'stdout') {
        const chunk = data?.chunk;
        if (typeof chunk === 'string' ? chunk.length > 0 : chunk !== undefined) {
            ledger.userVisibleOutputSeen = true;
        }
    }
    if (event === 'live_artifact')
        ledger.liveArtifactSeen = true;
    if (!data)
        return;
    if (data.type === 'text_delta' || data.type === 'thinking_delta') {
        if (typeof data.delta === 'string' && data.delta.length > 0) {
            ledger.userVisibleOutputSeen = true;
        }
    }
    if (data.type === 'live_artifact')
        ledger.liveArtifactSeen = true;
    if (data.type === 'artifact')
        ledger.directArtifactEventSeen = true;
    if (data.type === 'tool_use') {
        ledger.toolCallSeen = true;
        if (event !== 'agent')
            return;
        if (typeof data.name !== 'string')
            return;
        if (!WRITE_OR_EDIT_TOOL_NAMES.has(data.name))
            return;
        const path = extractToolFilePath(data.input);
        const id = readToolUseId(data);
        if (!path || !id)
            return;
        ledger.pendingWritePathById.set(id, path);
    }
    else if (data.type === 'tool_result' && event === 'agent') {
        const id = readToolResultId(data);
        if (!id)
            return;
        const path = ledger.pendingWritePathById.get(id);
        // Non-write tool_result (Read/Bash/Grep/…): nothing pending, drop it — this
        // is what keeps the ledger bounded on long tool-heavy runs.
        if (path === undefined)
            return;
        ledger.pendingWritePathById.delete(id);
        if (readToolResultIsError(data))
            return; // a failed write does not count
        ledger.writtenFilePaths.add(path);
        if (isArtifactPath(path))
            ledger.artifactPaths.add(path);
        if (isDesignSystemFile(path))
            ledger.designSystemFileWritten = true;
        if (isPreviewModulePath(path))
            ledger.previewModulePaths.add(path);
    }
}
function ledgerArtifactWriteSeen(ledger) {
    return (ledger.directArtifactEventSeen ||
        ledger.artifactPaths.size > 0 ||
        ledger.designSystemFileWritten ||
        ledger.previewModulePaths.size > 0);
}
export function sideEffectsFromLedger(ledger) {
    return {
        userVisibleOutputSeen: ledger.userVisibleOutputSeen,
        toolCallSeen: ledger.toolCallSeen,
        artifactWriteSeen: ledgerArtifactWriteSeen(ledger),
        liveArtifactSeen: ledger.liveArtifactSeen,
    };
}
// Read a run's committed side effects, preferring the truncation-proof ledger
// and falling back to the batch scan when a run has no ledger (e.g. legacy
// call sites or tests that build a run object directly).
export function runSideEffectsForRun(run) {
    if (run?.sideEffectLedger)
        return sideEffectsFromLedger(run.sideEffectLedger);
    return scanRunEventsForRetrySideEffects(run?.events);
}
export function runAdmissionEvidenceForRun(run) {
    return run.sideEffectLedger?.admissionEvidence;
}
// Distinct-artifact count that survives event-buffer truncation, with the same
// ledger-preferred / scan-fallback contract as runSideEffectsForRun.
export function runArtifactCountForRun(run) {
    if (run?.sideEffectLedger)
        return run.sideEffectLedger.artifactPaths.size;
    return countNewArtifacts(Array.isArray(run?.events) ? run.events : []);
}
// Truncation-proof all-file-types write count, same ledger-preferred contract.
// Tool-stream fallback for `run_finished.files_written_count` when the
// filesystem baseline diff is unavailable (no cwd, contended, snapshot error).
export function runFilesWrittenForRun(run) {
    if (run?.sideEffectLedger)
        return run.sideEffectLedger.writtenFilePaths.size;
    return countWrittenFiles(Array.isArray(run?.events) ? run.events : []);
}
// Truncation-proof `design_system_created`, same ledger-preferred contract.
export function runDesignSystemCreatedForRun(run) {
    if (run?.sideEffectLedger)
        return run.sideEffectLedger.designSystemFileWritten;
    return didRunCreateDesignSystemFile(Array.isArray(run?.events) ? run.events : []);
}
// Truncation-proof `preview_module_count`, same ledger-preferred contract.
export function runPreviewModuleCountForRun(run) {
    if (run?.sideEffectLedger)
        return run.sideEffectLedger.previewModulePaths.size;
    return countDesignSystemPreviewModules(Array.isArray(run?.events) ? run.events : []);
}
export function retryFinalResultForRunStatus(status, retryAttemptCount) {
    const result = runResultFromStatus(status);
    if ((retryAttemptCount ?? 0) <= 0) {
        return result === 'failed' ? 'suppressed' : 'not_attempted';
    }
    if (result === 'success')
        return 'success';
    if (result === 'failed')
        return 'failed';
    return 'suppressed';
}
export function runRetryEventsForAnalytics(events) {
    return (Array.isArray(events) ? events : []).filter((rec) => (isRecord(rec) &&
        typeof rec.event === 'string' &&
        'data' in rec &&
        (rec.event === 'run_retry_attempted' || rec.event === 'run_retry_finished')));
}
//# sourceMappingURL=run-lifecycle-analytics.js.map