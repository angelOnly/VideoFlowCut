export interface ScaffoldInput {
    targetDir: string;
    id: string;
    title?: string;
    description?: string;
    taskKind?: 'new-generation' | 'code-migration' | 'figma-migration' | 'tune-collab';
    mode?: string;
    scenario?: string;
    withClaudePlugin?: boolean;
}
export interface ScaffoldResult {
    folder: string;
    files: string[];
}
export declare class ScaffoldError extends Error {
    constructor(message: string);
}
export declare function scaffoldPlugin(input: ScaffoldInput): Promise<ScaffoldResult>;
