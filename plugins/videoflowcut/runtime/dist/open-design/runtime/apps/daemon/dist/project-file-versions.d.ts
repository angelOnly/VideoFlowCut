import type { ArtifactOrigin, ArtifactOriginStatus, ProjectFileVersion, ProjectFileVersionPromptSource, ProjectFileVersionSource } from '@open-design/contracts';
type VersionPromptSource = ProjectFileVersionPromptSource;
type VersionSource = ProjectFileVersionSource;
export interface CreateProjectFileVersionOptions {
    prompt?: string | null;
    promptSource?: VersionPromptSource;
    source?: VersionSource;
    label?: string | null;
    restoreFromVersionId?: string;
    parentVersionId?: string;
    origin?: ArtifactOrigin;
}
export interface ProjectFileVersionLockContext {
    safeName: string;
    createVersion: (content: string, options?: CreateProjectFileVersionOptions) => Promise<ProjectFileVersion>;
    ensureCurrentVersion: (content: string, options?: CreateProjectFileVersionOptions) => Promise<ProjectFileVersion | null>;
    matchVersionContent: (content: string, versionId?: string) => Promise<ProjectFileVersionContentMatch>;
}
export interface ProjectFileVersionContentMatch {
    status: Extract<ArtifactOriginStatus, 'matched' | 'missing_version' | 'digest_mismatch' | 'unknown'>;
    version: ProjectFileVersion | null;
}
export declare function withProjectFileVersionLock<T>(projectsRoot: string, projectId: string, fileName: string, metadata: unknown, fn: (context: ProjectFileVersionLockContext) => Promise<T>): Promise<T>;
export declare function projectFileVersionContentDigest(content: string): string;
export declare function isProjectFileVersionPath(raw: unknown): boolean;
export declare function listProjectFileVersions(projectsRoot: string, projectId: string, fileName: string, metadata?: unknown): Promise<ProjectFileVersion[]>;
export declare function readProjectFileVersion(projectsRoot: string, projectId: string, fileName: string, versionId: string, metadata?: unknown): Promise<{
    version: ProjectFileVersion;
    content: string;
}>;
export declare function createProjectFileVersion(projectsRoot: string, projectId: string, fileName: string, content: string, options?: CreateProjectFileVersionOptions, metadata?: unknown): Promise<ProjectFileVersion>;
export declare function markProjectFileVersionStoreDeleted(projectsRoot: string, projectId: string, fileName: string, metadata?: unknown): Promise<void>;
export declare function renameProjectFileVersionStore(projectsRoot: string, projectId: string, fromName: string, toName: string, metadata?: unknown): Promise<void>;
export declare function ensureCurrentProjectFileVersion(projectsRoot: string, projectId: string, fileName: string, content: string, options?: CreateProjectFileVersionOptions, metadata?: unknown): Promise<ProjectFileVersion | null>;
export declare function resolveProjectFileVersionContentMatch(projectsRoot: string, projectId: string, fileName: string, content: string, versionId?: string, metadata?: unknown): Promise<ProjectFileVersionContentMatch>;
export declare function getProjectFileVersionRootStats(projectsRoot: string, projectId: string, fileName: string, metadata?: unknown): Promise<{
    root: string;
    entries: string[];
    mtime: number;
}>;
export {};
