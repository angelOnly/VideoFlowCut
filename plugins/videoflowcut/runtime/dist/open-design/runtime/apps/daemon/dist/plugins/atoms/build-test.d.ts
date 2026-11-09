import { spawn, type SpawnOptions } from 'node:child_process';
import type { UntilSignals } from '../until.js';
export type BuildTestStatus = 'passing' | 'failing' | 'skipped';
export interface BuildTestCommandResult {
    command: string;
    exitCode: number;
    durationMs: number;
    status: BuildTestStatus;
    log: string;
    reason?: string;
}
export interface BuildTestReport {
    build: BuildTestCommandResult;
    tests: BuildTestCommandResult;
    signals: UntilSignals;
    endedAt: string;
}
export interface BuildTestRunOptions {
    cwd: string;
    buildCommand?: string | null;
    testCommand?: string | null;
    timeoutMs?: number;
    logBudgetBytes?: number;
    spawnFn?: (cmd: string, args: string[], opts: SpawnOptions) => ReturnType<typeof spawn>;
}
export declare function runBuildTest(opts: BuildTestRunOptions): Promise<BuildTestReport>;
export declare function writeBuildTestReport(args: {
    cwd: string;
    report: BuildTestReport;
}): Promise<{
    jsonPath: string;
    logPath: string;
}>;
