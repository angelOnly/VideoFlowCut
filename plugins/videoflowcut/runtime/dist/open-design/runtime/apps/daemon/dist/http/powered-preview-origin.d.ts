export declare function projectPoweredPreviewHostname(projectId: string): string;
interface PoweredPreviewOriginRequest {
    method: string;
    /** Full pathname, including the /api prefix. */
    path: string;
    headers: {
        host?: unknown;
        origin?: unknown;
        referer?: unknown;
        'sec-fetch-site'?: unknown;
        'sec-fetch-dest'?: unknown;
    };
}
/**
 * Project preview hosts are reserved for GETs of that project's powered
 * files. Check both the target and browser source before any API exception;
 * a preview cannot regain daemon access by targeting the normal loopback host.
 * The hostname hash names an origin, rather than granting project authority.
 */
export declare function projectPoweredPreviewOriginDecision(request: PoweredPreviewOriginRequest, daemonPort: number | null | undefined): 'allow' | 'reject' | null;
export {};
