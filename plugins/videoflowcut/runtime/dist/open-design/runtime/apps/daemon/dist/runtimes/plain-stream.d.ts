import type { ProjectFile } from '@open-design/contracts';
import { createProjectArtifactFile } from '../artifacts/create.js';
export interface PlainStreamArtifact {
    identifier: string;
    artifactType: string;
    title: string;
    content: string;
    extension: SupportedArtifactExtension;
    fileName: string;
}
export interface PersistedPlainStreamArtifact {
    identifier: string;
    artifactType: string;
    title: string;
    name: string;
    file: unknown;
}
interface RunEventLike {
    event?: string;
    data?: unknown;
}
type SupportedArtifactExtension = '.html' | '.css' | '.svg' | '.md';
type WriteProjectFile = Parameters<typeof createProjectArtifactFile>[0]['writeProjectFile'];
type ListFiles = (projectsRoot: string, projectId: string, opts?: {
    metadata?: unknown;
}) => Promise<ProjectFile[]>;
export declare function plainStdoutFromRunEvents(events: readonly RunEventLike[]): string;
export declare function extractPlainStreamArtifacts(stdout: string): PlainStreamArtifact[];
export declare function persistPlainStreamArtifacts(options: {
    projectsRoot: string;
    projectId: string;
    stdout: string;
    metadata?: unknown;
    writeProjectFile?: WriteProjectFile;
    listFiles?: ListFiles;
}): Promise<PersistedPlainStreamArtifact[]>;
export declare function persistPlainStreamArtifactList(options: {
    projectsRoot: string;
    projectId: string;
    artifacts: PlainStreamArtifact[];
    metadata?: unknown;
    writeProjectFile?: WriteProjectFile;
    listFiles?: ListFiles;
}): Promise<PersistedPlainStreamArtifact[]>;
export {};
