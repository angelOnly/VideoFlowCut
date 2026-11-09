import { type PublicShareLinkUnavailableCode } from '@open-design/contracts';
type EnvMap = NodeJS.ProcessEnv | Record<string, string | undefined>;
/**
 * Resolve the canonical public Viewer address. Only presentation configuration
 * failures become null; invalid identity and publishing/authorization errors
 * remain errors. The address uses a root-shell origin, never the console URL.
 */
export declare function resolvePublicShareViewerUrl(projectId: string, slug: string, env?: EnvMap, configuredEnv?: EnvMap): string | null;
/** Strict variant used by callers that must distinguish unavailable links. */
export declare function publicShareViewerUrl(projectId: string, slug: string, env?: EnvMap, configuredEnv?: EnvMap): string;
/**
 * What AMR said about one publication's address, after verification. AMR is
 * the canonical source of the share link (its `SHARE_APP_ORIGIN`); the daemon
 * only checks that what it was handed is structurally that link.
 */
export type AmrShareLink = {
    url: string;
} | {
    code: PublicShareLinkUnavailableCode;
};
/** The address to show for one publication, or why there is none. */
export type PublicShareLink = {
    url: string;
} | {
    url: null;
    code: PublicShareLinkUnavailableCode;
};
/**
 * Accept an AMR-reported address only when it is byte-for-byte the canonical
 * Viewer address of THIS identity on the address's own origin: HTTPS, a
 * root-only origin (no userinfo, query or fragment, judged on the raw text as
 * for the override), and the path exactly `/artifact/{projectId}/{slug}` with
 * the builder's percent-encoding. Anything else is null: a URL for another
 * project, another slug, a console path or a non-canonical spelling is never
 * shown, not repaired.
 */
export declare function verifiedAmrShareViewerUrl(raw: unknown, projectId: string, slug: string): string | null;
/**
 * Read the `url` / `link` pair AMR (through `vela share … --json`) attaches to
 * an active binding. Returns null when the record carries neither (a stopped
 * binding, a pending publish, or an older server): that is "AMR said nothing",
 * not an address. A present `url` that fails verification is reported as
 * unavailable and logged without echoing the address.
 */
export declare function parseAmrShareLink(record: unknown, projectId: string, slug: string): AmrShareLink | null;
/**
 * The single presentation rule for a publication's link:
 *
 * 1. an explicit `OD_SHARE_VIEWER_URL(S)` override (local dev/debug) wins; a
 *    present but invalid override is unavailable, never a fallback;
 * 2. otherwise the address AMR reported (fresh, or the persisted copy of the
 *    last one), re-verified here so a stored legacy console URL never shows;
 * 3. otherwise unavailable, carrying AMR's own code when it gave one.
 *
 * `amr` may be a raw persisted string: it goes through the same verification.
 */
export declare function resolvePublicShareLink(projectId: string, slug: string, amr: AmrShareLink | string | null, env?: EnvMap, configuredEnv?: EnvMap): PublicShareLink;
/** The value to persist with a publication: only a verified AMR address. */
export declare function persistedAmrShareUrl(link: AmrShareLink | null): string | null;
export {};
