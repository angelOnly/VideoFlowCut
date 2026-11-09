import type { EntryIndexConflict, EntryIndexConflictDetails } from '@open-design/contracts';
export declare const VERCEL_PROVIDER_ID = "vercel-self";
export declare const CLOUDFLARE_PAGES_PROVIDER_ID = "cloudflare-pages";
export declare const SAVED_TOKEN_MASK = "saved-vercel-token";
export declare const SAVED_CLOUDFLARE_TOKEN_MASK = "saved-cloudflare-token";
type JsonObject = Record<string, any>;
type DeployProviderId = typeof VERCEL_PROVIDER_ID | typeof CLOUDFLARE_PAGES_PROVIDER_ID;
type DeployErrorDetails = JsonObject | string | undefined;
type DeployConfig = {
    token: string;
    teamId?: string | undefined;
    teamSlug?: string | undefined;
    accountId?: string | undefined;
    projectName?: string | undefined;
    cloudflarePages?: CloudflarePagesConfigHints | undefined;
};
type CloudflarePagesConfigHints = {
    lastZoneId?: string;
    lastZoneName?: string;
    lastDomainPrefix?: string;
};
type DeployFile = {
    file: string;
    data: Buffer | Uint8Array | string;
    contentType?: string;
    sourcePath?: string;
};
type DeployFilePlan = {
    entryPath: string;
    html: string;
    files: DeployFile[];
    missing: string[];
    invalid: string[];
    /** Set when a walked reference resolves to the root index.html the entry is published as. */
    indexConflict: EntryIndexConflict | null;
};
type DeployOptions = {
    metadata?: unknown;
    hookScriptUrl?: string;
    providerId?: DeployProviderId;
    includeProjectFiles?: boolean;
    /** Share URLs are mounted below a slug, unlike standalone deployment roots. */
    assetUrlPolicy?: 'share-relative';
};
type DeployLinkStatus = 'ready' | 'protected' | 'failed' | 'link-delayed';
type DeploymentUrlCheck = {
    reachable: boolean;
    status?: DeployLinkStatus;
    statusCode?: number;
    statusMessage?: string;
};
type MaybeJsonObject = JsonObject | null | undefined;
export declare const CLOUDFLARE_PAGES_ASSET_UPLOAD_MAX_FILES = 100;
export declare const CLOUDFLARE_PAGES_ASSET_UPLOAD_MAX_BODY_BYTES: number;
export declare const CLOUDFLARE_PAGES_ASSET_MAX_BYTES: number;
export declare class DeployError extends Error {
    status: number;
    details: DeployErrorDetails;
    code?: string | undefined;
    constructor(message: string, status?: number, details?: DeployErrorDetails, code?: string);
}
export declare function deployConfigPath(providerId?: DeployProviderId): string;
export declare function readVercelConfig(): Promise<DeployConfig>;
export declare function readCloudflarePagesConfig(): Promise<DeployConfig>;
export declare function writeVercelConfig(input: Partial<DeployConfig>): Promise<{
    providerId: string;
    configured: boolean;
    tokenMask: string;
    teamId: string;
    teamSlug: string;
    target: string;
}>;
export declare function writeCloudflarePagesConfig(input: Partial<DeployConfig>): Promise<JsonObject>;
export declare function publicDeployConfig(config: Partial<DeployConfig>): {
    providerId: string;
    configured: boolean;
    tokenMask: string;
    teamId: string;
    teamSlug: string;
    target: string;
};
export declare function publicCloudflarePagesConfig(config: Partial<DeployConfig>): JsonObject;
export declare function readDeployConfig(providerId?: DeployProviderId): Promise<DeployConfig>;
export declare function writeDeployConfig(providerId?: DeployProviderId, input?: Partial<DeployConfig>): Promise<JsonObject | {
    providerId: string;
    configured: boolean;
    tokenMask: string;
    teamId: string;
    teamSlug: string;
    target: string;
}>;
export declare function publicDeployConfigForProvider(providerId?: DeployProviderId, config?: Partial<DeployConfig>): JsonObject | {
    providerId: string;
    configured: boolean;
    tokenMask: string;
    teamId: string;
    teamSlug: string;
    target: string;
};
export declare function isDeployProviderId(value: unknown): value is DeployProviderId;
export declare function buildDeployFilePlan(projectsRoot: string, projectId: string, entryName: string, options?: DeployOptions): Promise<DeployFilePlan>;
/**
 * Adds the copy-to-agent instruction to a conflict. This is the only place the
 * text is produced; the web UI and CLI display it verbatim.
 */
