export declare const SHARED_PROJECT_PLACEHOLDER_METADATA_KEY = "sharedProjectPlaceholderAt";
/** The `sharedProjectPlaceholderAt` stamp from a project's metadata, or null
 *  when the metadata does not mark an unmaterialized placeholder. */
export declare function sharedProjectPlaceholderStamp(metadata: unknown): number | null;
/**
 * Whether this local project record is still an unmaterialized shared-project
 * placeholder — i.e. local state that must never be published to the resource
 * hub (see module doc comment). Null/undefined (no local record at all) is
 * not a placeholder: it has nothing to publish either way, and the publish
 * paths already require a local record.
 */
export declare function isUnmaterializedSharedPlaceholder(project: {
    metadata?: unknown;
} | null | undefined): boolean;
