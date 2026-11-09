import Database from 'better-sqlite3';
import type { FinalizeAnthropicRequest, FinalizeAnthropicResponse, FinalizeArtifactRef, FinalizeProviderProtocol } from '@open-design/contracts/api/finalize';
export type { FinalizeAnthropicRequest, FinalizeAnthropicResponse, FinalizeArtifactRef, FinalizeProviderProtocol, };
export declare const DEFAULT_TIMEOUT_MS = 120000;
export declare function isFinalizeProviderProtocol(value: unknown): value is FinalizeProviderProtocol;
export declare function defaultBaseUrlForFinalizeProtocol(protocol: FinalizeProviderProtocol): string;
export interface FinalizeOptions {
    protocol?: FinalizeProviderProtocol;
    apiKey: string;
    baseUrl?: string;
    model: string;
    maxTokens?: number;
    apiVersion?: string;
    now?: () => Date;
    fetchImpl?: typeof globalThis.fetch;
    signal?: AbortSignal;
    timeoutMs?: number;
}
export declare class FinalizePackageLockedError extends Error {
    constructor(message: string);
}
/**
 * Upstream Anthropic call failure with a meaningful HTTP status the route
 * handler can map to one of the documented error codes (401/429/502).
 */
export declare class FinalizeUpstreamError extends Error {
    status: number;
    rawText: string;
    constructor(status: number, rawText: string, message?: string);
}
type Db = Database.Database;
interface ResolvedArtifact {
    name: string;
    body: string;
    manifest: {
        kind?: string;
        updatedAt?: string;
        title?: string;
        entry?: string;
    } | null;
}
/**
 * Resolve the project's "current artifact" for the synthesis prompt.
 *
 * Priority order:
 *   1. The file referenced by `tabs.is_active = 1` IF it has an
 *      `<name>.artifact.json` sidecar present on disk. "Sidecar
 *      presence" is the discriminator: an inferred manifest (e.g. for
 *      a bare `.html` file with no sidecar) does NOT count, and an
 *      active tab pointing at a non-artifact file (`.md`, `.txt`)
 *      falls through.
 *   2. The newest project file with a real `.artifact.json` sidecar,
 *      sorted by `manifest.updatedAt` descending. Files without an
 *      `updatedAt` (legacy pre-streaming manifests) sort last.
 *   3. `null` — no artifact in scope. Caller emits `artifact: null`
 *      in the response and the prompt's "Current artifact" section
 *      reads "none".
 *
 * `metadata` is the project row's `metadata` field (from `getProject`).
 * For imported-folder projects, `metadata.baseDir` redirects file IO
 * to the user's actual folder; without it, this resolver would only
 * look under `.od/projects/<id>` and miss the real artifacts.
 *
 * Sidecar presence is checked via `existsSync` on the on-disk path so
 * the resolver does not depend on `inferLegacyManifest`'s heuristic.
 */
export declare function resolveCurrentArtifact(db: Db, projectsRoot: string, projectId: string, metadata?: {
    baseDir?: string;
} | null): Promise<ResolvedArtifact | null>;
export declare function finalizeDesignPackage(db: Db, projectsRoot: string, designSystemsRoot: string, projectId: string, options: FinalizeOptions): Promise<FinalizeAnthropicResponse>;
/**
 * Append `/v1/<suffix>` to a base URL, but only if the URL does not
 * already include a `/vN` segment. Mirrors the helper inlined in
 * `apps/daemon/src/connectionTest.ts:188-195` (not exported there).
 */
export declare function appendVersionedApiPath(baseUrl: string, suffix: string): string;
export interface FinalizeProviderCallParams {
    protocol: FinalizeProviderProtocol;
    apiKey: string;
    baseUrl: string;
    model: string;
    maxTokens: number;
    systemPrompt: string;
    userPrompt: string;
    apiVersion?: string;
    signal?: AbortSignal;
    fetchImpl?: typeof globalThis.fetch;
    /** Test-only: skip the inter-attempt sleep so retries are instant. */
    _sleepMs?: (ms: number) => Promise<void>;
}
export type AnthropicCallParams = Omit<FinalizeProviderCallParams, 'protocol' | 'apiVersion'>;
/**
 * Call the selected provider API once, retrying once on a transient
 * upstream failure (HTTP 429 or 5xx). On a terminal failure, throw a
 * `FinalizeUpstreamError` carrying the upstream HTTP status and raw
 * body text — the route handler maps the status to one of
 * AUTH_FAILED / RATE_LIMITED / UPSTREAM_FAILED and runs the raw body
 * through `redactSecrets` before exposing it as `details` on the
 * error JSON.
 *
 * Retry posture (1 retry) is opinionated; the maintainer's
 * "standard exponential backoff" answer was directional and a single
 * retry matches the existing daemon's posture (transcript export and
 * connectionTest do zero retries).
 */
export declare function callFinalizeProviderWithRetry(params: FinalizeProviderCallParams): Promise<Response>;
export declare function callAnthropicWithRetry(params: AnthropicCallParams): Promise<Response>;
/**
 * Extract the Markdown body from a provider response. Anthropic returns
 * `content[].text`; OpenAI/Azure return `choices[].message.content`;
 * Gemini returns `candidates[].content.parts[].text`; Ollama returns
 * `message.content`. Unexpected shapes throw `FinalizeUpstreamError(502)`
 * so the route handler maps them to `502 UPSTREAM_FAILED` rather than
 * producing an empty DESIGN.md on disk.
 */
export declare function extractDesignMd(payload: unknown, protocol?: FinalizeProviderProtocol): string;
export interface SynthesisPromptInput {
    projectId: string;
    transcriptJsonl: string;
    transcriptMessageCount: number;
    designSystemId: string | null;
    designSystemBody: string | null;
    artifact: ResolvedArtifact | null;
    now: Date;
}
export interface SynthesisPromptOutput {
    systemPrompt: string;
    userPrompt: string;
}
/**
 * Build the system + user prompts for the Anthropic Messages API call.
 * Inputs are verbatim except for the transcript (which the caller has
 * already passed through `truncateTranscriptForPrompt` — this function
 * does not re-truncate). Missing inputs (no design system selected, no
 * artifact in scope) produce explicit "none"/parenthetical placeholders
 * so Claude does not hallucinate content for absent sections.
 */
export declare function buildSynthesisPrompt(input: SynthesisPromptInput): SynthesisPromptOutput;
/**
 * Truncate a JSONL transcript body so it fits inside Claude's context
 * window when fed into a synthesis prompt. The on-disk transcript stays
 * untouched (PR #493's lossless contract); this function operates on a
 * copy that lives only in the prompt.
 *
 * Strategy: keep the header line (line 0); if the remaining body exceeds
 * INPUT_BODY_CAP_BYTES (minus the header + marker reservation), retain
 * head and tail lines in roughly equal byte budgets and drop the middle
 * with a single sentinel JSON line:
 *
 *   {"kind":"truncated","reason":"size","omittedBytes":<N>}
 *
 * `omittedBytes` is the difference between the original UTF-8 byte
 * length and the truncated output's UTF-8 byte length, so a synthesis
 * consumer can detect the gap.
 *
 * If head + tail budgets together cover the whole body (e.g. all message
 * lines are tiny), no marker is emitted; the output is the input
 * verbatim.
 */
export declare function truncateTranscriptForPrompt(jsonl: string): string;
