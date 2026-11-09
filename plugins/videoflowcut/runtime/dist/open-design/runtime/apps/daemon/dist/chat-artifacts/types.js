// Chat artifact versioning — shared vocabulary.
//
// Two identities, deliberately kept apart (see
// specs/current/chat-artifact-versioning-design.md §3):
//
//   * `workspace_artifacts` is the MUTABLE latest pointer. It answers "what is
//     in Design Files right now" and survives overwrite and rename.
//   * `chat_artifact_snapshots` is the IMMUTABLE message evidence. It answers
//     "what did this turn produce" and never follows the workspace file.
//
// A card's cover and its click target are allowed to disagree, and for HTML
// they are SUPPOSED to: the cover is the frozen static shot of that turn, the
// click opens today's latest. That is the product ruling, not a bug.
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/u;
/** Content address guard. Anything else must never reach the filesystem. */
export function isContentDigest(value) {
    return typeof value === 'string' && DIGEST_RE.test(value);
}
/**
 * The hex half of a `sha256:<hex>` address, or null. Callers that build a
 * storage path MUST go through this so a caller-supplied string can never
 * become a path segment.
 */
export function digestHex(value) {
    return isContentDigest(value) ? value.slice('sha256:'.length) : null;
}
//# sourceMappingURL=types.js.map