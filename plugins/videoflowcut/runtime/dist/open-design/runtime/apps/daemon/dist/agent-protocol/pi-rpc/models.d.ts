/** @module agent-protocol/pi-rpc/models
 * Parses `pi --list-models` tabular stdout into the daemon's model-picker format.
 * No network I/O — accepts the raw stdout string and returns a typed array or null.
 */
/** A single model entry for the daemon's model-picker: an opaque id and a display label. */
export type PiModelOption = {
    id: string;
    label: string;
};
/**
 * Parses the tabular stdout of `pi --list-models` into an array of model options.
 * The first entry is always the `default` sentinel (\"Default (CLI config)\").
 * Provider/model pairs are de-duplicated; the header line is skipped.
 * Returns `null` when the output is empty or contains no parseable rows beyond
 * the header.
 *
 * @param stdout - Raw stdout captured from `pi --list-models`, as a string or Buffer.
 * @returns Parsed model array (at least 2 entries), or `null` when nothing is found.
 */
export declare function parsePiModels(stdout: unknown): PiModelOption[] | null;
