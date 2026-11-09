/**
 * Conformance history persistence (Phase 16).
 *
 * The prerelease cron writes one `ConformanceDay` row per adapter per day
 * via `appendConformanceDay`. The `/api/critique/conformance` route
 * reads the rolling N-day window via `readConformanceHistory` and
 * feeds it into the `evaluateRollout` ratchet.
 *
 * Storage shape: append-only JSON-lines under
 * `<dataDir>/conformance/<adapter>/<date>.jsonl`. One file per adapter
 * per day so a corrupted line in one file cannot poison the read for
 * another adapter / another day. JSON-lines (rather than a single JSON
 * blob) so a cron interruption mid-write leaves a recoverable file:
 * the writer always appends complete lines, and the reader drops any
 * line that fails to parse rather than throwing.
 *
 * The path layout is intentionally directory-per-adapter so a future
 * operator action like "purge all history for adapter X" is one `rm
 * -rf`, not a grep + rewrite across a mixed-adapter file.
 */
import type { ConformanceDay } from './ratchet.js';
/**
 * Where conformance history lives, relative to the daemon's `.od` data
 * dir. Wrapped in a function so a future override (env var, test seam)
 * can swap it without rewriting call sites.
 */
export declare function conformanceHistoryDir(dataDir: string): string;
/**
 * Append one conformance row to the day's file. Idempotent in the
 * weak sense: calling twice for the same `(adapter, date)` appends two
 * rows, and the reader keeps the last entry per (adapter, date) so a
 * retry-after-failure cron produces the right answer. The strong-sense
 * fix (dedupe before appending) is deliberately not v1 scope; it would
 * require a read-modify-write cycle whose cost grows with history
 * size.
 */
export declare function appendConformanceDay(dataDir: string, row: ConformanceDay): Promise<void>;
/**
 * Read every `ConformanceDay` row in the trailing `windowDays` ending
 * today (inclusive). Returns rows from every adapter in arbitrary
 * order; the evaluator aggregates them per day.
 *
 * Missing adapter directories, missing day files, and malformed lines
 * all collapse to "skip this row": a cron that has not run yet for a
 * day is data missing, not data wrong, and the evaluator handles
 * missing days by returning `hold` (insufficient data).
 */
export declare function readConformanceHistory(dataDir: string, windowDays: number, now?: Date): Promise<ConformanceDay[]>;
