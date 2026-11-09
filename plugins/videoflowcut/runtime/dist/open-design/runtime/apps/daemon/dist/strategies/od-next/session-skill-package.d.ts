import type { ProjectMetadata } from '@open-design/contracts';
import { type SkillInfo } from '../../skills.js';
import { type FrozenSkillPackageV1 } from './frozen-skill-package.js';
import { type ResolveLocalPluginBySource } from './example-skill-source.js';
/** Lists the Skill-like entries this run may resolve a selection from. */
export type ListSessionSkillCatalog = () => Promise<readonly SkillInfo[]>;
export interface OdNextSessionSkillSelection {
    /** `ChatRequest.skillId`, falling back to the project row's persisted Skill. */
    skillId?: unknown;
    /** `ChatRequest.skillIds` — the composer's per-turn @-mentions. */
    skillIds?: unknown;
}
/**
 * The frozen Skill package an admitted OD Next task starts from.
 *
 * The invariant: **naming a Skill refines the task; it does not claim the
 * route.** A Skill the user @-mentioned, and an official example card they
 * picked, are both material the session selected inside a task type OD Next
 * already owns. Neither pins a plugin and neither diverts the run to the
 * ordinary route — they ride in through `session_skills/user_selected_skills`,
 * where the strategy's own conflict order puts them above the general
 * orchestration Skill and the task-type Skill.
 *
 * One task freezes ONE package, so both channels converge here before capture:
 * the package identity is a digest over the whole selection list, and two
 * packages would mean two identities for one task.
 *
 * Fail-soft throughout, for the same reason the example rail is: a Skill that
 * was deleted between picking and running, a catalogue that will not list, a
 * selection larger than the package bounds — each is a reason to run the task
 * without that material, never a reason to fail the user's run. The ordinary
 * route drops an unresolvable Skill silently too (`findSkillById` simply
 * misses), so this is the same contract, not a new leniency.
 */
export declare function captureOdNextSessionSkillPackage(input: {
    metadata: ProjectMetadata | null | undefined;
    getLocalPluginBySource: ResolveLocalPluginBySource | undefined;
    selection: OdNextSessionSkillSelection;
    listSkillCatalog: ListSessionSkillCatalog | undefined;
}): Promise<FrozenSkillPackageV1>;
