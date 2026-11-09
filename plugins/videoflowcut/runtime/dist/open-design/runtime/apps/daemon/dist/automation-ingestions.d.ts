import type { AutomationContentPacket, AutomationSourceIngestionResponse, CreateAutomationSourceIngestionRequest } from '@open-design/contracts';
export declare function listAutomationSourcePackets(dataDir: string, opts?: {
    limit?: number;
}): Promise<AutomationContentPacket[]>;
export declare function getAutomationSourcePacket(dataDir: string, id: string): Promise<AutomationContentPacket | null>;
export declare function ingestAutomationSource(dataDir: string, input: CreateAutomationSourceIngestionRequest): Promise<AutomationSourceIngestionResponse>;
