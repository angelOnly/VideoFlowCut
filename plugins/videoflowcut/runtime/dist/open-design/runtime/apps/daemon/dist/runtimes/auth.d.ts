import type { RuntimeAgentDef, RuntimeEnv } from './types.js';
export type AgentAuthProbeResult = {
    status: 'ok' | 'missing' | 'unknown';
    message?: string;
    stdoutTail?: string;
    stderrTail?: string;
    exitCode?: number | null;
    signal?: string | null;
};
export declare function cursorAuthGuidance(): string;
export declare function deepseekAuthGuidance(): string;
export declare function deepseekHarnessAuthGuidance(): string;
export declare function antigravityAuthGuidance(): string;
export declare function antigravityQuotaGuidance(): string;
export declare function reasonixAuthGuidance(): string;
export declare function claudeAuthGuidance(): string;
export declare function isCursorAuthFailureText(text: string): boolean;
export declare function isAntigravityAuthFailureText(text: string): boolean;
export declare function isDeepSeekAuthFailureText(text: string): boolean;
export type DeepSeekHarnessFailure = {
    code: string;
    message: string;
    authRequired: boolean;
};
/**
 * Turns the profile's structured error payload into a safe user-facing error.
 * Harness SDK errors can place an object in `message`; never coerce that object
 * to text because it produces `[object Object]` and can expose provider data.
 */
export declare function normalizeDeepSeekHarnessFailure(payload: unknown): DeepSeekHarnessFailure;
export declare function isReasonixAuthFailureText(text: string): boolean;
export declare function isClaudeAuthFailureText(text: string): boolean;
export declare function classifyAgentAuthFailure(agentId: string, text: string): AgentAuthProbeResult | null;
export type AgentServiceFailureCode = 'AGENT_AUTH_REQUIRED' | 'RATE_LIMITED' | 'UPSTREAM_UNAVAILABLE';
/**
 * Every command name Open Design's own agent CLIs answer to — each shipped
 * adapter's `id` and its `bin`.
 *
 * This is the half of the attribution the text cannot supply, and the reason
 * the program-prefix shape alone is not enough: `dsh: MISSING_CREDENTIAL:
 * llm-deepseek: no API key for provider route …` wears exactly the same prefix
 * as `gh: not authenticated`, and it is DeepSeek Harness reporting its OWN
 * model key. Position does not separate them either — echoed tool output and
 * the agent's own lines are both line-initial. Only the name does.
 *
 * It is an allowlist of OURS, not a blocklist of tools, and that direction is
 * what makes it hold: everything the daemon did not spawn is foreign by
 * default, so the next `terraform:` or `kubectl:` needs no amendment here. The
 * only list that has to stay current is the adapter registry, which the daemon
 * maintains anyway — and
 * `tests/runtimes/tool-vs-agent-auth-snapshot.test.ts` reads the real
 * `SHIPPED_AGENT_DEFS` and goes red if this falls behind it. Kept as a literal
 * rather than derived from `registry.ts` because that module imports every
 * adapter and every adapter imports this file.
 *
 * Exported for that guard only.
 */
export declare const OWN_AGENT_COMMAND_NAMES: ReadonlySet<string>;
/**
 * True when the auth failure `text` reports belongs to a TOOL the agent ran,
 * rather than to the agent's own credential.
 *
 * This is an attribution question, not a vocabulary question, and the
 * distinction is the whole point. `AGENT_AUTH_REQUIRED` means "sign in" — an
 * offer to fix a credential the daemon can reach (the agent's CLI login, or the
 * AMR Cloud session the web resolves it to,
 * `apps/web/src/runtime/amr-guidance.ts`). A run's failure text is not a clean
 * channel for that claim: `collectFailureText`
 * (`run-failure-classification.ts:177`) folds `stderr` events into the corpus
 * (:188), and the ACP bridge folds whatever the agent wrote into its JSON-RPC
 * error frame — so `gh`, `npm`, `curl` and MCP output are read here too, in the
 * same auth vocabulary the agent's own failures use. Answering "sign in" to one
 * of those sends the user to log in to Open Design for a `gh` token in their
 * own shell: a fix guaranteed not to work.
 *
 * The rule is: **when the report names the credential's holder, believe it; the
 * daemon may supply "the agent" only when the report names nobody.** A holder
 * is named in exactly two ways, and both are the text identifying its own
 * speaker rather than us guessing from prose — the same precedence
 * `reportsPlatformProviderCredentialFault` established for R-053, where a
 * self-identifying machine code outranked the sentence it travelled with.
 *
 * Line scope, not whole-text scope: an unrelated `npm ERR!` elsewhere in a long
 * stderr tail must not vouch for the agent's own 401 on another line. And the
 * program prefix must be the SPEAKER of the complaint, not the complaint — so
 * the auth vocabulary has to appear after it. That is what keeps vela's own
 * `auth_required: please reconnect AMR Cloud` from reading as a program named
 * `auth_required`.
 *
 * Exported because the two classifiers that read the same corpus —
 * `classifyAgentServiceFailure` here and `run-failure-classification.ts`'s
 * `isAuthDetailText` branch — have to agree about whose credential it is.
 */
export declare function reportsToolPrincipalAuthFailure(text: string): boolean;
export declare function classifyAgentServiceFailure(text: string): AgentServiceFailureCode | null;
export declare function probeAgentAuthStatus(def: Pick<RuntimeAgentDef, 'id' | 'name' | 'authProbe'>, resolvedBin: string, env: RuntimeEnv): Promise<AgentAuthProbeResult | null>;
