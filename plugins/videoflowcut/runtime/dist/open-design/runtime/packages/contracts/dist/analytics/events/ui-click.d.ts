/**
 * @module analytics/events/ui-click
 * ui_click event prop types and their union.
 */
import type { DesignSystemEnrichClickProps, TrackingDesignSystemEditSurface } from './design-systems.js';
import type { TrackingPageName, TrackingSettingsPage } from './event-names.js';
import type { OnboardingClickProps, TrackingOnboardingFirstLoopStep, TrackingOnboardingProductType, TrackingOnboardingRole, TrackingOnboardingUseCase } from './onboarding.js';
import type { TrackingRunRecoveryActionType } from './result-events.js';
import type { TrackingAmrEntrySource, TrackingArtifactKind, TrackingByokProviderId, TrackingCampaignConversionSource, TrackingCampaignDeliveryMode, TrackingCampaignId, TrackingCampaignUserState, TrackingCliProviderId, TrackingExecutionMode, TrackingExportFormat, TrackingFeedbackProviderId, TrackingNewProjectTab, TrackingProjectKind, TrackingProjectSource } from './shared-enums.js';
import type { AccountMenuClickProps, CommunityTemplateClickProps, EntryNavigationClickProps, ExtensionMarketplaceClickProps, ProjectCollectionClickProps, TrackingWorkspaceScope, WorkspaceInviteClickProps, WorkspaceSwitcherClickProps } from './workspace.js';
export interface HomeNavClickProps {
    page_name: 'home';
    area: 'nav';
    element: 'home' | 'projects' | 'automations' | 'plugins' | 'design_systems' | 'integrations' | 'new_project_plus' | 'help';
}
export interface HelpPopoverClickProps {
    page_name: 'home';
    area: 'help_resources_popover';
    element: 'get_help_on_github' | 'submit_a_feature_request' | 'whats_new' | 'download_desktop_app';
    surface: 'popover';
}
export interface HomeToolbarClickProps {
    page_name: 'home';
    area: 'toolbar';
    element: 'star' | 'execution_settings' | 'use_everywhere' | 'workspace_teams' | 'settings';
}
export interface ExecutionSettingsPopoverClickProps {
    page_name: 'home';
    area: 'execution_settings_popover';
    element: 'mode_local_cli' | 'mode_byok' | 'agent_card' | 'byok_provider_tab' | 'model_dropdown' | 'open_execution_settings';
    cli_provider_id?: TrackingCliProviderId;
    provider_id?: TrackingByokProviderId;
    model_id?: string;
    execution_mode?: TrackingExecutionMode;
}
export interface SettingsPopoverClickProps {
    page_name: 'home' | 'artifact';
    area: 'settings_popover';
    element: 'language_select' | 'share_channel' | 'workspace_teams' | 'join_discord' | 'join_feishu' | 'follow_x' | 'follow_threads' | 'open_youtube' | 'follow_instagram' | 'follow_linkedin' | 'follow_xiaohongshu' | 'open_settings';
    value?: string;
    channel?: 'x' | 'linkedin' | 'facebook' | 'reddit' | 'telegram' | 'whatsapp' | 'weibo' | 'line' | 'instagram' | 'xiaohongshu';
}
export interface HomeChatComposerClickProps {
    page_name: 'home';
    area: 'chat_composer';
    element: 'chat_input' | 'send_button' | 'plugin_chip' | 'action_chip' | 'attachment' | 'library' | 'figma_import' | 'working_dir' | 'working_dir_clear' | 'plugin_chip_clear' | 'working_dir_recent' | 'task_chip' | 'task_chip_clear' | 'subcategory_chip' | 'example_prompt' | 'example_open_project' | 'plus_menu_open' | 'plus_pick' | 'plus_add' | 'plus_submenu_open' | 'plus_search' | 'figma_help' | 'design_system_open' | 'context_remove';
    resource_kind?: 'connector' | 'plugin' | 'skill' | 'mcp' | 'workspace';
    resource_id?: string;
    chip_id?: string;
    subcategory?: string;
    plugin_id?: string;
    plugin_type?: string;
}
export interface HomeRecommendationClickProps {
    page_name: 'home';
    area: 'onboarding_recommendation';
    element: 'enter_studio' | 'change' | 'browse_all';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
    role?: TrackingOnboardingRole;
    use_cases?: TrackingOnboardingUseCase[];
}
export interface StudioOnboardingHintClickProps {
    page_name: 'chat_panel';
    area: 'onboarding_first_artifact_hint';
    element: 'open_artifact' | 'dismiss';
    hint_type: 'view_artifact';
    studio_stage?: TrackingOnboardingFirstLoopStep;
    feature_id?: string;
}
export interface UpdateIndicatorClickProps {
    page_name: 'home' | 'app';
    area: 'update_indicator' | 'update_prompt' | 'mac_app_menu' | 'update_dialog';
    element: 'ready_indicator' | 'later' | 'install_update' | 'check_for_updates' | 'view_release_notes' | 'restart_anyway';
    action: 'open_prompt' | 'dismiss' | 'install' | 'check' | 'open_link' | 'force_restart';
    app_version_before?: string;
    app_version_after?: string;
}
export interface WhatsNewPopupClickProps {
    page_name: 'home';
    area: 'whats_new_popup';
    element: 'see_whats_new' | 'dismiss';
    action: 'open_link' | 'dismiss';
    app_version: string;
}
export interface NewProjectModalTabClickProps {
    page_name: 'home';
    area: 'new_project_modal';
    element: 'tab';
    tab_name: TrackingNewProjectTab;
}
export interface NewProjectModalElementClickProps {
    page_name: 'home';
    area: 'new_project_modal';
    element: 'project_name' | 'design_system' | 'target_platforms' | 'include_landing_page' | 'include_os_widgets' | 'wireframe' | 'high_fidelity' | 'create' | 'import_claude_design_zip' | 'open_folder' | 'path_input';
    tab_name: TrackingNewProjectTab;
}
export interface PluginReplacementModalClickProps {
    page_name: 'home';
    area: 'plugin_replacement_modal';
    element: 'cancel' | 'replace';
}
export interface PrivacyModalClickProps {
    page_name: 'home';
    area: 'privacy_modal';
    element: 'yes' | 'no';
}
export interface RecentProjectsClickProps {
    page_name: 'home';
    area: 'recent_projects';
    element: 'project_card' | 'view_all';
    project_id?: string;
    project_kind?: TrackingProjectKind;
    project_status?: string;
}
export interface HomeTemplatesClickProps {
    page_name: 'home';
    area: 'templates';
    element: 'featured' | 'all' | 'clear_filters' | 'browse_registry' | 'search_input' | 'filter_chip' | 'templates_feature' | 'templates_details' | 'templates_use' | 'templates_use_dropdown' | 'create_templates';
    template_id?: string;
    template_type?: string;
    filter_name?: string;
}
export interface HomeTemplatesDropdownClickProps {
    page_name: 'home';
    area: 'templates_dropdown';
    element: 'use' | 'use_with_query';
    template_id?: string;
    template_type?: string;
}
export interface ProjectsListControlsClickProps {
    page_name: 'projects';
    area: 'list_controls';
    element: 'recent' | 'your_designs' | 'search_input' | 'select' | 'refresh' | 'create_project' | 'grid_view' | 'list_view';
}
export interface ProjectsListClickProps {
    page_name: 'projects';
    area: 'list';
    element: 'project_card' | 'more';
    project_id?: string;
    project_kind?: TrackingProjectKind;
    project_source?: TrackingProjectSource;
}
export interface ProjectsMorePopoverClickProps {
    page_name: 'projects';
    area: 'projects_more_popover';
    element: 'rename' | 'duplicate' | 'delete';
    project_id?: string;
    project_kind?: TrackingProjectKind;
}
export interface AutomationsClickProps {
    page_name: 'automations';
    area: 'automations';
    element: 'new_automation' | 'new' | 'view_progress' | 'run_now' | 'open_artifact' | 'type_card' | 'filter_tab' | 'edit' | 'pause' | 'resume' | 'delete' | 'history' | 'cancel' | 'create' | 'save' | 'crystallize' | 'proposal_apply' | 'proposal_reject';
    type_id?: 'orbit' | 'routines' | 'schedules' | 'live_artifacts';
    filter_id?: 'all' | 'scheduled' | 'running' | 'done' | 'orbit' | 'live-artifact' | 'routine' | 'memory' | 'design-system' | 'skills' | 'connectors' | 'compression' | 'release' | 'quality';
    template_kind?: 'orbit' | 'live-artifact' | 'routine';
}
export interface PluginsTopClickProps {
    page_name: 'plugins';
    area: 'plugins';
    element: 'create_plugin' | 'import_plugin' | 'installed_tab' | 'available_tab' | 'sources_tab' | 'team_tab';
}
export interface PluginsInstalledTabClickProps {
    page_name: 'plugins';
    area: 'installed_tab';
    element: 'clear_filters' | 'search_input' | 'filter_chip' | 'templates_details' | 'templates_use' | 'templates_use_dropdown' | 'templates_publish' | 'templates_contribute' | 'create_plugin';
    filter_key?: string;
    filter_name?: string;
    template_id?: string;
    template_type?: string;
}
export interface PluginsTemplatesDropdownClickProps {
    page_name: 'plugins';
    area: 'templates_dropdown';
    element: 'use' | 'use_with_query';
    template_id?: string;
    template_type?: string;
}
export interface PluginsAvailableTabClickProps {
    page_name: 'plugins';
    area: 'available_tab';
    element: 'search_input' | 'details' | 'install' | 'source_dropdown';
    plugin_id?: string;
    plugin_type?: string;
}
export interface PluginsSourcesTabClickProps {
    page_name: 'plugins';
    area: 'sources_tab';
    element: 'source_url_input' | 'add_source' | 'refresh' | 'remove';
    plugin_id?: string;
    plugin_type?: string;
}
export type TrackingPluginImportSource = 'github' | 'zip' | 'folder';
export interface PluginImportModalClickProps {
    page_name: 'plugins';
    area: 'import_modal';
    element: 'source_tab' | 'import' | 'cancel';
    import_source?: TrackingPluginImportSource;
}
export interface PluginDetailClickProps {
    page_name: 'plugins';
    area: 'plugin_detail';
    element: 'back' | 'use_plugin';
    plugin_id?: string;
}
export interface PluginLoopClickProps {
    page_name: 'plugins';
    area: 'plugin_loop';
    element: 'clear_active' | 'submit' | 'card_details' | 'card_use';
    plugin_id?: string;
}
export interface CommunityGalleryClickProps {
    page_name: 'home';
    area: 'community_gallery';
    element: 'card' | 'card_open_external' | 'use_plugin';
    plugin_id?: string;
    plugin_type?: string;
    action?: 'use' | 'use_with_query';
}
export interface PluginDetailModalClickProps {
    page_name: 'home';
    area: 'plugin_detail_modal';
    element: 'use_plugin' | 'use_plugin_dropdown' | 'close';
    plugin_id?: string;
    plugin_type?: string;
}
export interface PluginDetailModalSharePopoverClickProps {
    page_name: 'home';
    area: 'plugin_detail_share_popover';
    element: 'x' | 'reddit' | 'facebook' | 'linkedin' | 'instagram' | 'xiaohongshu' | 'copy_link' | 'copy_share_text' | 'pdf' | 'zip' | 'html' | 'image' | 'open_in_new_tab';
    plugin_id?: string;
    plugin_type?: string;
}
export interface DesignSystemsTopClickProps {
    page_name: 'design_systems';
    area: 'design_systems';
    element: 'search_input' | 'search_dropdown' | 'filter_chip' | 'create';
    filter_name?: string;
    resource_scope?: TrackingWorkspaceScope;
}
export interface DesignSystemsTemplateCardClickProps {
    page_name: 'design_systems';
    area: 'templates_card';
    element: 'templates_card';
    templates_id?: string;
    templates_type?: string;
    resource_scope?: TrackingWorkspaceScope;
}
export interface DesignSystemsTemplatesModalClickProps {
    page_name: 'design_systems';
    area: 'templates_modal';
    element: 'showcase' | 'tokens' | 'design_md' | 'open_design_set' | 'fullscreen' | 'share';
    templates_id?: string;
    templates_type?: string;
}
export interface DesignSystemsTemplatesModalSharePopoverClickProps {
    page_name: 'design_systems';
    area: 'templates_modal_share_popover';
    element: string;
    templates_id?: string;
    templates_type?: string;
}
export interface DesignSystemsCreateClickProps {
    page_name: 'design_systems';
    area: 'design_system_create';
    element: 'source_url_add' | 'figma_url_add' | 'show_access_methods' | 'browse_folder' | 'upload_fig' | 'add_assets' | 'start_from_brand' | 'continue_to_generation' | 'back';
    methods_expanded?: boolean;
}
export interface DesignSystemsPresetBrandPickerClickProps {
    page_name: 'design_systems';
    area: 'preset_brand_picker';
    element: 'brand_pick' | 'quick_pick' | 'close';
    preset_brand_category?: string;
    is_quick_pick?: boolean;
}
export interface DesignSystemsPresetBrandPickerSurfaceViewProps {
    page_name: 'design_systems';
    area: 'preset_brand_picker';
}
export interface DesignSystemEditClickProps {
    page_name: 'design_systems' | 'design_system_project';
    area: 'design_system_edit';
    element: 'edit_with_agent' | 'refresh' | 'download' | 'logo_upload' | 'logo_delete' | 'design_md_copy' | 'design_md_edit' | 'design_md_upload' | 'font_upload' | 'color_edit' | 'image_upload' | 'image_delete' | 'kit_refresh' | 'kit_download' | 'kit_import' | 'kit_reset' | 'kit_open' | 'brand_card_use_in_chat' | 'brand_card_open_project' | 'brand_card_delete';
    module?: 'logo' | 'design_md' | 'typography' | 'palette' | 'images' | 'kit' | 'brand_card' | 'general';
    edit_surface?: TrackingDesignSystemEditSurface;
    artifact_kind?: 'design_system';
    design_system_id?: string;
    project_id?: string;
    resource_scope?: TrackingWorkspaceScope;
}
export interface IntegrationsTabClickProps {
    page_name: 'integrations';
    area: 'integrations_tab';
    element: 'mcp' | 'connectors' | 'skills' | 'use_everywhere';
}
export type TrackingExternalMcpElement = 'add_server' | 'pick_template' | 'pick_blank' | 'remove_server' | 'saved';
export interface IntegrationsMcpTabClickProps {
    page_name: 'integrations';
    area: 'mcp_tab';
    element: TrackingExternalMcpElement;
    template_id?: string;
}
export interface IntegrationsConnectorsTabClickProps {
    page_name: 'integrations';
    area: 'connectors_tab';
    element: 'api_key_input' | 'save_key' | 'clear' | 'get_api_key' | 'gate_card' | 'provider_chip' | 'search_connectors';
}
export interface IntegrationsSkillsTabClickProps {
    page_name: 'integrations';
    area: 'skills_tab';
    element: 'coming_soon';
}
export interface IntegrationsUseEverywhereTabClickProps {
    page_name: 'integrations';
    area: 'use_everywhere_tab';
    element: 'overview' | 'cli_od' | 'mcp_server' | 'http_api' | 'skills_headless' | 'configure_mcp_server' | 'copy_guide_for_agent' | 'copy';
}
export interface ChatPanelClickProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'history' | 'new_chat' | 'back' | 'template_card' | 'chat_input' | 'composer_settings' | 'attachment' | 'library' | 'figma_import' | 'figma_help' | 'send' | 'mention_popover_trigger' | 'resources_popover_trigger';
}
export type TrackingSessionMode = 'ask' | 'design' | 'plan';
export interface ComposerSessionModeClickProps {
    page_name: 'home' | 'chat_panel';
    area: 'chat_composer';
    element: 'session_mode_toggle';
    mode_before: TrackingSessionMode;
    mode_after: TrackingSessionMode;
    project_id?: string;
}
export interface DesignToolboxClickProps {
    page_name: 'chat_panel';
    area: 'chat_composer';
    element: 'design_toolbox_open' | 'design_toolbox_action' | 'design_toolbox_resource';
    toolbox_action_id?: string;
    resource_kind?: 'skill' | 'plugin' | 'mcp' | 'mcp-template' | 'connector' | 'file';
    resource_id?: string;
    project_id?: string;
}
export interface ComposerBarClickProps {
    page_name: 'chat_panel';
    area: 'chat_composer';
    element: 'plus_menu_open' | 'plus_pick' | 'plus_add' | 'plus_submenu_open' | 'plus_search' | 'design_system_open' | 'design_system_switch' | 'working_dir' | 'working_dir_recent' | 'working_dir_clear' | 'agent_selector_open' | 'agent_select' | 'agent_model_select' | 'context_remove';
    resource_kind?: 'connector' | 'plugin' | 'mcp' | 'skill' | 'workspace' | 'attachment';
    resource_id?: string;
    agent_id?: string;
    model_id?: string;
    design_system_id?: string;
    project_id?: string;
}
export interface NextStepActionClickProps {
    page_name: 'chat_panel';
    area: 'next_step';
    element: 'next_step_exposed' | 'share' | 'chip' | 'toolbox_action' | 'toolbox_more' | 'share_to_open_design'
    /**
     * One of the agent-written follow-up suggestions under a delivered turn.
     * Unlike every element above it, clicking this SENDS the row's sentence as
     * the user's next message, so its click-through is literally the
     * second-turn rate. `chip_id` carries the row's 0-based position, never the
     * text — the text is model-written prose about the user's own project and
     * has no business in an analytics payload.
     */
     | 'suggestion';
    chip_id?: string;
}
export interface QuestionsFormClickProps {
    page_name: 'chat_panel';
    area: 'questions_form';
    element: 'task_type_chip' | 'brand_bg_chip' | 'skip' | 'submit' | 'visual_style_card' | 'visual_style_refresh' | 'step_back' | 'step_next' | 'step_skip';
    chip_id?: string;
    skip_source?: 'button' | 'countdown';
    answered_count?: number;
    skipped_count?: number;
    form_id?: string;
    question_id?: string;
    style_id?: string;
    style_context?: 'deck' | 'prototype' | 'document' | 'image' | 'video';
    interaction_source?: 'inline';
    step_index?: number;
    step_count?: number;
    project_id: string;
}
export interface RunFailedToastClickProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'go_amr';
}
export interface RunRecoveryActionClickProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'run_recovery_action';
    task_execution_id: string;
    recovery_action_instance_id: string;
    recovery_action_type: TrackingRunRecoveryActionType;
    source_run_id?: string;
    source_agent_provider_id?: string;
    source_model_id?: string;
    failure_category?: string;
    failure_reason?: string;
    target_agent_provider_id?: string;
    target_model_id?: string;
}
export interface AmrEntryClickProps {
    page_name: TrackingPageName;
    area: 'amr_entry';
    element: TrackingAmrEntrySource;
    action: 'click_amr_entry';
    entry_id: string;
    source_product: 'open_design';
    source_detail: TrackingAmrEntrySource;
    entry_occurred_at: string;
    campaign_id?: TrackingCampaignId;
    conversion_source?: TrackingCampaignConversionSource;
}
export interface DeepSeekCampaignModalClickProps {
    page_name: 'home';
    area: 'deepseek_campaign_modal';
    element: 'close' | 'later' | 'use_now' | 'upgrade';
    campaign_id: TrackingCampaignId;
    user_state: TrackingCampaignUserState;
}
export interface GoPlanSunsetModalClickProps {
    page_name: 'home';
    area: 'go_plan_sunset_modal';
    element: 'view_other_subscriptions' | 'acknowledge' | 'close';
    close_method?: 'unknown';
    campaign_id: 'go_plan_sunset_202608';
    announcement_version: '2026_08_25';
    delivery_mode: TrackingCampaignDeliveryMode;
    current_plan_id: string;
    locale: string;
}
export interface DeepSeekCampaignBadgeClickProps {
    page_name: 'home';
    area: 'campaign_badge';
    element: 'open_pricing';
    campaign_id: TrackingCampaignId;
    user_state: TrackingCampaignUserState;
}
export interface AmrAuthResultProps {
    page_name: TrackingPageName;
    area: 'amr_auth';
    result: 'success' | 'failed' | 'cancelled' | 'timeout';
    error_code?: string;
    duration_ms: number;
    entry_id?: string;
    source_detail?: TrackingAmrEntrySource;
    auth_attempt_id?: string;
    last_stage?: import('./amr-auth.js').AmrAuthStage;
    last_stage_result?: import('./amr-auth.js').AmrAuthStageResult;
    last_error_kind?: import('./amr-auth.js').AmrAuthErrorKind;
    network_path?: import('./amr-auth.js').AmrAuthNetworkPath;
    fallback_used?: boolean;
}
export interface ChatPanelResourcesPopoverClickProps {
    page_name: 'chat_panel';
    area: 'resources_popover';
    element: 'plugins_tab' | 'skills_tab' | 'mcp_tab' | 'users_tab' | 'files_tab' | 'official' | 'my_plugins' | 'search_input' | 'template_card' | 'customize_in_settings';
}
export interface ChatPanelMessageQueueClickProps {
    page_name: 'chat_panel';
    area: 'message_queue';
    element: 'edit' | 'send_now' | 'delete' | 'steer';
    project_id: string;
    queue_length: number;
}
export interface FileManagerClickProps {
    page_name: 'file_manager';
    area: 'file_manager';
    element: 'new_sketch' | 'open_sketch' | 'new_browser' | 'create_design_system' | 'create_design_system_from_project' | 'duplicate_project' | 'paste' | 'upload' | 'library' | 'select_all_on_page' | 'select_everything' | 'download_as_zip' | 'delete' | 'previous' | 'next' | 'per_page_dropdown';
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface TabLauncherClickProps {
    page_name: 'file_manager';
    area: 'tab_launcher';
    element: 'open' | 'filter' | 'create' | 'open_file' | 'open_tab';
    action_id?: string;
    kind_filter?: string;
    file_kind?: string;
    tab_kind?: string;
    project_id?: string;
}
export type TrackingReferenceBoardCategory = 'all' | 'inspiration' | 'interfaces' | 'motion' | 'color' | 'type' | 'icons' | 'illustration' | 'photography' | '3d' | 'mockups' | 'systems' | 'components' | 'guidelines' | 'tools';
export interface ReferenceBoardClickProps {
    page_name: 'file_manager';
    area: 'reference_board';
    element: 'category_chip' | 'open_site' | 'search_input';
    category_id?: TrackingReferenceBoardCategory;
    site_id?: string;
    project_id?: string;
}
export interface ArtifactToolbarClickProps {
    page_name: 'artifact';
    area: 'artifact_toolbar';
    element: 'reload' | 'preview' | 'source' | 'screenshot' | 'edit_screenshot' | 'tweaks' | 'mark' | 'comment' | 'pods' | 'inspect' | 'edit' | 'zoom_out' | 'zoom_level_dropdown' | 'zoom_in' | 'versions';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    entry_from?: 'toolbar' | 'more_menu';
}
export interface DrawToolbarClickProps {
    page_name: 'artifact';
    area: 'draw_toolbar';
    element: 'rect' | 'pen' | 'text' | 'undo' | 'redo' | 'attach_image' | 'annotation_submit' | 'exit';
    submit_action?: 'draft' | 'queue' | 'send';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface TweaksPopoverClickProps {
    page_name: 'artifact';
    area: 'tweaks_popover';
    element: 'variant_option';
    variant_name?: string;
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    status_before: 'on' | 'off';
    status_after: 'on' | 'off';
}
export interface CommentPopoverClickProps {
    page_name: 'artifact';
    area: 'comment_popover';
    element: 'save_comment' | 'send_to_chat' | 'add_note';
    /** Saved comments selected at click time; does not imply queue acceptance. */
    submitted_comment_ids?: string[];
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface ArtifactHeaderClickProps {
    page_name: 'artifact';
    area: 'artifact_header';
    element: 'back' | 'edit' | 'present_dropdown' | 'download_dropdown' | 'share_dropdown' | 'settings';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export declare const TRACKING_HANDOFF_TARGET_IDS: readonly ['cursor', 'vscode', 'windsurf', 'zed', 'qoder', 'antigravity', 'webstorm', 'idea', 'xcode', 'finder', 'explorer', 'file-manager', 'terminal', 'warp', 'amr', 'claude', 'codex', 'opencode', 'cursor-agent', 'gemini', 'qwen', 'copilot', 'grok-build', 'deepseek', 'kimi', 'hermes', 'devin', 'kiro', 'kilo', 'vibe', 'aider', 'trae-cli', 'pi', 'reasonix'];
export type TrackingHandoffTargetId = (typeof TRACKING_HANDOFF_TARGET_IDS)[number] | 'other';
export declare function handoffTargetIdToTracking(id: string | null | undefined): TrackingHandoffTargetId;
export interface HandoffClickProps {
    page_name: 'artifact';
    area: 'handoff';
    element: 'trigger' | 'caret' | 'tab' | 'framework' | 'copy_path' | 'open_editor' | 'copy_cli_prompt' | 'amr_website';
    target_id?: TrackingHandoffTargetId;
    target_available?: boolean;
    handoff_tab?: 'editor' | 'cli';
    framework?: 'react' | 'vue' | 'svelte' | 'solid' | 'next' | 'vanilla';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface PresentPopoverClickProps {
    page_name: 'artifact';
    area: 'present_popover';
    element: 'in_this_tab' | 'fullscreen' | 'new_tab' | 'start_from_beginning' | 'start_from_current' | 'presenter_mode';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
}
export interface DeckViewerClickProps {
    page_name: 'artifact';
    area: 'deck_viewer';
    element: 'slide_prev' | 'slide_next' | 'slide_reset' | 'thumbnail_select' | 'thumbnail_rail_toggle' | 'speaker_notes_edit';
    artifact_id?: string;
    artifact_kind?: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    action?: 'expand' | 'collapse';
    slide_index?: number;
    slide_count?: number;
}
export interface ShareGuideClickProps {
    page_name: 'artifact';
    area: 'share_guide';
    element: 'try_share' | 'close' | 'never_show_again';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    artifact_id: string;
}
export interface ShareOptionPopoverClickProps {
    page_name: 'artifact';
    area: 'share_option_popover';
    element: TrackingExportFormat | 'publish_required_guide' | 'publish_file' | 'copy_publish_link';
    /** Existing stable alias at click time, if known. */
    publish_id?: string;
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind | null;
}
export type TrackingFileVersionSource = 'ai' | 'manual' | 'restore' | 'sync';
export interface FileVersionModalClickProps {
    page_name: 'artifact';
    area: 'file_version_modal';
    element: 'version_item' | 'viewport_toggle' | 'prompt_toggle' | 'copy_prompt' | 'open_in_new_tab' | 'restore' | 'restore_confirm' | 'restore_cancel';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    version_source?: TrackingFileVersionSource;
    version_is_current?: boolean;
    viewport?: 'desktop' | 'tablet' | 'mobile';
    version_count?: number;
}
export interface AssistantFeedbackButtonClickProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'assistant_feedback_button';
    action: 'submit_feedback_rating' | 'clear_feedback_rating';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id: string;
    agent_provider_id: TrackingFeedbackProviderId;
    model_id: string;
    rating: 'positive' | 'negative';
    rating_before: 'positive' | 'negative' | 'none';
    has_produced_files: boolean;
}
export interface AssistantFeedbackReasonSubmitClickProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'assistant_feedback_reason_submit_button';
    action: 'click_submit_feedback_reason';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id: string;
    agent_provider_id: TrackingFeedbackProviderId;
    model_id: string;
    rating: 'positive' | 'negative';
    reason?: string;
    reason_count: number;
    has_custom_reason: boolean;
    custom_reason?: string;
}
export type TrackingConversationForkPoint = 'latest' | 'historical' | 'unknown';
export interface ConversationForkAnalyticsContext {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'assistant_fork_button';
    action: 'fork_conversation';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string;
    assistant_message_id: string;
    source_run_id: string | null;
    source_agent_id: string;
    agent_provider_id: string;
    session_mode: TrackingSessionMode;
    fork_point: TrackingConversationForkPoint;
    seed_message_count: number | null;
    conversation_message_count: number;
    messages_after_fork_count: number | null;
}
export type ConversationForkClickProps = ConversationForkAnalyticsContext;
export type TrackingSettingsArea = 'configure_execution_mode' | 'configure_execution_mode_local_cli' | 'configure_execution_mode_byok' | 'instructions' | 'memory' | 'media_providers' | 'skills' | 'design_review' | 'external_mcp' | 'connectors' | 'orbit' | 'mcp_server' | 'language' | 'appearance' | 'notifications' | 'pets' | 'design_systems' | 'project_locations' | 'privacy' | 'labs' | 'about';
export interface SettingsSidebarClickProps {
    page_name: TrackingSettingsPage;
    area: 'settings_sidebar';
    element: TrackingSettingsArea;
}
export interface SettingsExecutionModeTabClickProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode';
    element: 'execution_mode_tab';
    action: 'switch_execution_mode';
    mode_before: TrackingExecutionMode;
    mode_after: TrackingExecutionMode;
}
export interface SettingsLocalCliClickProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode_local_cli';
    element: 'test' | 'rescan' | 'cli_provider' | 'install' | 'docs';
    cli_provider_id?: TrackingCliProviderId;
    install_status?: 'installed' | 'not_installed' | 'unknown';
}
export interface SettingsByokProviderOptionClickProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode_byok';
    element: 'byok_provider_option';
    action: 'select_byok_provider';
    provider_id: TrackingByokProviderId;
    is_selected: boolean;
}
export interface SettingsByokFieldClickProps {
    page_name: TrackingSettingsPage;
    area: 'configure_execution_mode_byok';
    element: 'fetch_models' | 'test' | 'quick_fill_provider' | 'api_key' | 'model' | 'memory_model' | 'base_url';
    provider_id: TrackingByokProviderId;
    has_value?: boolean;
}
export interface SettingsMediaProvidersClickProps {
    page_name: TrackingSettingsPage;
    area: 'media_providers';
    element: 'reload' | 'key_input' | 'url_input' | 'clear';
    providers_id?: string;
    is_configured?: boolean;
}
export interface SettingsConnectorsClickProps {
    page_name: TrackingSettingsPage;
    area: 'connectors';
    element: 'api_key_input' | 'save_key' | 'clear' | 'get_api_key' | 'gate_card' | 'provider_chip' | 'search_connectors';
    connector_id?: string;
}
export interface SettingsLanguageClickProps {
    page_name: TrackingSettingsPage;
    area: 'language';
    element: string;
}
export interface SettingsNotificationsClickProps {
    page_name: TrackingSettingsPage;
    area: 'notifications';
    element: 'completion_sound' | 'desktop_notification' | 'send_test' | 'success_sound' | 'failure_sound';
    sound_id?: 'ding' | 'chime' | 'two_tone_up' | 'pluck' | 'buzz' | 'two_tone_down' | 'thud';
    completion_sound_status?: 'on' | 'off';
    desktop_notification_status?: 'on' | 'off';
}
export interface SettingsPetsClickProps {
    page_name: TrackingSettingsPage;
    area: 'pets';
    element: 'tuck_away' | 'built_in' | 'custom' | 'community' | 'custom_card' | 'adopt';
    pet_id?: string;
}
export interface SettingsPrivacyClickProps {
    page_name: TrackingSettingsPage;
    area: 'privacy';
    element: 'anonymous_metrics' | 'conversation_and_tool_content' | 'delete_my_data';
    anonymous_metrics_status?: 'on' | 'off';
    conversation_and_tool_content_status?: 'on' | 'off';
}
export interface SettingsDesignReviewClickProps {
    page_name: TrackingSettingsPage;
    area: 'design_review';
    element: 'enable_toggle';
    status_before: 'on' | 'off';
    status_after: 'on' | 'off';
    has_active_project: boolean;
}
export interface SettingsExternalMcpClickProps {
    page_name: TrackingSettingsPage;
    area: 'external_mcp';
    element: TrackingExternalMcpElement;
    template_id?: string;
}
export type UiClickProps = EntryNavigationClickProps | AccountMenuClickProps | WorkspaceSwitcherClickProps | WorkspaceInviteClickProps | ProjectCollectionClickProps | CommunityTemplateClickProps | ExtensionMarketplaceClickProps | HomeNavClickProps | HelpPopoverClickProps | HomeToolbarClickProps | ExecutionSettingsPopoverClickProps | SettingsPopoverClickProps | HomeChatComposerClickProps | HomeRecommendationClickProps | StudioOnboardingHintClickProps | UpdateIndicatorClickProps | WhatsNewPopupClickProps | NewProjectModalTabClickProps | NewProjectModalElementClickProps | PluginReplacementModalClickProps | PrivacyModalClickProps | RecentProjectsClickProps | HomeTemplatesClickProps | HomeTemplatesDropdownClickProps | ProjectsListControlsClickProps | ProjectsListClickProps | ProjectsMorePopoverClickProps | AutomationsClickProps | PluginsTopClickProps | PluginsInstalledTabClickProps | PluginsTemplatesDropdownClickProps | PluginsAvailableTabClickProps | PluginsSourcesTabClickProps | PluginImportModalClickProps | PluginDetailClickProps | PluginLoopClickProps | CommunityGalleryClickProps | PluginDetailModalClickProps | PluginDetailModalSharePopoverClickProps | DesignSystemsTopClickProps | DesignSystemsTemplateCardClickProps | DesignSystemsTemplatesModalClickProps | DesignSystemsTemplatesModalSharePopoverClickProps | DesignSystemsCreateClickProps | DesignSystemsPresetBrandPickerClickProps | DesignSystemEnrichClickProps | DesignSystemEditClickProps | IntegrationsTabClickProps | IntegrationsMcpTabClickProps | IntegrationsConnectorsTabClickProps | IntegrationsSkillsTabClickProps | IntegrationsUseEverywhereTabClickProps | ChatPanelClickProps | ComposerSessionModeClickProps | DesignToolboxClickProps | ComposerBarClickProps | NextStepActionClickProps | QuestionsFormClickProps | RunFailedToastClickProps | RunRecoveryActionClickProps | AmrEntryClickProps | DeepSeekCampaignModalClickProps | GoPlanSunsetModalClickProps | DeepSeekCampaignBadgeClickProps | ChatPanelResourcesPopoverClickProps | ChatPanelMessageQueueClickProps | FileManagerClickProps | TabLauncherClickProps | ReferenceBoardClickProps | ArtifactToolbarClickProps | DrawToolbarClickProps | TweaksPopoverClickProps | CommentPopoverClickProps | ArtifactHeaderClickProps | HandoffClickProps | PresentPopoverClickProps | DeckViewerClickProps | ShareOptionPopoverClickProps | ShareGuideClickProps | FileVersionModalClickProps | ConversationForkClickProps | AssistantFeedbackButtonClickProps | AssistantFeedbackReasonSubmitClickProps | SettingsSidebarClickProps | SettingsExecutionModeTabClickProps | SettingsLocalCliClickProps | SettingsByokProviderOptionClickProps | SettingsByokFieldClickProps | SettingsMediaProvidersClickProps | SettingsConnectorsClickProps | SettingsLanguageClickProps | SettingsNotificationsClickProps | SettingsPetsClickProps | SettingsPrivacyClickProps | SettingsDesignReviewClickProps | SettingsExternalMcpClickProps | OnboardingClickProps;
//# sourceMappingURL=ui-click.d.ts.map