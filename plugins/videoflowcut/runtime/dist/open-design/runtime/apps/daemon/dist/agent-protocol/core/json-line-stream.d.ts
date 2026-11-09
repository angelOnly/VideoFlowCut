/** @module agent-protocol/core/json-line-stream
 * Streaming JSON-line parser that reassembles pretty-printed and multiline
 * JSON-RPC messages across chunk boundaries. Shared transport used by both the
 * acp/ and pi-rpc/ protocol adapters; this file has no dependencies on any
 * other agent-protocol sibling.
 */
/**
 * Creates a streaming JSON-line parser over a raw byte/string stream.
 * Buffers incoming chunks, splits on newline boundaries, and attempts
 * `JSON.parse` on each line. Accumulates pretty-printed (multiline) JSON across
 * up to 256 lines and 128 kB before abandoning and re-trying the current line
 * as a fresh candidate.
 *
 * Used as the shared ACP transport: both the acp/ and pi-rpc/ adapters call
 * this to decode JSON-RPC frames from a subprocess's stdout.
 *
 * @param onMessage - Called for each successfully parsed JSON value along with
 *   the raw reassembled line string as a second argument.
 * @returns An object with `feed(chunk)` for incremental input and `flush()` to
 *   drain any residual buffered content at stream end.
 */
export declare function createJsonLineStream(onMessage: (message: unknown, rawLine: string) => void): {
    feed(chunk: string): void;
    flush(): void;
};
/**
 * Incremental JSON completeness classifier used by `createJsonLineStream` to
 * decide whether an accumulating multiline candidate can still resolve into
 * valid JSON.
 *
 * Performs a single-pass character-level parse, tracking object and array
 * frames on a stack. Returns:
 * - `'complete'`   — a syntactically valid, fully closed JSON value.
 * - `'incomplete'` — valid so far but the document is still open (unclosed
 *   strings, objects, or arrays).
 * - `'invalid'`    — an irrecoverable syntax error was encountered.
 *
 * @param value - A string candidate to classify, typically one or more
 *   accumulated stdout lines from an ACP subprocess.
 */
export declare function classifyJsonCandidate(value: string): 'complete' | 'incomplete' | 'invalid';
