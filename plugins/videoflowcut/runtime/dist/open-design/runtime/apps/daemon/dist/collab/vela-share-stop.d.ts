import type { runVelaCommand } from '../integrations/vela-command.js';
/** The runner must already be pinned to the verified workspace and session. */
export declare function stopVelaShare(projectId: string, slug: string, run: typeof runVelaCommand): Promise<void>;
