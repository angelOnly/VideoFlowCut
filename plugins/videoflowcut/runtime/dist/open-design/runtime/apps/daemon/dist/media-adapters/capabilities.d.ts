import type { ModelCapability } from './types.js';
export interface CapabilityRegistry {
    /** Look up a model by catalogue id (the `aihubmix-` prefix is stripped first). */
    get(id: string): ModelCapability | undefined;
    /** Add/override capabilities (later calls win on duplicate id). */
    register(caps: ModelCapability[]): void;
    /** All registered capabilities. */
    all(): ModelCapability[];
}
/** Normalize a catalogue id: strip the `aihubmix-` prefix and trim. */
export declare function normalizeModelId(id: string): string;
export declare function createCapabilityRegistry(seed?: ModelCapability[]): CapabilityRegistry;
