// Plan §3.D — atom worker registry.
//
// Stage D of plugin-driven-flow-plan replaces the canned stub stage
// runner inside `firePipelineForRun` with a per-atom worker model.
// Each atom can register a `run(ctx)` that observes the run's DB
// state and returns real `UntilSignals`; atoms with no registered
// worker fall through silently so the stage runner keeps converging
// at parity with the v1 stub for unobserved pipelines.
//
// The registry stays intentionally minimal:
//   - module-level `Map<atomId, AtomWorker>` so registration is a
//     simple side-effect (built-ins.ts registers FIRST_PARTY_ATOMS
//     on first use)
//   - `runStageWithRegistry(ctx)` walks `stage.atoms`, asks each
//     registered worker for its signals, then pessimistically
//     merges them (lowest number / false-wins boolean) so a single
//     atom returning `critique.score: 2` overrides the optimistic
//     defaults
//   - permissive defaults (`critique.score: 4`, `preview.ok: true`,
//     `user.confirmed: true`) keep the happy path converging in one
//     iteration when no atom contradicts them — matches v1 stub
//     behaviour for backwards compatibility.
import { scanRunEventsForUsageAnalytics, } from '../../run-analytics-observability.js';
const REGISTRY = new Map();
export function registerAtomWorker(worker) {
    REGISTRY.set(worker.id, worker);
}
export function unregisterAtomWorker(id) {
    REGISTRY.delete(id);
}
export function clearAtomWorkers() {
    REGISTRY.clear();
}
export function getAtomWorker(id) {
    return REGISTRY.get(id);
}
export function listRegisteredAtomIds() {
    return Array.from(REGISTRY.keys()).sort();
}
// Permissive defaults mirror the v1 stub's canned signals so the
// registry runner stays at parity for unobserved atoms — swapping
// from stub → registry never regresses happy-path convergence.
// Real worker observations REPLACE these defaults wholesale (rather
// than min-merging) so a real score of 5 never gets clipped to the
// default 4; cross-worker conflicts inside a single stage still
// pessimistically merge (false-wins / lowest-number-wins).
export const PERMISSIVE_DEFAULT_SIGNALS = Object.freeze({
    'critique.score': 4,
    'preview.ok': true,
    'user.confirmed': true,
});
// Walk every atom in the stage, invoke its registered worker (if
// any), then layer the resulting real-observation map over the
// permissive defaults. Worker failures are captured as notes and
// never crash the stage — the devloop scheduler keeps its
// iteration cap as the safety net.
export async function runStageWithRegistry(ctx) {
    const real = new Map();
    const notes = [];
    const observed = [];
    for (const atomId of ctx.stage.atoms ?? []) {
        const worker = getAtomWorker(atomId);
        if (!worker)
            continue;
        observed.push(atomId);
        try {
            const out = await Promise.resolve(worker.run(ctx));
            for (const [k, v] of Object.entries(out.signals ?? {})) {
                const key = k;
                const prev = real.get(key);
                real.set(key, prev === undefined ? v : mergePessimistic(prev, v));
            }
            if (out.note)
                notes.push(`[${worker.id}] ${out.note}`);
        }
        catch (err) {
            notes.push(`[${worker.id}] worker error: ${err.message ?? String(err)}`);
        }
    }
    const accumulated = { ...PERMISSIVE_DEFAULT_SIGNALS };
    for (const [key, value] of real) {
        accumulated[key] = value;
    }
    return {
        signals: accumulated,
        critiqueSummary: notes.length > 0 ? notes.join('\n') : null,
        notes,
        observedAtoms: observed,
        tokensUsed: tokensUsedFromRunEvents(ctx.runEvents),
    };
}
function tokensUsedFromRunEvents(events) {
    if (!events?.length)
        return null;
    const usage = scanRunEventsForUsageAnalytics(events, null, 0);
    return usage.total_tokens ?? null;
}
// Pessimistic merge between multiple workers contributing to the
// same signal key. Cross-worker false-wins / lowest-number-wins
// so a single failing gate still surfaces as a failed convergence.
function mergePessimistic(prev, next) {
    if (typeof prev === 'boolean' && typeof next === 'boolean')
        return prev && next;
    if (typeof prev === 'number' && typeof next === 'number')
        return Math.min(prev, next);
    return next;
}
//# sourceMappingURL=registry.js.map