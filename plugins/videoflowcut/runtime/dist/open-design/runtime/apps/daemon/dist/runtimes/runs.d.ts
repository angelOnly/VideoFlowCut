export declare const TERMINAL_RUN_STATUSES: Set<string>;
export declare function isLegacyHydratedRunWithoutAppliedSnapshot(run: object): boolean;
declare function atomicWriteJson(filePath: any, value: any): {
    ok: boolean;
    errorType?: never;
} | {
    ok: boolean;
    errorType: import("../observability/run-terminal-lifecycle.js").RunTerminalPersistenceErrorType;
};
export declare function createChatRunService({ createSseResponse, createSseErrorPayload, maxEvents, ttlMs, shutdownGraceMs, runsLogDir, onEventEmitted, onDiagnosticLifecycle, beforeFinish, onTerminal, getAppVersionInfo, writeDurableState, }: {
    beforeFinish?: null | undefined;
    createSseErrorPayload: any;
    createSseResponse: any;
    getAppVersionInfo?: (() => null) | undefined;
    maxEvents?: number | undefined;
    onDiagnosticLifecycle?: null | undefined;
    onEventEmitted?: null | undefined;
    onTerminal?: null | undefined;
    runsLogDir?: null | undefined;
    shutdownGraceMs?: number | undefined;
    ttlMs?: number | undefined;
    writeDurableState?: typeof atomicWriteJson | undefined;
}): {
    create: (meta?: {}) => {
        id: `${string}-${string}-${string}-${string}-${string}`;
        doneKey: any;
        projectId: any;
        conversationId: any;
        assistantMessageId: any;
        clientRequestId: any;
        requestFingerprint: any;
        strategyRolloutDecision: any;
        agentId: any;
        appVersionInfo: import("../app-version.js").AppVersionInfo | null;
        projectMetadata: any;
        workspace: import("@open-design/contracts").RunWorkspace;
        appliedPluginSnapshotId: any;
        pluginId: any;
        mediaExecution: import("@open-design/contracts").MediaExecutionPolicy;
        toolBundle: import("../run-tool-bundle.js").RunToolBundle;
        browserUse: any;
        sessionMode: any;
        context: any;
        externalPluginAnalytics: {
            entrySurface: any;
            hostProduct: any;
            externalPluginId: string;
            externalPluginVersion: any;
            distributionMechanism: any;
            publisherClass: any;
            attributionQuality: any;
            pluginWorkflowId: any;
            logicalRequestDigest: any;
            logicalRequestDigestVersion: any;
            briefState: any;
            generationSloWindowMs: any;
        } | null;
        status: string;
        createdAt: number;
        updatedAt: number;
        terminalAt: null;
        events: never[];
        nextEventId: number;
        clients: Set<unknown>;
        waiters: Set<unknown>;
        child: null;
        acpSession: null;
        childPid: null;
        processGroupId: null;
        childExitObservedAt: null;
        exitCode: null;
        signal: null;
        error: null;
        errorCode: null;
        cancelRequested: boolean;
        cancelOrigin: null;
        terminalTrigger: null;
        runtimeFailureObservedBeforeCancellation: boolean;
        retryRestartTimer: null;
        retryOriginFailure: null;
        retryOriginErrorCode: null;
        retryStrategy: null;
        retryMaxAttempts: null;
        nativeSessionContinueAttemptCount: number;
        nativeSessionContinuePending: null;
        stdinOpen: boolean;
        stdinBackpressure: boolean;
        lastAgentActivityAt: number;
        lastTodoSnapshot: null;
        truncatedMidTurn: boolean;
        askUserScanText: string;
        authenticatedDoneConclusion: boolean;
        completionMarkerTail: string;
        completionMarkerAwaitingConclusion: boolean;
        mediaTaskFailures: never[];
        endedWithUnfinishedWork: boolean;
        artifactCount: number | undefined;
        artifactPaths: string[] | undefined;
        artifactOutcome: undefined;
        deliverableSyntaxRepair: undefined;
        deliverableSyntaxValidation: undefined;
        eventsLogPath: string | null;
        statePath: string | null;
        eventsLogStream: null;
        eventsLogClosed: boolean;
        cleanupGeneration: number;
        cumulativeRetryAttemptCount: number;
        manualResumeAttemptCount: number;
        rechargeWaitDurationMs: number;
    };
    createOrReuse: (meta?: {}) => {
        kind: string;
        run: any;
    };
    prepareRestart: (run: any) => any;
    start: (run: any, starter: any) => any;
    get: (id: any) => any;
    findByPluginWorkflowId: (pluginWorkflowId: any) => any;
    list: ({ projectId, conversationId, status }?: {}) => any[];
    stream: (run: any, req: any, res: any) => Promise<void> | undefined;
    cancel: (run: any, origin?: string) => Promise<{
        id: any;
        projectId: any;
        conversationId: any;
        assistantMessageId: any;
        clientRequestId: any;
        agentId: any;
        designSystemId: any;
        designSystemRequestedId: any;
        designSystemSelectionSource: any;
        designSystemDigest: any;
        appliedPluginSnapshotId: any;
        pluginId: any;
        strategyRolloutDecision: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        terminalAt: any;
        cancelRequested: boolean;
        cancelOrigin: any;
        terminalTrigger: any;
        childPid: any;
        processGroupId: any;
        childExited: boolean;
        childExitObservedAt: any;
        exitCode: any;
        signal: any;
        error: any;
        errorCode: any;
        failureCategory: any;
        failureDetail: any;
        failureAction: any;
        retryable: any;
        resumable: any;
        endedWithUnfinishedWork: boolean;
        mediaTaskFailures?: any;
        artifactCount?: any;
        artifactPaths?: any;
        eventsLogPath: any;
        workspace: import("@open-design/contracts").RunWorkspace;
        mediaExecution: any;
        toolBundle: import("../run-tool-bundle.js").RunToolBundleSummary;
        promptCache?: any;
        nativeSessionRecovery?: any;
        browserUse?: any;
        clientType?: any;
        externalPluginAnalytics?: any;
        manualResumeAttemptCount?: any;
        rechargeWaitDurationMs?: any;
        artifactOriginStatus?: any;
        artifactVersionId?: any;
        deliverableValid?: any;
        deliverableValidation?: any;
        deliverableEntryFile?: any;
        deliverableArtifactKind?: any;
        deliverableSyntaxRepair?: any;
        deliverableSyntaxValidation?: any;
        strategyTask?: any;
        terminalLifecycle?: any;
        executionDiagnostics?: {
            schemaVersion: number;
            collectorVersion: string;
            collectedAt: any;
            eventStreamCompleteness: string;
            timing: {
                queueDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                promptBuildDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                launchPreflightDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                processSpawnDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stdinWriteDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstModelEventWaitMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstVisibleOutputWaitMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                agentExecutionDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                toolDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                artifactWriteDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                };
                phaseTimingStatus?: import("@open-design/contracts").TrackingRunPhaseTimingStatus;
                bottleneckPhase?: import("@open-design/contracts").TrackingRunLifecyclePhase;
            };
            modelSteps: {
                count: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                averageDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                p50DurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                p90DurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                maxDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                over60sCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationSampleCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                completed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cancelled: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                incomplete: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                retryCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoningTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoningDurationMs: {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            assistantMessages: {
                count: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                averageDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                maxDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationSampleCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                completed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cancelled: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                incomplete: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            anomalies: {
                retryCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                rateLimitedCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                timeoutCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                upstreamErrorCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            tools: {
                total: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                succeeded: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                unknown: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                byName: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            cache: {
                inputTokensEffective: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheReadInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheCreationInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                uncachedInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheHitRatio: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallCacheReadInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallCacheHitRatio: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stablePromptCacheHit: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stablePromptCacheMissReason: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            environment: {
                agentId: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                provider: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                requestedModel: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                resolvedModel: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoning: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                agentCliVersion: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
        } | undefined;
    }>;
    steer: (run: any, text: any, runtimeAccepts: any, expectedTurnId: any, feedbackId: any) => Promise<any>;
    shutdownActive: ({ graceMs }?: {
        graceMs?: number | undefined;
    }) => Promise<void>;
    wait: (run: any) => Promise<unknown>;
    emit: (run: any, event: any, data: any, timestamp?: number, persistLifecycle?: boolean) => {
        id: number;
        event: any;
        data: any;
        timestamp: number;
    } | null;
    persistState: (run: any) => {
        ok: boolean;
        errorType?: never;
    } | {
        ok: boolean;
        errorType: string;
    };
    noteMediaTaskFailure: (runId: any, failure: any) => boolean;
    setAnalyticsRecovery: (run: any, recovery: any) => void;
    beginAnalyticsDelivery: (run: any) => any;
    finalizeAnalyticsDelivery: (run: any, delivery: any) => any;
    markAnalyticsCompleted: (run: any) => void;
    beginTelemetryDelivery: (run: any) => any;
    recordTelemetryDeliveryAttempt: (run: any) => any;
    finalizeTelemetryDelivery: (run: any, delivery: any) => any;
    markLangfuseCompleted: (run: any) => void;
    setDeliverableValidation: (run: any, result: any) => void;
    finish: (run: any, status: any, code?: number | null, signal?: string | null) => void;
    fail: (run: any, code: any, message: any, init?: {}) => void;
    drop: (run: any) => void;
    signalChild: (run: any, signal: any) => boolean;
    reapProcessGroup: (processGroupId: any) => boolean;
    terminateProcessTree: (run: any, child: any, processGroupId: any, { gracefulWaitMs, termGraceMs, killGraceMs, reason, onChildSignal, }?: {
        gracefulWaitMs?: number | undefined;
        killGraceMs?: number | undefined;
        onChildSignal?: (() => void) | undefined;
        reason?: string | undefined;
        termGraceMs?: number | undefined;
    }) => any;
    signalProcessGroup: (processGroupId: any, signal: any) => boolean;
    statusBody: (run: any) => {
        id: any;
        projectId: any;
        conversationId: any;
        assistantMessageId: any;
        clientRequestId: any;
        agentId: any;
        designSystemId: any;
        designSystemRequestedId: any;
        designSystemSelectionSource: any;
        designSystemDigest: any;
        appliedPluginSnapshotId: any;
        pluginId: any;
        strategyRolloutDecision: any;
        status: any;
        createdAt: any;
        updatedAt: any;
        terminalAt: any;
        cancelRequested: boolean;
        cancelOrigin: any;
        terminalTrigger: any;
        childPid: any;
        processGroupId: any;
        childExited: boolean;
        childExitObservedAt: any;
        exitCode: any;
        signal: any;
        error: any;
        errorCode: any;
        failureCategory: any;
        failureDetail: any;
        failureAction: any;
        retryable: any;
        resumable: any;
        endedWithUnfinishedWork: boolean;
        mediaTaskFailures?: any;
        artifactCount?: any;
        artifactPaths?: any;
        eventsLogPath: any;
        workspace: import("@open-design/contracts").RunWorkspace;
        mediaExecution: any;
        toolBundle: import("../run-tool-bundle.js").RunToolBundleSummary;
        promptCache?: any;
        nativeSessionRecovery?: any;
        browserUse?: any;
        clientType?: any;
        externalPluginAnalytics?: any;
        manualResumeAttemptCount?: any;
        rechargeWaitDurationMs?: any;
        artifactOriginStatus?: any;
        artifactVersionId?: any;
        deliverableValid?: any;
        deliverableValidation?: any;
        deliverableEntryFile?: any;
        deliverableArtifactKind?: any;
        deliverableSyntaxRepair?: any;
        deliverableSyntaxValidation?: any;
        strategyTask?: any;
        terminalLifecycle?: any;
        executionDiagnostics?: {
            schemaVersion: number;
            collectorVersion: string;
            collectedAt: any;
            eventStreamCompleteness: string;
            timing: {
                queueDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                promptBuildDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                launchPreflightDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                processSpawnDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stdinWriteDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstModelEventWaitMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstVisibleOutputWaitMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                agentExecutionDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                toolDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                artifactWriteDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                };
                phaseTimingStatus?: import("@open-design/contracts").TrackingRunPhaseTimingStatus;
                bottleneckPhase?: import("@open-design/contracts").TrackingRunLifecyclePhase;
            };
            modelSteps: {
                count: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                averageDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                p50DurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                p90DurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                maxDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                over60sCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationSampleCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                completed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cancelled: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                incomplete: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                retryCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoningTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoningDurationMs: {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            assistantMessages: {
                count: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                totalDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                averageDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                maxDurationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationSampleCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                completed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cancelled: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                incomplete: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            anomalies: {
                retryCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                rateLimitedCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                timeoutCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                upstreamErrorCount: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            tools: {
                total: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                succeeded: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                failed: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                unknown: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                durationMs: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                byName: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            cache: {
                inputTokensEffective: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheReadInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheCreationInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                uncachedInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                cacheHitRatio: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallCacheReadInputTokens: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                firstCallCacheHitRatio: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stablePromptCacheHit: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                stablePromptCacheMissReason: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
            environment: {
                agentId: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                provider: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                requestedModel: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                resolvedModel: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                reasoning: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
                agentCliVersion: {
                    state: string;
                    value: any;
                    evidence: string;
                    source: string;
                    complete: boolean;
                    definition: any;
                } | {
                    state: string;
                    source: string;
                    missingReason: any;
                };
            };
        } | undefined;
    };
    signalChildProcess: (child: any, processGroupId: any, signal: any) => any;
    isTerminal(status: any): boolean;
};
export {};
