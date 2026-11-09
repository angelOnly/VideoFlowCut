import type { OdNextStrategyStableRequestContextV2, ProjectExampleBinding, ProjectMetadata } from '@open-design/contracts';
import type { ResolvedFrozenSkillSourceV1 } from './frozen-skill-package.js';
/** The subset of an installed plugin record this resolver needs. */
export interface ResolvedExamplePluginRecord {
    id?: unknown;
    source?: unknown;
    fsPath?: unknown;
    title?: unknown;
    manifest?: unknown;
}
export type ResolveLocalPluginBySource = (id: string, source: string) => Promise<ResolvedExamplePluginRecord | null>;
/**
 * Resolve the project's official example card to a capture source, or null.
 *
 * The invariant this exists to hold: **an example card never changes the
 * route.** Picking one is a more specific choice inside a task type OD Next
 * already owns, not a claim on the strategy, so the card rides along in
 * `session_skills/user_selected_skills` instead of pinning a plugin. Capture
 * itself happens in `captureOdNextSessionSkillPackage`, because a task freezes
 * ONE package across every channel the session selected material through.
 *
 * It is deliberately fail-soft. Every reason resolution can fail — the example
 * was uninstalled, its manifest moved on from the digest the project pinned,
 * the folder is unreadable — is a reason to run this task without the example,
 * never a reason to fail the user's run or to divert it off the automatic
 * route it already qualified for. Failures are warned about, then swallowed,
 * and null means "run without the card".
 */
export declare function resolveProjectExampleSkillSource(input: {
    metadata: ProjectMetadata | null | undefined;
    getLocalPluginBySource: ResolveLocalPluginBySource | undefined;
}): Promise<ResolvedFrozenSkillSourceV1 | null>;
/**
 * Name the example card in the Bundle's stable request context.
 *
 * Two things the frozen Skill body cannot say on its own: WHICH card the user
 * pointed at, and WHAT it is for. The card's SKILL.md teaches how to build
 * things of its kind; the assignment lives in the manifest's
 * `od.useCase.query`, which the composer deliberately does not seed (it seeds
 * the short human-readable description instead). Carry it here or the run
 * keeps the craft and loses the brief.
 *
 * Returns undefined — omitting the fact entirely — when the record does not
 * re-resolve to the exact bound identity: an example that no longer resolves
 * must go unnamed rather than let a same-id record from somewhere else speak
 * for it.
 */
export declare function odNextExampleReferenceFact(input: {
    binding: ProjectExampleBinding;
    record: ResolvedExamplePluginRecord | null;
    locale?: string | undefined;
}): OdNextStrategyStableRequestContextV2['exampleReference'];
