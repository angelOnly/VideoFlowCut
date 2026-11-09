import { runVelaCommand } from '../integrations/vela-command.js';
import type { VelaControlApiContext } from '../integrations/vela.js';
/** Recover only this protocol's private configs whose creator is definitely gone.
 * A reused PID, EPERM, legacy name or symlink is deliberately left alone. This
 * removes credentials, not any already-issued remote mutation or orphan process.
 */
export declare function cleanupAbandonedPinnedVelaSessions(dataRoot: string): Promise<{
    removed: number;
    failed: number;
}>;
export interface PinnedVelaCommandInput {
    args: string[];
    session: VelaControlApiContext;
    /** Resolved daemon data root, supplied by the composition root. No fallback. */
    dataRoot: string;
    workspaceId: string;
    configuredEnv?: Record<string, string>;
}
/** Isolate Go CLI profile loading from concurrent login/account changes.
 * Credentials are never command arguments. The runner settles only after its
 * child has exited (including timeout termination), then the config is removed.
 */
export declare function runPinnedVelaCommand(input: PinnedVelaCommandInput, run?: typeof runVelaCommand): Promise<string>;
