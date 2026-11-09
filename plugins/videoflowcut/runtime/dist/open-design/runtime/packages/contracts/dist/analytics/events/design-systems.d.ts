/**
 * @module analytics/events/design-systems
 * Design-system analytics enums and lifecycle result prop types.
 */
import type { TrackingProjectKind } from './shared-enums.js';
import type { TrackingWorkspaceScope } from './workspace.js';
export type TrackingDesignSystemsArea = 'design_system_list' | 'design_system_create' | 'design_system_generation' | 'design_system_preview' | 'design_system_picker' | 'preset_brand_picker' | 'design_system_enrich' | 'composer';
export type TrackingDesignSystemsViewType = 'page' | 'panel' | 'dialog' | 'popover' | 'module';
export type TrackingDesignSystemsEntryFrom = 'onboarding' | 'design_systems_page' | 'home_card' | 'composer_picker' | 'project_settings' | 'project_canvas' | 'library' | 'unknown';
export type TrackingDesignSystemOrigin = 'onboarding' | 'manual_create' | 'source_url' | 'github_repo' | 'local_code' | 'fig' | 'assets' | 'official_preset' | 'enterprise' | 'template' | 'mixed' | 'unknown';
export type TrackingDesignSystemStatus = 'draft' | 'generating' | 'ready' | 'published' | 'default' | 'failed' | 'archived' | 'unknown';
export type TrackingDesignSystemKind = 'official' | 'custom' | 'unknown';
export type TrackingDesignSystemEditSurface = 'chat' | 'edit' | 'draw' | 'comment' | 'mark' | 'direct_module';
export interface DesignSystemsPageViewProps {
    page_name: 'design_systems' | 'design_system_project' | 'home' | 'studio';
    area: TrackingDesignSystemsArea;
    view_type: TrackingDesignSystemsViewType;
    entry_from: TrackingDesignSystemsEntryFrom;
    design_system_id?: string;
    design_system_source?: TrackingDesignSystemOrigin;
    design_system_status?: TrackingDesignSystemStatus;
    project_id?: string;
    available_design_system_count?: number;
}
export type TrackingDesignSystemLengthBucket = '0' | '1_50' | '51_200' | '201_500' | '500_plus';
export type TrackingDesignSystemFolderCountBucket = '0' | '1_10' | '11_50' | '51_200' | '200_plus' | 'unknown';
export type TrackingDesignSystemTotalSizeBucket = '0_1mb' | '1_10mb' | '10_50mb' | '50mb_plus' | 'unknown';
export type TrackingDesignSystemSourceIngestResult = 'success' | 'partial_success' | 'failed' | 'cancelled' | 'timeout';
export type TrackingDesignSystemIngestSourceType = 'github_repo' | 'local_code' | 'fig' | 'assets' | 'mixed';
export type TrackingDesignSystemIngestMethod = 'github_api' | 'git_clone' | 'local_snapshot' | 'fig_parse' | 'asset_upload' | 'manual_text' | 'unknown';
export type TrackingDesignSystemFallbackType = 'none' | 'native_github_auth' | 'local_git_clone' | 'manual_upload' | 'unknown';
export type TrackingDesignSystemRepoHost = 'github' | 'gitlab' | 'other' | 'unknown';
export type TrackingDesignSystemCreateEntryFrom = 'onboarding' | 'design_systems_page' | 'home_card' | 'composer_picker' | 'project_settings' | 'project_canvas' | 'library' | 'unknown';
export type TrackingDesignSystemSourceIngestEntryFrom = 'onboarding' | 'design_systems_page' | 'project_settings' | 'unknown';
export type TrackingDesignSystemCreateResult = 'success' | 'failed' | 'cancelled';
export type TrackingDesignSystemReviewAction = 'looks_good' | 'needs_work' | 'submit_revision' | 'regenerate';
export type TrackingDesignSystemReviewResult = 'submitted' | 'generated' | 'failed' | 'cancelled';
export type TrackingDesignSystemModuleType = 'typography' | 'colors' | 'spacing' | 'components' | 'brand_assets' | 'other';
export type TrackingDesignSystemStatusAction = 'publish' | 'unpublish' | 'set_default' | 'unset_default' | 'archive' | 'delete';
export type TrackingDesignSystemStatusResult = 'success' | 'failed' | 'cancelled';
export type TrackingDesignSystemStatusValue = 'draft' | 'ready' | 'published' | 'default' | 'failed' | 'archived' | 'deleted' | 'unknown';
export type TrackingDesignSystemApplyAction = 'select_design_system' | 'auto_select' | 'clear_selection' | 'apply_to_run';
export type TrackingDesignSystemApplyResult = 'success' | 'failed' | 'cancelled';
export type TrackingDesignSystemSelectionMode = 'auto' | 'manual' | 'default' | 'none';
export type TrackingDesignSystemApplyTargetKind = 'prototype' | 'slide_deck' | 'image' | 'video' | 'hyperframes' | 'audio' | 'live_artifact' | 'unknown';
export type TrackingDesignSystemRunEntryFrom = 'design_system_create' | 'onboarding_design_system' | 'regenerate_from_review' | 'unknown';
export interface DesignSystemSourceIngestResultProps {
    page_name: 'design_systems' | 'design_system_project';
    area: 'design_system_create';
    entry_from: TrackingDesignSystemSourceIngestEntryFrom;
    source_type: TrackingDesignSystemIngestSourceType;
    ingest_method: TrackingDesignSystemIngestMethod;
    result: TrackingDesignSystemSourceIngestResult;
    has_fallback: boolean;
    fallback_type: TrackingDesignSystemFallbackType;
    repo_host: TrackingDesignSystemRepoHost;
    file_count: number;
    folder_file_count_bucket: TrackingDesignSystemFolderCountBucket;
    total_size_bucket: TrackingDesignSystemTotalSizeBucket;
    error_code?: string;
    duration_ms: number;
    project_id?: string;
    design_system_id?: string;
}
export interface DesignSystemCreateResultProps {
    page_name: 'design_systems';
    area: 'design_system_create';
    entry_from: TrackingDesignSystemCreateEntryFrom;
    result: TrackingDesignSystemCreateResult;
    project_id?: string;
    design_system_id?: string;
    design_system_source: TrackingDesignSystemOrigin;
    ds_source_origins?: string;
    source_count: number;
    created_as_project: boolean;
    has_brand_description: boolean;
    brand_description_length_bucket: TrackingDesignSystemLengthBucket;
    notes_length_bucket: TrackingDesignSystemLengthBucket;
    error_code?: string;
    duration_ms: number;
}
export interface DesignSystemReviewResultProps {
    page_name: 'design_system_project';
    area: 'design_system_preview';
    review_action: TrackingDesignSystemReviewAction;
    result: TrackingDesignSystemReviewResult;
    design_system_id: string;
    project_id: string;
    module_id: string;
    module_type: TrackingDesignSystemModuleType;
    module_index: number;
    feedback_length_bucket: TrackingDesignSystemLengthBucket;
    has_custom_feedback: boolean;
    run_id?: string;
    revision_run_id?: string;
    error_code?: string;
    duration_ms: number;
}
export interface DesignSystemStatusResultProps {
    page_name: 'design_systems' | 'design_system_project';
    area: 'design_system_status';
    action: TrackingDesignSystemStatusAction;
    result: TrackingDesignSystemStatusResult;
    design_system_id: string;
    project_id?: string;
    status_before: TrackingDesignSystemStatusValue;
    status_after: TrackingDesignSystemStatusValue;
    is_default_before: boolean;
    is_default_after: boolean;
    error_code?: string;
    duration_ms: number;
    resource_scope?: TrackingWorkspaceScope;
}
export interface DesignSystemApplyResultProps {
    page_name: 'home' | 'studio';
    area: 'design_system_picker' | 'composer';
    action: TrackingDesignSystemApplyAction;
    result: TrackingDesignSystemApplyResult;
    target_project_kind: TrackingDesignSystemApplyTargetKind;
    design_system_id?: string;
    design_system_source?: TrackingDesignSystemOrigin;
    design_system_status?: TrackingDesignSystemStatusValue;
    design_system_applied: boolean;
    design_system_selection_mode: TrackingDesignSystemSelectionMode;
    is_default: boolean;
    is_auto_selected: boolean;
    available_design_system_count: number;
    run_id?: string;
    error_code?: string;
    duration_ms: number;
}
export interface DesignSystemEnrichClickProps {
    page_name: 'design_system_project';
    area: 'design_system_enrich';
    element: 'ai_optimize';
    design_system_id?: string;
    project_kind?: TrackingProjectKind | null;
}
export interface DesignSystemEnrichResultProps {
    page_name: 'design_system_project';
    area: 'design_system_enrich';
    result: 'success' | 'failed' | 'cancelled';
    design_system_id?: string;
    project_id?: string;
    run_id?: string;
    error_code?: string;
    duration_ms?: number;
}
//# sourceMappingURL=design-systems.d.ts.map