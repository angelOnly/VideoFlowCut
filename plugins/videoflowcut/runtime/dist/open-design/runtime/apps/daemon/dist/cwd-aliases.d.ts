export declare const SKILLS_CWD_ALIAS = ".od-skills";
export type SkillStagingLogger = (message: string) => void;
export interface SkillStagingResult {
    /** True when a usable copy of the source is sitting at `stagedPath`. */
    staged: boolean;
    /** Absolute path of the staged directory if staging succeeded. */
    stagedPath?: string;
    /** Populated when staging was skipped or failed; never thrown. */
    reason?: string;
}
export declare function skillCwdAliasSegment(dir: string): string;
type SkillCopyFn = (source: string, destination: string, options: {
    recursive: boolean;
    dereference: boolean;
    preserveTimestamps: boolean;
}) => Promise<void>;
/**
 * Copy `<sourceDir>` to `<cwd>/.od-skills/<folderName>/` so an agent can
 * reach skill side files via a cwd-relative path. Idempotent and
 * non-throwing — failures are logged and surfaced via the result so the
 * caller falls back to absolute-path delivery (`--add-dir` for
 * Claude/Copilot, embedded absolute path in the preamble for others).
 *
 * The previous-turn copy is replaced wholesale on every call, which is
 * the simplest correct way to handle skill-source updates (e.g. the
 * user just edited a `references/*.md` mid-session).
 */
export declare function stageActiveSkill(cwd: string | null | undefined, folderName: string, sourceDir: string, log?: SkillStagingLogger, nativeCopy?: SkillCopyFn): Promise<SkillStagingResult>;
export {};
