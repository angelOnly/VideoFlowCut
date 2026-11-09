import type { Express, Request } from 'express';
import { type AppConfigPrefs } from '../app-config.js';
type ReadAppConfig = (dataDir: string) => Promise<AppConfigPrefs>;
type PublicBaseUrlResolver = (req: Request) => string;
export interface RegisterVelaRoutesDeps {
    paths: {
        RUNTIME_DATA_DIR: string;
    };
    appConfig: {
        readAppConfig: ReadAppConfig;
    };
    http: {
        getPublicBaseUrl?: PublicBaseUrlResolver;
    };
    env?: NodeJS.ProcessEnv;
    /** Reconcile account-scoped caches/streams after credential observation. */
    onCredentialStateObserved?: () => void;
}
/**
 * Pipe one leg of the AMR proxy with an explicit source-error guard.
 *
 * `.pipe()` does NOT forward a source `'error'` to the destination, and a
 * stream that emits `'error'` with no listener throws — crashing the privileged
 * daemon. Both legs of this proxy have real-world error paths: the upstream
 * response body can `ECONNRESET` mid-stream (a network drop, routine), and the
 * inbound request body errors when a client aborts an upload. Routing the
 * source error to `onSourceError` (which tears the proxy down) instead of
 * leaving it unhandled is the invariant that keeps the daemon alive. Exported
 * for test.
 */
export declare function pipeProxyStreamWithGuard(source: NodeJS.ReadableStream, dest: NodeJS.WritableStream, onSourceError: (err: Error) => void): void;
export interface VelaRoutesLifecycle {
    close(): Promise<void>;
}
export declare function registerVelaRoutes(app: Express, deps: RegisterVelaRoutesDeps): VelaRoutesLifecycle;
export {};
