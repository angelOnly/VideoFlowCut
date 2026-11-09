// media-adapters — pure, isomorphic model-capability + request-mapping layer.
//
// This module is package-shaped (Phase 1 lives in open-design; later extracted
// to a public, generic npm package consumed by both open-design and
// aihubmix-video). It contains NO transport (fetch/auth/poll/storage) and NO
// proprietary model data baked into the interpreter — the model capability data
// is INJECTED (seeded now from a const, later fetched from AIHubMix's
// /api/v1/models + contract.json).
//
// The capability shape deliberately mirrors OpenRouter's GET /api/v1/videos/models
// (supported_resolutions / aspect_ratios / sizes / durations / frame_images /
// allowed_passthrough_parameters), so the eventual remote source is a drop-in.
export {};
//# sourceMappingURL=types.js.map