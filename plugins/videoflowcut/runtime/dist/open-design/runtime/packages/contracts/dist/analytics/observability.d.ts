export interface ObservabilityEventRequest {
    event: string;
    properties?: Record<string, unknown>;
}
export interface ObservabilityEventResponse {
    ok: true;
}
/** Consent-gated identity returned only to the local stdio MCP process. */
export interface McpAnalyticsContextResponse {
    enabled: boolean;
    deviceId: string | null;
    locale: string;
}
export interface McpAnalyticsEventRequest {
    event: 'mcp_session_initialized' | 'mcp_tool_started' | 'mcp_tool_finished';
    eventId: string;
    occurredAt: string;
    properties?: Record<string, unknown>;
}
/** Local diagnostic bridge only. Unlike safety events, requires metrics AND content consent. */
export declare const CLIENT_EXPERIENCE_DIAGNOSTIC_EVENT = "client_experience_diagnostic";
export interface ClientExperienceDiagnostic {
    occurrenceId: string;
    category: 'visible_error' | 'operation_failure' | 'project_failure' | 'runtime_failure';
    surface: string;
    errorCode: string;
    observedAt: number;
    runId?: string;
    projectId?: string;
    conversationId?: string;
    status?: string;
}
/** Reject free text and path-shaped IDs; return only the declared metadata fields. */
export declare function parseClientExperienceDiagnostic(value: unknown): ClientExperienceDiagnostic | null;
//# sourceMappingURL=observability.d.ts.map