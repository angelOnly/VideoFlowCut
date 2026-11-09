import type { Brand } from '@open-design/contracts';
export interface BrandFromDesignMdInput {
    markdown: string;
    sourceUrl: string;
    description?: string | undefined;
    fallbackName?: string;
}
export declare function sourceUrlForDesignMd(markdown: string, fallbackName?: string): string;
export declare function brandFromDesignMd(input: BrandFromDesignMdInput): Brand | null;
