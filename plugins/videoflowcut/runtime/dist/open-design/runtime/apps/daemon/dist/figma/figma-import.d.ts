import type { FigmaImportResult } from '@open-design/contracts';
import { type FigmaApiNode } from '../plugins/atoms/figma-extract.js';
export interface FigmaImportOptions {
    /** Absolute staging root; the snapshot lands under `<cwd>/<subdir>/`. */
    cwd: string;
    /** Snapshot subdirectory. Default `figma`. */
    subdir?: string;
    /** Human label (uploaded file name or Figma file title). */
    label?: string;
    /** Optional design brief folded into the suggested reshape prompt. */
    notes?: string;
    /** Per-asset size cap in bytes (default 12 MiB). */
    assetMaxBytes?: number;
}
/**
 * Decode `.fig` bytes fully offline and write the canonical snapshot.
 * Never throws on a partially-decodable file — it degrades to the assets
 * the ZIP layer recovered and reports that in `inventory.decoded`.
 */
export declare function importFigmaFromBytes(bytes: Uint8Array, opts: FigmaImportOptions): Promise<FigmaImportResult>;
export type { FigmaApiNode };
