export interface ParsedHostHeader {
    hostname: string;
    host: string;
    port: string;
}
export interface RequestWithOriginHeaders {
    headers?: {
        host?: unknown;
        origin?: unknown;
        'sec-fetch-site'?: unknown;
    };
}
export declare function configuredAllowedOrigins(env?: NodeJS.ProcessEnv): string[];
export declare function configuredAllowedHosts(origins?: string[]): string[];
export declare function configuredAllowedInternalHosts(env?: NodeJS.ProcessEnv, warn?: (message: string) => void): string[];
export declare function allowedBrowserPorts(port: number | string | null | undefined, env?: NodeJS.ProcessEnv): number[];
export declare function parseHostHeader(value: unknown): ParsedHostHeader | null;
export declare function isPrivateIpv4(hostname: unknown): boolean;
export declare function isIpLiteralHostname(hostname: unknown): boolean;
export declare function isLoopbackOrPrivateLanHost(hostname: unknown): boolean;
export declare function isAllowedBrowserHost(hostHeader: unknown, ports: number[], bindHost: string, extraAllowedOrigins: string[]): boolean;
export declare function isAllowedBrowserOrigin(origin: unknown, hostHeader: unknown, ports: number[], bindHost: string, extraAllowedOrigins: string[]): boolean;
export declare function isLocalSameOrigin(req: RequestWithOriginHeaders, port: number | string | null | undefined, env?: NodeJS.ProcessEnv): boolean;
/**
 * Zero-config OD Clipper bypass for the `/api` origin middleware.
 *
 * `apiRelativePath` MUST be `req.path` as observed INSIDE `app.use('/api', …)`.
 * Express strips the mounted `/api` prefix there, so a request to
 * `/api/library/ingest` arrives as `/library/ingest`. Matching `'/library/'`
 * is therefore the correct (and only working) prefix — matching
 * `'/api/library/'` here would never fire because the mount prefix is gone.
 *
 * Returns true only for a locally-installed browser extension (an origin a web
 * page cannot forge) targeting the narrow OD Clipper bootstrap surface: the
 * dedicated probe route and the ingest endpoint. Library reads still require
 * normal same-origin / allow-list validation so an unrelated installed
 * extension cannot enumerate or download the user's library.
 */
export declare function isZeroConfigClipperLibraryRequest(method: string, apiRelativePath: string, origin: unknown): boolean;
