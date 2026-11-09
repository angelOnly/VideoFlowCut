import type { PublicFilePublicationScope } from './public-file-publication-store.js';
/** One stable identity for publication and source deletion, including retries
 * after local bytes/project rows are gone. Never derive it from current login. */
export declare function publicFileResourceIdFor(scope: PublicFilePublicationScope): string;
