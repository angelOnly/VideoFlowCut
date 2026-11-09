import type { NextFunction, Request, Response } from 'express';
interface LocalAuthority {
    hostname: string;
    port: string;
}
interface LocalDaemonValidation {
    ok: true;
    origin: string | null;
}
interface LocalDaemonValidationError {
    ok: false;
    message: string;
    details: Record<string, string>;
}
export declare function normalizeLocalAuthority(value: unknown): LocalAuthority | null;
export declare function isLoopbackHostname(hostname: unknown): boolean;
export declare function isLoopbackPeerAddress(address: unknown): boolean;
export declare function localOriginFromHeader(value: unknown): string | null;
export declare function validateLocalDaemonRequest(req: Request): LocalDaemonValidation | LocalDaemonValidationError;
export declare function requireLocalDaemonRequest(req: Request, res: Response, next: NextFunction): void | Response;
export {};
