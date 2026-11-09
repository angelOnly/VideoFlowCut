import type { RecentApiFailure } from '../http/api-failure-journal.js';
import type { FaultEvidence } from './automatic-diagnostics.js';
interface Run {
    id: string;
    agentId?: string;
    projectId?: string;
    conversationId?: string;
    retryAttemptCount?: number;
    manualResumeAttemptCount?: number;
    errorCode?: string;
    strategyTask?: {
        outcome?: string;
    };
    createdAt?: number;
    lastAgentActivityAt?: number;
    cancelOrigin?: string | null;
    terminalTrigger?: string | null;
    deliverableValid?: boolean;
    deliverableValidation?: unknown;
    stdinBackpressure?: boolean;
    analyticsTelemetry?: {
        firstModelEventAt?: number;
    };
    terminalLifecycle?: {
        terminalPersistence?: {
            status: string;
            errorType?: string | null;
        };
    };
}
interface Event {
    id: number;
    event: string;
    timestamp: number;
    data: unknown;
}
export declare function createDiagnosticRunObserver(): (run: Run, event: Event) => FaultEvidence | null;
export declare function diagnosticFaultFromRun(run: Run, event: Event): FaultEvidence | null;
/** Internal lifecycle hook: deliberately not a new public SSE event. */
export declare function diagnosticFaultFromLifecycle(run: Run, kind: 'user_cancel' | 'terminal_persistence_failure', at: number, writeErrorType?: string): FaultEvidence;
/** One incident per API failure signature per device-hour. */
export declare const API_FAULT_DEDUPE_WINDOW_MS = 3600000;
/** Route templates contain no user filenames, query strings or request bodies. */
export declare function diagnosticFaultFromApi(failure: RecentApiFailure): FaultEvidence | null;
export {};
