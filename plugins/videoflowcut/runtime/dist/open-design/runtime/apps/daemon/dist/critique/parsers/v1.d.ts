import type { PanelEvent } from '@open-design/contracts/critique';
import type { ShipArtifactCallback } from '../parser.js';
export declare function parseV1(source: AsyncIterable<string>, opts: {
    runId: string;
    adapter: string;
    parserMaxBlockBytes: number;
    projectId?: string;
    artifactId?: string;
    onArtifact?: ShipArtifactCallback;
}): AsyncIterable<PanelEvent>;
/**
 * Find the first occurrence of `needle` in `source` that is NOT inside a
 * `<![CDATA[ ... ]]>` span. The wire protocol uses sibling tags (`</SHIP>`,
 * `</ARTIFACT>`, `<SUMMARY>`) that an agent could legitimately ship inside
 * an HTML / JS payload wrapped in CDATA — a naive `indexOf` would match
 * those sentinels, slicing the wrong block out and corrupting both the
 * extraction and the surrounding parser state. CDATA forbids the literal
 * `]]>` inside its content per the XML spec, so once we open one we can
 * always find its terminator and resume scanning afterward.
 *
 * Returns -1 when no out-of-CDATA match exists, including the case where
 * an unterminated CDATA span runs to the end of the source. Streaming
 * callers should treat that as "not enough bytes yet" and break.
 */
export declare function indexOfOutsideCdata(source: string, needle: string, startOffset?: number): number;
/**
 * Locate the `<ARTIFACT ...>` block inside the SHIP body and return its
 * attribute string + decoded payload. CDATA-aware: when the artifact body
 * starts with `<![CDATA[`, the function scans for the matching
 * `]]></ARTIFACT>` pair (allowing whitespace between `]]>` and `</ARTIFACT>`)
 * rather than the first bare `</ARTIFACT>`, so a payload containing a
 * literal `</ARTIFACT>` inside a JS string or comment is delivered intact.
 *
 * `blockEnd` is the offset in `source` immediately after the closing
 * `</ARTIFACT>` tag, so callers that need to scan SHIP-level sibling tags
 * (`<SUMMARY>`, etc.) can do so on `source.slice(blockEnd)` instead of the
 * full SHIP inner — otherwise an artifact body that contains a literal
 * `<SUMMARY>...</SUMMARY>` pair would be misread as the ship summary
 * (mrcfps follow-up on PR #1085).
 *
 * Returns `null` if no `<ARTIFACT>` opener exists, no closing tag matches,
 * or the body decodes to an empty string.
 */
export declare function extractArtifactBlock(source: string): {
    attrText: string;
    body: string;
    blockEnd: number;
} | null;
