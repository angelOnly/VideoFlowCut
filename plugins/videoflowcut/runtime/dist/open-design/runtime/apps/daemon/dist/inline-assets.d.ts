/**
 * A handle to a project-relative asset. Decoupled into `size` (cheap;
 * sourced from `stat` or equivalent) and `read()` (full materialization)
 * so the helper can short-circuit on `maxAssetBytes` / `maxTotalBytes`
 * BEFORE the asset is buffered into memory. PR #1312 round-4 (lefarcen
 * P2): the round-3 caps fired only after every candidate had already
 * been fully read + decoded, so 500 assets at 5 MiB each could
 * materialize 2.5 GiB before the 413. The size-then-read contract
 * lets us cap pre-buffer.
 */
export interface AssetHandle {
    readonly size: number;
    read(): Promise<string | null>;
}
export interface InlineAssetReader {
    (relPath: string): Promise<AssetHandle | null>;
}
export interface InlineOptions {
    /** Max byte length of the owner HTML; exceeds → throw InlineAssetsLimitError("owner"). */
    maxOwnerBytes?: number;
    /** Max byte length of a single inlined asset body; exceeds → tag stays as URL ref. */
    maxAssetBytes?: number;
    /** Max number of `<link>`/`<script>` matches in the owner HTML; exceeds → throw "candidates". */
    maxCandidates?: number;
    /** Max byte length of the assembled output; exceeds → throw InlineAssetsLimitError("total"). */
    maxTotalBytes?: number;
    /** Max concurrent fileReader invocations; defaults to MAX_INLINE_READ_CONCURRENCY. */
    maxReadConcurrency?: number;
}
export declare const MAX_INLINE_OWNER_BYTES: number;
export declare const MAX_INLINE_ASSET_BYTES: number;
export declare const MAX_INLINE_CANDIDATES = 500;
export declare const MAX_INLINE_TOTAL_BYTES: number;
export declare const MAX_INLINE_READ_CONCURRENCY = 8;
/**
 * Thrown by `inlineRelativeAssets` when a configured cap is exceeded.
 * The route handler maps every `InlineAssetsLimitError` to a 413
 * `PAYLOAD_TOO_LARGE` envelope; the `limit` field identifies which
 * cap fired so logs/clients can disambiguate.
 */
export declare class InlineAssetsLimitError extends Error {
    readonly limit: 'owner' | 'asset' | 'candidates' | 'total';
    constructor(message: string, limit: 'owner' | 'asset' | 'candidates' | 'total');
}
export declare function inlineRelativeAssets(html: string, ownerFileName: string, fileReader: InlineAssetReader, opts?: InlineOptions): Promise<string>;
export declare function baseDirFor(fileName: string): string;
export declare function resolveProjectRelativePath(ownerFileName: string, assetRef: string): string | null;
export declare function readHtmlAttr(tag: string, name: string): string | null;
export declare function hasBooleanHtmlAttr(tag: string, name: string): boolean;
export declare function escapeHtmlAttr(value: string): string;
