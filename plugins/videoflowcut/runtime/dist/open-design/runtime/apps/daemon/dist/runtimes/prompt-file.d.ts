import type { RuntimeAgentDef } from './types.js';
export type PreparedPromptFile = {
    path: string;
    cleanup: () => Promise<void>;
};
export declare function preparePromptFileForAgent(def: RuntimeAgentDef | null | undefined, prompt: string, label: string): Promise<PreparedPromptFile | null>;
