import type { ChildProcess } from 'node:child_process';
import type { Writable } from 'node:stream';
import type { JsonRecord, SendAgentEvent } from './internal.js';
/** A base64-encoded image object in pi's RPC prompt format. */
export type PiImagePayload = {
    type: 'image';
    data: string;
    mimeType: string;
};
/** Generic parameter bag for a pi RPC command written to child stdin. */
export type PiRpcParams = JsonRecord;
/** Options for `attachPiRpcSession`. All fields map directly to the pi RPC protocol. */
export type PiRpcSessionOptions = {
    child: ChildProcess;
    prompt: string;
    cwd?: string;
    model?: string | null;
    send: SendAgentEvent;
    imagePaths?: string[];
    uploadRoot?: string;
    parentSession?: string;
};
/** Handle returned by `attachPiRpcSession` for querying run state and requesting abort. */
export type PiRpcSession = {
    hasFatalError(): boolean;
    completedSuccessfully(): boolean;
    completionShutdownRequested(): boolean;
    abort(): void;
    getLastSessionPath(): string | null;
};
/** Maximum number of images forwarded per prompt turn. */
export declare const MAX_IMAGE_COUNT = 10;
/** Total byte ceiling for all images forwarded in one prompt turn. */
export declare const MAX_TOTAL_IMAGE_BYTES: number;
/** File extensions accepted in pi's `images` RPC field. */
export declare const ALLOWED_IMAGE_EXTENSIONS: Set<string>;
/** Extension UI methods that expect no response — silently consumed without reply. */
export declare const FIRE_AND_FORGET_METHODS: Set<string>;
/**
 * Writes a JSON-RPC response to pi's stdin for an `extension_ui_request` event,
 * keeping pi unblocked without surfacing an interactive dialog to the daemon caller.
 * Fire-and-forget methods are silently consumed. Dialog methods are auto-resolved:
 * `confirm` → `{ confirmed: true }`; select/input/editor → first option or cancelled.
 *
 * @param writable - The child process stdin stream.
 * @param raw      - The parsed `extension_ui_request` RPC object from pi's stdout.
 */
export declare function replyExtensionUi(writable: Writable, raw: JsonRecord): void;
/** Snapshot of `.pi/sessions/` file metadata taken before a prompt is sent. */
export type PiSessionFileSnapshot = Map<string, {
    mtimeMs: number;
    size: number;
}>;
/**
 * Reads `.pi/sessions/*.jsonl` entries from the given working directory,
 * returning file paths with their mtime and size. Returns an empty array
 * when the directory is absent, empty, or unreadable.
 *
 * @param cwd - Absolute path to the pi working directory; may be undefined.
 */
export declare function readPiSessionFiles(cwd: string | undefined): Array<{
    path: string;
    mtimeMs: number;
    size: number;
}>;
/**
 * Takes a before-snapshot of `.pi/sessions/` to enable changed-file detection
 * after the prompt completes.
 *
 * @param cwd - Absolute path to the pi working directory; may be undefined.
 */
export declare function snapshotPiSessionFiles(cwd: string | undefined): PiSessionFileSnapshot;
/**
 * Compares the current `.pi/sessions/` directory against a before-snapshot
 * and returns the path of the single changed file. Returns `null` when zero
 * or more than one file changed — concurrent pi processes are detected this
 * way to avoid associating the wrong session with this run.
 *
 * @param cwd    - Absolute path to the pi working directory; may be undefined.
 * @param before - Snapshot taken before the prompt was sent.
 * @returns Absolute path of the changed session file, or `null`.
 */
export declare function resolveSessionPathChangedSince(cwd: string | undefined, before: PiSessionFileSnapshot): string | null;
/**
 * Attaches the daemon's run lifecycle to an already-spawned `pi --mode rpc` child process.
 *
 * Responsibilities:
 * - Loads `parentSession` with `switch_session` before the prompt when
 *   resuming a prior conversation, waiting for acknowledgement before the prompt is sent.
 *   This preserves conversation history across edit rounds; if the parent session is
 *   rejected, the run is failed immediately rather than continuing without prior context.
 * - Encodes and forwards `imagePaths` as base64 in the `prompt` RPC command, subject to
 *   `MAX_IMAGE_COUNT` and `MAX_TOTAL_IMAGE_BYTES` budgets. Symlinks are resolved via
 *   `realpathSync` and re-verified against `uploadRoot` to prevent path-escape attacks.
 * - Streams pi's stdout through `createJsonLineStream`, delegating each parsed object to
 *   `mapPiRpcEvent` for typed SSE event dispatch, and auto-resolving extension-UI requests
 *   via `replyExtensionUi` so pi does not block waiting for interactive dialogs.
 * - Queries the native `sessionFile`; on `agent_end`, captures it for conversational
 *   resume, closes stdin, and schedules a SIGTERM fallback after
 *   `PI_GRACEFUL_SHUTDOWN_MS` ms (default 5000).
 *
 * @param options - Session parameters: child process, prompt string, optional model,
 *                  image paths, upload root for symlink verification, and optional
 *                  parent session path for conversation resume.
 * @returns A `PiRpcSession` handle with `hasFatalError`, `getLastSessionPath`, and `abort`.
 */
export declare function attachPiRpcSession({ child, prompt, cwd, model, send, imagePaths, uploadRoot, parentSession, }: PiRpcSessionOptions): PiRpcSession;
