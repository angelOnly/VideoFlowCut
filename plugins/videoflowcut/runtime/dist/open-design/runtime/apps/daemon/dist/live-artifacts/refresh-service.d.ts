import { type LiveArtifactStoreRecord } from './store.js';
export interface RefreshLiveArtifactOptions {
    projectsRoot: string;
    projectId: string;
    artifactId: string;
    now?: Date;
    onStarted?: (event: {
        refreshId: string;
        artifact: LiveArtifactStoreRecord['artifact'];
    }) => void | Promise<void>;
}
export interface RefreshLiveArtifactResult {
    artifact: LiveArtifactStoreRecord['artifact'];
    refresh: {
        id: string;
        status: 'succeeded';
        refreshedSourceCount: number;
    };
}
export declare class LiveArtifactRefreshUnavailableError extends Error {
    constructor(message?: string);
}
export declare function refreshLiveArtifact(options: RefreshLiveArtifactOptions): Promise<RefreshLiveArtifactResult>;
