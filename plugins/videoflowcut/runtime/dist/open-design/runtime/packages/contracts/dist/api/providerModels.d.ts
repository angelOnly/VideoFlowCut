import type { ConnectionTestKind, ConnectionTestProtocol } from './connectionTest';
import type { ReasoningExecutionRequestFields } from './reasoningExecution';
import type { AgentModelOption } from './registry';
export type ProviderModelsKind = ConnectionTestKind | 'no_models' | 'unsupported_protocol';
export interface ProviderModelsRequest extends ReasoningExecutionRequestFields {
    protocol: ConnectionTestProtocol;
    baseUrl: string;
    apiKey: string;
    apiVersion?: string;
}
export type ProviderModelOption = AgentModelOption;
export interface ProviderModelsResponse {
    ok: boolean;
    kind: ProviderModelsKind;
    latencyMs: number;
    models?: ProviderModelOption[];
    status?: number;
    detail?: string;
}
//# sourceMappingURL=providerModels.d.ts.map