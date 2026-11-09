export declare const MEDIA_EXECUTION_MODES: readonly ['enabled', 'disabled'];
export type MediaExecutionMode = (typeof MEDIA_EXECUTION_MODES)[number];
export declare const MEDIA_SURFACES: readonly ['image', 'video', 'audio'];
export type MediaSurface = (typeof MEDIA_SURFACES)[number];
/** Available supported Cloud video models for the authenticated project workspace. */
export interface CloudVideoModelsResponse {
    source: 'account_workspace_catalogue';
    video: Array<{
        id: string;
        label: string;
        hint: string;
        provider: string;
        caps: string[];
        default?: boolean;
    }>;
}
export declare const MEDIA_TASK_STATUSES: readonly ['queued', 'running', 'done', 'failed', 'interrupted'];
export type MediaTaskStatus = (typeof MEDIA_TASK_STATUSES)[number];
export interface ProjectMediaTaskFile {
    name: string;
    size?: number;
    /** Stable across an in-project rename/move and used to reconcile the final path. */
    mtime?: number;
    kind?: string;
    mime?: string;
}
/**
 * What to do next about a media generation that failed.
 *
 * This is the ONLY failure vocabulary a client — the agent that dispatched
 * the render, the chat host, a CLI caller — is meant to branch on. The
 * internal `code` stays for triage; it is not an answer to "so what now?",
 * and the moment it reached a user's screen it stopped being one at all
 * (「原因未分类(错误代码:MEDIA_DISPATCH_FAILED)」 is a support ticket, not a
 * next step).
 *
 * The values are the run-error ladder (`docs/design/run-errors/error-ux-design.md`
 * §3, mirrored in `apps/web/src/runtime/amr-guidance.ts`) applied to media, so
 * media failures do not grow a second, differently-shaped taxonomy:
 *
 * - rung 1 · the user can fix it right here — `revise-request`,
 *   `switch-model`, `open-settings`, `sign-in`
 * - rung 2 · nothing to fix, it may just work next time — `retry-later`
 * - rung 3 · this path cannot work; take a different one — `add-credit`,
 *   `update-app`, `unsupported`
 * - rung 4 · retrying is futile and we have no other lever — `contact-support`
 *
 * Two failures that put the user in the same place get the SAME value on
 * purpose: a missing OpenAI key and a model with no configured renderer are
 * different bugs and one sentence ("fill it in under Settings").
 */
export declare const MEDIA_FAILURE_NEXT_STEPS: readonly [
/** The request itself was refused. Reword it / swap the reference image. */
'revise-request', 
/** This model cannot serve the request; another one can. */
'switch-model', 
/** A credential or endpoint is missing or wrong in Settings. */
'open-settings', 
/** The Open Design session behind an OD-owned model expired. */
'sign-in', 
/** Credit is spent. Retrying cannot bring it back. */
'add-credit', 
/** Transient: upstream wobble, throttling, timeout, local restart. */
'retry-later', 
/** The installed app/runtime is too old to place the request at all. */
'update-app', 
/** This run/project does not do this kind of generation, by policy. */
'unsupported', 
/** We could not name a cause. Ours to fix, not the user's. */
'contact-support'];
export type MediaFailureNextStep = (typeof MEDIA_FAILURE_NEXT_STEPS)[number];
export interface ProjectMediaTaskError {
    message: string;
    status?: number;
    code?: string;
    subject?: 'prompt' | 'input_image' | 'output_image';
    retryable?: boolean;
    /**
     * The classified next step. Always present on a failure the daemon
     * recorded: an absent value would push every consumer back to guessing from
     * `message`, which is the habit this field exists to end.
     */
    nextStep?: MediaFailureNextStep;
}
/**
 * A media generation the HOST itself watched fail, attributed to the run that
 * asked for it.
 *
 * The daemon has always known this: `routes/media.ts` writes a `[media]`
 * `event: "failed"` diagnostic carrying the very `run_id` that dispatched the
 * task. It just never handed the fact back to the run, so the run's terminal
 * frame was decided by the agent's exit code alone — the agent exits 0 after
 * apologising in prose, and the turn published `status: "succeeded"`,
 * `endedWithUnfinishedWork: false`, a green check, and an empty artifact rail.
 *
 * This is host-observed evidence, never a reading of the model's own words.
 * The apology sentence the media contract asks the model to copy verbatim
 * (`prompts/media-contract.ts`, design S22) is COPY: it can be rewritten in any
 * release, and no completeness verdict may depend on what it says.
 */
