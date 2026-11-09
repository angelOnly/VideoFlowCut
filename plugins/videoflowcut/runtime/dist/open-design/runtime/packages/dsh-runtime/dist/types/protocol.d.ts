export declare const PROTOCOL_VERSION: 1;
export declare const RUNTIME_NAME: 'open-design';
export declare const CAPABILITIES: {
    readonly session_resume: true;
    readonly session_cancel: true;
    readonly structured_events: true;
};
export type ModelCatalogEntry = {
    provider: string;
    provider_name: string;
    id: string;
    name: string;
    reasoning_options?: Array<{
        id: string;
        name: string;
        default?: boolean;
    }>;
};
export declare function modelsFrame(models: ModelCatalogEntry[]): {
    v: 1;
    type: 'models';
    runtime: "open-design";
    models: ModelCatalogEntry[];
};
export type ExecuteCommand = {
    v: 1;
    type: 'execute';
    request_id: string;
    cwd: string;
    prompt: string;
    resume_session_id?: string;
    model?: {
        provider: string;
        id: string;
    };
    reasoning_effort?: string;
    mcp_servers: unknown[];
};
export type CancelCommand = {
    v: 1;
    type: 'cancel';
    request_id: string;
};
export type HostCommand = ExecuteCommand | CancelCommand;
export declare function parseHostCommand(value: unknown): HostCommand;
export declare function identityFrame(type: 'probe' | 'ready', pluginVersion: string): {
    v: 1;
    type: "probe" | "ready";
    runtime: "open-design";
    protocol_version: 1;
    plugin_version: string;
    capabilities: {
        readonly session_resume: true;
        readonly session_cancel: true;
        readonly structured_events: true;
    };
};
