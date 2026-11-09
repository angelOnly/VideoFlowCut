import { runFilesWrittenForRun } from '../../runtimes/run-lifecycle-analytics.js';
import { getStrategyTaskExecutionByRunId, InvalidStrategyTaskRecordError } from '../task-store.js';
import { InvalidFrozenSkillPackageError } from './frozen-skill-package.js';
import { recordStrategyRunWriteEvidence } from './intent-resolution-store.js';
/** The legacy count alone does not establish that the filesystem was observed. */
export function strategyRunWriteEvidence(run) {
    const outcome = run.artifactOutcome;
    return {
        filesWritten: Math.max(outcome?.filesWritten ?? 0, runFilesWrittenForRun(run)),
        filesWrittenUnknown: outcome?.filesWrittenUnknown !== false,
        filesWrittenSource: outcome?.filesWrittenSource ?? 'unknown',
    };
}
/** Uses the same ledger and terminal outcome as the real run lifecycle callbacks. */
export function createStrategyRunWriteEvidenceRecorder(db) {
    const lastToolCount = new WeakMap();
    const taskForRun = (runId) => {
        try {
            return getStrategyTaskExecutionByRunId(db, runId);
        }
        catch (error) {
            // A corrupt task has no trustworthy evidence owner. The lifecycle must
            // still persist its failure instead of throwing again while finishing.
            if (error instanceof InvalidStrategyTaskRecordError || error instanceof InvalidFrozenSkillPackageError)
                return null;
            throw error;
        }
    };
    return {
        observeToolStream(run) {
            const filesWritten = runFilesWrittenForRun(run);
            if (filesWritten <= (lastToolCount.get(run) ?? 0))
                return;
            const task = taskForRun(run.id);
            if (!task)
                return;
            recordStrategyRunWriteEvidence(db, {
                taskExecutionId: task.taskExecutionId, runId: run.id,
                filesWritten, unknown: false, source: 'tool_stream',
            });
            lastToolCount.set(run, filesWritten);
        },
        finish(run) {
            const task = taskForRun(run.id);
            if (!task)
                return;
            const evidence = strategyRunWriteEvidence(run);
            recordStrategyRunWriteEvidence(db, {
                taskExecutionId: task.taskExecutionId, runId: run.id,
                filesWritten: evidence.filesWritten, unknown: evidence.filesWrittenUnknown,
                source: evidence.filesWrittenSource,
            });
        },
    };
}
//# sourceMappingURL=run-write-evidence.js.map