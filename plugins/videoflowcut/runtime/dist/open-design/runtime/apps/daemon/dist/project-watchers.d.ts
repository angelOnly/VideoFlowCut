import type { Stats } from 'node:fs';
import { type FSWatcher } from 'chokidar';
export type ProjectWatchKind = 'add' | 'change' | 'unlink';
export interface ProjectWatchEvent {
    type: 'file-changed';
    path: string;
    kind: ProjectWatchKind;
}
export type ProjectWatchCallback = (evt: ProjectWatchEvent) => void;
type ProjectWatchIgnored = (absPath: string, stats?: Stats) => boolean;
export interface ProjectWatcherOptions {
    ignored?: ProjectWatchIgnored;
    awaitWriteFinish?: false | {
        stabilityThreshold: number;
        pollInterval: number;
    };
    metadata?: unknown;
    _watcherFactory?: WatcherFactory;
}
interface WatcherEntry {
    dir: string;
    watcher: FSWatcher;
    ready: Promise<void>;
    subscribers: Set<ProjectWatchCallback>;
    closing: Promise<void> | null;
}
type WatcherFactory = (dir: string, opts: Required<Pick<ProjectWatcherOptions, 'ignored' | 'awaitWriteFinish'>>) => WatcherEntry;
export declare function makeIgnored(rootDir: string): ProjectWatchIgnored;
export declare const DEFAULT_AWAIT_WRITE_FINISH: {
    stabilityThreshold: number;
    pollInterval: number;
};
/**
 * Subscribe to file-change events for a project.
 *
 * @param {string} projectsRoot Absolute path to the projects parent directory.
 * @param {string} projectId Project id (validated by projectDir()).
 * @param {(evt: {type: 'file-changed', path: string, kind: 'add'|'change'|'unlink'}) => void} onEvent
 * @param {{ ignored?: string[], awaitWriteFinish?: object, _watcherFactory?: typeof makeEntry }} [opts]
 * @returns {{ unsubscribe: () => Promise<void>, ready: Promise<void> }}
 *   `unsubscribe` releases the subscriber and closes the watcher if it was the
 *   last; `ready` resolves once chokidar has finished its initial scan.
 */
export declare function subscribe(projectsRoot: string, projectId: string, onEvent: ProjectWatchCallback, opts?: ProjectWatcherOptions): {
    unsubscribe: () => Promise<void>;
    ready: Promise<void>;
};
/** Test-only: drop all watchers. */
export declare function _resetForTests(): Promise<void>;
/** Test-only: number of active watchers. */
export declare function _activeWatcherCount(): number;
/** Test-only: return the chokidar FSWatcher for a given project's directory. */
export declare function _internalWatcherForTests(projectsRoot: string, projectId: string): FSWatcher | undefined;
export {};
