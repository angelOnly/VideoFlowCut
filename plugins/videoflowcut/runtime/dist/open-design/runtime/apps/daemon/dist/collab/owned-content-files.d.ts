import { type RunVelaResource } from './vela-cli-resource-adapter.js';
import type { OwnedContentScope } from './owned-content-store.js';
/** The exact root snapshot roster, shared by upload checkpoints and HTML fact admission. */
export declare function contentFiles(directory: string): Promise<string[]>;
/** Runs only at publication/receipt boundaries, never in periodic status reads. */
export declare function ownedContentFingerprint(directory: string): Promise<string>;
export interface ApplyOwnedContentOptions {
    projectsRoot: string;
    scope: OwnedContentScope;
    expectedVersion: number;
    authorize(): Promise<void>;
    isBusy(): boolean;
    commit(version: number): Promise<void> | void;
    run?: RunVelaResource;
}
/** Authenticated owner transport; member receipt authorization remains separate. */
export declare function applyOwnedProjectContent(options: ApplyOwnedContentOptions): Promise<{
    version: number;
    fingerprint: string;
}>;
