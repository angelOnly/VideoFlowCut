import type { PrepareShareBinding } from './share-binding-startup.js';
import { readVelaControlApiContext } from '../integrations/vela.js';
import { fetchVelaWorkspaceDirectory } from './vela-workspace-context.js';
import { runPinnedVelaCommand } from './vela-pinned-command.js';
export interface VelaShareBindingPrepareOptions {
    dataRoot: string;
    configuredEnv?: Record<string, string> | (() => Record<string, string>);
    readSession?: typeof readVelaControlApiContext;
    fetchDirectory?: typeof fetchVelaWorkspaceDirectory;
    runCommand?: typeof runPinnedVelaCommand;
}
/** Verify the original principal then bind with that exact session and generation.
 * Directory lookup is the existing integration; binding itself is CLI-only.
 */
export declare function createVelaShareBindingPrepare(options: VelaShareBindingPrepareOptions): PrepareShareBinding;
