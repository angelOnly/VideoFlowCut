import type { PreparePublicFileStop } from './public-file-publication-store.js';
import { readVelaControlApiContext } from '../integrations/vela.js';
import { fetchVelaWorkspaceDirectory } from './vela-workspace-context.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
export interface VelaPublicFileStopOptions {
    readSession?: typeof readVelaControlApiContext;
    fetchDirectory?: typeof fetchVelaWorkspaceDirectory;
    /** Used only by the existing directory integration, never for stop. */
    fetch?: typeof fetch;
    configuredEnv?: Record<string, string> | (() => Record<string, string>);
    dataRoot?: string;
    runCommand?: typeof runPinnedVelaCommand;
}
/** Delete the published source resource for file/project deletion and its retries.
 * The server atomically revokes snapshots with source_deleted. Manual unshare
 * uses share stop separately; never substitute it for this operation.
 * Workspace roles cannot substitute for the persisted original member; the
 * remote resource authority still checks creator ownership at execution time.
 */
export declare function createVelaPublicFileStop(options?: VelaPublicFileStopOptions): PreparePublicFileStop;
