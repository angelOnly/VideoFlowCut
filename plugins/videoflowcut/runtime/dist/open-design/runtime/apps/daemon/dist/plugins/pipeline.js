// Plugin pipeline scheduler + devloop driver (spec §10.1 / §10.2).
//
// The scheduler is "headless": it walks the manifest pipeline stage by
// stage, asks the caller-supplied `runStage()` to actually do the work,
// then evaluates each stage's `until` against returned signals to decide
// whether to advance or loop. The devloop ceiling
// (`OD_MAX_DEVLOOP_ITERATIONS`, default 10) is enforced here so a buggy
// plugin cannot burn provider quota in an infinite loop.
//
// Side effects:
//
//   - SQLite write to `run_devloop_iterations` after every iteration via
//     `recordIteration()`. This module is the sole writer of that table.
//   - Optional event sink (`PipelineEventSink`) emits
//     `pipeline_stage_started` / `pipeline_stage_completed` events. The
//     daemon wires this to `runs.emit(run, ...)`; tests pass an in-memory
//     recorder.
//
// The function is exported as a generator-like async iterator so callers
// can stream stage events to SSE without buffering the whole run. Tests
// can drain it into an array.
import { randomUUID } from 'node:crypto';
import { buildPipelineStageCompletedEvent, buildPipelineStageStartedEvent, } from '../genui/events.js';
import { evaluateUntil, parseUntil } from './until.js';
export class PipelineConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PipelineConfigError';
    }
}
// Run an entire pipeline. Returns one `StageOutcomeRecord` per stage in
// pipeline order. Throws on config errors (`repeat: true` without
// `until`, unparseable `until`, etc.). Iteration cap hits are reported
// as a non-converged outcome and let the caller decide whether to
// continue or fail the run.
export async function runPipeline(input) {
    const out = [];
    for (const stage of input.pipeline.stages) {
        out.push(await runStageWithDevloop(stage, input));
    }
    return out;
}
async function runStageWithDevloop(stage, input) {
    const repeat = stage.repeat === true;
    if (repeat && !stage.until) {
        throw new PipelineConfigError(`stage "${stage.id}" sets repeat:true but no until expression — refusing to schedule`);
    }
    const expression = stage.until ? parseUntilOrThrow(stage.until, stage.id) : null;
    const max = repeat ? Math.max(1, input.env.maxIterations) : 1;
    let iteration = 0;
    let converged = !repeat;
    let lastSignals = { iterations: 0 };
    while (iteration < max) {
        input.emit?.(buildPipelineStageStartedEvent({
            runId: input.runId,
            snapshotId: input.snapshot.snapshotId,
            stageId: stage.id,
            iteration,
        }));
        const outcome = await Promise.resolve(input.runStage({ stage, iteration, snapshot: input.snapshot }));
        iteration += 1;
        const merged = {
            ...(outcome.signals ?? {}),
            iterations: iteration,
        };
        lastSignals = merged;
        let stageConverged = !repeat;
        if (expression) {
            stageConverged = evaluateUntil(expression, merged).satisfied;
        }
        recordIteration(input.db, {
            runId: input.runId,
            stageId: stage.id,
            iteration,
            artifactDiffSummary: outcome.artifactDiffSummary ?? null,
            critiqueSummary: outcome.critiqueSummary ?? null,
            tokensUsed: outcome.tokensUsed ?? null,
        });
        input.emit?.(buildPipelineStageCompletedEvent({
            runId: input.runId,
            snapshotId: input.snapshot.snapshotId,
            stageId: stage.id,
            iteration: iteration - 1,
            converged: stageConverged,
            ...(outcome.artifactDiffSummary
                ? { diffSummary: outcome.artifactDiffSummary }
                : {}),
        }));
        if (stageConverged) {
            converged = true;
            return {
                stageId: stage.id,
                iterations: iteration,
                converged,
                termination: repeat ? 'until-satisfied' : 'no-loop',
            };
        }
    }
    void lastSignals;
    return {
        stageId: stage.id,
        iterations: iteration,
        converged: false,
        termination: 'iteration-cap',
    };
}
function parseUntilOrThrow(source, stageId) {
    try {
        return parseUntil(source);
    }
    catch (err) {
        throw new PipelineConfigError(`stage "${stageId}" until expression rejected: ${err instanceof Error ? err.message : String(err)}`);
    }
}
export function recordIteration(db, input) {
    const id = randomUUID();
    const endedAt = Date.now();
    db.prepare(`INSERT INTO run_devloop_iterations
       (id, run_id, stage_id, iteration, artifact_diff_summary, critique_summary, tokens_used, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, input.runId, input.stageId, input.iteration, input.artifactDiffSummary, input.critiqueSummary, input.tokensUsed, endedAt);
    return {
        id,
        runId: input.runId,
        stageId: input.stageId,
        iteration: input.iteration,
        artifactDiffSummary: input.artifactDiffSummary,
        critiqueSummary: input.critiqueSummary,
        tokensUsed: input.tokensUsed,
        endedAt,
    };
}
export function listIterationsForRun(db, runId) {
    const rows = db.prepare(`SELECT * FROM run_devloop_iterations WHERE run_id = ? ORDER BY iteration ASC, ended_at ASC`).all(runId);
    return rows.map((r) => ({
        id: r.id,
        runId: r.run_id,
        stageId: r.stage_id,
        iteration: r.iteration,
        artifactDiffSummary: r.artifact_diff_summary,
        critiqueSummary: r.critique_summary,
        tokensUsed: r.tokens_used,
        endedAt: r.ended_at,
    }));
}
//# sourceMappingURL=pipeline.js.map