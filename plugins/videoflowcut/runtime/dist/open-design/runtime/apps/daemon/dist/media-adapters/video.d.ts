import type { BuiltVideoRequest, MediaFamily, ModelCapability, VideoBuildInput } from './types.js';
/** Resolve the upstream model name: i2v variant when a reference image is present. */
export declare function resolveWireModel(cap: ModelCapability, hasReference: boolean): string;
/** Derive the request family from the resolved upstream model name (or explicit override). */
export declare function deriveVideoFamily(wireModel: string, cap?: ModelCapability): MediaFamily;
/**
 * Snap a requested duration to the model's allowed set (e.g. Veo 4/6/8, wan 5/10).
 * Falls back to a 3–12 clamp when the model declares no constraint. Ties prefer
 * the shorter value.
 */
export declare function snapDuration(cap: ModelCapability, requested: number | undefined): number;
/**
 * Seedance and wan accept resolution ONLY as a quality token (`480p`/`720p`/
 * `1080p`), never a `WxH` pixel string. Callers may hand us either: an explicit
 * token from the tool's `resolution` arg, or a pixel `size` like `1280x720`
 * derived from an aspect ratio. Passing a pixel string straight through makes
 * Doubao Seedance 400 with "the parameter resolution ... is not valid ... in
 * i2v". Normalise to the nearest lowercase token by the short side (720→720p,
 * 1080→1080p, …); default to 720p when nothing usable is supplied. (wan wants
 * the uppercase form `720P`, so its branch upper-cases the result.)
 */
export declare function snapResolutionToken(resolution: string | undefined, size: string | undefined): string;
export declare function snapVeoSize(size: string | undefined): string;
/**
 * Snap a requested `size` to the model's declared `supportedSizes` by
 * orientation. Sora 400s on an unsupported size (e.g. a 1:1 `1024x1024` —
 * "Supported values are: '720x1280','1280x720',…"), so a caller-derived size
 * that isn't on the list is mapped to a supported one of the same orientation
 * (portrait↔portrait, else landscape). Returns the size unchanged when the
 * model declares no constraint; falls back to the first supported size when the
 * input is missing/unparseable.
 */
export declare function snapSizeToSupported(size: string | undefined, supported: string[] | undefined): string | undefined;
/**
 * Build the upstream video request body for a model. Pure: no fetch, no auth.
 * Caller: POST `${baseUrl}${pathSuffix}` with auth headers + JSON.stringify(body).
 */
export declare function buildVideoRequest(cap: ModelCapability, input: VideoBuildInput): BuiltVideoRequest;
export interface NormalizedVideoResponse {
    id?: string;
    status?: string;
    /** Inline asset URL when the upstream returns one. */
    url?: string;
    error?: string;
}
/** Best-effort normalization of an async-submit / poll response across families. */
export declare function normalizeVideoResponse(raw: unknown): NormalizedVideoResponse;
