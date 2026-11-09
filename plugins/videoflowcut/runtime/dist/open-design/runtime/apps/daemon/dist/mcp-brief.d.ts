import { type OpenDesignBriefAnswers, type OpenDesignBriefArtifactType } from '@open-design/contracts';
import { type ExternalPluginContext } from './mcp-observability.js';
type UnknownRecord = Record<string, unknown>;
export type LocalMcpBriefLocale = 'en' | 'zh-CN' | 'zh-TW' | 'ja';
export interface LocalMcpBriefStoreOptions {
    now?: () => number;
    ttlMs?: number;
}
export interface LocalMcpBriefQuestionForm {
    id: 'open-design-brief';
    title: string;
    description: string;
    submitLabel: string;
    questions: Array<{
        id: string;
        label: string;
        description: string;
        type: 'radio';
        required: true;
        allowCustom: false;
        defaultValue: string;
        options: Array<{
            value: string;
            label: string;
            description: string;
        }>;
    }>;
}
export interface LocalMcpBriefForm {
    view: 'brief-form';
    artifactType: OpenDesignBriefArtifactType;
    projectTitle: string;
    locale: LocalMcpBriefLocale;
    localeSource: 'provided' | 'fallback';
    briefDraftId: string;
    nonce: string;
    expiresAt: number;
    pluginWorkflowId?: string;
    externalPluginContext?: ExternalPluginContext;
    questionForm: LocalMcpBriefQuestionForm;
    questionFormsByLocale: Record<LocalMcpBriefLocale, LocalMcpBriefQuestionForm>;
}
export interface LocalMcpBriefConfirmation {
    view: 'brief-confirmed';
    artifactType: OpenDesignBriefArtifactType;
    projectTitle: string;
    locale: LocalMcpBriefLocale;
    briefDraftId: string;
    briefConfirmationId: string;
    confirmedAt: number;
    answers: OpenDesignBriefAnswers;
    summary: string;
    pluginWorkflowId?: string;
    externalPluginContext?: ExternalPluginContext;
}
export interface LocalMcpBriefStore {
    collect(input: UnknownRecord): LocalMcpBriefForm;
    confirm(input: UnknownRecord): LocalMcpBriefConfirmation;
    attributionForDraft(briefDraftId: unknown): {
        pluginWorkflowId: string;
        externalPluginContext: ExternalPluginContext;
    } | null;
    briefStateForWorkflow(pluginWorkflowId: unknown): 'confirmed' | 'skipped' | 'not_applicable';
}
export declare function createLocalMcpBriefStore(options?: LocalMcpBriefStoreOptions): LocalMcpBriefStore;
export declare function readBriefLocale(value: unknown): LocalMcpBriefLocale;
export declare function localMcpBriefResponseCopy(locale: LocalMcpBriefLocale): {
    completeCard: string;
    confirmed: string;
    continueWithBrief: string;
};
export {};
