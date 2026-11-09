import type { McpAuthMode, McpServerConfig, McpTransport } from './mcp-config.js';
import type { RuntimeAgentDef } from './runtimes/types.js';
export interface RunToolBundle {
    mcpServers: McpServerConfig[];
}
export interface RunToolBundleSummary {
    mcpServers: Array<{
        id: string;
        label?: string;
        templateId?: string;
        transport: McpTransport;
        enabled: boolean;
        authMode?: McpAuthMode;
    }>;
}
export interface ExternalMcpSelection {
    enabledServers: McpServerConfig[];
    persistedTokenServerIds: Set<string>;
}
export type RunToolBundleParseResult = {
    ok: true;
    bundle: RunToolBundle;
} | {
    ok: false;
    message: string;
};
export type RunToolBundleValidationResult = {
    ok: true;
} | {
    ok: false;
    message: string;
};
export type RunToolBundleDeliveryTarget = 'managed-project' | 'external-project' | 'none';
export interface RunToolBundleValidationOptions {
    deliveryTarget?: RunToolBundleDeliveryTarget;
}
type RunToolBundleAgent = Pick<RuntimeAgentDef, 'id' | 'name' | 'externalMcpInjection'>;
export declare function normalizeRunToolBundleForRun(raw: unknown): RunToolBundle;
export declare function parseRunToolBundleForRequest(raw: unknown): RunToolBundleParseResult;
export declare function summarizeRunToolBundle(bundle: RunToolBundle | null | undefined): RunToolBundleSummary;
export declare function validateRunToolBundleForAgent(bundle: RunToolBundle | null | undefined, agent: RunToolBundleAgent | null | undefined, options?: RunToolBundleValidationOptions): RunToolBundleValidationResult;
export declare function resolveExternalMcpServersForRun({ persistedServers, runScopedServers, sandboxMode, }: {
    persistedServers: McpServerConfig[];
    runScopedServers: McpServerConfig[];
    sandboxMode: boolean;
}): ExternalMcpSelection;
export {};
