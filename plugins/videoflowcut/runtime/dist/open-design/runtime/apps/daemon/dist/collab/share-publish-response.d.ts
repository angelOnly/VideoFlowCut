import type { SharePublishResponse, SharePublishResult } from '@open-design/contracts';
import type { PublicShareLink } from './public-share-viewer-url.js';
/** Presentation origin and binding readiness are independent. A URL names the
 * Viewer route, not a promise that its binding already serves content. */
export declare function sharePublishResponse(result: SharePublishResult, presented: PublicShareLink): SharePublishResponse;
