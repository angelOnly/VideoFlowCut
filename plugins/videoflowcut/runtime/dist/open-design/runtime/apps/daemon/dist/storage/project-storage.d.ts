import { type SigV4Credentials } from './aws-sigv4.js';
export interface ProjectFileMeta {
    path: string;
    size: number;
    mtimeMs: number;
}
export interface ProjectStorage {
    readFile(projectId: string, relpath: string): Promise<Buffer>;
    writeFile(projectId: string, relpath: string, body: Buffer): Promise<ProjectFileMeta>;
    listFiles(projectId: string): Promise<ProjectFileMeta[]>;
    deleteFile(projectId: string, relpath: string): Promise<void>;
    statFile(projectId: string, relpath: string): Promise<ProjectFileMeta | null>;
}
export declare class StorageError extends Error {
    readonly code: 'NOT_FOUND' | 'TRAVERSAL' | 'IO';
    constructor(code: 'NOT_FOUND' | 'TRAVERSAL' | 'IO', message: string);
}
/**
 * v1 default — backed by the daemon's existing `<dataDir>/.od/projects/`
 * filesystem layout. Pure pass-through to fs/promises with the
 * traversal guard the legacy `projects.ts` helpers already enforce.
 */
export declare class LocalProjectStorage implements ProjectStorage {
    private readonly projectsRoot;
    constructor(projectsRoot: string);
    readFile(projectId: string, relpath: string): Promise<Buffer>;
    writeFile(projectId: string, relpath: string, body: Buffer): Promise<ProjectFileMeta>;
    listFiles(projectId: string): Promise<ProjectFileMeta[]>;
    deleteFile(projectId: string, relpath: string): Promise<void>;
    statFile(projectId: string, relpath: string): Promise<ProjectFileMeta | null>;
    private resolvePath;
}
/**
 * Phase 5 / spec §15.6 / plan §3.U1 — S3-compatible blob backend.
 *
 * Signs requests inline with AWS SigV4 (see ./aws-sigv4.ts) using
 * only node:crypto. No `@aws-sdk/*` dep is pulled in; the backend
 * targets AWS S3 + every S3-compatible store the spec lists (Aliyun
 * OSS, Tencent COS, Huawei OBS, MinIO).
 *
 * Five operations:
 *   readFile    \u2192 GET    /<key>
 *   writeFile   \u2192 PUT    /<key>          (with x-amz-content-sha256)
 *   deleteFile  \u2192 DELETE /<key>
 *   statFile    \u2192 HEAD   /<key>
 *   listFiles   \u2192 GET    /?list-type=2&prefix=<projectId>/...
 *
 * Network is pluggable: pass `fetchFn` in the constructor (tests
 * inject a stub; production defaults to globalThis.fetch).
 */
export interface S3ProjectStorageOptions {
    bucket: string;
    region: string;
    prefix?: string;
    endpoint?: string;
    credentials: SigV4Credentials;
    fetchFn?: typeof fetch;
    now?: () => Date;
}
export declare class S3ProjectStorage implements ProjectStorage {
    readonly options: S3ProjectStorageOptions;
    private readonly fetchFn;
    constructor(options: S3ProjectStorageOptions);
    readFile(projectId: string, relpath: string): Promise<Buffer>;
    writeFile(projectId: string, relpath: string, body: Buffer): Promise<ProjectFileMeta>;
    deleteFile(projectId: string, relpath: string): Promise<void>;
    statFile(projectId: string, relpath: string): Promise<ProjectFileMeta | null>;
    listFiles(projectId: string): Promise<ProjectFileMeta[]>;
    keyFor(projectId: string, relpath: string): string;
    private endpointBase;
    private signedRequest;
}
/**
 * Resolve the daemon-wide project storage adapter from environment.
 * Default is local-disk; setting OD_PROJECT_STORAGE=s3 pulls the
 * stub above (and will pull the real impl once it lands).
 */
export declare function resolveProjectStorage(opts: {
    projectsRoot: string;
    env?: Record<string, string | undefined>;
}): ProjectStorage;
