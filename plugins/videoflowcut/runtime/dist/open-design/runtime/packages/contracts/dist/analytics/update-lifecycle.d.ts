import { z } from 'zod';
/** Finite, content-free stages of one persisted updater flow. */
export declare const UPDATE_LIFECYCLE_STAGES: readonly ['install_requested', 'shutdown_started', 'renderer_quiesced', 'shutdown_completed', 'cleanup_daemon', 'cleanup_web', 'predecessor_wait_started', 'predecessor_wait_completed', 'desktop_ready'];
export type UpdateLifecycleStage = typeof UPDATE_LIFECYCLE_STAGES[number];
export type UpdateLifecycleObservation = {
    stage: UpdateLifecycleStage;
    outcome: 'started' | 'completed' | 'forced' | 'failed';
    duration_ms?: number;
    repeated_quit_count?: number;
    forced_process_count?: number;
    remaining_process_count?: number;
};
export type UpdateLifecycleObservedProps = UpdateLifecycleObservation & {
    flow_id: string;
    from_version: string;
    to_version: string;
    channel: string;
    platform: string;
    arch: string;
    occurred_at: string;
    observation_version: 1;
};
/** Project only bounded metrics; never forward paths, PIDs, messages or extra keys. */
export declare function parseUpdateLifecycleObservation(value: unknown): UpdateLifecycleObservation | null;
export declare const UPDATE_METRIC_STAGES: readonly ['check', 'download', 'verify', 'install_verify', 'install_open', 'restart'];
export declare const updateStageMetricFields: {
    flow_id: z.ZodString;
    stage: z.ZodEnum<["check", "download", "verify", "install_verify", "install_open", "restart"]>;
    result: z.ZodEnum<["started", "success", "failed", "cancelled", "unknown", "not_applied"]>;
    reason_code: z.ZodNullable<z.ZodEnum<["check_failed", "download_failed", "download_incomplete", "checksum_mismatch", "verification_failed", "install_open_failed", "operation_failed", "version_matches", "version_unchanged", "same_version_reinstall", "identity_mismatch", "expired", "interrupted", "legacy_observation", "cancelled"]>>;
    from_version: z.ZodNullable<z.ZodString>;
    to_version: z.ZodNullable<z.ZodString>;
    update_path: z.ZodNullable<z.ZodEnum<["installer", "payload"]>>;
    artifact_type: z.ZodNullable<z.ZodEnum<["dmg", "installer", "payload"]>>;
    trigger: z.ZodEnum<["manual", "silent", "unknown"]>;
    duration_ms: z.ZodNullable<z.ZodNumber>;
};
export declare const updateStageMetricSchema: z.ZodObject<{
    flow_id: z.ZodString;
    stage: z.ZodEnum<["check", "download", "verify", "install_verify", "install_open", "restart"]>;
    result: z.ZodEnum<["started", "success", "failed", "cancelled", "unknown", "not_applied"]>;
    reason_code: z.ZodNullable<z.ZodEnum<["check_failed", "download_failed", "download_incomplete", "checksum_mismatch", "verification_failed", "install_open_failed", "operation_failed", "version_matches", "version_unchanged", "same_version_reinstall", "identity_mismatch", "expired", "interrupted", "legacy_observation", "cancelled"]>>;
    from_version: z.ZodNullable<z.ZodString>;
    to_version: z.ZodNullable<z.ZodString>;
    update_path: z.ZodNullable<z.ZodEnum<["installer", "payload"]>>;
    artifact_type: z.ZodNullable<z.ZodEnum<["dmg", "installer", "payload"]>>;
    trigger: z.ZodEnum<["manual", "silent", "unknown"]>;
    duration_ms: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    flow_id: string;
    stage: "check" | "download" | "install_open" | "install_verify" | "restart" | "verify";
    result: "cancelled" | "failed" | "not_applied" | "started" | "success" | "unknown";
    reason_code: "cancelled" | "check_failed" | "checksum_mismatch" | "download_failed" | "download_incomplete" | "expired" | "identity_mismatch" | "install_open_failed" | "interrupted" | "legacy_observation" | "operation_failed" | "same_version_reinstall" | "verification_failed" | "version_matches" | "version_unchanged" | null;
    from_version: string | null;
    to_version: string | null;
    update_path: "installer" | "payload" | null;
    artifact_type: "dmg" | "installer" | "payload" | null;
    trigger: "manual" | "silent" | "unknown";
    duration_ms: number | null;
}, {
    flow_id: string;
    stage: "check" | "download" | "install_open" | "install_verify" | "restart" | "verify";
    result: "cancelled" | "failed" | "not_applied" | "started" | "success" | "unknown";
    reason_code: "cancelled" | "check_failed" | "checksum_mismatch" | "download_failed" | "download_incomplete" | "expired" | "identity_mismatch" | "install_open_failed" | "interrupted" | "legacy_observation" | "operation_failed" | "same_version_reinstall" | "verification_failed" | "version_matches" | "version_unchanged" | null;
    from_version: string | null;
    to_version: string | null;
    update_path: "installer" | "payload" | null;
    artifact_type: "dmg" | "installer" | "payload" | null;
    trigger: "manual" | "silent" | "unknown";
    duration_ms: number | null;
}>;
export type UpdateStageMetric = z.infer<typeof updateStageMetricSchema>;
//# sourceMappingURL=update-lifecycle.d.ts.map