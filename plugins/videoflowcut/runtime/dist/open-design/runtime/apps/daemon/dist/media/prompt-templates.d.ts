declare const SUPPORTED_SURFACES: readonly ['image', 'video'];
type PromptTemplateSurface = (typeof SUPPORTED_SURFACES)[number];
interface PromptTemplate {
    id: string;
    surface: PromptTemplateSurface;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    model?: string;
    aspect?: string;
    prompt: string;
    previewImageUrl?: string;
    previewVideoUrl?: string;
    source: {
        repo: string;
        license: string;
        author?: string;
        url?: string;
    };
}
export declare function listPromptTemplates(root: string): Promise<PromptTemplate[]>;
export declare function readPromptTemplate(root: string, surface: string, id: string): Promise<PromptTemplate | null>;
export {};
