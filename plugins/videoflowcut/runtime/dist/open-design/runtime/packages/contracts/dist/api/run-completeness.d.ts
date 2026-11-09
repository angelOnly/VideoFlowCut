/**
 * Canonical "did the run's declared work actually finish?" predicate.
 *
 * ONE definition, shared by the daemon run classifier (which stamps
 * `endedWithUnfinishedWork` onto the run/message) and the web chat footer
 * (`unfinishedTodosFromEvents` in apps/web/src/runtime/todos.ts). If these two
 * drifted, the lower-left status surfaces (Pet task center, project pill) could
 * read "Completed" while the chat footer reads "Stopped with unfinished work" —
 * the exact bug (#1247 / #1060) this module exists to make unrepresentable.
 *
 * A TodoWrite task counts as UNFINISHED when its status is anything other than
 * `completed` — i.e. `pending`, `in_progress`, or `stopped` (a task the agent
 * marked failed/canceled). This mirrors the web footer's `status !== 'completed'`
 * filter exactly. Do not narrow this to "pending or in_progress only": excluding
 * `stopped` would make a stopped-only run read "unfinished" in the footer but
 * "Completed" on the pill/Pet widget, reintroducing the divergence.
 */
/** Turn-terminal stop reasons that mean the model was cut off mid-generation
 *  rather than finishing cleanly. A run truncated here is incomplete even if its
 *  last TodoWrite looked done. Shared by the daemon capture path and the persisted
 *  events predicate so the live and reloaded verdicts agree. */
export declare const MID_TURN_TRUNCATION_STOP_REASONS: ReadonlySet<string>;
/** True when a turn stop reason indicates a mid-generation truncation. */
export declare function stopReasonIsTruncation(stopReason: unknown): boolean;
/** True when a single TodoWrite task status represents unfinished work. */
export declare function todoStatusIsUnfinished(status: unknown): boolean;
/**
 * Only the canonical per-run marker is completion evidence. The prompt asks
 * the model to copy this exact form and explicitly says that a fenced marker
 * is ignored, so this predicate deliberately fails closed on alternate tag
 * spellings and markers inside fenced/inline code.
 */
export declare function textHasAuthenticatedDoneConclusion(text: unknown, key: unknown): boolean;
/** True when the exact per-run marker occurs outside Markdown code. */
export declare function textHasAuthenticatedDoneMarker(text: unknown, key: unknown): boolean;
export interface AuthenticatedDoneCaptureState {
    markerTail: string;
    awaitingConclusion: boolean;
    authenticatedConclusion: boolean;
}
/**
 * Incremental live-stream companion to `textHasAuthenticatedDoneConclusion`.
 *
 * `fullVisibleText` is the caller's existing reply accumulator; this state
 * deliberately keeps only a marker-length tail and one boolean. Once a valid
 * marker has arrived without prose, later whitespace deltas do no rescanning;
 * the first non-whitespace delta authenticates the conclusion in O(1).
 */
export declare function advanceAuthenticatedDoneCapture(args: {
    fullVisibleText: string;
    delta: string;
    key: string;
    state?: Partial<AuthenticatedDoneCaptureState> | null;
}): AuthenticatedDoneCaptureState;
/**
 * Persisted-event form of `textHasAuthenticatedDoneConclusion`. A `done_key`
 * without its matching marker is not evidence; neither is a marker without a
 * visible final answer after it.
 */
export declare function eventsHaveAuthenticatedDoneConclusion(events: unknown): boolean;
/**
 * True when the turn ended by handing the baton back to the user.
 *
 * `text` is the turn's VISIBLE assistant text. The turn asked when that text
 * rendered a `<question-form>`/`<ask-question>` the user can answer — the same
 * `emittedRenderableQuestionForm` the daemon already uses to report a project
 * as `awaiting_input` (`listPartitionsAwaitingInput` in apps/daemon/src/db.ts)
 * and to score `run_finished.asked_user_question`. This is deliberately not a
 * new product rule: it is the existing awaiting-input rule, finally consulted
 * by the surfaces that judge completeness.
 *
 * Why completeness has to ask it. A discovery/clarification turn writes its
 * plan with TodoWrite, asks its question, and exits 0 — nothing stopped it, and
 * the user's answer is the continuation. Judging that turn on its last TodoWrite
 * snapshot alone (one `in_progress` + three `pending`, zero `completed`) made
 * every surface assert a *termination cause* it had no evidence for: the chat
 * footer read "stopped with unfinished work" under a form the user was still
 * filling in, and `projectDisplayStatusForRunRow` projected the project as
 * `incomplete`. Run `441ff961-bd66-4c4a-91e7-812f1d489668` (packaged beta
 * 0.21.1-beta.7) is the recorded case: `status: succeeded`, `exitCode: 0`,
 * `signal: null`, no error of any kind, and the next turn — after the user
 * answered — delivered 34 artifacts.
 *
 * Renderable is the whole point of the predicate: a bare `<question-form` tag
 * quoted in prose, or the literal markup inside a generated HTML artifact, is
 * NOT a question. Only a closed block whose body the web parser would actually
 * turn into a form card counts, so an artifact-writing turn that happens to
 * print the tag keeps reporting its real completeness.
 *
 * Callers combine this with the run's terminal status themselves, exactly as
 * they already do for `authenticatedDoneConclusion`: a turn the user STOPPED,
 * or one that failed, is stopped whatever it asked on the way out.
 */
export declare function turnEndedByAskingUser(text: unknown): boolean;
/**
 * Persisted-event form of `turnEndedByAskingUser`.
 *
 * Reassembles the turn's visible text from `kind: 'text'` events — the same
 * events `eventsHaveAuthenticatedDoneConclusion` reads, and the same array the
 * web chat footer holds — so the reloaded verdict matches the live one.
 */
export declare function eventsEndedByAskingUser(events: unknown): boolean;
/**
 * True when a TodoWrite `todos` snapshot contains any unfinished task.
 *
 * `todos` is the raw `input.todos` array from a `TodoWrite` tool_use event.
 * A non-array (no plan emitted) is NOT unfinished — the absence of a declared
 * plan means a text-only answer, which must stay "Completed". An empty array is
 * likewise finished.
 */
export declare function todoSnapshotHasUnfinishedWork(todos: unknown): boolean;
export declare function isTodoWriteToolName(name: unknown): boolean;
/**
 * Derive "ended with unfinished declared work" from a run's PERSISTED agent
 * events (the `events_json` the daemon writes per event, and the same array the
 * web chat footer reads). Finds the LAST TodoWrite tool_use snapshot and applies
 * the canonical predicate. Returns false when the run emitted no TodoWrite at all
 * (a text-only answer stays "Completed").
 *
 * This lets the project-status projection judge completeness from data that
 * already survives reload — no extra column — while reusing the exact predicate
 * the footer uses, so the two can never disagree (#1247 / #1060).
 */
export declare function eventsEndedWithUnfinishedWork(events: unknown): boolean;
/** Extract a TodoWrite tool_use's task array from its input, whether the tool
 *  emitted `todos` or `plan`. Exposed so the daemon capture path folds the same
 *  shape the projection later reads. */
export declare function todoItemsFromTodoWriteInput(input: unknown): unknown;
/** Explicit file evidence only. A completed task merely means its execution ended. */
export declare function strategyTaskProvesDelivery(strategyTask: {
    outcome?: unknown;
    terminal?: unknown;
    deliverableValid?: unknown;
} | null | undefined): boolean;
//# sourceMappingURL=run-completeness.d.ts.map