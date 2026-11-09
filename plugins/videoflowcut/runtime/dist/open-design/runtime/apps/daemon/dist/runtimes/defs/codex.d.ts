import type { RuntimeModelOption } from '../types.js';
import type { RuntimeAgentDef } from '../types.js';
export declare function parseCodexDebugModels(stdout: string): RuntimeModelOption[] | null;
export declare function codexOpenDesignShellEnvironmentArgs(): string[];
export declare function codexReasoningSummaryArgs(): string[];
export declare function codexUpdatePlanToolArgs(): string[];
export declare function codexNeedsDangerFullAccessSandbox(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): boolean;
export declare const codexAgentDef: {
    id: string;
    name: string;
    bin: string;
    versionArgs: string[];
    listModels: {
        args: string[];
        parse: typeof parseCodexDebugModels;
        timeoutMs: number;
    };
    authProbe: {
        args: string[];
        timeoutMs: number;
    };
    fallbackModels: RuntimeModelOption[];
    reasoningOptions: {
        id: string;
        label: string;
    }[];
    buildArgs: (_prompt: string, _imagePaths: string[], extraAllowedDirs?: string[] | undefined, options?: import("../types.js").RuntimeBuildOptions | undefined, runtimeContext?: import("../types.js").RuntimeContext | undefined) => string[];
    promptViaStdin: true;
    resumesSessionViaCli: true;
    capturesSessionIdFromStream: true;
    streamFormat: string;
    eventParser: string;
};
/**
 * `streamFormat` value that routes a codex run through the JSON-RPC
 * `codex app-server` transport instead of `exec --json`.
 *
 * The two transports coexist. `app-server` is the shipping default, while an
 * operator can set `OD_CODEX_TRANSPORT=exec-json` for an immediate rollback.
 * The reason to have a second transport at all is that `exec --json` cannot
 * stream: `codex-rs/exec/src/event_processor_with_json_output.rs` has
 * suppressed `AgentMessageDelta` / `AgentReasoningDelta` since `rust-v0.8.0`,
 * so a several-minute codex turn shows nothing until an item completes. The
 * app-server transport carries the same items PLUS the token deltas.
 */
export declare const CODEX_APP_SERVER_STREAM_FORMAT = "codex-app-server";
/**
 * Lowest codex release `auto` mode will switch to.
 *
 * Three numbers matter, established by reading the codex source at each tag
 * rather than by reading the protocol declarations — a method NAME routinely
 * appears releases before anything emits it, and a declared-but-unwired method
 * looks supported while streaming nothing:
 *
 *   rust-v0.56.0  `thread/start` / `thread/resume` / `turn/start` /
 *                 `turn/interrupt` land wired; `ThreadStartParams.sandbox` and
 *                 `TurnStartParams.summary` exist from day one.
 *   rust-v0.59.0  first emit of `item/agentMessage/delta` (PR #6559) and of the
 *                 reasoning summary deltas — i.e. the streaming this transport
 *                 exists for. Also the first `turn/completed` emit.
 *   rust-v0.64.0  first emit of `thread/tokenUsage/updated`. This is the
 *                 CAPABILITY floor: below it the transport still works but
 *                 reports no token usage, which would be a regression against
 *                 `exec --json`.
 *
 * The constant is set higher still, at the release where `initialize` first
 * accepts a `capabilities` object at all (PR #10231). Below it our handshake
 * would be sending a field the server has no place to put, and we would be
 * guessing at how its deserializer treats the extra key. Refusing to guess
 * costs nothing real — codex ships roughly two stable releases a week, so
 * everything below this floor is long superseded.
 *
 * Two notifications land later than this floor and degrade quietly when
 * absent: `warning` (rust-v0.122.0) simply produces no warning pill, and
 * `item/fileChange/patchUpdated` (rust-v0.123.0) is enabled per thread only
 * when the running server's initialize response reports a supported version.
 */
export declare const CODEX_APP_SERVER_MIN_VERSION = "0.95.0";
export type CodexTransport = 'exec-json' | 'app-server';
export type CodexTransportPreference = CodexTransport | 'auto';
/** Operator switch. Unset means the shipping `app-server` behaviour. */
export declare const CODEX_TRANSPORT_ENV_VAR = "OD_CODEX_TRANSPORT";
/**
 * Read the operator's transport preference.
 *
 * Three values. An unrecognised non-empty value fails closed to exec-json
 * rather than taking Codex offline; an unset or empty value uses the shipping
 * app-server default.
 *
 *   (unset)                app-server (shipping default)
 *   `exec-json`            force the legacy transport (rollback)
 *   `auto`                 app-server when the installed codex is new enough
 *   `app-server`           force, no version gate (operator override)
 */
export declare function codexTransportPreference(env?: NodeJS.ProcessEnv | Record<string, string | undefined>): CodexTransportPreference;
/**
 * Decide whether a detected codex version is at or above the app-server floor.
 *
 * Fails closed: a version string this parser cannot read (a nightly tag, an
 * empty probe result, a CLI that changed its `--version` format) reports false,
 * so `auto` stays on `exec --json` instead of gambling on a silent stream.
 */
export declare function codexAppServerSupportsVersion(version: string | null | undefined): boolean;
/** Resolve the transport for one run from the switch plus the version probe. */
export declare function resolveCodexTransport(opts: {
    env: NodeJS.ProcessEnv | Record<string, string | undefined>;
    version: string | null;
}): CodexTransport;
/**
 * Effective sandbox mode for a codex run, shared by both transports so the
 * app-server thread can never be more permissive than the `exec` invocation it
 * replaces. `workspace-write` and `danger-full-access` are the same two
 * `SandboxMode` values codex's own `--sandbox` flag accepts, and codex builds
 * the identical policy from either entry point.
 */
export declare function codexResolvedSandboxMode(): 'workspace-write' | 'danger-full-access';
/**
 * Return the runtime definition to use for one run under `transport`.
 *
 * Under `exec-json` this returns the SAME OBJECT the registry exports. That is
 * the rollback guarantee in its strongest available form: with the switch off
 * there is no derived def, no copied field, and nothing downstream — the spawn
 * branch, the `start` SSE payload, the execution-profile lookup, the resume
 * bookkeeping — can observe that this code exists.
 */
export declare function withCodexTransport(def: RuntimeAgentDef, transport: CodexTransport): RuntimeAgentDef;
export declare function probeCodexVersion(launchPath: string): string | null;
/** Test-only: forget the memoized probe so a suite can vary the version. */
export declare function resetCodexVersionProbeCache(): void;
/**
 * Resolve the runtime definition a chat run should use for `agentId`.
 *
 * This is the single choke point where the codex transport switch is applied.
 * For every non-codex agent, and for codex with the switch off, the argument is
 * returned unchanged — same object, same behaviour.
 */
export declare function applyCodexTransportOverride(def: RuntimeAgentDef | null, env?: NodeJS.ProcessEnv): RuntimeAgentDef | null;
