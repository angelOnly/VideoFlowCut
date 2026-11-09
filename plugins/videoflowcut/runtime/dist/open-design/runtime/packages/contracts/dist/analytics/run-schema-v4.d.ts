import type { RunActivityProps, RunAutomaticRetryProps, RunCapabilitiesProps, RunContextProps, RunCreatedProps, RunDesignSystemProps, RunDiagnosticsProps, RunFinishedProps, RunLangfuseDeliveryProps, RunTaskLineageProps, RunTimingProps, RunTokenProps, TrackingInputAccountingMode } from './events/result-events.js';
type JsonRecord = Record<string, unknown>;
export interface RunCreatedV4Aliases extends RunTaskLineageProps {
    entry_source?: RunCreatedProps['entry_source'];
    interaction_mode?: RunCreatedProps['interaction_mode'];
    has_attachments: boolean;
    run_context?: RunContextProps;
    capabilities?: RunCapabilitiesProps;
    tokens: RunTokenProps;
    design_system?: RunDesignSystemProps;
}
export interface RunFinishedV4Overrides {
    inputAccountingMode?: TrackingInputAccountingMode;
    firstModelCall?: RunTokenProps['first_model_call'];
    primaryArtifactChange?: RunFinishedProps['primary_artifact_change'];
    artifactFiles?: NonNullable<RunActivityProps['artifacts']>;
    designSystemChangeType?: NonNullable<RunDesignSystemProps['change_type']>;
}
export interface RunFinishedV4Aliases extends RunCreatedV4Aliases {
    failure_reason?: RunFinishedProps['failure_reason'];
    is_automatic_retry_eligible?: boolean;
    clarification_requested: boolean;
    primary_artifact_change?: RunFinishedProps['primary_artifact_change'];
    timing: RunTimingProps;
    automatic_retry?: RunAutomaticRetryProps;
    run_activity?: RunActivityProps;
    diagnostics?: RunDiagnosticsProps;
    langfuse_delivery?: RunLangfuseDeliveryProps;
}
export declare function buildRunCreatedV4Aliases(legacy: JsonRecord, lineage: RunTaskLineageProps): RunCreatedV4Aliases;
export declare function buildRunFinishedV4Aliases(legacy: JsonRecord, lineage: RunTaskLineageProps, overrides?: RunFinishedV4Overrides): RunFinishedV4Aliases;
export {};
//# sourceMappingURL=run-schema-v4.d.ts.map