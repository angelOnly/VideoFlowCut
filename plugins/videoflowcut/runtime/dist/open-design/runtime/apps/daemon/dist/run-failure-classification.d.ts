import type { TrackingRunCancelOrigin, TrackingRunFailureCategory, TrackingRunFailureDetail, TrackingRunFailureDomain, TrackingRunFailureMechanism, TrackingRunFailureStage, TrackingRunFailureUserAction, TrackingRunEvidenceLevel, TrackingRunAdmissionStatus, TrackingRunAdmissionPhase, TrackingRunPolicyReason, TrackingRunRepairOwner, TrackingRunTerminalTrigger } from '@open-design/contracts/analytics';
import type { RunResult, RunStatusForAnalytics } from './run-result.js';
import type { RunAdmissionEvidence } from './runtimes/run-lifecycle-analytics.js';
export interface RunEventForFailureClassification {
    event: string;
    data: unknown;
}
export interface RunFailureClassificationInput {
    result: RunResult;
    status: RunStatusForAnalytics & {
        error?: string | null;
    };
    errorCode?: string;
    agentId?: string | null;
    cancelOrigin?: TrackingRunCancelOrigin | null;
    terminalTrigger?: TrackingRunTerminalTrigger | null;
    events?: RunEventForFailureClassification[];
    admissionEvidence?: RunAdmissionEvidence | undefined;
    /**
     * The OS the agent ran on. Defaults to this daemon's host, which is where
     * every agent child is spawned; tests pass it explicitly.
     */
    hostOs?: RunFailureHostOs;
}
export interface RunFailureHostOs {
    platform: string;
    /** `os.release()`, e.g. `10.0.16299` on Windows 10 1709. */
    release: string;
}
export interface RunFailureClassification {
    failure_category: TrackingRunFailureCategory;
    failure_detail: TrackingRunFailureDetail;
    failure_stage: TrackingRunFailureStage;
    failure_mechanism?: TrackingRunFailureMechanism;
    failure_domain?: TrackingRunFailureDomain;
    evidence_level?: TrackingRunEvidenceLevel;
    repair_owner?: TrackingRunRepairOwner;
    admission_status?: TrackingRunAdmissionStatus;
    admission_phase?: TrackingRunAdmissionPhase;
    policy_reason?: TrackingRunPolicyReason;
    classifier_version?: 'run-failure-v2' | 'run-failure-v3';
    retryable: boolean;
    user_action: TrackingRunFailureUserAction;
    /** Distinguishes an explicit user stop from lifecycle-driven cancellation. */
    cancel_origin?: TrackingRunCancelOrigin;
    /** Lifecycle or watchdog mechanism that forced the terminal state. */
    terminal_trigger?: TrackingRunTerminalTrigger;
}
/**
 * Whether a terminal failure can be recovered by RESUMING the agent's existing
 * CLI session (continue from where it left off) rather than restarting from
 * scratch. True only for transient mid-stream interruptions — an upstream drop
 * or an inactivity timeout — where any work already committed to the session is
 * worth continuing. Deliberately excludes process crashes, OOM kills,
 * auth/balance/prompt-size and any other non-transient cause: resuming those
 * would just reproduce the failure. The caller additionally gates on the
 * runtime actually supporting CLI session resume and on holding a session id.
 */
export declare function isResumableFailure(failure: RunFailureClassification | undefined): boolean;
/**
 * True when this failure text reads as an ACP handshake rejection the agent CLI
 * gave no reason for — the one shape "this CLI build cannot start a session;
 * change it, then retry" actually answers, because the build is the only
 * variable left.
 *
 * Answered by running the classifier itself rather than by a second signature
 * list, so the prescription the user reads and the bucket the run is filed
 * under are the same decision. A handshake failure that names a cause the
 * classifier recognises — signed out, throttled, out of balance, upstream down,
 * prompt too long — is claimed by that cause's branch and reported false here,
 * so the user is sent after the fix that actually applies.
 *
 * @param text - Failure text as surfaced by the ACP session (`rpcErrorMessage`).
 */
export declare function isAcpCliSessionRefusalText(text: string | null | undefined): boolean;
export declare function classifyRunFailure(input: RunFailureClassificationInput): RunFailureClassification | undefined;
