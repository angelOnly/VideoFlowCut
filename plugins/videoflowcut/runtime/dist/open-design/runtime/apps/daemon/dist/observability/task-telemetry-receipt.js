import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTaskTelemetrySinkConfig, readTelemetrySinkConfig } from '../langfuse-trace.js';
/** Small non-secret exporter receipt under the caller's resolved daemon data root.
 * Missing/corrupt receipts must never be reconstructed from current config. */
export function taskTraceReceipts(dataDir) {
    const memory = new Map();
    const file = (id) => join(dataDir, 'task-telemetry-receipts', createHash('sha256').update(id).digest('hex') + '.json');
    return {
        write(receipt) {
            memory.set(receipt.taskExecutionId, receipt);
            if (!dataDir)
                return;
            try {
                mkdirSync(join(dataDir, 'task-telemetry-receipts'), { recursive: true, mode: 0o700 });
                const target = file(receipt.taskExecutionId);
                writeFileSync(target + '.tmp', JSON.stringify(receipt), { mode: 0o600 });
                renameSync(target + '.tmp', target);
            }
            catch { /* Observability cannot fail task execution or delivery. */ }
        },
        read(id, idempotencyKey) {
            try {
                const r = memory.get(id) ?? (dataDir ? JSON.parse(readFileSync(file(id), 'utf8')) : undefined);
                if (r?.taskExecutionId === id && (idempotencyKey === undefined || r.idempotencyKey === idempotencyKey)
                    && typeof r.traceId === 'string' && r.traceId.length > 0
                    && ['legacy-v1', 'otlp-v4'].includes(r.protocol)
                    && ['langfuse', 'relay', 'vela'].includes(r.transport))
                    return r;
            }
            catch { /* Unknown is preferable to a guessed trace identity. */ }
            return undefined;
        },
    };
}
/** Never move feedback or manifest updates to another trace after an upgrade.
 * No receipt means delivery must wait for the Task root, not create an orphan. */
export function taskUpdateSink(dataDir, clientTraceId, env = process.env, configuredEnv = {}) {
    if (!clientTraceId.startsWith('strategy-task:'))
        return null;
    const receipt = taskTraceReceipts(dataDir).read(clientTraceId.slice('strategy-task:'.length));
    if (!receipt)
        return null;
    const sink = receipt.transport === 'vela'
        ? readTaskTelemetrySinkConfig(env, configuredEnv)
        : readTelemetrySinkConfig(env);
    return sink?.kind === receipt.transport ? sink : null;
}
//# sourceMappingURL=task-telemetry-receipt.js.map