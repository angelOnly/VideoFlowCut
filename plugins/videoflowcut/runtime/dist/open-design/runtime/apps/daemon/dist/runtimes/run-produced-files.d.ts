import type Database from 'better-sqlite3';
/**
 * One entry of the message's produced-file list, shaped exactly like the
 * `ProjectFile` the file listing hands the web (`projects.ts` `collectFiles`).
 *
 * The shape is load-bearing, not decorative: the chat card picks the image
 * card vs. the audio capsule from `kind`/the extension, builds its preview URL
 * from `name`, and shows `size`. A list of bare filenames would persist and
 * then render as nothing.
 */
export interface RunProducedFile {
    name: string;
    path: string;
    localPath: string;
    type: 'file';
    size: number;
    mtime: number;
    kind: string;
    mime: string;
}
export interface AssociateRunProducedFilesInput {
    /** Assistant message that carries the turn. */
    messageId: string;
    /** Absolute project directory the run wrote into. */
    projectRoot: string;
    /** Absolute paths the run created or modified (the run's artifact diff). */
    touchedPaths: readonly string[];
    /** Cap so a pathological run cannot flood the column. */
    maxFiles?: number;
}
export type AssociateRunProducedFilesOutcome = {
    written: false;
    reason: 'no-paths' | 'unreadable' | 'client-owned';
} | {
    written: true;
    files: RunProducedFile[];
};
/**
 * Fill this message's produced-file list from the run's touched paths, but only
 * while it is still empty.
 *
 * Never throws: a missed association costs one card, it must not fail the run.
 */
export declare function associateRunProducedFiles(db: Database.Database, input: AssociateRunProducedFilesInput): Promise<AssociateRunProducedFilesOutcome>;
export interface AssociateLateRunProducedFileInput {
    /** The run the producing task was spawned from (`media_tasks.run_id`). */
    runId: string;
    /** Absolute project directory the task wrote into. */
    projectRoot: string;
    /** Project-relative path of the file the task just produced. */
    projectRelativePath: string;
}
export type AssociateLateRunProducedFileOutcome = {
    written: false;
    reason: 'no-message' | 'run-active' | 'unreadable' | 'already-listed' | 'contended';
} | {
    written: true;
    messageId: string;
    file: RunProducedFile;
};
/**
 * Attach a late-landing file to the assistant message of the run that produced
 * it, without ever taking anything away.
 *
 * STILL A FLOOR, by two rules:
 *
 *  1. It only ever ADDS. The stored list is read, the one new entry is put in
 *     front of it, and every entry the client wrote survives verbatim. The
 *     client's verdict on what this turn produced is never contradicted, only
 *     completed with a file the client could not have seen. Re-running it is a
 *     no-op: a path already in the list is left alone.
 *  2. It refuses to act while the turn is still live. A media task that
 *     completes DURING its run needs nothing from here — its file is on disk
 *     before the terminal snapshot, so the floor above already carries it — and
 *     writing early would make that floor read the column as client-owned and
 *     silently drop every other file the same turn produced.
 *
 * THE READ-MODIFY-WRITE MUST STAY UNBROKEN. The list is re-read AFTER the only
 * `await` in here and then extended and written with nothing awaited in
 * between, which is what makes it atomic against every other writer in this
 * single-threaded daemon — including a client `PUT` that lands while the
 * `stat` is in flight, and a sibling media task of the same batch finishing
 * alongside this one. Introduce an `await` between that re-read and the
 * `UPDATE` and two concurrent late files start overwriting each other.
 *
 * Never throws: a missed association costs one card, it must not fail the task.
 */
export declare function associateLateRunProducedFile(db: Database.Database, input: AssociateLateRunProducedFileInput): Promise<AssociateLateRunProducedFileOutcome>;
