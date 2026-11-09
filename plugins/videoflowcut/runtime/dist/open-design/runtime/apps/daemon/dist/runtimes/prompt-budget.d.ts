import type { RuntimeAgentDef, RuntimePromptBudgetError } from './types.js';
export declare function checkPromptArgvBudget(def: RuntimeAgentDef | null | undefined, composed: unknown, platform?: NodeJS.Platform): RuntimePromptBudgetError | null;
export declare function checkWindowsCmdShimCommandLineBudget(def: RuntimeAgentDef | null | undefined, resolvedBin: unknown, args: unknown): RuntimePromptBudgetError | null;
export declare function checkWindowsDirectExeCommandLineBudget(def: RuntimeAgentDef | null | undefined, resolvedBin: unknown, args: unknown): RuntimePromptBudgetError | null;
