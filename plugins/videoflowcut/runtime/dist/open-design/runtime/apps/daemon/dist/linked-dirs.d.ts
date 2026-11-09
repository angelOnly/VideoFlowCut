export declare function isBlocked(realPath: string): boolean;
export declare function validateLinkedDirs(dirs: unknown): {
    dirs: string[];
    error?: undefined;
} | {
    error: string;
    dirs?: undefined;
};
