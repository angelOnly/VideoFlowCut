import type { AutomationEvolutionProposal, AutomationProposalStatus, CreateAutomationEvolutionProposalRequest } from '@open-design/contracts';
export declare function listAutomationProposals(dataDir: string, opts?: {
    status?: AutomationProposalStatus | 'all';
}): Promise<AutomationEvolutionProposal[]>;
export declare function getAutomationProposal(dataDir: string, id: string): Promise<AutomationEvolutionProposal | null>;
export declare function createAutomationProposal(dataDir: string, input: CreateAutomationEvolutionProposalRequest & {
    id?: string;
    status?: AutomationProposalStatus;
}): Promise<AutomationEvolutionProposal>;
export declare function applyAutomationProposal(dataDir: string, id: string): Promise<{
    proposal: AutomationEvolutionProposal;
    result: {
        memoryId: string;
        action: string;
    } | {
        memoryId: any;
        action: "create" | "merge" | "move" | "promote" | "update";
    } | {
        designSystemId: string;
        action: string;
        path: string;
    } | {
        skillSlug: string;
        action: string;
        path: string;
    } | {
        automationTemplateId: string;
        action: "create" | "merge" | "move" | "promote" | "update";
        path: string;
    };
}>;
export declare function rejectAutomationProposal(dataDir: string, id: string, reason?: string): Promise<AutomationEvolutionProposal>;
