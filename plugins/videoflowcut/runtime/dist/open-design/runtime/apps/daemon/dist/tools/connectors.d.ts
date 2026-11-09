import type { ToolTokenGrant } from '../tool-tokens.js';
import { type ConnectorToolUseCase } from '../connectors/catalog.js';
import { ConnectorService, type ConnectorExecuteRequest } from '../connectors/service.js';
export interface ConnectorToolContext {
    grant: ToolTokenGrant;
    projectsRoot: string;
    service?: ConnectorService;
}
export declare function listConnectorTools(context: ConnectorToolContext & {
    useCase?: ConnectorToolUseCase;
}): Promise<Awaited<ReturnType<ConnectorService['listConnectors']>>>;
export declare function executeConnectorTool(request: ConnectorExecuteRequest, context: ConnectorToolContext): Promise<import("../connectors/service.js").ConnectorExecuteResponse>;
