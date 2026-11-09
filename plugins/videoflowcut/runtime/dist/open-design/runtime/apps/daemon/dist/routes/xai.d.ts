import type { Express } from 'express';
import type { RouteDeps } from '../server-context.js';
export interface RegisterXaiRoutesDeps extends RouteDeps<'http' | 'paths'> {
}
export declare function registerXaiRoutes(app: Express, ctx: RegisterXaiRoutesDeps): void;
/** Pull the assistant's main text out of an xAI Responses API payload.
 * Handles both the convenience `output_text` field and the structured
 * `output[].content[].text` form. */
export declare function extractAnswerText(data: unknown): string;
/** Walk every annotation in the Responses API output and return the
 * unique URL citations. xAI tags them with `type: 'url_citation'` and
 * fills in `url` / `title` (we only surface url here; the title is
 * already inlined into the answer text). */
export declare function extractUrlCitations(data: unknown): string[];
