/**
 * @module analytics/events/surface-view
 * surface_view event prop types and their union.
 */
import type { TrackingOnboardingFirstLoopStep, TrackingOnboardingProductType, TrackingOnboardingRole, TrackingOnboardingUseCase } from './onboarding.js';
import type { TrackingRunRecoveryActionType } from './result-events.js';
import type { TrackingArtifactKind, TrackingCampaignDeliveryMode, TrackingCampaignId, TrackingCampaignUserState, TrackingNewProjectTab, TrackingProjectKind, TrackingRunFailureCategory } from './shared-enums.js';
import type { DesignSystemsPresetBrandPickerSurfaceViewProps } from './ui-click.js';
import type { WorkspaceSurfaceViewProps } from './workspace.js';
export interface HelpPopoverSurfaceViewProps {
    page_name: 'home';
    area: 'help_resources_popover';
}
export interface SettingsPopoverSurfaceViewProps {
    page_name: 'home' | 'artifact';
    area: 'settings_popover';
}
export interface NewProjectModalSurfaceViewProps {
    page_name: 'home';
    area: 'new_project_modal';
    tab_name: TrackingNewProjectTab;
}
export interface PluginReplacementModalSurfaceViewProps {
    page_name: 'home';
    area: 'plugin_replacement_modal';
}
export interface DeepSeekCampaignModalSurfaceViewProps {
    page_name: 'home';
    area: 'deepseek_campaign_modal';
    element: 'modal';
    campaign_id: TrackingCampaignId;
    user_state: TrackingCampaignUserState;
}
export interface GoPlanSunsetModalSurfaceViewProps {
    page_name: 'home';
    area: 'go_plan_sunset_modal';
    element: 'modal';
    campaign_id: 'go_plan_sunset_202608';
    announcement_version: '2026_08_25';
    delivery_mode: TrackingCampaignDeliveryMode;
    current_plan_id: string;
    locale: string;
}
export interface DeepSeekCampaignBadgeSurfaceViewProps {
    page_name: 'home';
    area: 'campaign_badge';
    element: 'deepseek_v4_flash' | 'deepseek_v4_pro';
    campaign_id: TrackingCampaignId;
    user_state: TrackingCampaignUserState;
}
export interface DeepSeekCampaignModelBenefitSurfaceViewProps {
    page_name: 'home';
    area: 'execution_settings_popover';
    element: 'deepseek_v4_flash_benefit' | 'deepseek_v4_pro_benefit';
    campaign_id: TrackingCampaignId;
    user_state: TrackingCampaignUserState;
    model_id: string;
}
export interface PluginDetailModalSurfaceViewProps {
    page_name: 'home';
    area: 'plugin_detail_modal';
    plugin_id?: string;
    plugin_type?: string;
}
export interface PluginImportModalSurfaceViewProps {
    page_name: 'plugins';
    area: 'import_modal';
}
export interface ProjectReferenceModalSurfaceViewProps {
    page_name: 'home' | 'chat_panel';
    area: 'project_reference_modal';
    project_id?: string;
}
export interface FigmaHelpModalSurfaceViewProps {
    page_name: 'home' | 'chat_panel';
    area: 'figma_help_modal';
    project_id?: string;
}
export interface DesignSystemsTemplatesModalSurfaceViewProps {
    page_name: 'design_systems';
    area: 'templates_modal';
    templates_id?: string;
    templates_type?: string;
}
export interface RunFailedToastSurfaceViewProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'run_failed_toast';
    error_code: string;
    /**
     * WHICH SENTENCE the user actually read: the i18n key of the mapped copy,
     * or `generic_fallback` when the mapping table had no line for this failure
     * and the card fell back to "the task failed".
     *
     * Always present, never omitted. The fallback rate — how often we show a
     * failed user a blank apology instead of a diagnosis — is the whole point,
     * and a rate needs a denominator: an omitted key would silently drop the
     * fallback impressions out of the count that is supposed to measure them.
     *
     * Not typed as the web's `RunFailureMessageKey` union: that union lives in
     * `apps/web` and grows every time copy is added, and pinning it here would
     * make a copy change a contracts change.
     */
    message_key: string;
    /**
     * The daemon's own classification of the failure, as carried on the run's
     * error event. `unknown` when the event carries none — the enum's existing
     * member for exactly that, so the field stays present and the shape stays
     * one that `run_finished` / `run_recovery_action` can be joined against.
     */
    failure_category: TrackingRunFailureCategory;
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id: string | null;
}
export interface RunRecoveryActionSurfaceViewProps {
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
}
export interface RunStartBlockedSurfaceViewProps {
    page_name: 'chat_panel';
    area: 'chat_composer';
    element: 'run_start_blocked';
    task_execution_id: string;
    recovery_action_instance_id: string;
    block_reason: string;
    agent_provider_id: string;
    model_id: string;
}
export interface PreviewRunStatusSurfaceViewProps {
    page_name: 'file_manager';
    area: 'preview_run_status';
    element: 'run_status_bar';
    status: 'generating' | 'verifying' | 'succeeded' | 'failed';
    delivery_state?: 'delivered' | 'no_result' | 'delivery_failed';
    project_id: string;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id?: string;
}
export interface AssistantFeedbackReasonPanelSurfaceViewProps {
    page_name: 'chat_panel';
    area: 'chat_panel';
    element: 'assistant_feedback_reason_panel';
    view_type: 'panel';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    conversation_id: string | null;
    assistant_message_id: string;
    run_id: string;
    rating: 'positive' | 'negative';
}
export interface QuestionsFormSurfaceViewProps {
    page_name: 'chat_panel';
    area: 'questions_form';
    project_id: string;
    form_id?: string;
}
export interface ReferenceBoardSurfaceViewProps {
    page_name: 'file_manager';
    area: 'reference_board';
    project_id?: string;
}
export interface UpdateIndicatorSurfaceViewProps {
    page_name: 'home';
    area: 'update_indicator';
    app_version_before?: string;
    app_version_after?: string;
}
export interface UpdatePromptSurfaceViewProps {
    page_name: 'home' | 'app';
    area: 'update_prompt' | 'update_dialog';
    app_version_before?: string;
    app_version_after?: string;
}
export interface WhatsNewPopupSurfaceViewProps {
    page_name: 'home';
    area: 'whats_new_popup';
    app_version: string;
    /** True when release-configured highlights were shown, false for the generic fallback copy. */
    has_release_notes: boolean;
}
export interface FileVersionModalSurfaceViewProps {
    page_name: 'artifact';
    area: 'file_version_modal';
    entry_from: 'toolbar' | 'more_menu';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
}
export interface DeckViewerSurfaceViewProps {
    page_name: 'artifact';
    area: 'deck_viewer';
    artifact_id: string;
    artifact_kind: TrackingArtifactKind;
    project_id: string;
    project_kind: TrackingProjectKind;
    slide_count?: number;
}
export interface HomeRecommendationSurfaceViewProps {
    page_name: 'home';
    area: 'onboarding_recommendation';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
    role?: TrackingOnboardingRole;
    use_cases?: TrackingOnboardingUseCase[];
}
export interface StudioOnboardingHintSurfaceViewProps {
    page_name: 'chat_panel';
    area: 'onboarding_first_artifact_hint';
    hint_type: 'view_artifact';
    studio_stage?: TrackingOnboardingFirstLoopStep;
    feature_id?: string;
}
export interface ShareGuideSurfaceViewProps {
    page_name: 'artifact';
    area: 'share_guide';
    project_id: string;
    project_kind: TrackingProjectKind | null;
    artifact_id: string;
}
export type SurfaceViewProps = ShareGuideSurfaceViewProps | WorkspaceSurfaceViewProps | RunFailedToastSurfaceViewProps | RunRecoveryActionSurfaceViewProps | RunStartBlockedSurfaceViewProps | PreviewRunStatusSurfaceViewProps | DeepSeekCampaignModalSurfaceViewProps | GoPlanSunsetModalSurfaceViewProps | DeepSeekCampaignBadgeSurfaceViewProps | DeepSeekCampaignModelBenefitSurfaceViewProps | HomeRecommendationSurfaceViewProps | StudioOnboardingHintSurfaceViewProps | HelpPopoverSurfaceViewProps | SettingsPopoverSurfaceViewProps | NewProjectModalSurfaceViewProps | PluginReplacementModalSurfaceViewProps | PluginDetailModalSurfaceViewProps | PluginImportModalSurfaceViewProps | ProjectReferenceModalSurfaceViewProps | FigmaHelpModalSurfaceViewProps | DesignSystemsTemplatesModalSurfaceViewProps | DesignSystemsPresetBrandPickerSurfaceViewProps | AssistantFeedbackReasonPanelSurfaceViewProps | QuestionsFormSurfaceViewProps | UpdateIndicatorSurfaceViewProps | ReferenceBoardSurfaceViewProps | UpdatePromptSurfaceViewProps | WhatsNewPopupSurfaceViewProps | FileVersionModalSurfaceViewProps | DeckViewerSurfaceViewProps;
//# sourceMappingURL=surface-view.d.ts.map