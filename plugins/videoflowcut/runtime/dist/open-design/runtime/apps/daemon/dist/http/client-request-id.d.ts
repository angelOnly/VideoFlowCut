import type { Request } from 'express';
/** The client's observational request id, or undefined when absent/malformed. */
export declare function clientRequestIdFor(req: Request): string | undefined;
