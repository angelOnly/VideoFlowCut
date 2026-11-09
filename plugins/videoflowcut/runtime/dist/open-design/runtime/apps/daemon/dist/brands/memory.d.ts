import type { Brand } from '@open-design/contracts';
/** A memory entry derived from a brand, ready to hand to `upsertMemoryEntry`. */
export interface BrandMemoryEntryInput {
    id: string;
    name: string;
    description: string;
    type: 'user' | 'reference' | 'rule';
    body: string;
}
/**
 * Derive the coherent set of memory entries for a finalized brand. Pure: takes
 * the validated Brand and returns the entries to upsert. Skips any facet the
 * brand does not carry (e.g. no voice → no voice entry).
 */
export declare function brandToMemoryEntries(brand: Brand): BrandMemoryEntryInput[];
export interface ReflowBrandToMemoryResult {
    /** Entry ids written to the memory store. Empty when memory is disabled. */
    written: string[];
    /** Set when nothing was written, explaining why. */
    skipped?: 'memory-disabled';
}
/**
 * Sediment a finalized brand into the filesystem memory store. Gated on the
 * master memory switch (`enabled`) — when memory is off we write nothing, the
 * same contract every other extraction path honors. Best-effort per entry: a
 * single bad entry does not abort the rest. Re-finalizing the same brand
 * overwrites its entries in place (ids are deterministic from the brand name).
 */
export declare function reflowBrandToMemory(dataDir: string, brand: Brand): Promise<ReflowBrandToMemoryResult>;
