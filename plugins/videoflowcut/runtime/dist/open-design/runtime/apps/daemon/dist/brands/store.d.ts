import type { Brand, BrandMeta } from '@open-design/contracts';
type BrandMetaPatch = Partial<Omit<BrandMeta, 'error' | 'extractionTerminalRunId' | 'extractionTerminalError' | 'extractionRunId' | 'blockedReason'>> & {
    error?: string | undefined;
    extractionTerminalRunId?: string | undefined;
    extractionTerminalError?: string | undefined;
    extractionRunId?: string | undefined;
    blockedReason?: string | undefined;
};
/** True when `id` is a safe single-segment brand directory name. */
export declare function isValidBrandId(id: string): boolean;
/**
 * Derive a brand id from a source URL: a host slug plus a 6-char random suffix
 * so concurrent extractions of the same host never collide. The suffix uses
 * crypto.randomBytes (not Math.random).
 */
export declare function newBrandId(sourceUrl: string): string;
/**
 * Resolve `relParts` under a brand dir with a traversal guard. Returns the
 * absolute path, or null when the id is invalid or the resolved path escapes
 * the brand dir.
 */
export declare function resolveBrandFile(brandsRoot: string, id: string, relParts: string[]): string | null;
/** Create the brand dir and write its initial meta.json. */
export declare function createBrandDir(brandsRoot: string, id: string, meta: BrandMeta): void;
export declare function readMeta(brandsRoot: string, id: string): BrandMeta | null;
export declare function writeMeta(brandsRoot: string, id: string, meta: BrandMeta): void;
/** Shallow-merge a partial patch onto the stored meta (bumps updatedAt).
 *  Returns the merged meta, or null when the brand is missing. */
export declare function patchMeta(brandsRoot: string, id: string, patch: BrandMetaPatch): BrandMeta | null;
export declare function readBrand(brandsRoot: string, id: string): Brand | null;
export declare function writeBrand(brandsRoot: string, id: string, brand: Brand): void;
export declare function readBrandGuide(brandsRoot: string, id: string): string | null;
export declare function writeBrandGuide(brandsRoot: string, id: string, guide: string): void;
/** Directory names of every brand (valid ids only), newest dir first by mtime. */
export declare function listBrandIds(brandsRoot: string): string[];
/** Remove a brand directory and everything under it. Returns false on miss. */
export declare function deleteBrandDir(brandsRoot: string, id: string): boolean;
export {};
