export declare const RUN_ARTIFACT_RECONCILE_MTIME_GRACE_MS = 1000;
export declare const projectFileRenameTestHooks: {
    beforeCommit: null | ((paths: {
        source: string;
        target: string;
    }) => Promise<void> | void);
};
export declare const projectFileWriteTestHooks: {
    afterCommit: null | ((write: {
        safeName: string;
        target: string;
        body: Buffer | string;
    }) => Promise<void> | void);
};
export declare function isRunTouchedProjectFile(fileMtimeMs: any, runStartTimeMs: any): boolean;
export declare function projectDir(projectsRoot: any, projectId: any): string;
export declare class SandboxImportedProjectError extends Error {
    code: string;
    constructor();
}
export declare function assertVisibleForImportedProject(name: any, metadata?: any): void;
export declare function assertSandboxProjectRootAvailable(metadata?: any): void;
export declare function resolveProjectDir(projectsRoot: any, projectId: any, metadata?: any, opts?: {}): string;
export declare function ensureProject(projectsRoot: any, projectId: any, metadata?: any): Promise<string>;
export declare function listFiles(projectsRoot: any, projectId: any, opts?: {}): Promise<any[]>;
export declare function listProjectFolders(projectsRoot: any, projectId: any, opts?: {}): Promise<any[]>;
export declare function createProjectFolder(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<{
    name: string;
    path: string;
    type: string;
    size: number;
    mtime: number;
}>;
export declare function ensureProjectSubdir(projectsRoot: any, projectId: any, subdir: any, metadata?: any): Promise<{
    absDir: any;
    relDir: string;
}>;
export declare function deleteProjectFolder(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<void>;
export declare function detectEntryFile(dir: string): Promise<string | null>;
export declare function buildProjectArchive(projectsRoot: any, projectId: any, root: any, metadata?: any): Promise<{
    buffer: Buffer<ArrayBufferLike>;
    baseName: string;
}>;
export declare function createProjectArchiveStream(projectsRoot: any, projectId: any, root: any, metadata?: any): Promise<{
    stream: NodeJS.ReadableStream;
    baseName: string;
}>;
export declare function buildBatchArchive(projectsRoot: any, projectId: any, fileNames: any, metadata?: any): Promise<{
    buffer: Buffer<ArrayBufferLike>;
    baseName: string;
}>;
export declare function createBatchArchiveStream(projectsRoot: any, projectId: any, fileNames: any, metadata?: any): Promise<{
    stream: NodeJS.ReadableStream;
    baseName: string;
}>;
export declare function readProjectFile(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<{
    buffer: NonSharedBuffer;
    name: any;
    path: any;
    size: number;
    mtime: number;
    mime: any;
    kind: string;
    artifactKind: unknown;
    artifactManifest: {
        [x: string]: unknown;
    } | null;
}>;
/** Managed deletion needs a canonical, confined path even on retry after unlink.
 * Unlike preview/media resolution this does not require surviving bytes. */
export declare function resolveProjectDeletePath(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<{
    filePath: any;
    name: any;
}>;
/** Resolve an existing or future output through the project's symlink-aware boundary. */
export declare function resolveProjectWritePath(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<any>;
export declare function resolveProjectFilePath(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<{
    filePath: any;
    name: any;
    size: number;
    mtime: number;
    mime: any;
    kind: string;
}>;
export declare function writeProjectFile(projectsRoot: any, projectId: any, name: any, body: any, { overwrite, artifactManifest }?: {
    artifactManifest?: null | undefined;
    overwrite?: boolean | undefined;
}, metadata?: any): Promise<{
    name: string;
    path: string;
    size: number;
    mtime: number;
    kind: string;
    mime: any;
    artifactKind: unknown;
    artifactManifest: {
        [x: string]: unknown;
    } | null;
}>;
export declare function reconcileHtmlArtifactManifest(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<{
    [x: string]: unknown;
} | null>;
export declare function deleteProjectFile(projectsRoot: any, projectId: any, name: any, metadata?: any): Promise<void>;
export declare function renameProjectFile(projectsRoot: any, projectId: any, fromName: any, toName: any, metadata?: any): Promise<{
    file: {
        name: string;
        path: string;
        size: number;
        mtime: number;
        kind: string;
        mime: any;
        artifactKind: unknown;
        artifactManifest: {
            [x: string]: unknown;
        } | null;
    };
    oldName: string;
    newName: string;
}>;
export declare function removeProjectDir(projectsRoot: any, projectId: any): Promise<void>;
export declare function stageProjectDirsForDelete(projectsRoot: any, projectIds: any, batchId: any): Promise<{
    rollback(): Promise<void>;
    commit(): Promise<void>;
}>;
export declare function sanitizePath(raw: any): string;
export declare function validateProjectPath(raw: any): string;
export declare function isReservedProjectFilePath(raw: any): boolean;
export declare function sanitizeName(raw: any): string;
export declare function decodeMultipartFilename(name: any): any;
export declare function isSafeId(id: any): boolean;
export declare function mimeFor(name: any): any;
export declare function parseByteRange(header: any, fileSize: any): "unsatisfiable" | {
    start: number;
    end: number;
} | null;
export declare function searchProjectFiles(projectsRoot: any, projectId: any, query: any, opts?: {}): Promise<{
    file: any;
    line: number;
    snippet: string | undefined;
}[]>;
export declare function kindFor(name: any): "audio" | "binary" | "code" | "document" | "html" | "image" | "pdf" | "presentation" | "sketch" | "spreadsheet" | "text" | "video";
