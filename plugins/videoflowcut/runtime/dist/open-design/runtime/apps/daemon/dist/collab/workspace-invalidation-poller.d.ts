import type { CollabCloudMemberDirectoryEntry, TeamProject, WorkspaceCollabContext, WorkspaceInvalidationSsePayload } from '@open-design/contracts';
export interface WorkspaceInvalidationPollerDeps {
    /** Current workspace context (proxies Vela/B in prod). Gates team reads and
     *  drives `workspace-context-changed`. Returns null off-team / signed out. */
    getWorkspaceContext: () => Promise<WorkspaceCollabContext | null>;
    /** Team-shared project discovery (resource hub). Only called on a team context. */
    listTeamProjects: (context: WorkspaceCollabContext) => Promise<TeamProject[]>;
    /** Team member directory. Only called on a team context. */
    listMembers: (context: WorkspaceCollabContext) => Promise<CollabCloudMemberDirectoryEntry[]>;
    /** Emit a thin workspace invalidation to the connected web sinks. */
    emit: (payload: WorkspaceInvalidationSsePayload, context: WorkspaceCollabContext | null) => void;
    /** Poll cadence; defaults to 15s (matches the web team-projects/members poll). */
    pollIntervalMs?: number;
    /** While the exact-workspace realtime stream is proven healthy, keep a
     *  bounded authoritative poll floor instead of running every base tick. */
    realtimePollFloorMs?: number;
    /** Ask the daemon recovery coordinator to inspect locally missing team
     * projects. This is a fire-and-forget request: a slow recovery must never
     * block workspace context, catalog, or member polling. `projects` is the
     * display-cache observation, not pull authorization: the recovery coordinator
     * must independently re-read authoritative identity + catalog state. */
    onTeamProjectsObserved?: (input: {
        workspaceId: string;
        projects: readonly TeamProject[];
    }) => void | Promise<void>;
    /** Minimum cadence for the missing-project recovery request. */
    recoveryFloorIntervalMs?: number;
    /** Injectable wall clock for deterministic recovery-floor tests. */
    now?: () => number;
    /** Bounded observability hook; one callback equals one upstream poll cycle
     * avoided by the strict realtime safety floor. */
    onPollSuppressed?: () => void;
    onError?: (error: unknown) => void;
}
export interface WorkspaceInvalidationPoller {
    /** Run one diff cycle (context → team reads → emit on change). */
    pollOnce(): Promise<void>;
    /** Enable the slower poll floor only after strict realtime health is proven. */
    setRealtimeHealthy(healthy: boolean): void;
    start(): void;
    stop(): void;
}
export declare function createWorkspaceInvalidationPoller(deps: WorkspaceInvalidationPollerDeps): WorkspaceInvalidationPoller;