export interface RunMediaTaskFailure {
    /** The media task's id, so a consumer can fetch its full record. */
    taskId: string;
    /** `image` | `video` | `audio`, as requested. Absent if the request never named one. */
    surface?: string;
    /** The requested media model id. */
    model?: string;
    /** When the host recorded the failure. */
    failedAt: number;
    /** The task's own classified error, verbatim — same shape the media task
     *  endpoints publish, so an error card needs no second vocabulary. */
    error: ProjectMediaTaskError;
}
/** Everything a media failure can be classified from. All fields optional. */
export interface MediaFailureSignal {
    /**
     * The producer's stable code, when it published one. Never invent it: an
     * unrecognised code must NOT be promoted to a content refusal, or a user
     * gets sent off to rewrite a prompt that was never the problem.
     */
    code?: string | null | undefined;
    /** A real upstream HTTP status. Omit rather than defaulting it. */
    status?: number | null | undefined;
    /** The producer's diagnostic sentence. Read, never shown to a user. */
    message?: string | null | undefined;
    /** Only an explicit boolean counts; undefined means "the producer did not say". */
    retryable?: boolean | null | undefined;
    /** Model id, so an OD-owned (`vela/*`) credential failure is not read as a BYOK one. */
    model?: string | null | undefined;
}
/**
 * Classify a media failure into the one thing its reader should do next.
 *
 * Precedence is deliberate and narrows outward from proof to guess: a code the
 * producer published, then a real HTTP status, then the two message shapes
 * that provably carry a status, then a two-entry message allowlist, then the
 * producer's own retry verdict. Anything left is `contact-support` — "we could
 * not name it" is an honest answer and its copy still offers a retry, whereas
 * guessing `revise-request` would blame the user for our outage.
 */
export declare function mediaFailureNextStep(signal: MediaFailureSignal): MediaFailureNextStep;
/** A project media task snapshot consumed by ChatPanel's per-output progress row. */
export interface ProjectMediaTask {
    taskId: string;
    /**
     * Creation order within the daemon's media task store. Compare it, never
     * persist or display it. `startedAt` ties on every parallel fan-out, so this
     * is the only field that keeps a batch's cells in their real positions
     * across polls. Absent from a producer that does not report it — fall back
     * to `startedAt` then.
     */
    sequence?: number;
    /**
     * Identity of the generation batch this task belongs to: same-run,
     * same-surface tasks whose lifetimes overlap, which is what a user perceives
     * as one "generate the illustrations" action. Absent means the producer did
     * not group; treat the task as a batch of one rather than guessing a total.
     */
    batchId?: string;
    /** 1-based position within `batchId`. The N in "N/M". */
    batchIndex?: number;
    /**
     * Tasks known in `batchId`. The M in "N/M". It grows while the batch is open
     * and freezes once its last member ends, so a progress row's denominator
     * never walks backwards. A one-at-a-time generation reports 1 here: the
     * product ruling is a single spinner, not a fabricated total.
     */
    batchSize?: number;
    runId?: string;
    status: MediaTaskStatus;
    startedAt: number;
    endedAt: number | null;
    elapsed: number;
    surface?: string;
    model?: string;
    progress: string[];
    progressCount: number;
    file?: ProjectMediaTaskFile;
    error?: ProjectMediaTaskError;
}
export interface ProjectMediaTasksResponse {
    tasks: ProjectMediaTask[];
}
export declare const MEDIA_POLICY_DENIAL_CODES: readonly ['MEDIA_EXECUTION_DISABLED', 'MEDIA_SURFACE_DENIED', 'MEDIA_MODEL_DENIED'];
export type MediaPolicyDenialCode = (typeof MEDIA_POLICY_DENIAL_CODES)[number];
/**
 * Run-scoped policy controlling OpenDesign-owned media generation only.
 *
 * `allowedSurfaces` and `allowedModels` apply solely to `/api/tools/media/generate`
 * and in-run `od media generate`. External MCP media tools are intentionally
 * unaffected: provider policy for those belongs to the MCP server / orchestrator.
 */
export interface MediaExecutionPolicy {
    mode: MediaExecutionMode;
    allowedSurfaces?: MediaSurface[];
    allowedModels?: string[];
}
export declare const DEFAULT_MEDIA_EXECUTION_POLICY: MediaExecutionPolicy;
export interface MediaPolicyTarget {
    surface: MediaSurface;
    model?: string;
}
export interface MediaPolicyDenial {
    code: MediaPolicyDenialCode;
    message: string;
}
export declare function mediaExecutionPolicyDenial(policy: MediaExecutionPolicy, target: MediaPolicyTarget): MediaPolicyDenial | null;
/** Request for Open Design's deterministic local HyperFrames scaffold. */
export interface HyperFramesScaffoldRequest {
    /** Project-relative path in the form `.hyperframes-cache/<id>` or visible `motion-source/<id>`. */
    compositionDir: string;
}
/** Files created before the agent authors the composition HTML. */
export interface HyperFramesScaffoldResponse {
    compositionDir: string;
    files: ['hyperframes.json', 'meta.json', 'index.html', ...string[]];
}
//# sourceMappingURL=media.d.ts.map