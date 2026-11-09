export * from './types.js';
export * from './capabilities.js';
export * from './video.js';
export { AIHUBMIX_VIDEO_SEED } from './seed.js';
/**
 * Default registry seeded with the ported aihubmix-video video models.
 * Phase 2: seed from a live AIHubMix /api/v1/models fetch (with this as fallback).
 */
export declare const aihubmixMediaRegistry: import("./capabilities.js").CapabilityRegistry;
