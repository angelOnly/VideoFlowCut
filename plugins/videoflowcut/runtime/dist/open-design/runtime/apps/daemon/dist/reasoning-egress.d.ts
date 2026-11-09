import type { Response } from 'express';
import type { ReasoningExecutionMode } from '@open-design/contracts/api/reasoningExecution';
export type ReasoningEgressRouteKind = 'proxy' | 'provider_models' | 'connection_test' | 'finalize';
export interface ReasoningEgressRequest {
    policy: unknown;
    routeKind: ReasoningEgressRouteKind;
    provider: string;
    resolvedBaseUrl?: string;
    model?: string;
}
export type ReasoningEgressDenial = ReasoningEgressInvalidPolicyDenial | ReasoningEgressPolicyDenial;
export interface ReasoningEgressInvalidPolicyDenial {
    status: 400;
    code: 'reasoning_execution_invalid_policy';
    message: string;
    data: {
        routeKind: ReasoningEgressRouteKind;
        provider: string;
        resolvedBaseUrl?: string;
        model?: string;
    };
}
export interface ReasoningEgressPolicyDenial {
    status: 403;
    code: 'reasoning_execution_disabled' | 'reasoning_execution_not_allowlisted';
    message: string;
    data: {
        routeKind: ReasoningEgressRouteKind;
        provider: string;
        policyMode: Exclude<ReasoningExecutionMode, 'enabled'>;
        resolvedBaseUrl?: string;
        model?: string;
    };
}
export declare function normalizeReasoningBaseUrl(value: string): string | null;
export declare function authorizeReasoningEgress(args: ReasoningEgressRequest): ReasoningEgressDenial | null;
export declare function sendReasoningEgressDenial(res: Response, denial: ReasoningEgressDenial): void;
