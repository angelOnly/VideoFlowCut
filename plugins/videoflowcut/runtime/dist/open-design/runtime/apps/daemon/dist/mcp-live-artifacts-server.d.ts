type JsonObject = Record<string, unknown>;
interface JsonRpcRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: JsonObject;
}
interface McpTool {
    name: string;
    description: string;
    inputSchema: JsonObject;
}
interface McpServerResult {
    exitCode: number;
}
export declare function createLiveArtifactsMcpTools(): McpTool[];
export declare function handleLiveArtifactsMcpRequest(request: JsonRpcRequest): Promise<JsonObject | undefined>;
export declare function runLiveArtifactsMcpServer(): Promise<McpServerResult>;
export {};
