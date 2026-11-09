import { EventEmitter } from 'node:events';
import type { MemoryExtractionOrigin } from '@open-design/contracts';
export declare const memoryEvents: EventEmitter<[never]>;
export type MemoryChangeKind = 'upsert' | 'delete' | 'index' | 'config' | 'extract';
export interface MemoryChangeEvent {
    kind: MemoryChangeKind;
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    count?: number;
    source?: MemoryEntrySource;
    enabled?: boolean;
    at: number;
}
export type MemoryEntrySource = 'heuristic' | 'llm' | 'manual' | 'connector' | 'brand' | 'annotation';
export declare function memoryDir(dataDir: any): string;
export declare function deriveMemoryId(type: any, name: any): string;
export declare function readMemoryConfig(dataDir: any): Promise<{
    enabled: boolean;
    chatExtractionEnabled: boolean;
    profileEnabled: boolean;
    rewriteEnabled: boolean;
    verifyEnabled: boolean;
    extraction: {
        provider: any;
    } | null;
}>;
export declare function writeMemoryConfig(dataDir: any, patch: any): Promise<{
    enabled: any;
    chatExtractionEnabled: any;
    profileEnabled: any;
    rewriteEnabled: any;
    verifyEnabled: any;
    extraction: {
        provider: any;
    } | null;
}>;
export declare function maskMemoryExtractionConfig(extraction: any): {
    provider: any;
    model: any;
    baseUrl: any;
    apiVersion: any;
    apiKeyTail: any;
    apiKeyConfigured: boolean;
} | null;
export declare function readMemoryIndex(dataDir: any): Promise<string>;
export declare function writeMemoryIndex(dataDir: any, body: any, options: any): Promise<void>;
export declare function listMemoryEntries(dataDir: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    source: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
}[]>;
export declare function buildMemoryTree(dataDir: any): Promise<({
    id: string;
    parentId: null;
    path: string;
    name: any;
    description: string;
    kind: string;
    type: import("@open-design/contracts").MemoryType;
    scope: string;
    sourcePacketIds: never[];
    proposalIds: never[];
    createdAt: string;
    updatedAt: string;
    childrenCount: any;
} | {
    id: any;
    parentId: string;
    path: string;
    name: any;
    description: any;
    kind: string;
    type: any;
    scope: string;
    sourcePacketIds: unknown[];
    proposalIds: unknown[];
    createdAt: string;
    updatedAt: string;
    childrenCount: number;
})[]>;
export declare function readMemoryEntry(dataDir: any, id: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    source: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
    body: string;
} | null>;
export declare function updateMemoryTreeNode(dataDir: any, id: any, patch: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    source: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
    body: string;
}>;
export declare function upsertMemoryEntry(dataDir: any, input: any, options: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    source: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
    body: string;
}>;
export declare function deleteMemoryEntry(dataDir: any, id: any): Promise<void>;
export declare function composeMemoryBody(dataDir: any): Promise<string>;
export declare function listActiveRuleEntries(dataDir: any): Promise<{
    id: any;
    name: any;
    description: string;
    body: string;
}[]>;
/**
 * True when a memory entry is provably an artifact of the retired chat
 * regex pack — its name matches one of the pack's fixed display names and
 * its body is an instance of that pattern's fill-in template. Used by the
 * one-time cleanup migration; LLM, connector, and hand-written entries never
 * match because their bodies are free prose, not template instances.
 */
export declare function isHeuristicExtractionArtifact(entry: any): boolean;
/**
 * Reduce a user_profile body to the canonical field set the settings-panel
 * profile editor writes (`CANONICAL_PROFILE_LABELS`). Rows under any other
 * label were accumulated by the retired chat-form capture — per-project
 * discovery answers re-keyed by whatever the form question's wording was
 * ("要做什么？", "What should I build?", …) — and are dropped. Returns null
 * when no canonical row survives, i.e. the whole profile was form residue.
 */
export declare function pruneProfileBodyToCanonical(body: any): string | null;
export declare function extractFromMessage(dataDir: any, userMessage: any, options?: {
    extractionOrigin?: MemoryExtractionOrigin;
}): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
}[]>;