export declare function describeEntryIndexConflict(conflict: EntryIndexConflict, action: 'share' | 'deploy'): EntryIndexConflictDetails;
export declare function entryIndexConflictError(conflict: EntryIndexConflict, action: 'share' | 'deploy'): {
    message: string;
    data: EntryIndexConflictDetails;
};
export declare function buildDeployFileSet(projectsRoot: string, projectId: string, entryName: string, options?: DeployOptions): Promise<DeployFile[]>;
export declare function deployToVercel({ config, files, projectId }: {
    config: DeployConfig;
    files: DeployFile[];
    projectId: string;
}): Promise<{
    providerId: string;
    url: any;
    deploymentId: any;
    target: string;
    status: string;
    statusMessage: string;
    reachableAt: number | undefined;
}>;
export declare function listCloudflarePagesZones(config: DeployConfig): Promise<{
    zones: {
        id: string;
        name: string;
        status: string | undefined;
        type: string | undefined;
    }[];
    cloudflarePages: CloudflarePagesConfigHints;
}>;
export declare function deployToCloudflarePages(input: {
    config: DeployConfig;
    files: DeployFile[];
    projectId?: string;
    cloudflarePages?: unknown;
    priorMetadata?: JsonObject | undefined;
    target?: 'preview' | 'production';
}): Promise<{
    providerId: string;
    url: any;
    deploymentId: any;
    target: "preview" | "production";
    status: any;
    statusMessage: any;
    reachableAt: number | undefined;
    cloudflarePages: {
        projectName: string;
        pagesDev: {
            url: any;
            status: DeployLinkStatus;
            statusMessage: string;
            reachableAt: number | undefined;
        };
        customDomain?: {
            hostname: string;
            url: string;
            zoneId: string;
            zoneName: string;
            domainPrefix: string;
            status: string;
            statusMessage: string;
            errorCode: any;
            errorMessage: string;
            dnsStatus: any;
            dnsRecordId: any;
            dnsOwnership: any;
            domainStatus: string;
        } | {
            hostname: string;
            url: string;
            zoneId: string;
            zoneName: string;
            domainPrefix: string;
            status: string;
            statusMessage: string;
            errorCode: any;
            errorMessage: string;
            dnsStatus: string;
            dnsRecordId: any;
            dnsOwnership: string;
            domainStatus: any;
        } | {
            hostname: string;
            url: string;
            zoneId: string;
            zoneName: string;
            domainPrefix: string;
            status: string;
            statusMessage: string;
            errorCode: string | undefined;
            dnsStatus: string;
            dnsRecordId: any;
            dnsOwnership: string;
            domainStatus: string;
            pagesDomainStatus: any;
            validationData: any;
            verificationData: any;
        };
    };
    providerMetadata: {
        cloudflarePagesProjectName: string;
        cloudflarePages: JsonObject;
        cloudflarePagesCustomDomain?: {
            projectId: string;
            pagesProjectName: string;
            hostname: any;
            zoneId: any;
            zoneName: any;
            domainPrefix: any;
            marker: string;
            dnsRecordId: any;
            dnsOwnership: any;
        };
    };
}>;
export declare function readCloudflarePagesDomain(config: DeployConfig, hostname: string): Promise<any>;
export declare function aggregateCloudflarePagesStatus(pagesDev: JsonObject, customDomain?: JsonObject): {
    status: any;
    statusMessage: any;
};
export declare function chunkCloudflarePagesAssetUploads(files: {
    hash: string;
    data: Buffer | Uint8Array | string;
    contentType?: string;
}[], { maxFiles, maxBytes, }?: {
    maxBytes?: number | undefined;
    maxFiles?: number | undefined;
}): {
    hash: string;
    data: Buffer | Uint8Array | string;
    contentType?: string;
}[][];
export declare function cloudflarePagesAssetHash(file: Pick<DeployFile, 'file' | 'data'>): string;
export declare function extractHtmlReferences(html: string): string[];
export declare function extractCssReferences(css: string): string[];
export declare function extractInlineCssReferences(html: string): string[];
type ShareReferenceRewrite = {
    /** Directory the rewritten file is published in; references become relative to it. */
    outputBase: string;
    /** Source path of the shared entry, which is published as `index.html`. */
    entryPath?: string;
};
export declare function rewriteCssReferences(css: string, baseDir: string, share?: ShareReferenceRewrite): string;
export declare function resolveReferencedPath(raw: unknown, baseDir: string): string | null;
export declare function rewriteEntryHtmlReferences(html: string, baseDir: string, share?: ShareReferenceRewrite): string;
export declare const DEPLOY_PREFLIGHT_LARGE_ASSET_BYTES: number;
export declare const DEPLOY_PREFLIGHT_LARGE_BUNDLE_BYTES: number;
export declare const DEPLOY_PREFLIGHT_LARGE_HTML_BYTES: number;
/**
 * @param {{
 *   entryPath: string,
 *   html: string,
 *   files: any[],
 *   missing?: any[],
 *   invalid?: any[]
 * }} input
 * @returns {{ warnings: any[], totalBytes: number, totalFiles: number }}
 */
export declare function analyzeDeployPlan(input: {
    entryPath: string;
    html: string;
    files: DeployFile[];
    missing?: string[];
    invalid?: string[];
    indexConflict?: EntryIndexConflict | null;
}): {
    warnings: JsonObject[];
    totalBytes: number;
    totalFiles: number;
};
export declare function prepareDeployPreflight(projectsRoot: string, projectId: string, entryName: string, options?: DeployOptions): Promise<{
    providerId: DeployProviderId;
    entry: string;
    files: {
        path: string;
        size: number;
        mime: string;
        sourcePath: string | undefined;
    }[];
    totalFiles: number;
    totalBytes: number;
    warnings: JsonObject[];
}>;
export declare function injectDeployHookScript(html: string, scriptUrl: unknown): string;
export declare function normalizeDeployHookScriptUrl(raw: unknown): string;
export declare function waitForReachableDeploymentUrl(urls: unknown[], { timeoutMs, intervalMs, providerLabel }?: {
    intervalMs?: number | undefined;
    providerLabel?: string | undefined;
    timeoutMs?: number | undefined;
}): Promise<{
    status: string;
    url: string;
    statusMessage: string;
    reachableAt?: never;
} | {
    status: string;
    url: string;
    statusMessage: string;
    reachableAt: number;
}>;
export declare function checkDeploymentUrl(url: unknown, { timeoutMs }?: {
    timeoutMs?: number;
}): Promise<DeploymentUrlCheck>;
export declare function isVercelProtectedResponse(resp: Response, body?: string): boolean;
export declare function deploymentUrlCandidates(...responses: MaybeJsonObject[]): string[];
export declare function normalizeDeploymentUrl(url: unknown): string;
export declare function cloudflarePagesProjectNameForProject(projectId: string, projectName?: string): string;
export {};
