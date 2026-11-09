// Phase 7-8 entry slice / spec §10 / §11.5.1 / §21.5 — handoff atom.
//
// SKILL.md fragment lives at plugins/_official/atoms/handoff/. The
// daemon-side helper updates an ArtifactManifest's provenance +
// distribution metadata so subsequent runs (and the CLI's
// `od plugin export`) can reverse-resolve the artifact's lineage
// without mutating any prior fields. The contract is append-only:
//
//   - sourcePluginSnapshotId NEVER changes after first write.
//   - exportTargets[] / deployTargets[] only ever GROW.
//   - handoffKind can be promoted (e.g. 'patch' → 'deployable-app')
//     when build-test signals + diff-review acceptance combine.
import path from 'node:path';
import { promises as fsp } from 'node:fs';
const HANDOFF_RANK = {
    'design-only': 0,
    'implementation-plan': 1,
    'patch': 2,
    'deployable-app': 3,
};
export function recordHandoff(input) {
    const changed = [];
    // Clone shallowly so the caller's reference isn't mutated; arrays
    // we touch get fresh copies before we push.
    const next = { ...input.manifest };
    if (input.exportTarget) {
        const incoming = input.exportTarget;
        const existing = next.exportTargets ?? [];
        // Idempotency: a (surface, target) pair only ever lands once.
        const already = existing.some((t) => t.surface === incoming.surface && t.target === incoming.target);
        if (!already) {
            next.exportTargets = [...existing, incoming];
            changed.push('exportTargets');
        }
    }
    if (input.deployTarget) {
        const incoming = input.deployTarget;
        const existing = next.deployTargets ?? [];
        const already = existing.some((t) => t.provider === incoming.provider && t.location === incoming.location);
        if (!already) {
            next.deployTargets = [...existing, incoming];
            changed.push('deployTargets');
        }
    }
    if (input.handoffKind) {
        const enforce = input.enforceMonotonicHandoff ?? true;
        const current = next.handoffKind;
        if (!current) {
            next.handoffKind = input.handoffKind;
            changed.push('handoffKind');
        }
        else {
            const incomingRank = HANDOFF_RANK[input.handoffKind] ?? 0;
            const currentRank = HANDOFF_RANK[current] ?? 0;
            if (!enforce || incomingRank >= currentRank) {
                if (current !== input.handoffKind) {
                    next.handoffKind = input.handoffKind;
                    changed.push('handoffKind');
                }
            }
        }
    }
    return { manifest: next, changed };
}
// Spec §11.5.1 promotion rule for the deployable-app tier:
// `handoffKind: 'deployable-app'` requires:
//   - build.passing  (the build-test atom emitted true)
//   - tests.passing  (same)
//   - at least one exportTargets[] entry on a 'docker' or 'cli' surface
//     (i.e. the patch was actually packaged for delivery)
//
// This helper computes the eligibility flag so the handoff atom's
// caller can promote in one place rather than leaking the rule into
// every plugin.
export function isDeployableAppEligible(args) {
    if (args.buildPassing !== true)
        return false;
    if (args.testsPassing !== true)
        return false;
    const exports = args.manifest.exportTargets ?? [];
    return exports.some((t) => t.surface === 'docker' || t.surface === 'cli');
}
export async function runHandoffAtom(input) {
    const cwd = path.resolve(input.cwd);
    const decision = await readDiffReviewDecision(cwd);
    const buildTest = await readBuildTestSignals(cwd);
    // Start by appending whatever explicit export/deploy targets the
    // caller passed in. Idempotency is enforced inside recordHandoff().
    let next = input.manifest;
    let changed = [];
    const targets = [
        ...(input.exportTarget ? [input.exportTarget] : []),
        ...(input.exportTargets ?? []),
    ];
    for (const t of targets) {
        const out = recordHandoff({ manifest: next, exportTarget: t });
        next = out.manifest;
        for (const c of out.changed)
            if (!changed.includes(c))
                changed.push(c);
    }
    const deploys = [
        ...(input.deployTarget ? [input.deployTarget] : []),
        ...(input.deployTargets ?? []),
    ];
    for (const d of deploys) {
        const out = recordHandoff({ manifest: next, deployTarget: d });
        next = out.manifest;
        for (const c of out.changed)
            if (!changed.includes(c))
                changed.push(c);
    }
    // Compute the target handoff kind from the on-disk state.
    let handoffKind;
    if (decision === 'reject') {
        handoffKind = 'design-only';
    }
    else if (decision === 'accept' || decision === 'partial') {
        handoffKind = 'implementation-plan';
        if (buildTest && (buildTest.buildPassing || buildTest.testsPassing)) {
            handoffKind = 'patch';
        }
        if (buildTest && isDeployableAppEligible({
            manifest: next,
            buildPassing: buildTest.buildPassing,
            testsPassing: buildTest.testsPassing,
        })) {
            handoffKind = 'deployable-app';
        }
    }
    if (handoffKind) {
        const out = recordHandoff({ manifest: next, handoffKind });
        next = out.manifest;
        for (const c of out.changed)
            if (!changed.includes(c))
                changed.push(c);
    }
    const signals = {
        deployable: handoffKind === 'deployable-app',
    };
    if (decision)
        signals.decision = decision;
    if (buildTest) {
        signals.buildPassing = buildTest.buildPassing;
        signals.testsPassing = buildTest.testsPassing;
    }
    return { manifest: next, changed, signals };
}
async function readDiffReviewDecision(cwd) {
    const p = path.join(cwd, 'review', 'decision.json');
    try {
        const raw = await fsp.readFile(p, 'utf8');
        const obj = JSON.parse(raw);
        if (obj.decision === 'accept' || obj.decision === 'reject' || obj.decision === 'partial') {
            return obj.decision;
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
const DEFAULT_MANIFEST_SEED = {
    version: 1,
    kind: 'react-component',
    title: 'Pipeline output',
    entry: '',
    renderer: 'react-component',
    exports: [],
};
export async function runAndPersistHandoff(input) {
    const cwd = path.resolve(input.cwd);
    const manifestPath = path.join(cwd, 'handoff', 'manifest.json');
    const existing = await readManifestFile(manifestPath);
    const seed = existing ?? input.manifestSeed ?? DEFAULT_MANIFEST_SEED;
    const handoffInput = { cwd, manifest: seed };
    if (input.exportTarget)
        handoffInput.exportTarget = input.exportTarget;
    if (input.exportTargets)
        handoffInput.exportTargets = input.exportTargets;
    if (input.deployTarget)
        handoffInput.deployTarget = input.deployTarget;
    if (input.deployTargets)
        handoffInput.deployTargets = input.deployTargets;
    const report = await runHandoffAtom(handoffInput);
    let persistMode;
    if (!existing) {
        await fsp.mkdir(path.dirname(manifestPath), { recursive: true });
        await fsp.writeFile(manifestPath, JSON.stringify(report.manifest, null, 2) + '\n', 'utf8');
        persistMode = 'created';
    }
    else if (report.changed.length > 0) {
        await fsp.writeFile(manifestPath, JSON.stringify(report.manifest, null, 2) + '\n', 'utf8');
        persistMode = 'updated';
    }
    else {
        persistMode = 'skipped';
    }
    return { ...report, manifestPath, persistMode };
}
async function readManifestFile(p) {
    try {
        const raw = await fsp.readFile(p, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return undefined;
    }
}
async function readBuildTestSignals(cwd) {
    const p = path.join(cwd, 'critique', 'build-test.json');
    try {
        const raw = await fsp.readFile(p, 'utf8');
        const obj = JSON.parse(raw);
        const buildPassing = obj.signals?.['build.passing'] === true;
        const testsPassing = obj.signals?.['tests.passing'] === true;
        return { buildPassing, testsPassing };
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=handoff.js.map