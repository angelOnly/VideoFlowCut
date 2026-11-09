/** @typedef {{ source: 'github', url: string } | { source: 'local', path: string }} InstallTarget */
export declare const GITHUB_URL_RE: RegExp;
export declare const SAFE_NAME_RE: RegExp;
export declare function sanitizeRepoName(url: any): any;
/**
 * Recursively report whether `dir` contains any symbolic link at any depth.
 * Uses lstat-based dirents (readdir withFileTypes) so it detects symlinks
 * without following them and never descends through one.
 * @param {string} dir
 * @returns {Promise<boolean>}
 */
export declare function containsSymlink(dir: any): Promise<boolean>;
/**
 * @param {InstallTarget} target
 * @param {string} userDir - user-installed directory (e.g. ~/.open-design/skills)
 * @param {'skill' | 'design-system'} kind
 * @returns {Promise<{ok: true, dir: string} | {ok: false, error: string}>}
 */
export declare function installFromTarget(target: any, userDir: any, kind: any): Promise<{
    ok: boolean;
    error: string;
    dir?: never;
} | {
    error?: never;
    ok: boolean;
    dir: string;
}>;
/**
 * @param {string} id - skill or DS id to uninstall
 * @param {string} userDir - user-installed directory
 * @param {string} builtInDir - built-in directory
 * @param {'skill' | 'design-system'} kind
 * @returns {Promise<{ok: true} | {ok: false, error: string, status?: number}>}
 */
export declare function uninstallById(id: any, userDir: any, builtInDir: any, kind: any): Promise<{
    ok: boolean;
    error: string;
    status: number;
} | {
    status?: never;
    ok: boolean;
    error: string;
} | {
    error?: never;
    status?: never;
    ok: boolean;
}>;
