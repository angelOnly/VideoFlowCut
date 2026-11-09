/**
 * Lifecycle states for an {@link AgentTask}. The `const` array mirrors the house
 * `API_ERROR_CODES` idiom so the union derives from a single source.
 */
export declare const AGENT_TASK_STATUSES: readonly ['active', 'awaiting-consent', 'completed', 'failed', 'cancelled'];
export type AgentTaskStatus = (typeof AGENT_TASK_STATUSES)[number];
/**
 * A durable, project-agnostic unit of work. An AgentTask owns a goal that may
 * span several steps and several projects; it is NOT tied to the chat of any one
 * project.
 *
 * `projectIds` is the ownership / blast-radius boundary — the SET of projects
 * this task is authorized to touch — NOT the enforcement mechanism. How that set
 * is granted and widened (explicit allow-list vs just-in-time consent) is the
 * maintainer's separate reviewable decision; see the companion RFC "Permissions".
 * Keeping the boundary as a plain id set (no embedded project state, no roles) is
 * the deliberate guard against re-modeling `ProjectView` here.
 */
export interface AgentTask {
    /** Stable identity for the task; unique within a workspace. */
    taskId: string;
    /** Optional human-readable goal ("Apply our Q3 brand to the pitch deck"). */
    goal?: string;
    /**
     * The projects this task is authorized to act on. Empty means "no project
     * scope granted yet." A step targeting a project not in this set must obtain
     * consent (see the RFC) rather than proceed.
     */
    projectIds: string[];
    /** Current lifecycle state. */
    status: AgentTaskStatus;
}
//# sourceMappingURL=task.d.ts.map