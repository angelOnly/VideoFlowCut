import type { RoutineRunStatus, RoutineRunTrigger } from './routines.js';
type RoutineLike = {
    id: string;
    name: string;
    prompt: string;
};
type MessageLike = {
    role?: string;
    content?: unknown;
};
export declare function automationTemplateIdFromRoutinePrompt(prompt: string): string | null;
export declare function ingestRoutineConnectorEvolution(dataDir: string, input: {
    routine: RoutineLike;
    runId: string;
    trigger: RoutineRunTrigger;
    status: RoutineRunStatus;
    projectId: string;
    conversationId: string;
    agentRunId: string;
    summary: string;
    connectorIds: string[];
    messages: MessageLike[];
}): Promise<import("@open-design/contracts").AutomationSourceIngestionResponse | null>;
export {};
