import type { CollabPresenceMember } from '@open-design/contracts';
export type PresenceMember = CollabPresenceMember;
export interface CollabPresenceTrackerOptions {
    /** A member is considered gone this long after their last heartbeat. */
    ttlMs?: number;
    now?: () => number;
    /** Fired when a project's present set changes via an explicit join or leave. */
    onChange?: (result: {
        projectId: string;
        present: PresenceMember[];
    }) => void;
}
export declare class CollabPresenceTracker {
    private readonly ttlMs;
    private readonly now;
    private readonly onChange?;
    private readonly projects;
    constructor(options?: CollabPresenceTrackerOptions);
    /** Mark a member present in a project (call on view + on each poll). */
    heartbeat(projectId: string, member: PresenceMember, clientId?: string): void;
    /** Explicit departure (tab closed / left the project). */
    leave(projectId: string, memberId: string, clientId?: string): void;
    /** Members present now — sweeps any whose heartbeat aged past the TTL. */
    present(projectId: string): PresenceMember[];
    dispose(): void;
    private emit;
    private ensure;
}
