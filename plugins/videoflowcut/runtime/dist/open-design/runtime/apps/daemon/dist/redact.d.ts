/**
 * Returns `input` with every recognised secret / PII pattern replaced by
 * a `[REDACTED:<kind>]` marker. Idempotent — re-running on already
 * redacted text only matches new tokens.
 *
 * Empty / non-string input passes through unchanged so the caller can
 * use this as a no-op on optional fields.
 */
export declare function redactSecrets(input: string): string;
/**
 * Same as `redactSecrets` but also returns per-category counts so the
 * caller can attach an audit summary to the trace metadata
 * ('we stripped 2 keys + 1 email before send').
 */
export declare function redactSecretsWithCounts(input: string): {
    redacted: string;
    counts: Record<string, number>;
};
