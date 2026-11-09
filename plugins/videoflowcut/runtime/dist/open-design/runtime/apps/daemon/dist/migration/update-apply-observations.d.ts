import type { TrackingUpdateApplyElapsedBucket, TrackingUpdateApplyReason, TrackingUpdateApplyResult } from '@open-design/contracts/analytics';
import { type ReleaseChannel } from '@open-design/release';
import type { AnalyticsService } from '../analytics.js';
import { type AppConfigPrefs } from '../app-config.js';
declare const INSTALLER_OBSERVATION_SCHEMA_VERSION = 1;
declare const INSTALLER_OBSERVATION_KIND = "installer_apply_observation";
type InstallerObservationArtifactType = 'dmg' | 'installer' | 'payload';
type InstallerObservationChannel = ReleaseChannel;
type InstallerObservationDeliveryStatus = 'submitted' | 'skipped_analytics_disabled' | 'skipped_missing_identity' | 'skipped_no_consent' | 'failed';
export type InstallerObservationSummary = {
    arch: string;
    artifactType: InstallerObservationArtifactType;
    attemptedAt: string;
    channel: InstallerObservationChannel;
    delivery?: {
        eventName: 'update_apply_observed';
        insertId?: string;
        status: InstallerObservationDeliveryStatus;
        updatedAt: string;
    };
    elapsedBucket?: TrackingUpdateApplyElapsedBucket;
    flowId: string;
    fromVersion: string;
    kind: typeof INSTALLER_OBSERVATION_KIND;
    namespace: string;
    observedAt?: string;
    platform: string;
    reason: 'installer_open_requested' | 'installer_open_failed' | TrackingUpdateApplyReason;
    result: 'pending' | TrackingUpdateApplyResult;
    schemaVersion: typeof INSTALLER_OBSERVATION_SCHEMA_VERSION;
    toVersion: string;
    updatedAt: string;
};
export type InstallerObservationClassification = {
    elapsedBucket: TrackingUpdateApplyElapsedBucket;
    reason: TrackingUpdateApplyReason;
    result: TrackingUpdateApplyResult;
};
export type ObservePendingInstallerApplyAttemptsOptions = {
    analytics: Pick<AnalyticsService, 'capture'>;
    appVersion: string;
    currentChannel?: string | null;
    currentVersion: string;
    dataRoot: string;
    env?: NodeJS.ProcessEnv;
    logger?: Pick<Console, 'warn'>;
    namespace: string;
    now?: () => Date;
    readConfig?: (dataRoot: string) => Promise<AppConfigPrefs>;
};
export declare function installerObservationRoot(dataRoot: string): string;
export declare function normalizeUpdateObservationChannel(version: string, explicit?: string | null): InstallerObservationChannel;
export declare function elapsedBucket(elapsedMs: number): TrackingUpdateApplyElapsedBucket;
export declare function classifyInstallerObservation(summary: InstallerObservationSummary, options: {
    currentChannel: InstallerObservationChannel;
    currentVersion: string;
    namespace: string;
    now: Date;
    ttlMs?: number;
}): InstallerObservationClassification;
export declare function observePendingInstallerApplyAttempts(options: ObservePendingInstallerApplyAttemptsOptions): Promise<{
    observed: number;
}>;
export type ObserveUpdateLifecycleStagesOptions = Omit<ObservePendingInstallerApplyAttemptsOptions, 'analytics'> & {
    analytics: Pick<AnalyticsService, 'capture' | 'captureSafety'>;
};
/** Replay immutable stage records independently of version-apply classification. */
export declare function observeUpdateLifecycleStages(options: ObserveUpdateLifecycleStagesOptions): Promise<{
    queued: number;
}>;
export {};
