/**
 * Tool-loop guard — detects an agent stuck repeating failing tool calls and
 * lets the run loop intervene before it grinds through dozens of identical
 * attempts.
 *
 * Motivating failure (the reason this exists): an agent was asked to move a
 * button into a titlebar element it believed was called `titlebar-left`. The
 * real class was `tb-left`. It wrote a shell verification that asserted
 * `titlebar-left` exists, the assertion failed, it concluded the edit hadn't
 * landed, re-read, and retried the SAME wrong assumption — 80+ tool calls,
 * ~19 of them errors, all looping on one invented identifier. Nothing in the
 * autonomous agent-CLI path noticed or stepped in; the daemon faithfully
 * streamed every attempt. (The BYOK proxy path already bounds its tool loop at
 * MAX_BYOK_TOOL_LOOPS; the autonomous chat agents had no equivalent.)
 *
 * This guard observes the normalized `tool_use` / `tool_result` events that
 * EVERY agent stream emits (Claude stream-json, Codex/OpenCode json-event,
 * Copilot, ACP, …), so a single run-scoped instance covers all of them. It is
 * pure and synchronous: feed it events, it returns a verdict the moment a loop
 * signature crosses a threshold. Two independent triggers:
 *
 *   1. CONSECUTIVE failures — N tool_results in a row are errors with no
 *      successful tool call between them. Catches "everything it tries fails"
 *      even when the agent keeps varying the command. Reset to zero on any
 *      successful tool_result, because a success is real progress.
 *
 *   2. REPEATED failure — the SAME (tool, action) signature errors K times.
 *      Catches fixation: re-running the identical failing Edit/Bash over and
 *      over (the titlebar-left case). A read-only success (Read/Glob/LS/Grep,
 *      TodoWrite, …) does NOT clear this tally: a stuck agent often re-reads the
 *      file and retries the same wrong assumption, so resetting on those reads
 *      would let `fail -> read(ok) -> same fail -> read(ok) -> …` loop forever
 *      (exactly the "re-read, retry the same wrong assumption" shape from the
 *      motivating report). The tally clears only on real PROGRESS: a successful
 *      mutating call (Edit/Write, or a state-changing shell command like
 *      `sed -i` / `pnpm install` / `git commit`), or the failing action itself
 *      finally succeeding. K is set high enough that a couple of legitimate
 *      retries of the same command (fix, re-run, fix, re-run) never trip it.
 *
 * Two escalation tiers per trigger:
 *   - WARN  — emit a one-shot heads-up event so the UI/CLI surfaces "this run
 *             may be stuck" while it is still cheap to stop. Never destructive.
 *   - HALT  — at a hard ceiling, terminate the child so the worst case is
 *             bounded instead of open-ended. Opt-in: the daemon defaults to
 *             warn (heads-up only); operators enable the hard stop via
 *             OD_TOOL_LOOP_GUARD=halt.
 *
 * Latching: WARN fires at most once; after it, continued failures can still
 * escalate to HALT (also once). HALT supersedes WARN if the first counted
 * failure already crosses the ceiling. Once halted, further observations are
 * inert — the run is being torn down.
 */
/** Why the guard tripped. */
export type ToolLoopReason = 'consecutive-errors' | 'repeated-failure';
/** What the run loop should do about it. */
export type ToolLoopAction = 'warn' | 'halt';
/** Operating mode. `off` disables the guard entirely. `warn` (the daemon
 *  default) only ever emits heads-up events and never halts. `halt` warns
 *  first, then terminates the run at the hard ceiling; opt in via
 *  OD_TOOL_LOOP_GUARD=halt. */
export type ToolLoopMode = 'off' | 'warn' | 'halt';
/** The verdict returned the instant a threshold is crossed. Shaped to match
 *  the `tool_loop` SSE payload in `@open-design/contracts`. */
