export type StandaloneMaintenanceLeaseOptions = Readonly<{
    heartbeatIntervalMs?: number;
    leaseDurationMs?: number;
}>;
export declare function withStandaloneMaintenanceLock<T>(root: string, operation: () => Promise<T>, options?: StandaloneMaintenanceLeaseOptions): Promise<T>;
//# sourceMappingURL=maintenance.d.ts.map