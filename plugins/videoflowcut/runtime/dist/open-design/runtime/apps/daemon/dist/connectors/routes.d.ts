import type { Express, Request, RequestHandler, Response } from 'express';
import { type ToolTokenGrant } from '../tool-tokens.js';
import { ConnectorService } from './service.js';
type ConnectorApiErrorCode = 'BAD_REQUEST' | 'FORBIDDEN' | 'VALIDATION_FAILED' | 'CONNECTOR_NOT_FOUND' | 'CONNECTOR_AUTH_CONFIG_REQUIRED' | 'CONNECTOR_NOT_CONNECTED' | 'CONNECTOR_NOT_GRANTED' | 'CONNECTOR_DISABLED' | 'CONNECTOR_TOOL_NOT_FOUND' | 'CONNECTOR_SAFETY_DENIED' | 'CONNECTOR_INPUT_SCHEMA_MISMATCH' | 'CONNECTOR_RATE_LIMITED' | 'CONNECTOR_OUTPUT_TOO_LARGE' | 'CONNECTOR_EXECUTION_FAILED';
export declare const COMPOSIO_LOGO_CACHE_MAX_ENTRIES = 128;
export type ConnectorApiErrorSender = (res: Response, status: number, code: ConnectorApiErrorCode, message: string, init?: {
    details?: unknown;
    retryable?: boolean;
    requestId?: string;
    taskId?: string;
}) => Response;
export interface RegisterConnectorRoutesOptions {
    service?: ConnectorService;
    sendApiError: ConnectorApiErrorSender;
    projectsRoot?: string;
    authorizeToolRequest?: (req: Request, res: Response, operation: string) => ToolTokenGrant | null;
    requireLocalDaemonRequest?: RequestHandler;
    composio?: {
        clearDiscoveryCache: () => void;
    };
}
export declare function registerConnectorRoutes(app: Express, options: RegisterConnectorRoutesOptions): void;
export {};
