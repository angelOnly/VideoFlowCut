import type { ConnectorMemoryExtractionResult, MemorySuggestion, MemoryEntrySummary } from '@open-design/contracts';
import { type ConnectorService } from './connectors/service.js';
export interface ExtractMemoryFromConnectorsOptions {
    projectsRoot: string;
    projectRoot?: string;
    projectId?: string | null;
    connectorIds?: string[];
    query?: string;
    chatAgentId?: string | null;
    chatModel?: string | null;
    service?: ConnectorService;
    signal?: AbortSignal;
    localCliRunner?: (input: {
        agentId: string;
        model: string;
        system: string;
        user: string;
        projectRoot: string | null;
        dataDir: string | null;
    }) => Promise<string>;
}
export interface ExtractMemoryFromConnectorsResult {
    changed: MemoryEntrySummary[];
    attemptedLLM: boolean;
    connectors: ConnectorMemoryExtractionResult[];
    contextBytes: number;
}
export interface SuggestMemoryFromConnectorsResult {
    suggestions: MemorySuggestion[];
    attemptedLLM: boolean;
    connectors: ConnectorMemoryExtractionResult[];
    contextBytes: number;
}
export declare function suggestMemoryFromConnectors(dataDir: string, options: ExtractMemoryFromConnectorsOptions): Promise<SuggestMemoryFromConnectorsResult>;
export declare function extractMemoryFromConnectors(dataDir: string, options: ExtractMemoryFromConnectorsOptions): Promise<ExtractMemoryFromConnectorsResult>;
