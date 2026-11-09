/**
 * @module analytics/events/result-events
 * *_result event prop types (run, feedback, settings, packaged).
 */
import type { ApiFailureReason, ApiFailureStage } from '../../api/failure-detail.js';
import type { AnalyticsAttributionQuality, AnalyticsDistributionMechanism, AnalyticsEntrySurface, AnalyticsHostProduct, AnalyticsPublisherClass, TrackingRuntimeType } from '../public-params.js';
import type { StrategySettlementFactsV2 } from '../../plugins/strategy-v2.js';
import type { ReleaseChannel } from '@open-design/release';
import type { ArtifactOriginEntrySurface, ArtifactOriginStatus } from '../../api/files.js';
import type { AgentDiagnosticReason, AgentDiagnosticSeverity } from '../../api/registry.js';
import type { TrackingDesignSystemEditSurface, TrackingDesignSystemKind, TrackingDesignSystemLengthBucket, TrackingDesignSystemOrigin, TrackingDesignSystemRunEntryFrom } from './design-systems.js';
import type { TrackingSettingsPage } from './event-names.js';
import type { TrackingAmrOpenCodeErrorPhase, TrackingAmrOpenCodeLastEventType, TrackingAmrOpenCodeLastToolKind, TrackingAmrOpenCodeLastToolStatus, TrackingArtifactKind, TrackingArtifactWriteSource, TrackingArtifactWriteStatus, TrackingByokPreflightBlockReason, TrackingByokProviderId, TrackingCliProviderId, TrackingDesignSystemSource, TrackingExecutionMode, TrackingExportFormat, TrackingExportResult, TrackingFeedbackAction, TrackingFeedbackProviderId, TrackingFeedbackRating, TrackingFeedbackRatingWithNone, TrackingFeedbackReasonCode, TrackingFidelity, TrackingFileSizeBucket, TrackingFileType, TrackingFirstModelEventType, TrackingHarness, TrackingLabsItemId, TrackingLabsOptOutReason, TrackingLabsSystemReason, TrackingLabsToggleSource, TrackingLangfuseDeliveryStatus, TrackingLangfuseDropReason, TrackingLangfuseReportResult, TrackingLangfuseReportSkipReason, TrackingProjectKind, TrackingProjectSource, TrackingPublishErrorCode, TrackingResult, TrackingRunAdmissionPhase, TrackingRunPolicyReason, TrackingRunAdmissionStatus, TrackingRunCancelOrigin, TrackingRunCloseReason, TrackingRunDiagnosticSource, TrackingRunEvidenceLevel, TrackingRunFailureCategory, TrackingRunFailureDetail, TrackingRunFailureDomain, TrackingRunFailureMechanism, TrackingRunFailureStage, TrackingRunFailureUserAction, TrackingRunLifecyclePhase, TrackingRunMatureUnfinishedState, TrackingRunPhaseTimingStatus, TrackingRunPosthogAcknowledgement, TrackingRunPosthogDeliveryStatus, TrackingRunPosthogErrorType, TrackingRunReconciliationIntegrity, TrackingRunRepairOwner, TrackingRunResult, TrackingRunRetryFinalResult, TrackingRunRetryStrategy, TrackingRunRetrySuppressedReason, TrackingRunTerminalIntegrity, TrackingRunTerminalPersistenceErrorType, TrackingRunTerminalPersistenceStatus, TrackingRunTerminalTrigger, TrackingRunTerminationOrigin, TrackingStderrLineCountBucket, TrackingTestResult, TrackingTokenCountSource } from './shared-enums.js';
import type { ConversationForkAnalyticsContext, TrackingFileVersionSource, TrackingPluginImportSource, TrackingSessionMode, TrackingSettingsArea } from './ui-click.js';
export interface MediaGenerationResultProps {
    page_name: 'studio';
    area: 'media_generation';
    project_id: string;
    task_id: string;
    run_id?: string;
    surface: 'image' | 'video' | 'audio';
    provider_id: string;
    model_id: string;
    result: 'success' | 'failed';
    initial_response_status?: number;
    response_status?: number;
    attempt_count: number;
    retry_count: number;
    retry_reason?: 'rate_limit_429' | 'service_unavailable_503';
    retry_after_ms?: number;
    retry_delay_ms?: number;
    retry_final_result: 'not_attempted' | 'success' | 'failed' | 'skipped_retry_after_budget';
    duration_ms: number;
    used_stub_fallback: boolean;
}
/**
 * One chat turn's artifact-snapshot outcome, emitted at the run's terminal
 * chokepoint — the moment the daemon decides what evidence this message will
 * carry forever.
 *
 * `source_changed_count` is broken out of `failed_count` on purpose. Every
 * other failure means "we could not keep a copy"; this one means the file on
 * disk stopped being the file this turn produced BEFORE the copy was taken, so
 * the capture window itself is wrong. It is the only counter here that
 * indicates a correctness failure rather than a capacity or availability one,
 * and it should alarm on its own rather than be averaged into a failure rate.
 *
 * Nothing here identifies content: no paths, no labels, no digests, no bytes.
 */
