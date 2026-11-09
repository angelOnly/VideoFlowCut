export declare const PLUGIN_PREVIEWS_ROUTE = "/api/plugin-previews";
export interface BakedPreviewBlock {
    poster: string;
    video: string;
    holdMs?: number;
}
export declare function resolvePluginPreviewsDir(projectRoot: string): string;
export declare function bakedPreviewBlock(id: string, dir: string): BakedPreviewBlock | null;
export declare function applyBakedPreviews<T extends {
    id: string;
    manifest?: unknown;
}>(records: T[], dir: string): T[];
