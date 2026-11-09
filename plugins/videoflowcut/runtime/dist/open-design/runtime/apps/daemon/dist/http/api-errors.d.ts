import type { ApiError, ApiErrorCode, ApiErrorResponse } from '@open-design/contracts';
import type { Response } from 'express';
export declare function createCompatApiError(code: ApiErrorCode, message: string, init?: Omit<ApiError, 'code' | 'message'>): ApiError;
export declare function createCompatApiErrorResponse(code: ApiErrorCode, message: string, init?: Omit<ApiError, 'code' | 'message'>): ApiErrorResponse;
export declare function sendApiError(res: Response, status: number, code: ApiErrorCode, message: string, init?: Omit<ApiError, 'code' | 'message'>): Response<ApiErrorResponse>;
