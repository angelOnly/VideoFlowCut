import type { ProjectExampleBinding, ProjectMetadata } from '@open-design/contracts';
export declare class InvalidProjectExampleBindingError extends Error {
    constructor(message: string);
}
/**
 * Digest the SKILL.md the example card would contribute as a user-selected
 * Skill.
 *
 * SKILL.md — not `open-design.json` — is deliberately the pinned artifact:
 * these are the exact bytes `captureFrozenSkillPackageFromSources` will read
 * at run start, so the recorded digest is the one that can actually be
 * reproduced there. An example with no SKILL.md has nothing to carry into
 * `session_skills`, and is rejected rather than bound to nothing.
 */
export declare function digestExampleSkillManifest(pluginFsPath: string): Promise<string>;
export declare function createProjectExampleBinding(input: {
    pluginId: string;
    pluginSource: string;
    manifestSourceDigest: string;
    boundAt?: number;
}): ProjectExampleBinding;
/**
 * Read the daemon-owned example binding, or null when the stored value is not
 * one this daemon would have written.
 *
 * Mirrors `readVerifiedProjectStrategyBinding`, with one deliberate
 * difference: the strategy binding re-derives its task profile from project
 * metadata and rejects a binding that disagrees, whereas an example binding
 * has no metadata-derivable counterpart to check against. Its authority comes
 * from the two facts recorded here — the exact `pluginSource` the record is
 * re-resolved through at run start, and the `manifestSourceDigest` capture has
 * to reproduce from disk. This function is therefore a shape gate only, and
 * must not be treated as proof that the example still exists.
 */
export declare function readVerifiedProjectExampleBinding(metadata: ProjectMetadata | null | undefined): ProjectExampleBinding | null;
