import { Readable } from 'node:stream';
export type SkillInstallErrorCode = 'BAD_REQUEST' | 'FETCH_FAILED' | 'INVALID_ARCHIVE' | 'INVALID_MANIFEST' | 'CONFLICT' | 'INTERNAL_ERROR';
export type SkillRemoteInstallResult = {
    ok: true;
    id: string;
    dir: string;
} | {
    ok: false;
    code: SkillInstallErrorCode;
    error: string;
};
export type SkillArchiveFetcher = (url: string) => Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    body: Readable | null;
}>;
export interface SkillRemoteInstallOptions {
    fetcher?: SkillArchiveFetcher;
    maxBytes?: number;
    /** Called after the archive identity is verified but before any bytes are
     * committed under the user's skills root. */
    allowInstallIdentity?: (identity: {
        id: string;
        slug: string;
    }) => boolean | Promise<boolean>;
}
/**
 * Archive entry invariant shared by extraction and tests. Treat backslashes as
 * separators too so a Windows traversal payload cannot become safe merely
 * because extraction is running on POSIX.
 */
export declare function isSafeSkillArchivePath(rawPath: string): boolean;
export declare function installSkillFromRemoteSource(userSkillsRoot: string, rawSource: string, options?: SkillRemoteInstallOptions): Promise<SkillRemoteInstallResult>;