export interface ChatArtifactCaptureResultProps {
    page_name: 'studio';
    area: 'chat_artifact_capture';
    project_id: string;
    run_id: string;
    /** Cards this turn will show. */
    ref_count: number;
    /** Snapshots this pass wrote. */
    captured_count: number;
    /** Snapshots the media path had already frozen for this run. */
    reused_count: number;
    failed_count: number;
    /** Subset of `failed_count`. Alarms on its own; see above. */
    source_changed_count: number;
    result: 'success' | 'degraded';
}
export interface ProjectCreateResultProps {
    page_name: 'home';
    area: 'new_project';
    project_source: TrackingProjectSource;
    project_id: string | null;
    project_kind: TrackingProjectKind | null;
    design_system?: string;
    target_platforms?: string;
    companion_surfaces?: string;
    fidelity: TrackingFidelity;
    connectors?: string;
    use_speaker_notes?: boolean;
    include_animations?: boolean;
    reference_template?: string;
    model_id?: string;
    aspect?: string;
    plugin_id?: string;
    plugin_type?: string;
    result: TrackingResult;
    error_code?: string;
}
export interface PluginReplacementResultProps {
    page_name: 'home';
    area: 'plugin_replacement';
    plugin_before: string;
    plugin_after: string;
    result: TrackingResult;
    error_code?: string;
}
export interface SpeakerNotesSaveResultProps {
    page_name: 'artifact';
    area: 'deck_viewer';
    edit_surface: 'preview' | 'presenter';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    slide_count?: number;
    has_content?: boolean;
    result: TrackingResult;
    error_code?: string;
}
export type TrackingArtifactEditAction = 'apply' | 'undo' | 'redo';
export type TrackingArtifactEditKind = 'text' | 'link' | 'image' | 'element_remove' | 'token' | 'style' | 'attributes' | 'html' | 'source';
export interface ArtifactEditResultProps {
    page_name: 'artifact';
    area: 'manual_edit';
    action: TrackingArtifactEditAction;
    edit_kind: TrackingArtifactEditKind;
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    result: TrackingResult;
    error_code?: 'edit_busy' | 'source_unavailable' | 'patch_invalid' | 'source_conflict' | 'save_failed' | 'unknown';
    duration_ms: number;
}
export interface PluginImportResultProps {
    page_name: 'plugins';
    area: 'import_modal';
    import_source: TrackingPluginImportSource;
    result: TrackingResult;
    error_code?: string;
}
export interface UpdateInstallResultProps {
    page_name: 'home' | 'app';
    area: 'update_prompt' | 'update_dialog';
    result: TrackingResult;
    app_version_before?: string;
    app_version_after?: string;
    error_code?: string;
}
export interface UpdateCheckResultProps {
    page_name: 'app';
    area: 'update_dialog';
    result: 'available' | 'up_to_date' | 'failed';
    app_version_before?: string;
    app_version_after?: string;
    error_code?: string;
}
export type TrackingRunEntrySource = 'new_project' | 'chat_composer' | 'comment' | 'mark' | 'next_step' | 'question_answer' | 'resume_continue' | TrackingDesignSystemRunEntryFrom;
export type TrackingRunRecoveryActionType = 'manual_retry' | 'resume_run' | 'authorize_and_retry' | 'switch_model_retry' | 'switch_runtime_retry' | 'question_answer';
export interface RunTaskLineageProps {
    /** Stable id for one user intent across every recovery-created Run. */
    task_execution_id: string;
    /** First Run in the task. Equals run_id on task_run_index zero. */
    initial_run_id: string;
    /** Previous Run that directly triggered this recovery Run. */
    source_run_id?: string;
    /** Zero-based Run index inside the task; same-Run automatic retries do not increment it. */
    task_run_index: number;
    recovery_action_type?: TrackingRunRecoveryActionType;
    recovery_action_instance_id?: string;
}
export interface RunContextProps {
    session_run_index?: number;
    project_run_index?: number;
    has_existing_artifacts?: boolean;
    is_followup_run?: boolean;
}
export interface RunCapabilitiesProps {
    plugin_id?: string;
    skill_ids?: string[];
    mcp_server_ids?: string[];
}
export type TrackingInputAccountingMode = 'inclusive' | 'additive' | 'unknown';
export interface RunModelCallTokenProps {
    provider_input_tokens?: number;
    effective_input_tokens?: number;
    output_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
}
export interface RunTokenProps extends RunModelCallTokenProps {
    usage_count_source: TrackingTokenCountSource;
    cache_token_source?: 'anthropic' | 'openai' | 'unavailable';
    input_accounting_mode?: TrackingInputAccountingMode;
    user_query_tokens?: number;
    total_tokens?: number;
    first_model_call?: RunModelCallTokenProps;
}
export interface RunDesignSystemProps {
    selection_source?: string;
    edit_surface?: TrackingDesignSystemEditSurface;
    origin?: TrackingDesignSystemOrigin;
    input_source_count?: number;
    has_brand_description?: boolean;
    brand_description_length_bucket?: TrackingDesignSystemLengthBucket;
    github_repo_count?: number;
    local_folder_count?: number;
    fig_file_count?: number;
    asset_file_count?: number;
    change_type?: 'none' | 'created' | 'modified';
    preview_module_count?: number;
    missing_font_count?: number;
}
export interface RunTimingProps {
    total_duration_ms: number;
    queue_duration_ms?: number;
    process_spawn_duration_ms?: number;
    time_to_first_model_event_ms?: number;
    first_model_event_type?: TrackingFirstModelEventType;
    time_to_first_token_ms?: number;
    time_to_first_visible_output_ms?: number;
    time_to_first_artifact_ms?: number;
    generation_duration_ms?: number;
    model_active_duration_ms?: number;
    finalize_duration_ms?: number;
    collection_status?: TrackingRunPhaseTimingStatus;
}
export interface RunAutomaticRetryProps {
    retry_count: number;
    outcome: TrackingRunRetryFinalResult;
    suppressed_reason?: TrackingRunRetrySuppressedReason;
    last_attempt?: {
        index?: number;
        duration_ms?: number;
        time_to_first_token_ms?: number;
    };
}
export interface RunActivityProps {
    tools?: {
        call_count?: number;
        duration_ms?: number;
    };
    artifacts?: {
        changed_file_count?: number;
        created_file_count?: number;
        modified_file_count?: number;
        supporting_asset_files_changed_count?: number;
        write_duration_ms?: number;
        write_status?: TrackingArtifactWriteStatus;
        write_source?: TrackingArtifactWriteSource;
    };
}
export interface RunDiagnosticsProps {
    failure_signal_source?: TrackingRunDiagnosticSource;
    run_close_reason?: TrackingRunCloseReason;
    last_observed_phase?: TrackingRunLifecyclePhase;
    stderr_line_count_bucket?: TrackingStderrLineCountBucket;
    stdout_line_count_bucket?: TrackingStderrLineCountBucket;
    first_token_seen?: boolean;
    user_visible_output_seen?: boolean;
    tool_call_seen?: boolean;
    artifact_write_seen?: boolean;
    live_artifact_seen?: boolean;
    session_resume_fallback_used?: boolean;
    runtime_timing?: Record<string, number>;
}
export interface RunLangfuseDeliveryProps {
    delivery_status: TrackingLangfuseDeliveryStatus;
    drop_reason?: TrackingLangfuseDropReason;
}
export interface RunCreatedProps extends RunTaskLineageProps {
    page_name: 'chat_panel' | 'design_system_project';
    area: 'chat_composer' | 'design_system_generation';
    entry_from?: TrackingRunEntrySource;
    /** Explicit saved-comment attachments of this Run; not proof of a public-share comment. */
    comment_ids?: string[];
    /** v4 name; entry_from remains during the compatibility window. */
    entry_source?: TrackingRunEntrySource;
    turn_index?: number;
    is_first_run?: boolean;
    project_turn_index?: number;
    conversation_turn_index?: number;
    has_existing_artifact?: boolean;
    project_source?: TrackingProjectSource;
    project_id: string;
    conversation_id: string | null;
    run_id: string;
    project_kind: TrackingProjectKind | null;
    design_system_id?: string;
    design_system_source: TrackingDesignSystemSource;
    design_system_kind?: TrackingDesignSystemKind;
    design_system_slug?: string;
    design_system_version?: string;
    edit_surface?: TrackingDesignSystemEditSurface;
    ds_source_origin?: TrackingDesignSystemOrigin;
    source_count?: number;
    has_brand_description?: boolean;
    brand_description_length_bucket?: TrackingDesignSystemLengthBucket;
    github_repo_count?: number;
    local_folder_count?: number;
    fig_file_count?: number;
    asset_file_count?: number;
    target_platforms?: string;
    companion_surfaces?: string;
    fidelity?: TrackingFidelity;
    connectors?: string;
    use_speaker_notes?: boolean;
    include_animations?: boolean;
    reference_template?: string;
    aspect?: string;
    has_attachment: boolean;
    /** v4 name; has_attachment remains during the compatibility window. */
    has_attachments: boolean;
    user_query_tokens: number;
    model_id: string;
    agent_provider_id: TrackingCliProviderId | TrackingByokProviderId;
    runtime_type?: TrackingRuntimeType;
    skill_id: string | null;
    mcp_id: string | null;
    session_mode?: TrackingSessionMode;
    /** v4 name; session_mode remains during the compatibility window. */
    interaction_mode?: TrackingSessionMode;
    plugin_id?: string | null;
    mcp_ids?: string[];
    skill_ids?: string[];
    token_count_source: TrackingTokenCountSource;
    /** v4 grouped domains. Old flat aliases remain during migration. */
    run_context?: RunContextProps;
    capabilities?: RunCapabilitiesProps;
    tokens: RunTokenProps;
    design_system?: RunDesignSystemProps;
    entry_surface?: AnalyticsEntrySurface;
    host_product?: AnalyticsHostProduct;
    external_plugin_id?: string;
    external_plugin_version?: string;
    distribution_mechanism?: AnalyticsDistributionMechanism;
    publisher_class?: AnalyticsPublisherClass;
    attribution_quality?: AnalyticsAttributionQuality;
    plugin_workflow_id?: string;
    logical_request_digest?: string;
    logical_request_digest_version?: 1;
    mcp_session_id?: string;
    brief_state?: 'confirmed' | 'skipped' | 'not_applicable';
    deduplicated?: boolean;
    resume?: boolean;
    attempt_count?: number;
    generation_slo_window_ms?: number;
    recharge_wait_duration_ms?: number;
    /**
     * Which harness actually produced this run.
     *
     * The whole point of the Labs switch is a before/after comparison, and that
     * comparison is only possible if every run says which side it is on. Read
     * from the run's own rollout decision rather than the live setting, because
     * the setting can change while the run is in flight.
     */
    harness?: TrackingHarness;
    /**
     * Why a run took the ordinary route while the user had the switch on.
     *
     * Answers the question a support thread cannot: "I enabled it and nothing
     * changed." The switch can be on and still not apply — the project's task
     * type, the selected agent, an explicitly chosen plugin, or an unverified
     * runtime capability each route back. Omitted when `harness` is `od_next`,
     * and when the user never opted in (there is nothing to explain).
     */
    harness_fallback_reason?: string;
    /**
     * The gate that refused an OD Next turn, when its logical task settled
     * `blocked`.
     *
     * `result` is derived from the PHYSICAL run status, and a refused turn
     * usually exits 0 with a complete reply on screen — so this whole class of
     * failure reported `result: 'success'` and left no trace anywhere queryable.
     * The user saw a red card; the data said the run was fine. Carrying the
     * primary reason code (the same `reasonCodes[0]` the failure card keys on)
     * makes the class countable without changing what `result` means.
     *
     * Omitted for every run whose strategy task did not block, which is the
     * common case.
     */
    od_next_blocked_reason_code?: string;
    /** Orchestration action: question, continued, or ended. */
    od_next_settlement_reason?: string;
    /** Independent physical-run and reply facts, not a success verdict. */
    od_next_settlement_facts?: StrategySettlementFactsV2;
}
export interface RunFinishedProps extends Omit<RunCreatedProps, 'area'> {
    area: 'chat_panel' | 'design_system_generation';
    result: TrackingRunResult;
    error_code?: string;
    /** Only `user_stop` proves the user explicitly cancelled the run. */
    cancel_origin?: TrackingRunCancelOrigin;
    /** Lifecycle or watchdog mechanism that forced the terminal state. */
    terminal_trigger?: TrackingRunTerminalTrigger;
    failure_category?: TrackingRunFailureCategory;
    failure_detail?: TrackingRunFailureDetail;
    /** v4 name; failure_detail remains during the compatibility window. */
    failure_reason?: TrackingRunFailureDetail;
    failure_stage?: TrackingRunFailureStage;
    /** Versioned causal classification added alongside the legacy category/detail. */
    failure_mechanism?: TrackingRunFailureMechanism;
    failure_domain?: TrackingRunFailureDomain;
    evidence_level?: TrackingRunEvidenceLevel;
    repair_owner?: TrackingRunRepairOwner;
    admission_status?: TrackingRunAdmissionStatus;
    /** Independent of policy reason; never inferred from missing tokens. */
    admission_phase?: TrackingRunAdmissionPhase;
    policy_reason?: TrackingRunPolicyReason;
    terminal_integrity?: TrackingRunTerminalIntegrity;
    /** Current physical attempt within this Open Design Run. */
    run_attempt?: number;
    /** Vela-owned runtime generation UUID when explicitly reported back. */
    runtime_generation_id?: string;
    termination_origin?: TrackingRunTerminationOrigin;
    terminal_persistence_status?: TrackingRunTerminalPersistenceStatus;
    terminal_persistence_error_type?: TrackingRunTerminalPersistenceErrorType | null;
    /** Local PostHog queue state; `queued` is not a remote ingestion ACK. */
    posthog_delivery_status?: TrackingRunPosthogDeliveryStatus;
    posthog_acknowledgement?: TrackingRunPosthogAcknowledgement;
    posthog_delivery_attempt_count?: number;
    posthog_error_type?: TrackingRunPosthogErrorType | null;
    mature_unfinished_state?: TrackingRunMatureUnfinishedState;
    reconciliation_generation?: string;
    reconciliation_integrity?: TrackingRunReconciliationIntegrity;
    duplicate_terminal_count?: number;
    late_terminal_count?: number;
    classifier_version?: 'run-failure-v2' | 'run-failure-v3';
    retryable?: boolean;
    /** v4 name; retryable remains during the compatibility window. */
    is_automatic_retry_eligible?: boolean;
    user_action?: TrackingRunFailureUserAction;
    terminal_reconciled?: boolean;
    terminal_recovery_reason?: 'daemon_restart' | 'analytics_incomplete';
    langfuse_trace_id?: string;
    langfuse_expected?: boolean;
    langfuse_drop_reason?: TrackingLangfuseDropReason;
    langfuse_delivery_status?: TrackingLangfuseDeliveryStatus;
    diagnostic_source?: TrackingRunDiagnosticSource;
    stderr_present?: boolean;
    stderr_line_count_bucket?: TrackingStderrLineCountBucket;
    stdout_present?: boolean;
    stdout_line_count_bucket?: TrackingStderrLineCountBucket;
    rpc_close_reason?: TrackingRunCloseReason;
    first_token_seen?: boolean;
    user_visible_output_seen?: boolean;
    tool_call_seen?: boolean;
    artifact_write_seen?: boolean;
    live_artifact_seen?: boolean;
    /** Bounded summary of Vela/OpenCode v1 tool-execution lifecycle diagnostics. */
    tool_execution_lifecycle_seen?: boolean;
    tool_execution_lifecycle_count_bucket?: '1' | '2_5' | '6_20' | 'gt_20';
    tool_execution_trigger?: 'exit' | 'abort' | 'deadline' | 'mixed' | 'unknown';
    tool_execution_terminal?: 'running' | 'returned' | 'failed' | 'interrupted' | 'mixed' | 'unknown';
    tool_terminal_source?: 'tool_result' | 'tool_error' | 'processor_cleanup' | 'mixed' | 'unknown';
    tool_kill_outcome?: 'none' | 'requested' | 'sent' | 'failed';
    tool_child_close_seen?: boolean;
    tool_stdout_close_seen?: boolean;
    tool_stderr_close_seen?: boolean;
    tool_execution_evidence_incomplete?: boolean;
    deliverable_valid?: boolean;
    deliverable_validation?: 'valid' | 'invalid';
    artifact_origin_status?: ArtifactOriginStatus;
    artifact_version_id?: string;
    artifact_count: number;
    artifacts_created?: number;
    artifacts_modified?: number;
    files_written_count?: number;
    asked_user_question: boolean;
    /** v4 name; asked_user_question remains during the compatibility window. */
    clarification_requested: boolean;
    /**
     * The turn emitted a `<od-focus show="…">` the host could act on.
     *
     * The one number that says whether the instruction works. Its only prior
     * measurement came from a diagnostics zip that happened to be attached to a
     * bug report: 100% on turns that created a file, 22–25% on turns that only
     * edited one.
     */
    declared_artifact_focus?: boolean;
    /** Usable paths in that declaration. `0` when the turn declared nothing. */
    declared_count?: number;
    /**
     * Main artifacts the host picked for an UNDECLARED turn; `0` when the turn
     * declared (the fallback did not run). A `0` on a turn that wrote files is a
     * turn with no result cards at all — the OPEND-2550 symptom.
     */
    fallback_picked_count?: number;
    /**
     * Every file this turn wrote was a dependency (`.js` / `.css` / `.svg` /
     * `.json` and family), so the fallback had no deliverable to show.
     *
     * This is the frequency of the ONE case that would justify letting a card
     * point at a file the turn did not write ("changed `app.js`, show the
     * `index.html` that includes it"). That exception is deliberately NOT built:
     * it breaks the marker contract's own rule that a card never points outside
     * the turn's output. If this stays near zero it never needs building.
     */
    wrote_only_dependencies?: boolean;
    /** Main user-visible artifact outcome; omitted for Ask, clarification and DS Runs. */
    primary_artifact_change?: 'none' | 'created' | 'modified';
    input_tokens?: number;
    input_tokens_provider?: number;
    input_tokens_effective?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    uncached_input_tokens?: number;
    estimated_context_tokens?: number;
    cache_hit_ratio?: number;
    first_call_input_tokens?: number;
    first_call_cache_read_input_tokens?: number;
    first_call_cache_hit_ratio?: number;
    is_followup_turn?: boolean;
    cache_token_source?: 'anthropic' | 'openai' | 'unavailable';
    request_usage_count?: number;
    request_usage_input_tokens_sum?: number;
    request_usage_output_tokens_sum?: number;
    request_usage_reconciles_aggregate?: boolean;
    queue_duration_ms?: number;
    pre_spawn_duration_ms?: number;
    prompt_build_duration_ms?: number;
    launch_preflight_duration_ms?: number;
    process_spawn_duration_ms?: number;
    stdin_write_duration_ms?: number;
    time_to_first_model_event_ms?: number;
    first_model_event_type?: TrackingFirstModelEventType;
    time_to_first_token_ms?: number;
    time_to_first_visible_output_ms?: number;
    runtime_init_to_first_token_ms?: number;
    runtime_init_to_first_model_response_ms?: number;
    spawn_to_first_token_ms?: number;
    time_to_first_artifact_ms?: number;
    cli_ready_ms?: number;
    session_init_ms?: number;
    model_first_token_ms?: number;
    spawn_to_first_token_remainder_ms?: number;
    generation_duration_ms?: number;
    model_active_duration_ms?: number;
    tool_call_count?: number;
    tool_duration_ms?: number;
    artifact_write_duration_ms?: number;
    artifact_write_status?: TrackingArtifactWriteStatus;
    artifact_write_source?: TrackingArtifactWriteSource;
    finalize_duration_ms?: number;
    total_duration_ms: number;
    timing: RunTimingProps;
    automatic_retry?: RunAutomaticRetryProps;
    run_activity?: RunActivityProps;
    diagnostics?: RunDiagnosticsProps;
    langfuse_delivery?: RunLangfuseDeliveryProps;
    bottleneck_phase?: TrackingRunLifecyclePhase;
    phase_schema_version?: number;
    last_observed_phase?: TrackingRunLifecyclePhase;
    phase_timing_status?: TrackingRunPhaseTimingStatus;
    approval_requested?: boolean;
    stdin_backpressure?: boolean;
    tool_result_sent?: boolean;
    last_progress_age_ms?: number;
    amr_opencode_error_phase?: TrackingAmrOpenCodeErrorPhase;
    amr_opencode_last_event_type?: TrackingAmrOpenCodeLastEventType;
    amr_opencode_last_tool_status?: TrackingAmrOpenCodeLastToolStatus;
    amr_opencode_last_tool_kind?: TrackingAmrOpenCodeLastToolKind;
    attempt_index?: number;
    attempt_duration_ms?: number;
    attempt_time_to_first_token_ms?: number;
    attempt_terminal_phase?: TrackingRunLifecyclePhase;
    design_system_created?: boolean;
    preview_module_count?: number;
    missing_font_count?: number;
    retry_attempt_count?: number;
    retry_final_result?: TrackingRunRetryFinalResult;
    retry_suppressed_reason?: TrackingRunRetrySuppressedReason;
    agent_cli_version?: string;
    runtime_companion_name?: string;
    runtime_companion_version?: string;
    /** Current assistant-message event persistence path for rollout comparison. */
    message_event_storage_mode?: 'events_json_snapshot' | 'append_only';
    /** Persistable agent events observed before batching or compaction. */
    message_event_input_count?: number;
    message_event_delta_count?: number;
    /** Approximate UTF-16 character volume accepted by the persistence path. */
    message_event_input_char_count?: number;
    /** Synchronous message persistence batches attempted during this run. */
    message_event_flush_count?: number;
    /** Events handed to storage after in-memory adjacent-delta compaction. */
    message_event_batch_event_count?: number;
    /** Final compacted event count observed after the last successful flush. */
    message_event_persisted_count?: number;
    message_event_flush_total_ms?: number;
    message_event_flush_max_ms?: number;
    message_event_pending_char_peak?: number;
    /** Number and cost of terminal append-only batch folds. */
    message_event_finalize_count?: number;
    message_event_finalize_total_ms?: number;
    message_event_finalize_max_ms?: number;
    /** Compacted event count in the terminal message snapshot. */
    message_event_final_event_count?: number;
    message_event_persistence_error_count?: number;
    /**
     * Content-free storage summary of what this run left in SQLite, measured
     * after the run's events were finalized. Byte fields are SQLite
     * `octet_length` of the stored text (logical content, not file growth).
     * A field that could not be measured is omitted, never reported as 0.
     */
    storage_schema_version?: 1;
    storage_events_json_bytes?: number;
    storage_content_bytes?: number;
    /** Append-only event batches still unfolded for this message. */
    storage_pending_batch_count?: number;
    storage_pending_batch_bytes?: number;
    /** OD Next prompt bundle; only on the task's initial run, never per resume. */
    storage_prompt_bundle_bytes?: number;
    /** Largest single persisted event (UTF-16 chars) and its event kind. */
    storage_largest_event_chars?: number;
    storage_largest_event_kind?: string;
    /** Events the payload budget truncated, and their original UTF-8 size. */
    storage_truncated_event_count?: number;
    storage_truncated_original_bytes?: number;
    retry_original_failure_category?: TrackingRunFailureCategory;
    retry_original_failure_detail?: TrackingRunFailureDetail;
    retry_original_failure_stage?: TrackingRunFailureStage;
    /** Exact, content-free ACP prompt frame measurement captured at the writer boundary. */
    prompt_budget_version?: 'prompt_budget_v1';
    prompt_frame_bytes?: number;
    prompt_bytes?: number;
    prompt_token_estimate?: number;
    prompt_token_estimate_method?: 'utf8_bytes_div_3_ceil_v1';
    prompt_session_mode?: 'new' | 'resume';
    prompt_model_id?: string;
    prompt_context_window_source?: 'model_metadata' | 'unknown';
    prompt_context_window_tokens?: number;
    prompt_prior_session_usage_source?: 'agent_session' | 'unknown';
    prompt_prior_session_input_tokens?: number;
}
export interface LangfuseReportResultProps {
    page_name: 'chat_panel' | 'design_system_project';
    area: 'chat_panel' | 'design_system_generation';
    project_id: string | null;
    conversation_id: string | null;
    run_id: string;
    langfuse_trace_id: string;
    langfuse_expected: boolean;
    langfuse_delivery_status: TrackingLangfuseDeliveryStatus;
    langfuse_drop_reason?: TrackingLangfuseDropReason;
    langfuse_report_result: TrackingLangfuseReportResult;
    langfuse_report_trigger: 'final_message' | 'terminal_fallback';
    langfuse_report_skip_reason?: TrackingLangfuseReportSkipReason;
    report_duration_ms?: number;
    result?: TrackingRunResult;
    error_code?: string;
    agent_provider_id?: TrackingCliProviderId;
    model_id?: string;
}
export interface RunRetryBaseProps {
    page_name: 'chat_panel' | 'design_system_project';
    area: 'chat_panel' | 'design_system_generation';
    project_id: string;
    conversation_id: string | null;
    run_id: string;
    retry_of_run_id: string;
    retry_attempt_index: number;
    retry_max_attempts: number;
    retry_strategy: TrackingRunRetryStrategy;
    agent_provider_id: TrackingCliProviderId;
    model_id: string;
    failure_category?: TrackingRunFailureCategory;
    failure_detail?: TrackingRunFailureDetail;
    failure_stage?: TrackingRunFailureStage;
    terminal_trigger?: TrackingRunTerminalTrigger;
    error_code?: string;
}
export interface RunRetryAttemptedProps extends RunRetryBaseProps {
    retry_reason: 'transient_failure' | 'post_tool_resume';
    retry_delay_ms?: number;
}
export interface RunRetryFinishedProps extends RunRetryBaseProps {
    retry_result: 'success' | 'failed' | 'suppressed';
    retry_suppressed_reason?: TrackingRunRetrySuppressedReason;
}
export type TrackingUpdateApplyResult = 'success' | 'not_applied' | 'unknown';
export type TrackingUpdateApplyReason = 'app_version_matches' | 'app_version_unchanged' | 'expired' | 'identity_mismatch';
export type TrackingUpdateApplyElapsedBucket = 'lt_5m' | '5m_1h' | '1h_6h' | '6h_24h' | '1d_7d' | 'gt_7d' | 'unknown';
export interface UpdateApplyObservedProps {
    flow_id: string;
    channel: ReleaseChannel;
    namespace: string;
    platform: string;
    arch: string;
    artifact_type: 'dmg' | 'installer' | 'payload';
    from_version: string;
    to_version: string;
    result: TrackingUpdateApplyResult;
    reason: TrackingUpdateApplyReason;
    elapsed_bucket: TrackingUpdateApplyElapsedBucket;
}
export type TrackingFileUploadSurface = {
    page_name: 'file_manager';
    area: 'file_manager';
    project_id: string;
} | {
    page_name: 'chat_panel';
    area: 'chat_composer';
    project_id: string;
} | {
    page_name: 'home';
    area: 'chat_composer';
    project_id: string;
} | {
    page_name: 'onboarding';
    area: 'design_system_source';
    source_type: 'local_code' | 'fig' | 'assets';
    onboarding_session_id: string;
    project_id?: string;
} | {
    page_name: 'design_systems';
    area: 'design_system_source';
    source_type: 'local_code' | 'fig' | 'assets';
    design_system_id?: string;
    project_id?: string;
};
export interface ContextLinkResultProps {
    page_name: 'home' | 'chat_panel';
    area: 'chat_composer';
    context_kind: 'project' | 'local_code';
    result: 'success' | 'cancelled' | 'failed';
    count?: number;
    project_id?: string;
}
export type FileUploadResultProps = TrackingFileUploadSurface & {
    file_count: number;
    file_type: TrackingFileType;
    file_size_bucket: TrackingFileSizeBucket;
    result: TrackingRunResult;
    error_code?: string;
    duration_ms?: number;
};
export interface ArtifactExportResultProps {
    page_name: 'artifact';
    area: 'share_option_popover';
    entry_surface: 'open_design_ui';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    export_format: TrackingExportFormat;
    result: TrackingExportResult;
    error_code?: string;
    export_duration_ms: number;
    project_id: string;
    project_kind: TrackingProjectKind | null;
    artifact_origin_status: ArtifactOriginStatus;
    artifact_version_id?: string;
    origin_entry_surface: ArtifactOriginEntrySurface;
    origin_external_plugin_id?: string;
    origin_plugin_workflow_id?: string;
    origin_run_id?: string;
}
export interface SketchSaveResultProps {
    page_name: 'file_manager';
    area: 'sketch_editor';
    result: TrackingExportResult;
    error_code?: string;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface SketchExportResultProps {
    page_name: 'file_manager';
    area: 'sketch_editor';
    result: TrackingExportResult;
    error_code?: string;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export type TrackingDeployProvider = 'vercel' | 'cloudflare_pages';
export interface TrackingFailureDetailProps {
    failed_stage?: ApiFailureStage;
    failure_reason?: ApiFailureReason;
    upstream_status?: number;
    upstream_error_code?: string;
}
export interface ArtifactDeployResultProps extends TrackingFailureDetailProps {
    page_name: 'artifact';
    area: 'deploy_modal';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    provider: TrackingDeployProvider;
    result: TrackingExportResult;
    saved_new_token: boolean;
    first_configure: boolean;
    error_code?: string;
    deploy_duration_ms: number;
    project_id: string;
    project_kind: TrackingProjectKind | null;
}
/** Queue acceptance is separate from a click or a successful physical Run. */
export interface ProjectCommentSendResultProps {
    page_name: 'artifact';
    area: 'comment_popover';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    result: 'accepted' | 'queued' | 'rejected';
    submitted_comment_ids: string[];
    /** Returned subset of explicitly saved comments; excludes temporary board notes. */
    comment_ids: string[];
}
export interface ArtifactPublishResultProps extends TrackingFailureDetailProps {
    page_name: 'artifact';
    area: 'share_option_popover';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    action: 'publish' | 'unpublish';
    result: TrackingExportResult;
    error_code?: TrackingPublishErrorCode;
    publish_duration_ms: number;
    /** Stable alias already known to this attempt, never a full public URL. */
    publish_id?: string;
    /** Only the committed receipt supplies version and time. */
    share_version?: number;
    published_at?: number;
    project_id: string;
    project_kind: TrackingProjectKind | null;
    daemon_error_code?: string;
}
export interface FileVersionRestoreResultProps {
    page_name: 'artifact';
    area: 'file_version_modal';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind | null;
    version_source: TrackingFileVersionSource;
    version_gap: number;
    version_count: number;
    result: TrackingResult;
    error_code?: string;
    restore_duration_ms: number;
}
export interface FeedbackSubmitResultProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'assistant_feedback_reason_submit';
    action: 'submit_feedback_reason';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id: string;
    model_id: string;
    agent_provider_id: TrackingFeedbackProviderId;
    rating: 'positive' | 'negative';
    reason?: string;
    reason_count: number;
    has_custom_reason: boolean;
    custom_reason?: string;
    result: TrackingResult;
}
export type TrackingConversationForkErrorCode = 'bad_request' | 'permission_denied' | 'fork_source_not_found' | 'payload_too_large' | 'server_error' | 'http_error' | 'network_error' | 'empty_response' | 'unknown_error';
export interface ConversationForkResultProps extends ConversationForkAnalyticsContext {
    target_conversation_id: string | null;
    result: TrackingResult;
    error_code?: TrackingConversationForkErrorCode;
    duration_ms: number;
}
interface AssistantFeedbackBase {
    page: 'studio';
    area: 'chat_panel';
    project_id: string;
    project_kind: TrackingProjectKind;
    conversation_id: string;
    assistant_message_id: string;
    run_id: string | null;
    agent_provider_id: TrackingFeedbackProviderId;
    model_id: string;
    rating: TrackingFeedbackRating;
}
export interface AssistantFeedbackClickProps extends Omit<AssistantFeedbackBase, 'rating'> {
    element: 'assistant_feedback_button';
    action: TrackingFeedbackAction;
    /** Post-action state. `'none'` when the user just cleared their rating. */
    rating: TrackingFeedbackRatingWithNone;
    /** Pre-action state. Renamed from `previous_rating` for symmetry with `rating`. */
    rating_before: TrackingFeedbackRatingWithNone;
    has_produced_files: boolean;
}
export interface AssistantFeedbackReasonViewProps extends AssistantFeedbackBase {
    element: 'assistant_feedback_reason_panel';
    view_type: 'panel';
}
interface AssistantFeedbackReasonResultBase extends AssistantFeedbackBase {
    reason: TrackingFeedbackReasonCode[];
    reason_count: number;
    has_custom_reason: boolean;
    /** Raw free-text the user typed in the "other" input. Empty string when
     * the user didn't select "other" or left the field blank. Product
     * confirmed on 2026-05-13 that the raw text ships (no length bucketing). */
    custom_reason: string;
}
export interface AssistantFeedbackReasonClickProps extends AssistantFeedbackReasonResultBase {
    element: 'assistant_feedback_reason_submit_button';
    action: 'click_submit_feedback_reason';
}
export interface AssistantFeedbackReasonSubmitProps extends AssistantFeedbackReasonResultBase {
    element: 'assistant_feedback_reason_submit';
    action: 'submit_feedback_reason';
}
/**
 * One Labs experiment switch moved.
 *
 * Generic on purpose: the experiment is a property (`item_id`), not part of the
 * event name, so a second experiment reuses this event and every existing
 * PostHog query keeps working.
 *
 * Direction and reason ride on the same event because the dashboard reads them
 * together — opt-out rate is `to: 'off'` split by `reason`. The reason panel
 * appears *after* the switch moves, so an opt-out emits twice: once
 * immediately without a reason, once more if the user gives one. Count
 * opt-outs from the first, read reasons from the second.
 */
export interface LabsItemToggledProps {
    item_id: TrackingLabsItemId;
    to: 'on' | 'off';
    source: TrackingLabsToggleSource;
    /** Only when `source` is `system`. */
    system_reason?: TrackingLabsSystemReason;
    /** Only on the follow-up emit after an opt-out, once the user answers. */
    reason?: TrackingLabsOptOutReason[];
    has_custom_reason?: boolean;
    /** Raw free text from the "other" field. Empty when unused. */
    custom_reason?: string;
}
export interface SettingsViewProps {
    page_name: TrackingSettingsPage;
    area: TrackingSettingsArea;
}
/**
 * One diagnostic detection produced for one agent CLI. Answers, fleet-wide, the
 * question a single bug report can only answer for one machine: how many
 * installs of an agent someone installed cannot actually be used, and why.
 *
 * Carries no `page_name` on purpose. Detection is a daemon fact reported to
 * whichever surface asked for the agent list; the surface is incidental to the
 * failure and splitting by it would fragment the only number that matters.
 *
 * Carries no resolved path on purpose either — an agent binary path contains
 * the OS username.
 */
export interface AgentDetectDiagnosticProps {
    area: 'runtime_detection';
    cli_provider_id: TrackingCliProviderId;
    reason: AgentDiagnosticReason;
    severity: AgentDiagnosticSeverity;
    /** Warnings are not blocking, so availability is what separates them. */
    agent_available: boolean;
    /** The version detection read, when it read one. */
    agent_version?: string;
    /** A row with no path is hidden entirely — the user sees nothing to fix. */
    has_path: boolean;
}
export interface SettingsCliTestResultProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode';
    cli_provider_id: TrackingCliProviderId;
    result: TrackingTestResult;
    error_code?: string;
    duration_ms: number;
}
export interface SettingsByokTestResultProps {
    page_name: TrackingSettingsPage;
    area: 'execution_model';
    provider_id: TrackingByokProviderId;
    result: TrackingTestResult;
    error_code?: string;
    error_kind?: string;
    field_missing?: 'api_key' | 'base_url' | 'model' | 'multiple' | 'none';
    config_key_changed?: boolean;
    success_after_action?: boolean;
    duration_ms: number;
}
export interface SettingsByokModelsFetchResultProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode_byok';
    provider_id: TrackingByokProviderId;
    result: TrackingResult;
    trigger: 'auto' | 'manual';
    source: 'network' | 'cache';
    error_code?: string;
    error_kind?: string;
    field_missing?: 'api_key' | 'base_url' | 'model' | 'multiple' | 'none';
    model_count?: number;
    duration_ms: number;
}
export interface ByokPreflightBlockedProps {
    source: 'settings' | 'run';
    reason: TrackingByokPreflightBlockReason;
    provider_id: TrackingByokProviderId | 'unknown';
    active_execution_mode: TrackingExecutionMode;
}
export interface SettingsConnectorAuthResultProps {
    page_name: TrackingSettingsPage;
    area: 'connectors';
    connector_id: string;
    action: 'connect' | 'disconnect' | 'refresh';
    result: TrackingRunResult;
    error_code?: string;
}
export type PackagedStartupFailureKind = 'daemon-start' | 'web-start' | 'path-access' | 'status-timeout' | 'spawn-failed' | 'unknown';
export interface PackagedRuntimeFailedProps {
    failure_kind: PackagedStartupFailureKind;
    exit_code: number | null;
    signal: string | null;
    error_name: string;
    error_code: string | null;
    missing_module: string | null;
    daemon_error?: string | null;
    daemon_log_tail?: string | null;
    sys_code?: string | null;
    sys_errno?: number | null;
    sys_syscall?: string | null;
    error_message?: string | null;
    error_stack?: string | null;
    native_module_present?: boolean | null;
    native_module_size?: number | null;
    native_module_path?: string | null;
    log_path: string | null;
    app_version: string | null;
    namespace: string;
    source: string;
    platform: string;
}
export {};
//# sourceMappingURL=result-events.d.ts.map