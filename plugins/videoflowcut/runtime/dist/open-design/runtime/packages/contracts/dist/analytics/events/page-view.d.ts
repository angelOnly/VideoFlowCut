/**
 * @module analytics/events/page-view
 * page_view event prop types and their union.
 */
import type { DesignSystemsPageViewProps } from './design-systems.js';
import type { TrackingPageName } from './event-names.js';
import type { OnboardingPageViewProps, TrackingChatPanelPageViewSource } from './onboarding.js';
export interface GenericPageViewProps {
    page_name: Exclude<TrackingPageName, 'onboarding' | 'design_system_project' | 'studio'>;
    source?: TrackingChatPanelPageViewSource;
}
export type PageViewProps = GenericPageViewProps | OnboardingPageViewProps | DesignSystemsPageViewProps;
//# sourceMappingURL=page-view.d.ts.map