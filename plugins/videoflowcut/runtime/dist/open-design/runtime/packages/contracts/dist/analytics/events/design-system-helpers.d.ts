/**
 * @module analytics/events/design-system-helpers
 * Design-system tracking bucket/slug helpers.
 */
import type { TrackingDesignSystemFolderCountBucket, TrackingDesignSystemLengthBucket, TrackingDesignSystemModuleType, TrackingDesignSystemRepoHost, TrackingDesignSystemTotalSizeBucket } from './design-systems.js';
export declare function designSystemLengthBucket(text: string | null | undefined): TrackingDesignSystemLengthBucket;
export declare function designSystemFolderCountBucket(count: number | null | undefined): TrackingDesignSystemFolderCountBucket;
export declare function designSystemTotalSizeBucket(bytes: number | null | undefined): TrackingDesignSystemTotalSizeBucket;
export declare function designSystemModuleSlug(header: string | null | undefined): string;
export declare function questionsFormTrackingId(raw: string | null | undefined): string;
export declare function designSystemModuleType(slug: string | null | undefined): TrackingDesignSystemModuleType;
export declare function designSystemRepoHostFromUrl(url: string | null | undefined): TrackingDesignSystemRepoHost;
//# sourceMappingURL=design-system-helpers.d.ts.map