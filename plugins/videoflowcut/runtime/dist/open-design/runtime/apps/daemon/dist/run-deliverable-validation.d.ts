import type { ChatRunStatus, ProjectFileKind, ProjectMetadata } from '@open-design/contracts';
export type RunDeliverableValidation = 'valid' | 'not_succeeded' | 'no_artifact' | 'project_missing' | 'entry_missing' | 'entry_not_touched' | 'entry_unreadable' | 'type_mismatch';
export interface RunDeliverableValidationResult {
    valid: boolean;
    validation: RunDeliverableValidation;
    entryFile?: string;
    artifactKind?: ProjectFileKind;
    /** Internal syntax-finalization input; entryFile remains the canonical entry. */
    linkedPage?: string;
}
interface ValidateRunDeliverableInput {
    projectsRoot: string;
    projectId: string | null;
    projectMetadata?: Partial<ProjectMetadata> | Record<string, unknown> | null;
    runStatus: ChatRunStatus;
    artifactCount: number;
    /** Exact artifact paths changed by this run. Undefined means the runtime
     *  could not produce a reliable per-file diff (for example contention). */
    touchedPaths?: string[];
    /** Unambiguous HTML entry observed by the host before this run wrote files. */
    baselineEntryFile?: string;
    /** New marker tasks may deliver a separate file without changing the project entry.
     * Requires exact current-run touched paths; never enables project-wide inference. */
    allowIndependentOutput?: boolean;
    allowMultipleOutputCandidates?: boolean;
}
export declare function inferBaselineHtmlEntry(projectRoot: string, paths: Iterable<string>): string | undefined;
/**
 * The two questions a caller can ask about a project's canonical deliverable.
 *
 * `'run'` — did THIS run produce it? Strict on purpose: the answer decides
 * whether the host may accept an Agent's completion claim, so a turn must not
 * be able to pass by pointing at a file an earlier turn wrote.
 *
 * `'project'` — does the user have it, right now? The same filesystem checks
 * without the run-scoped gates. It answers a presentation question ("is there
 * anything to tell the user they lost?"), where the earlier turn's file counts
 * precisely because the user can open it.
 *
 * Splitting them is the whole point: one predicate used to answer both, and
 * the strict answer is the WRONG answer to the loose question. A "继续" turn
 * that verifies finished work and correctly changes nothing scores
 * `no_artifact` under `'run'` — true, and irrelevant to whether the user got
 * their deck.
 */
export type DeliverableValidationScope = 'run' | 'project';
/** Values `validateProjectDeliverable` can actually produce, narrowed to the
 *  wire union. Run-scoped outcomes are unreachable there; returning null for
 *  one keeps a future enum addition from being reported as a wire value the
 *  client's type does not admit. */
export declare function projectDeliverableValidation(validation: RunDeliverableValidation): 'valid' | 'project_missing' | 'entry_missing' | 'entry_unreadable' | 'type_mismatch' | null;
/**
 * Does this project hold a usable canonical deliverable right now?
 *
 * Same entry resolution, kind contract and readability check as
 * `validateRunDeliverable`, minus every gate that asks about a particular run.
 * Never use it to accept a completion claim — see `DeliverableValidationScope`.
 */
export declare function validateProjectDeliverable(input: Omit<ValidateRunDeliverableInput, 'runStatus' | 'artifactCount' | 'touchedPaths'>): Promise<RunDeliverableValidationResult>;
/**
 * Resolve and verify the one canonical file a successful run can deliver.
 *
 * `artifactCount` proves this run touched output; it does not prove the
 * project's declared entry still exists. The filesystem-backed file list and
 * a direct readability check are therefore authoritative.
 */
export declare function validateRunDeliverable(input: ValidateRunDeliverableInput): Promise<RunDeliverableValidationResult>;
export {};
