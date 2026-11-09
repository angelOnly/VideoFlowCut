import type { ProjectLocationPrefs } from './app-config.js';
export declare const BUILT_IN_PROJECT_LOCATION_ID = "default";
export declare const PROJECT_MANIFEST_RELATIVE_PATH: string;
export interface ProjectLocation extends ProjectLocationPrefs {
    builtIn?: boolean;
}
export interface ProjectManifest {
    schemaVersion: 1;
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    skillId?: string | null;
    designSystemId?: string | null;
}
export declare function builtInProjectLocation(projectsDir: string): ProjectLocation;
export declare function allProjectLocations(projectsDir: string, external: ProjectLocationPrefs[] | undefined): ProjectLocation[];
export declare function locationProjectDir(location: ProjectLocation, projectId: string): string;
export declare function createLocationProjectDir(location: ProjectLocation, projectId: string): Promise<string>;
export declare function canonicalLocationChildDir(location: ProjectLocation, childName: string): Promise<string>;
export declare function manifestPath(projectDir: string): string;
export declare function ensureProjectLocation(locationPath: string): Promise<string>;
export declare function writeProjectManifest(projectDir: string, manifest: ProjectManifest): Promise<void>;
export declare function readProjectManifest(projectDir: string): Promise<ProjectManifest | null>;
export declare function scanProjectLocation(location: ProjectLocation): Promise<Array<{
    dir: string;
    manifest: ProjectManifest;
}>>;
