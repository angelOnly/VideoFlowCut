import type { FigmaApiNode } from '../plugins/atoms/figma-extract.js';
export interface FigDecodeResult {
    /** Rebuilt document tree (REST `FigmaApiNode` shape), or null if the
     *  kiwi layer could not be decoded (ZIP-only degraded result). */
    document: FigmaApiNode | null;
    /** Embedded raster/vector assets, keyed by lowercase hex hash. */
    images: Map<string, Uint8Array>;
    /** `thumbnail.png` bytes, when the archive ships one. */
    thumbnail: Uint8Array | null;
    /** Parsed `meta.json`, when present. */
    meta: Record<string, unknown> | null;
    /** Distinct (family, styles) pairs referenced by TEXT nodes. */
    fonts: Array<{
        family: string;
        styles: string[];
    }>;
    /** Non-fatal notes (degradation reasons, skipped chunks). */
    warnings: string[];
    /** True when the kiwi node-tree decoded (Layer 2 succeeded). */
    decoded: boolean;
    /** Whether the input was a ZIP container or a raw `canvas.fig`. */
    source: 'zip' | 'raw';
    /** Number of nodes in the rebuilt tree (0 when undecoded). */
    nodeCount: number;
}
/**
 * Decode a `.fig` file (ZIP-wrapped or raw `canvas.fig`) fully offline.
 * Never throws on a malformed kiwi payload — it degrades to whatever the
 * ZIP layer recovered.
 */
export declare function decodeFigFile(input: Uint8Array): Promise<FigDecodeResult>;
