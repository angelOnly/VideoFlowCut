// Phase 4 / spec §11.5 / plan §3.FF1 — `od plugin verify` orchestrator.
//
// Pure helper that aggregates three independent checks into one
// CI-friendly pass/fail report:
//
//   doctor     — manifest + atom + ref lint (existing helper)
//   simulate   — pipeline convergence dry-run for every
//                'until' expression in the plugin (existing helper)
//   canon      — optional byte-equality check against a committed
//                expected-block.md fixture
//
// The orchestrator is pure relative to its inputs: doctor + simulate
// reports come in already-computed (the CLI runs them and feeds the
// outputs in). canon comparison happens here because it's a string
// equality + diff format. Callers decide which checks to run via the
// `checks` flag set; the orchestrator skips disabled checks cleanly.
//
// Sister of plugins/doctor.ts, plugins/simulate.ts. Lives separately
// so the verify report shape can evolve without churning either of
// the underlying helpers.
const DEFAULT_CHECKS = ['doctor', 'simulate', 'canon'];
export function verifyPlugin(input) {
    const enabled = new Set((input.config.enabled ?? DEFAULT_CHECKS).filter((c) => c === 'doctor' || c === 'simulate' || c === 'canon'));
    const outcomes = [];
    // doctor
    if (!enabled.has('doctor')) {
        outcomes.push({ check: 'doctor', status: 'skipped', summary: 'doctor: skipped (not in enabled set)' });
    }
    else if (!input.doctor) {
        outcomes.push({ check: 'doctor', status: 'unsupported', summary: 'doctor: report missing (CLI did not fetch)' });
    }
    else {
        const errors = input.doctor.issues.filter((i) => i.severity === 'error').length;
        const warnings = input.doctor.issues.filter((i) => i.severity === 'warning').length;
        // Plan §3.HH1: in strict mode, warnings fail the check too.
        const strict = input.config.strict === true;
        const failed = errors > 0 || (strict && warnings > 0);
        const status = failed ? 'failed' : 'passed';
        const summary = strict && warnings > 0 && errors === 0
            ? `doctor: 0 errors, ${warnings} warning${warnings === 1 ? '' : 's'} (strict mode \u2014 warnings fail the check)`
            : `doctor: ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`;
        outcomes.push({
            check: 'doctor',
            status,
            summary,
            details: { errors, warnings, ok: input.doctor.ok, freshDigest: input.doctor.freshDigest, strict },
        });
    }
    // simulate
    if (!enabled.has('simulate')) {
        outcomes.push({ check: 'simulate', status: 'skipped', summary: 'simulate: skipped (not in enabled set)' });
    }
    else if (!input.simulate) {
        outcomes.push({ check: 'simulate', status: 'unsupported', summary: 'simulate: report missing (CLI did not run pipeline simulator)' });
    }
    else {
        const failing = input.simulate.outcome === 'cap-hit' || input.simulate.outcome === 'unparsable';
        const status = failing ? 'failed' : 'passed';
        outcomes.push({
            check: 'simulate',
            status,
            summary: `simulate: ${input.simulate.outcome}, ${input.simulate.totalIterations} iteration${input.simulate.totalIterations === 1 ? '' : 's'} across ${input.simulate.stages.length} stage${input.simulate.stages.length === 1 ? '' : 's'}`,
            details: {
                outcome: input.simulate.outcome,
                totalIterations: input.simulate.totalIterations,
                stages: input.simulate.stages.map((s) => ({ stageId: s.stageId, outcome: s.outcome, iterations: s.iterations })),
            },
        });
    }
    // canon — only meaningful when both inputs are present.
    if (!enabled.has('canon')) {
        outcomes.push({ check: 'canon', status: 'skipped', summary: 'canon: skipped (not in enabled set)' });
    }
    else if (typeof input.canon !== 'string' || typeof input.canonExpected !== 'string') {
        outcomes.push({
            check: 'canon',
            status: 'skipped',
            summary: 'canon: skipped (no fixture supplied; declare config.canon.fixturePath)',
        });
    }
    else if (input.canon === input.canonExpected) {
        outcomes.push({
            check: 'canon',
            status: 'passed',
            summary: `canon: byte-equal (${input.canon.length} bytes)`,
        });
    }
    else {
        outcomes.push({
            check: 'canon',
            status: 'failed',
            summary: `canon: mismatch (expected ${input.canonExpected.length} bytes, got ${input.canon.length} bytes)`,
            details: { expectedLength: input.canonExpected.length, actualLength: input.canon.length },
        });
    }
    // Overall pass: every enabled outcome passed, and no 'unsupported'.
    const passed = outcomes.every((o) => o.status === 'passed' || o.status === 'skipped');
    return { passed, outcomes };
}
//# sourceMappingURL=verify.js.map