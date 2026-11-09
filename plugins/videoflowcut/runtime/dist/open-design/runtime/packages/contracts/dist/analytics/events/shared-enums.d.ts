/**
 * @module analytics/events/shared-enums
 * Shared tracking enums and value unions used across analytics events.
 */
export type TrackingProjectKind = 'prototype' | 'web_clone' | 'wireframe' | 'mobile' | 'live_artifact' | 'slide_deck' | 'template' | 'document' | 'image' | 'video' | 'hyperframes' | 'audio' | 'brand' | 'orbit' | 'design_system' | 'other';
export type TrackingProjectSource = 'create_button' | 'import_claude_design_zip' | 'open_folder' | 'template' | 'chat_composer' | 'unknown';
export type TrackingAmrEntrySource = 'onboarding_amr_card' | 'onboarding_amr_sign_in_continue' | 'inline_model_switcher_amr_row' | 'settings_amr_agent_card' | 'settings_amr_authorize' | 'settings_cloud_callout' | 'settings_amr_console' | 'settings_amr_install' | 'avatar_amr_console' | 'handoff_amr_website' | 'chat_error_authorize_retry' | 'chat_error_recharge' | 'chat_error_upgrade' | 'chat_balance_gate_upgrade' | 'chat_upgrade_card' | 'chat_upgrade_card_auto_recharge' | 'home_balance_gate_upgrade' | 'chat_low_balance_warn_recharge' | 'home_low_balance_warn_recharge' | 'chat_balance_gate_sign_in' | 'home_balance_gate_sign_in' | 'chat_error_switch_retry_card' | 'generation_preview_authorize_retry' | 'generation_preview_recharge' | 'generation_preview_switch_retry_card' | 'settings_amr_upgrade' | 'inline_amr_upgrade' | 'go_plan_sunset_modal' | 'deepseek_unpaid_modal' | 'deepseek_workbench_badge' | 'deepseek_model_switcher_upgrade' | 'avatar_amr_upgrade' | 'avatar_amr_agent_card' | 'artifact_success_upgrade' | 'home_artifact_upgrade';
export type TrackingCampaignId = 'deepseek_v4_flash' | 'deepseek_v4_pro' | 'go_plan_sunset_202608';
export type TrackingCampaignUserState = 'paid' | 'unpaid';
export type TrackingCampaignDeliveryMode = 'demo' | 'targeted';
export type TrackingCampaignConversionSource = 'go_plan_sunset_modal' | 'deepseek_unpaid_modal' | 'deepseek_workbench_badge' | 'deepseek_model_switcher_upgrade' | 'landing_home_banner' | 'landing_pricing_personal_plan' | 'landing_pricing_team_plan';
export interface AmrEntryAttribution {
    entryId: string;
    sourceProduct: 'open_design';
    sourceDetail: TrackingAmrEntrySource;
    occurredAt: string;
    campaignId?: TrackingCampaignId;
    conversionSource?: TrackingCampaignConversionSource;
    odDeviceId?: string;
    odRole?: string;
    odOrgSize?: string;
    odUseCase?: string[];
    odSource?: string;
}
export type TrackingNewProjectTab = 'prototype' | 'live_artifact' | 'slide_deck' | 'from_template' | 'media' | 'other';
export type TrackingFidelity = 'wireframe' | 'high_fidelity' | 'not_applicable';
export type TrackingExecutionMode = 'local_cli' | 'byok';
export type TrackingByokPreflightBlockReason = 'api_key_required' | 'api_key_invalid' | 'base_url_required' | 'base_url_invalid' | 'model_required' | 'model_default' | 'multiple' | 'config_invalid';
export type TrackingByokProviderId = 'anthropic' | 'openai' | 'azure_openai' | 'google_gemini' | 'ollama_cloud' | 'senseaudio' | 'aihubmix';
export type TrackingCliProviderId = 'claude_code' | 'codex_cli' | 'devin_for_terminal' | 'gemini_cli' | 'opencode' | 'byok_opencode' | 'hermes' | 'kimi_cli' | 'cursor_agent' | 'qwen_code' | 'qoder_cli' | 'github_copilot_cli' | 'pi' | 'kilo' | 'kiro' | 'vibe' | 'amp' | 'aider' | 'trae_cli' | 'grok_build' | 'antigravity' | 'codebuddy' | 'reasonix' | 'mimo' | 'atomcode' | 'deepseek' | 'deepseek_harness' | 'amr' | 'other';
export type TrackingFeedbackProviderId = TrackingCliProviderId | TrackingByokProviderId;
export type TrackingArtifactKind = 'html' | 'markdown' | 'image' | 'video' | 'audio' | 'doc' | 'unknown';
export type TrackingExportFormat = 'pdf' | 'pptx' | 'zip' | 'html' | 'image' | 'markdown' | 'template' | 'share_link' | 'share_page';
export type TrackingResult = 'success' | 'failed';
export type TrackingRunResult = 'success' | 'failed' | 'cancelled';
export type TrackingRunCancelOrigin = 'user_stop' | 'project_cleanup' | 'daemon_shutdown' | 'unknown';
export type TrackingRunTerminalTrigger = TrackingRunCancelOrigin | 'first_output_deadline' | 'inactivity_watchdog' | 'acp_stage_timeout' | 'daemon_restart';
export type TrackingExportResult = 'success' | 'failed' | 'cancelled';
export type TrackingPublishErrorCode = 'workspace_identity_required' | 'publish_failed';
export type TrackingTestResult = 'success' | 'failed' | 'timeout';
export type TrackingRunFailureCategory = 'auth' | 'rate_limit' | 'insufficient_balance' | 'entitlement_required' | 'model_unavailable' | 'prompt_too_large' | 'upstream_unavailable' | 'timeout' | 'empty_output' | 'tool_error' | 'process_exit' | 'user_cancel' | 'unknown';
export type TrackingRunFailureDetail = 'auth_required' | 'stale_profile' | 'refresh_token_reused' | 'missing_api_key' | 'invalid_api_key' | 'hard_quota' | 'model_window_limit' | 'membership_concurrency_limit' | 'workspace_credits_exhausted' | 'rate_limit_429' | 'amr_insufficient_balance' | 'amr_tier_upgrade_required' | 'model_not_found' | 'model_not_supported' | 'model_disabled' | 'local_model_not_loaded' | 'cli_version_incompatible' | 'prompt_too_large' | 'request_too_large' | 'attachment_media_type_unsupported' | 'tool_schema_invalid' | 'prompt_tokenization_failed' | 'provider_resource_not_found' | 'upstream_5xx' | 'upstream_client_error' | 'region_not_supported' | 'stream_disconnected' | 'network_error' | 'provider_high_demand' | 'provider_routing_error' | 'inactivity_timeout' | 'timeout' | 'empty_output' | 'tool_error' | 'plugin_artifact_missing' | 'cli_not_installed' | 'bundled_binary_missing' | 'host_policy_block' | 'local_storage_failure' | 'certificate_failure' | 'proxy_configuration' | 'network_configuration' | 'git_bash_missing' | 'agent_config_invalid' | 'spawn_failed' | 'spawn_enoexec' | 'spawn_ebadf' | 'spawn_eperm' | 'stdin_write_eof' | 'agent_protocol_error' | 'acp_frame_too_large' | 'session_resume_expired' | 'credential_refresh_contention' | 'fabricated_role_marker' | 'permission_request_not_found' | 'qoder_stop_sequence' | 'signal_killed' | 'process_crashed' | 'cpu_unsupported' | 'os_unsupported' | 'account_suspended' | 'interrupted' | 'exit_code' | 'terminated_unknown' | 'stream_error' | 'exit_nonzero' | 'fatal_rpc_error' | 'continuation_incomplete' | 'execution_failed' | 'user_cancelled' | 'unknown';
export type TrackingRunFailureStage = 'preflight' | 'spawn' | 'session_init' | 'model_select' | 'prompt_send' | 'first_token_wait' | 'tool_execution' | 'tool_outstanding' | 'post_tool_resume' | 'artifact_write' | 'child_close' | 'finalize';
export type TrackingRunFailureMechanism = 'policy_rejection' | 'provider_rejection' | 'model_route_unavailable' | 'invalid_model_selection' | 'protocol_violation' | 'frame_too_large' | 'startup_readiness_timeout' | 'first_output_deadline' | 'acp_response_deadline' | 'post_tool_resume_timeout' | 'tool_execution_failure' | 'child_exit' | 'stream_idle_timeout' | 'empty_completion' | 'transport_failure' | 'unknown';
export type TrackingRunFailureDomain = 'client_product' | 'client_environment' | 'provider_control_plane' | 'policy_admission' | 'cross_boundary' | 'unknown';
export type TrackingRunEvidenceLevel = 'structured_error' | 'structured_code' | 'protocol_error' | 'lifecycle_signal' | 'stderr_fallback' | 'close_reason' | 'legacy_text' | 'unknown';
export type TrackingRunRepairOwner = 'open_design' | 'client_environment' | 'provider_owner' | 'policy_owner' | 'shared_boundary' | 'unknown';
/** v3 describes the terminal attempt; absent evidence remains unknown. */
export type TrackingRunAdmissionPhase = 'before_execution' | 'during_execution' | 'unknown';
/** `none` means no affirmative policy evidence, not proof that no policy applied. */
export type TrackingRunPolicyReason = 'model_window_limit' | 'membership_concurrency_limit' | 'hard_quota' | 'workspace_credits_exhausted' | 'amr_insufficient_balance' | 'amr_tier_upgrade_required' | 'entitlement_required' | 'none';
/** v2 values were defaults, not phase evidence. Use admission_phase on v3. */
export type TrackingRunAdmissionStatus = 'admitted' | 'rejected_policy' | 'unknown';
export type TrackingRunTerminalIntegrity = 'canonical' | 'duplicate' | 'late' | 'reconciled' | 'overwritten' | 'permanently_missing' | 'post_terminal_activity';
export type TrackingRunTerminationOrigin = 'user_cancel' | 'project_cleanup' | 'watchdog_cleanup' | 'daemon_quit' | 'update_apply' | 'unknown';
export type TrackingRunTerminalPersistenceStatus = 'acknowledged' | 'failed' | 'unknown';
export type TrackingRunTerminalPersistenceErrorType = 'permission_denied' | 'read_only_storage' | 'storage_full' | 'storage_unavailable' | 'serialization_failed' | 'unknown';
export type TrackingRunPosthogDeliveryStatus = 'unknown' | 'in_flight' | 'queued' | 'not_expected' | 'failed';
export type TrackingRunPosthogAcknowledgement = 'unknown' | 'local_buffer' | 'none';
export type TrackingRunPosthogErrorType = 'not_configured' | 'metrics_consent_disabled' | 'config_read_failed' | 'enqueue_failed';
export type TrackingRunMatureUnfinishedState = 'still_running' | 'terminated_persistence_missing' | 'terminal_persisted_posthog_failed' | 'recovery_pending' | 'permanently_missing' | 'unknown';
export type TrackingRunReconciliationIntegrity = 'recovered';
export type TrackingRunLifecyclePhase = 'queued' | 'prompt_build' | 'launch_preflight' | 'process_spawn' | 'stdin_write' | 'runtime_init' | 'first_token_wait' | 'stream_output' | 'tool_execution' | 'artifact_write' | 'finalize' | 'complete' | 'unknown';
export type TrackingRunPhaseTimingStatus = 'complete' | 'partial' | 'missing';
export type TrackingArtifactWriteStatus = 'none' | 'started' | 'completed' | 'failed';
export type TrackingArtifactWriteSource = 'write_tool' | 'live_artifact' | 'design_system_file' | 'artifact_event' | 'unknown';
export type TrackingFirstModelEventType = 'text_delta' | 'thinking_delta' | 'tool_use' | 'artifact';
export type TrackingRunFailureUserAction = 'retry' | 'login' | 'recharge' | 'upgrade' | 'switch_model' | 'reduce_context' | 'install_cli' | 'fix_config' | 'none';
export type TrackingRunRetryStrategy = 'same_run_transient' | 'native_session_continue';
export type TrackingRunRetryFinalResult = 'not_attempted' | 'success' | 'failed' | 'suppressed';
export type TrackingRunRetrySuppressedReason = 'not_failed' | 'not_retryable' | 'unsupported_category' | 'non_retryable_category' | 'unsafe_failure_stage' | 'missing_failure_signal' | 'hard_quota' | 'attempt_limit_reached' | 'cancel_requested' | 'user_visible_output_seen' | 'tool_call_seen' | 'artifact_write_seen' | 'live_artifact_seen';
export type TrackingRunDiagnosticSource = 'error_event' | 'stderr' | 'exit_code' | 'signal' | 'unknown';
export type TrackingStderrLineCountBucket = 'none' | '1_5' | '6_20' | '21_100' | 'gt_100';
export type TrackingRunCloseReason = 'exit_0' | 'exit_nonzero' | 'signal' | 'cancel_requested' | 'stream_error' | 'fatal_rpc_error' | 'empty_output' | 'unknown';
export type TrackingAmrOpenCodeErrorPhase = 'timeout' | 'event_stream_start' | 'event_stream' | 'prompt_async' | 'other';
export type TrackingAmrOpenCodeLastEventType = 'tool_call' | 'tool_call_update' | 'agent_message_chunk' | 'agent_thought_chunk' | 'done' | 'other';
export type TrackingAmrOpenCodeLastToolStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'other';
export type TrackingAmrOpenCodeLastToolKind = 'read' | 'write' | 'edit' | 'search' | 'execute' | 'fetch' | 'other';
export type TrackingLangfuseDeliveryStatus = 'not_expected' | 'queued' | 'accepted' | 'failed';
export type TrackingLangfuseDropReason = 'metrics_consent_off' | 'content_consent_off' | 'missing_sink_config' | 'payload_too_large' | 'task_hierarchy_rollout' | 'relay_429' | 'relay_413' | 'relay_5xx' | 'langfuse_4xx' | 'langfuse_5xx' | 'vela_400' | 'vela_401' | 'vela_403' | 'vela_413' | 'vela_429' | 'vela_5xx' | 'network_error';
export type TrackingLangfuseReportResult = 'accepted' | 'failed' | 'skipped';
export type TrackingLangfuseReportSkipReason = 'run_not_found' | 'duplicate_run' | 'not_expected';
export type TrackingFeedbackRating = 'positive' | 'negative';
export type TrackingFeedbackRatingWithNone = 'positive' | 'negative' | 'none';
export type TrackingFeedbackAction = 'submit_feedback_rating' | 'clear_feedback_rating';
export type TrackingFeedbackReasonCode = 'matched_request' | 'strong_visual' | 'useful_structure' | 'easy_to_continue' | 'followed_design_system' | 'missed_request' | 'weak_visual' | 'could_not_run' | 'too_slow' | 'incomplete_output' | 'hard_to_use' | 'missed_design_system' | 'other';
export type TrackingTokenCountSource = 'provider_usage' | 'estimated' | 'unknown';
export type TrackingDesignSystemSource = 'default' | 'user_selected' | 'template_inherited' | 'project_saved' | 'not_applicable' | 'unknown';
export type TrackingFileType = 'image' | 'video' | 'audio' | 'pdf' | 'zip' | 'folder' | 'other';
export type TrackingFileSizeBucket = '0_1mb' | '1_10mb' | '10_100mb' | '100mb_plus';
/**
 * Which agent harness actually produced a run.
 *
 * Deliberately a value, not an event-name suffix: a third harness is one more
 * member here and every existing query keeps working. `ordinary` means the run
 * took the pre-existing strategy route, whatever the user's Labs switch said —
 * see `harness_fallback_reason` for why.
 */
export type TrackingHarness = 'od_next' | 'ordinary';
/**
 * A Labs experiment. Carried as a property so the toggle event stays generic:
 * a second experiment adds one member here and reuses the same event.
 */
export type TrackingLabsItemId = 'design_harness';
/** Who moved a Labs switch. `system` is not a user action — see `TrackingLabsSystemReason`. */
export type TrackingLabsToggleSource = 'settings' | 'cli' | 'system';
/**
 * Why the system moved a Labs switch on the user's behalf. Kept separate from
 * the opt-out reasons so "the user turned this off" and "we turned it off for
 * them" can never be summed together by accident.
 */
export type TrackingLabsSystemReason = 'env_override' | 'latched' | 'restored';
/**
 * Why a user turned a Labs experiment off.
 *
 * `skipped` is not a reason — it is the absence of one, recorded so the share
 * of people who declined to answer is visible instead of missing. A timeout and
 * an explicit "skip" record the same value on purpose.
 */
export type TrackingLabsOptOutReason = 'worse_output' | 'too_slow' | 'not_what_i_wanted' | 'other' | 'skipped';
//# sourceMappingURL=shared-enums.d.ts.map