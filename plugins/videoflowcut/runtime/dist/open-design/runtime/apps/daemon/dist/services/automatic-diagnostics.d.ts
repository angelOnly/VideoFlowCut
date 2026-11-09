import { type AutomaticDiagnosticSource, type LogSource } from '@open-design/diagnostics';
import { DiagnosticOutbox } from '../storage/diagnostic-outbox.js';
export interface FaultEvidence {
    sourceId: string;
    kind: string;
    at: number;
    runId?: string;
    agentId?: string;
    projectId?: string;
    conversationId?: string;
    attempt?: number;
    errorCode?: string;
    detail?: unknown;
}
interface Options {
    dataRoot: string;
    relayOrigin: string | null;
    consent(): boolean;
    sources(evidence: FaultEvidence): Promise<AutomaticDiagnosticSource[]>;
    baselineSources?(): Promise<LogSource[]>;
    context?(): unknown;
    onDelivered?(incidentId: string, receipt: string, evidence: FaultEvidence): void;
    fetcher?: typeof fetch;
}
export declare class AutomaticDiagnostics {
    private readonly options;
    readonly outbox: DiagnosticOutbox;
    private timer?;
    private active;
    private controller;
    private stopped;
    private readonly relay;
    private readonly consentFence;
    private consentBarrier;
    private observedLogIdentities;
    constructor(options: Options);
    private allowed;
    private hasConsent;
    record(evidence: FaultEvidence): string | null;
    start(): void;
    trackRun(runId: string, evidence: FaultEvidence): void;
    finishRun(runId: string): void;
    recovered(runId: string, at: number): void;
    /** Called synchronously after preference persistence, before any further transport step. */
    consentChanged(): void;
    private baselineConsent;
    /** Sources introduced after opting in get a boundary at first sight instead of being omitted forever. */
    private extendConsent;
    tick(): Promise<void>;
    private fencedSources;
    private cleanup;
    private device;
    private drain;
    stop(): Promise<void>;
}
export {};
