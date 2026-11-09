import type { DoctorReport } from './doctor.js';
import type { SimulatePipelineResult } from './simulate.js';
export type VerifyCheckId = 'doctor' | 'simulate' | 'canon';
export interface VerifyConfig {
    enabled?: ReadonlyArray<VerifyCheckId>;
    strict?: boolean;
    simulate?: {
        signals?: Record<string, string | number | boolean>;
        iterationCap?: number;
    };
    canon?: {
        snapshotId?: string;
        fixturePath?: string;
    };
}
export interface VerifyInput {
    config: VerifyConfig;
    doctor?: DoctorReport;
    simulate?: SimulatePipelineResult;
    canon?: string;
    canonExpected?: string;
}
export interface VerifyCheckOutcome {
    check: VerifyCheckId;
    status: 'passed' | 'failed' | 'skipped' | 'unsupported';
    summary: string;
    details?: Record<string, unknown>;
}
export interface VerifyReport {
    pluginId?: string;
    passed: boolean;
    outcomes: VerifyCheckOutcome[];
}
export declare function verifyPlugin(input: VerifyInput): VerifyReport;
