export interface MediaTaskDiagnosticInput {
    code?: string | undefined;
    elapsedMs?: number | undefined;
    error?: string | undefined;
    event: 'queued' | 'done' | 'failed';
    fileSize?: number | undefined;
    hasCompositionDir?: boolean | undefined;
    mime?: string | undefined;
    model: string;
    projectId: string;
    providerId?: string | undefined;
    runId?: string | undefined;
    referenceImageCount?: number | undefined;
    status?: number | string | undefined;
    surface: string;
    taskId: string;
}
export declare function formatMediaTaskDiagnostic(input: MediaTaskDiagnosticInput): string;
