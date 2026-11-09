import type { AutomationTemplate } from '@open-design/contracts';
export declare const BUILT_IN_AUTOMATION_TEMPLATES: AutomationTemplate[];
export declare function listAutomationTemplates(): AutomationTemplate[];
export declare function getAutomationTemplate(id: string): AutomationTemplate | null;
export declare function normalizeAutomationTemplate(input: unknown): AutomationTemplate;
export declare function listAllAutomationTemplates(dataDir: string): Promise<AutomationTemplate[]>;
export declare function getAnyAutomationTemplate(dataDir: string, id: string): Promise<AutomationTemplate | null>;
export declare function upsertUserAutomationTemplate(dataDir: string, input: unknown): Promise<AutomationTemplate>;
