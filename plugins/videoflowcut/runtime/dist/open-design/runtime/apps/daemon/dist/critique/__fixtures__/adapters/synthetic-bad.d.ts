/**
 * Synthetic adapter that emits a malformed transcript
 * (`malformed-unbalanced.txt`). Used by the Phase 10 conformance harness
 * to assert that the parser raises `MalformedBlockError` and the
 * orchestrator transitions the run to `critique.degraded` with the
 * adapter marked degraded for the 24h TTL window.
 *
 * Pair with `synthetic-good.ts` so any future change to the orchestrator
 * is forced to maintain the good ⇒ shipped / bad ⇒ degraded contract
 * the prerelease matrix relies on.
 */
import url from 'node:url';
/**
 * Module-URL-anchored fixture path (mirrors `synthetic-good.ts`; see
 * lefarcen P2 on PR #1317 for the rationale).
 */
export declare const SYNTHETIC_BAD_FIXTURE_URL: url.URL;
export declare const SYNTHETIC_BAD_FIXTURE_PATH: string;
export declare function syntheticBadTranscript(): string;
export declare function syntheticBadStream(): AsyncIterable<string>;
