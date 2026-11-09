import { type RunTelemetrySinkConfig } from '../langfuse-trace.js';
export interface TaskTraceReceipt {
    taskExecutionId: string;
    idempotencyKey: string;
    traceId: string;
    protocol: 'legacy-v1' | 'otlp-v4';
    transport: 'langfuse' | 'relay' | 'vela';
}
/** Small non-secret exporter receipt under the caller's resolved daemon data root.
 * Missing/corrupt receipts must never be reconstructed from current config. */
export declare function taskTraceReceipts(dataDir?: string): {
    write(receipt: TaskTraceReceipt): void;
    read(id: string, idempotencyKey?: string | null): TaskTraceReceipt | undefined;
};
/** Never move feedback or manifest updates to another trace after an upgrade.
 * No receipt means delivery must wait for the Task root, not create an orphan. */
export declare function taskUpdateSink(dataDir: string, clientTraceId: string, env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): RunTelemetrySinkConfig | null;
