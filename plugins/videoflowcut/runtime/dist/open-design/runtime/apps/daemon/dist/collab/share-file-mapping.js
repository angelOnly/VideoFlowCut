function safePath(value) {
    return typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes('\0')
        && !value.split('/').some(part => !part || part === '.' || part === '..');
}
/** The planner's actual sourcePath/file pairs are the only renaming authority.
 * This records packaging, NOT permission to publish comments on these files.
 */
export function createShareFileMapping(files) {
    const sources = new Set();
    const targets = new Set();
    const entries = files.map(file => {
        if (!safePath(file.sourcePath) || !safePath(file.file) || sources.has(file.sourcePath) || targets.has(file.file)) {
            throw new Error('SHARE_FILE_MAPPING_INVALID');
        }
        sources.add(file.sourcePath);
        targets.add(file.file);
        return Object.freeze({ sourcePath: file.sourcePath, publishedPath: file.file });
    });
    return Object.freeze(entries);
}
export function publishedPathForSource(mapping, sourcePath) {
    const matches = mapping.filter(entry => entry.sourcePath === sourcePath);
    return matches.length === 1 ? matches[0].publishedPath : null;
}
export function sourcePathForPublished(mapping, publishedPath) {
    const matches = mapping.filter(entry => entry.publishedPath === publishedPath);
    return matches.length === 1 ? matches[0].sourcePath : null;
}
//# sourceMappingURL=share-file-mapping.js.map