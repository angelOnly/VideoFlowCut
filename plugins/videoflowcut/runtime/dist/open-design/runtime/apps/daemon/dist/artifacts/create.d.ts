import { Buffer } from 'node:buffer';
type JsonObject = Record<string, unknown>;
export interface CreateProjectArtifactInput {
    name: string;
    content: string;
    encoding?: 'utf8' | 'base64' | string;
    artifactManifest?: unknown;
}
export interface CreateProjectArtifactOptions {
    projectsRoot: string;
    projectId: string;
    input: CreateProjectArtifactInput;
    metadata?: unknown;
    writeProjectFile: (projectsRoot: string, projectId: string, name: string, body: Buffer, options: {
        overwrite: false;
        artifactManifest: unknown;
    }, metadata?: unknown) => Promise<unknown>;
}
export declare class ArtifactManifestRequiredError extends Error {
    code: 'ARTIFACT_MANIFEST_REQUIRED';
    constructor(name: string);
}
export declare class ArtifactManifestInvalidError extends Error {
    code: 'ARTIFACT_MANIFEST_INVALID';
    constructor(message: string);
}
export declare function buildCreateArtifactRequestBody(input: CreateProjectArtifactInput): JsonObject;
export declare function resolveCreateArtifactManifest(input: CreateProjectArtifactInput): unknown;
export declare function createProjectArtifactFile(options: CreateProjectArtifactOptions): Promise<unknown>;
export declare function postCreateArtifactRequest(args: {
    baseUrl: string;
    projectId: string;
    input: CreateProjectArtifactInput;
    headers?: Record<string, string>;
}): Promise<unknown>;
export {};
