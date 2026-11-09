type FrontmatterScalar = string | number | boolean | null;
export type FrontmatterValue = FrontmatterScalar | FrontmatterArray | FrontmatterObject;
export interface FrontmatterArray extends Array<FrontmatterValue> {
}
export interface FrontmatterObject extends Record<string, FrontmatterValue> {
}
export declare function parseFrontmatter(src: string): {
    data: FrontmatterObject;
    body: string;
};
export {};
//# sourceMappingURL=frontmatter.d.ts.map