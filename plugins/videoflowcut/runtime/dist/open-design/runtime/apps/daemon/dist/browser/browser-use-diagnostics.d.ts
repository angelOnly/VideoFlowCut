import type { BrowserUseDiscoveryFacts, BrowserUseRunState } from '@open-design/contracts';
export declare function browserUseRegistryPath(tmpDir?: string): string;
export declare function isBrowserUseRequested(...values: unknown[]): boolean;
export declare function collectBrowserUseDiscoveryFacts({ registryPath, now, currentSessionId, staleThresholdMs, }?: {
    registryPath?: string;
    now?: number;
    currentSessionId?: string | null;
    staleThresholdMs?: number;
}): BrowserUseDiscoveryFacts;
export declare function buildBrowserUseRunState({ requested, agentId, diagnostics, }: {
    requested: boolean;
    agentId: string | null | undefined;
    diagnostics?: BrowserUseDiscoveryFacts;
}): BrowserUseRunState | null;
export declare function renderBrowserUseUnavailablePrompt(state: BrowserUseRunState | null): string;
