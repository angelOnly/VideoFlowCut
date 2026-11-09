export declare function __resetMemoryTurnDedupeForTests(): void;
export declare function suggestWithLLM(dataDir: any, input: any, options: any): Promise<any>;
export declare function distillAnnotationsToMemory(dataDir: any, input: any, options: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
}[]>;
export declare function extractWithLLM(dataDir: any, input: any, options: any): Promise<{
    id: any;
    name: any;
    description: string;
    type: import("./design-systems/frontmatter.js").FrontmatterValue | undefined;
    updatedAt: any;
}[]>;