export interface ToolLoopVerdict {
    type: 'tool_loop';
    reason: ToolLoopReason;
    action: ToolLoopAction;
    /** The tool that kept failing (e.g. `Edit`, `Bash`). */
    toolName: string;
    /** Truncated, human-readable form of the repeated action. */
    signature: string;
    /** How many times it failed: the consecutive run, or repeats of this exact
     *  signature, depending on `reason`. */
    count: number;
}
export interface ToolLoopGuardOptions {
    /** Consecutive errored tool_results that trigger a WARN. Default 5. */
    warnConsecutive?: number;
    /** Consecutive errored tool_results that trigger a HALT. Default 10. */
    haltConsecutive?: number;
    /** Repeats of the same failing signature that trigger a WARN. Default 4. */
    warnRepeat?: number;
    /** Repeats of the same failing signature that trigger a HALT. Default 8. */
    haltRepeat?: number;
    /** Operating mode. Default `warn`. */
    mode?: ToolLoopMode;
}
export interface ToolLoopGuard {
    /** Record a tool call so a later errored result can be attributed to its
     *  action signature. Safe to call with unknown/missing input. */
    observeToolUse(id: string, name: string, input: unknown): void;
    /** Record a tool result. Returns a verdict the first time WARN is crossed
     *  and again the first time HALT is crossed; otherwise `null`. */
    observeToolResult(toolUseId: string, isError: boolean, content?: string): ToolLoopVerdict | null;
    /** True once a WARN verdict has been returned. */
    readonly warned: boolean;
    /** True once a HALT verdict has been returned. */
    readonly halted: boolean;
}
/**
 * Heuristic: does this shell command ONLY inspect state? A successful read-only
 * shell call must not clear the repeated-failure tally, while a state-changing
 * one (sed -i, mv, pnpm install, a build, a redirect to a file, git add/commit)
 * should. Conservative by design — anything not recognised as a pure inspection
 * is treated as a state change (progress), so the guard never halts a run that
 * is making real changes through the shell.
 */
export declare function isReadOnlyShellCommand(command: string): boolean;
/**
 * Whether a SUCCESSFUL tool call is progress on the work (so it clears the
 * repeated-failure tally). Read-only tools and pure-inspection shell commands
 * are not; everything else is. `signature` is the value from
 * computeToolSignature (`<tool> <detail>`), used to recover the shell command.
 */
export declare function isProgressSuccess(name: string, signature: string): boolean;
/**
 * Build a stable signature for a tool call from its name + input. Prefers the
 * one field that identifies the ACTION an agent would keep retrying:
 *   - Bash            → the command
 *   - Edit/Write/Read → the file path (plus the search string for Edit, since
 *                       re-running Edit on the same file with a different
 *                       old_string is legitimate progress, not a loop)
 *   - anything else   → a stable stringify of the whole input
 * Falls back to the tool name alone when there is no usable input. The result
 * is whitespace-collapsed but NOT length-capped: it is the dedup key, so it
 * must stay full-fidelity or two distinct long actions sharing a prefix would
 * collide and pool each other's failures. Use `displayToolSignature` for the
 * bounded form surfaced in the `tool_loop` event.
 */
export declare function computeToolSignature(name: string, input: unknown): string;
/**
 * Bound a full signature to a human-readable length for the emitted
 * `tool_loop` event. Only the DISPLAY form is truncated; the full signature
 * from `computeToolSignature` remains the dedup key, so two long actions that
 * share a 160-char prefix still count separately.
 */
export declare function displayToolSignature(signature: string): string;
/**
 * Create a run-scoped tool-loop guard. See the module docblock for the
 * detection model. Usage in the run loop:
 *
 *   const guard = createToolLoopGuard({ mode: resolveToolLoopMode() });
 *   // on tool_use:    guard.observeToolUse(ev.id, ev.name, ev.input);
 *   // on tool_result: const v = guard.observeToolResult(ev.toolUseId, ev.isError, ev.content);
 *   //                 if (v) { send('agent', v); if (v.action === 'halt') abortForToolLoop(v); }
 */
export declare function createToolLoopGuard(options?: ToolLoopGuardOptions): ToolLoopGuard;
/**
 * Resolve the guard mode from the environment. `OD_TOOL_LOOP_GUARD` accepts
 * `warn` (default), `halt`, or `off`. The default is `warn`: a heuristic guard
 * should surface a heads-up before it terminates anyone's run, and operators
 * opt into `halt` for the hard stop. Anything unrecognised falls back to `warn`
 * so a typo never changes behavior unexpectedly. Mirrors the OD_*_GUARD
 * convention (e.g. OD_ARTIFACT_STUB_GUARD).
 */
export declare function resolveToolLoopMode(env?: NodeJS.ProcessEnv): ToolLoopMode;
