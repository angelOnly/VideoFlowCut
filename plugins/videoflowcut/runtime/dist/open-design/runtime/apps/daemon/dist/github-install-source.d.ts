export type GithubRepositoryUrlResolution = {
    kind: 'other';
} | {
    kind: 'invalid';
    error: string;
} | {
    kind: 'repository';
    owner: string;
    repo: string;
    source: string;
};
/**
 * Translate the browser URL users naturally paste into the canonical
 * `github:owner/repo` source understood by both install backends.
 *
 * Deliberately narrow: accepting only a repository root keeps refs/subpaths
 * unambiguous and prevents a GitHub HTML page (issues/tree/blob) from falling
 * through to the generic HTTPS tarball downloader.
 */
export declare function resolveGithubRepositoryUrl(rawSource: string): GithubRepositoryUrlResolution;
