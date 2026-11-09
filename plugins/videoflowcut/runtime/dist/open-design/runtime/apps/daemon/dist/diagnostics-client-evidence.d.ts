/**
 * Renderer-side evidence that has to ride inside the diagnostics zip.
 *
 * Why the daemon holds it at all
 * ------------------------------
 * The diagnostics bundle is built here, from files this process can read. The
 * chat scroll freeze is the opposite kind of fact: it lives entirely in the
 * renderer — DOM, computed styles, running animations, the freeze probe's own
 * state — and none of it is on disk anywhere.
 *
 * Both export paths funnel through `GET /api/diagnostics/export`. In the
 * packaged app the click goes renderer -> preload -> Electron main -> native
 * save dialog -> daemon GET, so there is no request body the renderer could
 * attach anything to. A rendezvous is therefore the only shape that works for
 * BOTH the browser download and the packaged native save: the renderer posts
 * the scene here first, this module holds the latest one, and the export drains
 * it into `summary/chat-scroll-forensics.json`.
 *
 * Memory, not disk
 * ----------------
 * The evidence is only interesting while the incident is live, and it dies with
 * the page anyway. Keeping it in memory means it never becomes a data-directory
 * path question and never outlives the daemon that collected it.
 */
import { type RequestHandler } from 'express';
/** Where the renderer posts a capture. Canonical definition. */
export declare const CHAT_SCROLL_FORENSICS_PATH = "/api/diagnostics/chat-scroll-forensics";
/**
 * Body ceiling. A capture carries the chat log's full `outerHTML`, and a long
 * transcript runs to several megabytes; the renderer already truncates its own
 * side at 8MB, so this leaves room for the rest of the scene without inviting
 * an unbounded parse.
 */
export declare const CHAT_SCROLL_FORENSICS_BODY_LIMIT = "24mb";
/** The name this lands under inside the zip. */
export declare const CHAT_SCROLL_FORENSICS_SUMMARY_FILE = "chat-scroll-forensics.json";
export declare const NO_RENDERER_CAPTURE_NOTE: string;
export interface StoredChatScrollForensics {
    receivedAtIso: string;
    /** Opaque here on purpose — the renderer owns the shape. */
    payload: unknown;
}
export declare function storeChatScrollForensics(payload: unknown): StoredChatScrollForensics;
export declare function readStoredChatScrollForensics(): StoredChatScrollForensics | null;
export declare function clearStoredChatScrollForensics(): void;
export interface ChatScrollForensicsSummary {
    captured: boolean;
    receivedAtIso: string | null;
    note: string;
    evidence: unknown;
}
/**
 * What goes into the zip.
 *
 * Absence is written out in words rather than left as a missing file: a reader
 * who opens the bundle and finds nothing must be able to tell "the renderer had
 * nothing to say" apart from "this export path never asks the renderer", and
 * only one of those is a reason to go back and ask for another bundle.
 */
export declare function buildChatScrollForensicsSummary(): ChatScrollForensicsSummary;
/**
 * JSON body parser sized for a full chat-log capture.
 *
 * Annotated explicitly: `express.json()` infers a connect `NextHandleFunction`,
 * whose name the daemon's declaration emit cannot reach, so an inferred type
 * here builds under `typecheck` and fails under `tsc -p tsconfig.json`.
 */
export declare const chatScrollForensicsBodyParser: RequestHandler;
export declare const chatScrollForensicsHandler: RequestHandler;
