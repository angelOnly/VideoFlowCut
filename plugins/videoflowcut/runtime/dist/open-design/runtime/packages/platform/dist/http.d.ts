export type HttpWaitOptions = {
    timeoutMs?: number;
};
/**
 * Poll a URL until it returns an OK (2xx) response or the timeout elapses,
 * retrying on both non-OK statuses and fetch errors.
 *
 * @param url - The URL to poll.
 * @param options - `timeoutMs` maximum wait in milliseconds (default 20000).
 * @returns `true` once an OK response is received.
 * @throws When the timeout elapses without an OK response (message includes the last error).
 */
export declare function waitForHttpOk(url: string, { timeoutMs }?: HttpWaitOptions): Promise<true>;
//# sourceMappingURL=http.d.ts.map