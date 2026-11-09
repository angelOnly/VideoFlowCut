/**
 * Critique Theater structured logger (Phase 12).
 *
 * Six events, one JSON object per line on stdout, namespaced
 * `critique`. Matches the JSON-line convention `cli.ts` and
 * `mcp-live-artifacts-server.ts` already write so an operator's
 * existing log pipeline (Loki, Cloudwatch, Datadog, etc.) ingests
 * critique events without a new adapter.
 *
 * Why a discriminated union instead of pino / winston: the daemon
 * already does JSON-per-line writes through `process.stdout`; adding
 * pino would either wrap that surface (a refactor outside Phase 12's
 * scope) or run two logger systems side by side. The thin wrapper
 * below tests via `process.stdout.write` capture and a future system
 * swap can replace the implementation without touching the call sites.
 */
/**
 * Emit one JSON line for the given critique event. The timestamp is
 * ISO-8601 with millisecond precision so an aggregator that ingests
 * multiple log streams can stable-sort across them.
 */
export function logCritique(e) {
    const line = JSON.stringify({
        ...e,
        namespace: 'critique',
        timestamp: new Date().toISOString(),
    });
    process.stdout.write(line + '\n');
}
//# sourceMappingURL=critique.js.map