import type { PluginPipeline } from '@open-design/contracts';
import { evaluateUntil, type UntilSignals } from './until.js';
export interface StageSignalProvider {
    /**
     * Returns the signals snapshot for a given (stageId, iteration)
     * tuple. The caller defines the simulation policy; common
     * choices:
     *
     *   - constant signals across every stage (`() => ({ 'critique.score': 5 })`)
     *   - per-stage tables (`(stageId) => stageSignals[stageId] ?? {}`)
     *   - increasing signals across iterations (e.g. score grows
     *     toward convergence)
     */
    (stageId: string, iteration: number): UntilSignals;
}
export interface SimulatePipelineInput {
    pipeline: PluginPipeline;
    signals: StageSignalProvider | UntilSignals;
    iterationCap?: number;
}
export interface SimulateStageOutcome {
    stageId: string;
    iterations: number;
    outcome: 'converged' | 'cap' | 'unparsable' | 'single';
    finalSignals: UntilSignals;
    matched?: ReturnType<typeof evaluateUntil>['matched'];
    reason?: string;
}
export interface SimulatePipelineResult {
    stages: SimulateStageOutcome[];
    totalIterations: number;
    outcome: 'all-converged' | 'all-single' | 'mixed' | 'cap-hit' | 'unparsable';
}
export declare function simulatePipeline(input: SimulatePipelineInput): SimulatePipelineResult;
export declare function parseSignalKv(args: ReadonlyArray<string>): {
    signals: UntilSignals;
    warnings: string[];
};
