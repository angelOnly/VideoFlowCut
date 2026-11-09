import type { OrbitRunSummary, OrbitStatusResponse } from '@open-design/contracts/api/orbit';
import type { OrbitConfigPrefs } from './app-config.js';
export interface OrbitConnectorRunResult {
    connectorId: string;
    connectorName: string;
    accountLabel?: string;
    toolName?: string;
    toolTitle?: string;
    status: 'succeeded' | 'skipped' | 'failed';
    summary: string;
    error?: string;
}
export interface OrbitActivitySummary extends OrbitRunSummary {
    id: string;
    startedAt: string;
    completedAt: string;
    trigger: 'manual' | 'scheduled';
    templateSkillId?: string | null;
    connectorsChecked: number;
    connectorsSucceeded: number;
    connectorsFailed: number;
    connectorsSkipped: number;
    artifactId?: string;
    artifactProjectId?: string;
    agentRunId?: string;
    markdown: string;
    results: OrbitConnectorRunResult[];
}
export interface OrbitAgentRunResult {
    agentRunId: string;
    status: 'succeeded' | 'failed' | 'canceled';
    artifactId?: string;
    artifactProjectId?: string;
    summary?: string;
}
export interface OrbitRunHandlerStart {
    projectId: string;
    agentRunId: string;
    completion: Promise<OrbitAgentRunResult>;
}
export interface OrbitTemplateSelection {
    id: string;
    name: string;
    examplePrompt: string;
    dir: string;
    body: string;
    designSystemRequired: boolean;
}
export type OrbitRunHandler = (request: {
    runId: string;
    trigger: 'manual' | 'scheduled';
    startedAt: string;
    prompt: string;
    systemPrompt: string;
    template: OrbitTemplateSelection | null;
    workspaceScope: OrbitConfigPrefs['workspaceScope'];
}) => Promise<OrbitRunHandlerStart>;
export declare function formatLocalProjectTimestamp(iso: string): string;
export type OrbitTemplateResolver = (skillId: string) => Promise<OrbitTemplateSelection | null>;
export interface OrbitStatus extends OrbitStatusResponse {
    config: OrbitConfigPrefs;
    running: boolean;
    nextRunAt: string | null;
    lastRun: OrbitActivitySummary | null;
    lastRunsByTemplate: Record<string, OrbitActivitySummary>;
}
export declare const DEFAULT_ORBIT_CONFIG: OrbitConfigPrefs;
export declare function buildOrbitPrompt(now?: Date, template?: OrbitTemplateSelection | null, locale?: string | null): string;
export declare function buildOrbitSystemPrompt(now?: Date, template?: OrbitTemplateSelection | null, locale?: string | null): string;
export declare function renderOrbitTemplateSystemPrompt(template: OrbitTemplateSelection | null): string;
export declare class OrbitService {
    private readonly dataDir;
    private config;
    private timer;
    private nextRunAtValue;
    private starting;
    private inflight;
    private inflightProjectId;
    private inflightAgentRunId;
    private runHandler;
    private templateResolver;
    constructor(dataDir: string);
    setRunHandler(handler: OrbitRunHandler): void;
    setTemplateResolver(resolver: OrbitTemplateResolver): void;
    configure(config: Partial<OrbitConfigPrefs> | undefined): void;
    status(): Promise<OrbitStatus>;
    start(trigger: 'manual' | 'scheduled', options?: {
        locale?: string | null;
    }): Promise<{
        projectId: string;
        agentRunId: string;
    }>;
    private startRun;
    stop(): void;
    private reschedule;
}
