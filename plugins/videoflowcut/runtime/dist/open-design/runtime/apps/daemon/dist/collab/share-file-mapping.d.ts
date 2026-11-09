export type ShareFileMapping = ReadonlyArray<Readonly<{
    sourcePath: string;
    publishedPath: string;
}>>;
/** The planner's actual sourcePath/file pairs are the only renaming authority.
 * This records packaging, NOT permission to publish comments on these files.
 */
export declare function createShareFileMapping(files: ReadonlyArray<{
    sourcePath?: string;
    file: string;
}>): ShareFileMapping;
export declare function publishedPathForSource(mapping: ShareFileMapping, sourcePath: string): string | null;
export declare function sourcePathForPublished(mapping: ShareFileMapping, publishedPath: string): string | null;
