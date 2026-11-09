/**
 * @module analytics/events/onboarding
 * Onboarding analytics event prop types.
 */
import type { TrackingRuntimeType } from '../public-params.js';
import type { TrackingCliProviderId } from './shared-enums.js';
export type TrackingChatPanelPageViewSource = 'new_project' | 'chat_composer' | 'recent_project' | 'projects_list' | 'template' | 'automation' | 'deeplink' | 'reload' | 'unknown';
export type TrackingOnboardingArea = 'runtime' | 'model_source' | 'runtime_setup' | 'about_you' | 'newsletter' | 'design_system'
/** @deprecated legacy onboarding final-step area; use `design_system`. */
 | 'brand' | 'generation_progress';
export type TrackingOnboardingStepIndex = '1' | '2' | '3' | '4' | 'progress';
export type TrackingOnboardingStepName = 'connect' | 'model_source' | 'runtime_setup' | 'about_you' | 'newsletter' | 'design_system'
/** @deprecated legacy onboarding final-step name; use `design_system`. */
 | 'brand_extract' | 'generation';
export type TrackingOnboardingRuntimeType = TrackingRuntimeType;
export type TrackingOnboardingSourceType = 'text' | 'github_repo' | 'local_code' | 'fig' | 'assets' | 'mixed' | 'none';
export type TrackingOnboardingCompletionResult = 'completed'
/** @deprecated no longer emitted — Skip was removed from onboarding. */
 | 'skipped' | 'cancelled' | 'failed';
export type TrackingOnboardingCompletionType = 'completed_with_design_system' | 'completed_without_design_system'
/** @deprecated no longer emitted — Skip was removed from onboarding. */
 | 'skipped';
export type TrackingOnboardingScanResult = 'success' | 'failed' | 'timeout';
export type TrackingOnboardingOrganizationSize = string;
export type TrackingOnboardingUseCase = string;
export type TrackingOnboardingDiscoverySource = string;
export type TrackingOnboardingRole = string;
export type TrackingOnboardingProductType = 'product_ui' | 'marketing' | 'internal_tool' | 'general';
export interface OnboardingPageViewProps {
    page_name: 'onboarding';
    area: TrackingOnboardingArea;
    step_index: TrackingOnboardingStepIndex;
    step_name: TrackingOnboardingStepName;
    onboarding_session_id: string;
}
export type TrackingOnboardingClickElement = 'amr_cloud' | 'local_coding_agent' | 'byok' | 'continue' | 'back'
/** @deprecated no longer emitted — Skip was removed from onboarding. */
 | 'skip' | 'generate' | 'role' | 'organization_size' | 'use_case' | 'hear_about_us' | 'newsletter_email' | 'about_you_submit' | 'github_repo' | 'local_code' | 'fig_upload' | 'assets_upload' | 'show_access_methods';
export type TrackingOnboardingClickAction = 'select_runtime' | 'continue' | 'back'
/** @deprecated no longer emitted — Skip was removed from onboarding. */
 | 'skip' | 'generate' | 'select_option' | 'add_source' | 'upload_source' | 'show_access_methods' | 'subscribe';
export interface OnboardingClickProps {
    page_name: 'onboarding';
    area: TrackingOnboardingArea;
    element: TrackingOnboardingClickElement;
    action: TrackingOnboardingClickAction;
    step_index: TrackingOnboardingStepIndex;
    step_name: TrackingOnboardingStepName;
    onboarding_session_id: string;
    runtime_type?: TrackingOnboardingRuntimeType;
    is_recommended?: boolean;
    role?: TrackingOnboardingRole;
    organization_size?: TrackingOnboardingOrganizationSize;
    use_case?: TrackingOnboardingUseCase;
    use_cases?: TrackingOnboardingUseCase[];
    discovery_source?: TrackingOnboardingDiscoverySource;
    source_type?: TrackingOnboardingSourceType;
    has_brand_description?: boolean;
    source_count?: number;
    newsletter_opt_in?: boolean;
}
export interface OnboardingRuntimeScanResultProps {
    page_name: 'onboarding';
    area: 'runtime';
    runtime_type: 'local_cli';
    result: TrackingOnboardingScanResult;
    detected_cli_count: number;
    available_cli_count: number;
    selected_cli_id?: TrackingCliProviderId;
    error_code?: string;
    duration_ms: number;
    onboarding_session_id: string;
}
export interface OnboardingCompleteResultProps {
    page_name: 'onboarding';
    area: 'onboarding';
    result: TrackingOnboardingCompletionResult;
    exit_step_name: TrackingOnboardingStepName;
    completion_type: TrackingOnboardingCompletionType;
    runtime_type: TrackingOnboardingRuntimeType;
    has_about_you: boolean;
    has_design_system_request: boolean;
    source_count: number;
    error_code?: string;
    duration_ms: number;
    onboarding_session_id: string;
    role?: TrackingOnboardingRole;
    organization_size?: TrackingOnboardingOrganizationSize;
    use_cases?: TrackingOnboardingUseCase[];
    discovery_source?: TrackingOnboardingDiscoverySource;
}
export interface OnboardingPromptPrefilledProps {
    entry_source: 'home_recommendation';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
    role?: TrackingOnboardingRole;
    use_cases?: TrackingOnboardingUseCase[];
}
export interface OnboardingFirstPromptSentProps {
    entry_source: 'home_recommendation';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
    has_prefilled_prompt: boolean;
}
export interface OnboardingFirstGenerationCompletedProps {
    entry_source: 'home_recommendation';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
}
export type TrackingOnboardingFirstLoopStep = 'prompt_sent' | 'generated' | 'artifact_viewed' | 'delivered';
export interface OnboardingCompletedProps {
    entry_source: 'home_recommendation';
    product_type: TrackingOnboardingProductType;
    recommendation_id: string;
    completed_steps: TrackingOnboardingFirstLoopStep[];
}
//# sourceMappingURL=onboarding.d.ts.map