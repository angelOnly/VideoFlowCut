import { type ShareStatus } from '@open-design/contracts';
import { runVelaCommand } from '../integrations/vela-command.js';
export type VelaShareStatusResult = {
    known: true;
    projectId: string;
    slug: string;
    status: ShareStatus;
    bindingExists: true;
    shareStopped: boolean;
} | {
    known: false;
};
/** Owner-only lookup: not-found is non-enumerable, not proof of absence or stop.
 * Callers may inject a runner pinned to their verified session.
 */
export declare function readVelaShareStatus(input: {
    workspaceId: string;
    projectId: string;
    slug: string;
}, run?: typeof runVelaCommand): Promise<VelaShareStatusResult>;
