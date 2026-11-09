import type { Response } from 'express';
import { type ApiError } from '@open-design/contracts';
export declare function sendJson(res: Response, status: number, body: unknown): void;
export declare function sendApiError(res: Response, status: number, error: ApiError): void;
export declare function statusForError(error: ApiError): number;
