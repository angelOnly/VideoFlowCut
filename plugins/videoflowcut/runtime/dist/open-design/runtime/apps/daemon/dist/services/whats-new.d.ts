import type { WhatsNewContent } from '@open-design/contracts';
export interface WhatsNewReadResult {
    id: string | null;
    content: WhatsNewContent | null;
    fetchedAt: number;
    stale: boolean;
}
export interface WhatsNewServiceOptions {
    fetchImpl?: typeof fetch;
    now?: () => number;
    env?: NodeJS.ProcessEnv;
}
export interface WhatsNewService {
    readWhatsNew(channel: string): Promise<WhatsNewReadResult>;
}
/** The dedicated, hardcoded highlights document. Operators update this file. */
export declare const DEFAULT_WHATS_NEW_URL = "https://whatsnew.open-design.ai/whats-new.json";
/**
 * The document URL, or null when this build must not show the card.
 * `OD_WHATS_NEW_URL` overrides it for local fixtures and tests (e.g. a
 * tools-serve endpoint) regardless of channel; otherwise the dedicated R2
 * object is used only on release channels.
 */
export declare function whatsNewSourceUrl(env: NodeJS.ProcessEnv, channel: string): string | null;
/**
 * Parses the hosted highlights document. A valid highlight needs a non-empty
 * `id` (the once-per-highlight key) plus `title` and `body`. Anything missing
 * or malformed resolves to `{ id: null, content: null }` rather than
 * propagating a shape error into the UI.
 */
export declare function parseWhatsNewDocument(payload: unknown): {
    id: string | null;
    content: WhatsNewContent | null;
};
export declare function createWhatsNewService({ fetchImpl, now, env, }?: WhatsNewServiceOptions): WhatsNewService;
