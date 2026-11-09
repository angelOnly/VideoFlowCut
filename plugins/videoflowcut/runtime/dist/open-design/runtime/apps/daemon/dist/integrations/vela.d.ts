import type { AmrAuthErrorKind, AmrAuthNetworkPath, AmrAuthStage, AmrAuthStageResult, AmrEntryAttribution, TrackingAmrEntrySource, TrackingCampaignConversionSource, TrackingCampaignId, TrackingPageName } from '@open-design/contracts/analytics';
import type { AmrSessionState } from '@open-design/contracts';
export { resolveAmrProfile } from './vela-profile.js';
type AmrEntrySourcePageName = Extract<TrackingPageName, 'onboarding' | 'chat_panel' | 'settings' | 'file_manager' | 'artifact' | 'home'>;
export interface AmrEntryAnalyticsPayload {
    pageName: 'open_design';
    sourcePageName: AmrEntrySourcePageName;
    area: 'amr_entry';
    element: TrackingAmrEntrySource;
    action: 'click_amr_entry';
    entryId: string;
    sourceProduct: 'open_design';
    sourceDetail: TrackingAmrEntrySource;
    entryOccurredAt: string;
    campaignId?: TrackingCampaignId;
    conversionSource?: TrackingCampaignConversionSource;
    odRole?: string;
    odOrgSize?: string;
    odUseCase?: string[];
    odSource?: string;
}
export interface AmrOnboardingProfileAnalyticsPayload {
    pageName: 'open_design';
    sourcePageName: 'onboarding';
    area: 'onboarding';
    element: 'about_you_submit';
    action: 'submit_profile';
    entryId: string;
    sourceProduct: 'open_design';
    sourceDetail: TrackingAmrEntrySource;
    entryOccurredAt: string;
    profileOccurredAt: string;
    odDeviceId?: string;
    odRole?: string;
    odOrgSize?: string;
    odUseCase?: string[];
    odSource?: string;
}
export interface AmrEntryAnalyticsContext {
    deviceId?: string | null;
    sessionId?: string | null;
    locale?: string | null;
}
interface FetchResponseLike {
    ok: boolean;
    status: number;
}
type FetchLike = (input: string, init: {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
}) => Promise<FetchResponseLike>;
export interface MirrorAmrEntryAnalyticsDeps {
    analyticsContext?: AmrEntryAnalyticsContext | null;
    appVersion?: string | null;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: FetchLike;
}
export interface MirrorAmrEntryAnalyticsResult {
    mirrored: boolean;
    status?: number;
    error?: string;
}
export interface VelaUser {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    plan?: string;
    /**
     * Wallet balance (USD, string), surfaced live from the control-plane
     * `/api/v1/me` endpoint. `null` when unknown (lookup failed, not yet warmed,
     * or upstream does not return it). Absent on stale config-only reads.
     */
    balanceUsd?: string | null;
}
export interface VelaLoginStatus {
    loggedIn: boolean;
    sessionState?: AmrSessionState;
    credentialRevision?: string;
    loginInFlight: boolean;
    profile: string;
    user: VelaUser | null;
    /**
     * Live billing projection (plan tier + wallet balance) for the signed-in
     * account. Kept SEPARATE from `user` so env-backed sessions (where `user` is
     * null) can surface plan/balance without fabricating a blank identity, and so
     * `user.id === null` keeps meaning "no account identity available" for
     * analytics and other callers. Absent until the live summary resolves;
     * absent means unknown / hidden.
     */
    account?: VelaLiveAccount;
    configPath: string;
    /**
     * Device-authorization URL parsed from `vela login` stdout, surfaced so the
     * user can complete sign-in manually when the browser did not auto-open.
     * Present only while a login is in flight and after vela has printed it.
     */
    activationUrl?: string;
    /** Device-authorization user code printed alongside the activation URL. */
    userCode?: string;
    /** True when vela warned it could not open the browser automatically. */
    browserOpenFailed?: boolean;
    /**
     * Origin of the vela web console this runtime talks to, when it was given
     * one. See {@link resolveVelaConsoleOrigin} — the client needs it to build
     * wallet / plans / upgrade links for a non-public AMR environment.
     */
    consoleOrigin?: string;
    authAttemptId?: string;
    authStages?: VelaLoginAuthStage[];
    authRoute?: AmrAuthNetworkPath;
    fallbackUsed?: boolean;
}
/**
 * The vela web console origin this runtime was configured with, normalized
 * without a trailing slash, or undefined when it was given none.
 *
 * Non-prod AMR environments are internal deployments, so their hostnames are
 * not literals in this public repository: packaging injects the origin from a
 * CI secret and the packaged runtime forwards it as `OD_VELA_WEB_URL`. Reporting
 * it on the login status is how the web client learns which console to link to.
 * The resolver combines that packaged origin with the settings-selected AMR
 * profile, so a runtime switch cannot keep linking to the package's backend.
 */
export declare function resolveVelaConsoleOrigin(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): string | undefined;
export interface VelaLoginAuthStage {
    sequence: number;
    stage: AmrAuthStage;
    result: AmrAuthStageResult;
    source: 'daemon';
    occurredAt: string;
    route: AmrAuthNetworkPath;
    errorKind?: AmrAuthErrorKind;
}
export interface VelaLoginAttemptSnapshot {
    authAttemptId?: string;
    authStages?: VelaLoginAuthStage[];
    authRoute?: AmrAuthNetworkPath;
    fallbackUsed?: boolean;
}
export interface VelaLoginActivation {
    activationUrl: string | null;
    userCode: string | null;
    browserOpenFailed: boolean;
}
export declare function parseVelaLoginActivation(stdout: string, stderr: string): VelaLoginActivation;
export interface VelaCredentialRevision {
    authSource: 'env' | 'file' | 'none';
    profile: string;
    loggedIn: boolean;
    userId: string;
    userEmail: string;
    configMtimeMs: number | null;
    /**
     * Non-secret fingerprint of the configured AMR env credentials
     * (`VELA_RUNTIME_KEY` / `VELA_LINK_URL`, which can come from `agentCliEnv.amr`
     * in app-config, not just process env). Env-backed sessions report
     * `user: null`, so without this an account switch that only rewrites the
     * Settings-backed env (leaving `~/.amr/config.json` untouched) would reuse the
     * previous account's cached plan/balance. File-backed sessions fingerprint
     * the stored keys as well, so a successful login is recognized even when a
     * filesystem preserves the config mtime.
     */
    credentialFingerprint: string;
}
export interface VelaControlApiContext {
    profile: string;
    apiUrl: string;
    controlKey: string;
    user: VelaUser | null;
    configMtimeMs: number | null;
}
export interface VelaApiContext {
    profile: string;
    apiUrl: string;
}
interface VelaProfileShape {
    controlKey?: string;
    runtimeKey?: string;
    apiUrl?: string;
    linkUrl?: string;
    user?: VelaUser | null;
}
interface VelaProfileConfigSnapshot {
    profile: string;
    stored: VelaProfileShape | undefined;
    configMtimeMs: number | null;
}
export declare function mergeVelaEnv(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): NodeJS.ProcessEnv;
export declare function amrConfigPath(): string;
export declare function readVelaLoginStatus(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): VelaLoginStatus;
/**
 * Live account fields (plan tier + wallet balance) sourced from the vela CLI
 * (`vela billing summary`). Cached separately from the config-only
 * {@link readVelaLoginStatus} read so the status route can merge live data
 * without blocking: the route reads this cache synchronously and triggers a
 * background CLI refresh for the next poll. The CLI spawn itself lives in the
 * route layer (which already resolves the vela launch path for models).
 */
export interface VelaLiveAccount {
    plan?: string;
    balanceUsd?: string | null;
}
/**
 * Cache key for the live account. Derived from the full credential revision
 * (auth source + profile + signed-in user + config mtime), NOT just the
 * profile — so a logout or an account switch on the same profile produces a
 * fresh key and the previous account's plan/balance can never leak into a new
 * session before the background refresh completes.
 */
export declare function velaLiveAccountCacheKey(revision: VelaCredentialRevision): string;
/** Synchronous, non-blocking read of the most recent live-account projection. */
export declare function peekVelaLiveAccount(cacheKey: string): VelaLiveAccount | null;
/**
 * TTL gate for the background refresh. Returns true (and records the attempt)
 * at most once per cache key per {@link LIVE_ACCOUNT_TTL_MS}, so concurrent
 * status polls don't all spawn the CLI.
 */
export declare function shouldRefreshVelaLiveAccount(cacheKey: string): boolean;
/** Store a freshly fetched live-account projection. */
export declare function setVelaLiveAccount(cacheKey: string, account: VelaLiveAccount): void;
/** Clear the refresh throttle so a failed fetch can retry on the next poll. */
export declare function clearVelaLiveAccountRefreshThrottle(cacheKey: string): void;
/**
 * Drop every cached live-account projection + throttle. Call on logout so a
 * subsequent login can never surface the signed-out account's plan or balance.
 */
export declare function clearAllVelaLiveAccounts(): void;
/**
 * Attach a fetched live account (plan tier + wallet balance) to a login status
 * on the dedicated {@link VelaLoginStatus.account} field. Deliberately does NOT
 * touch `status.user`: env-backed sessions keep `user: null` (no fabricated
 * blank identity), and the billing projection rides on its own field so every
 * surface can read plan/balance uniformly. No-op when signed out or when there
 * is no account to apply.
 */
export declare function applyVelaLiveAccount(status: VelaLoginStatus, account: VelaLiveAccount | null): void;
export declare function readVelaCredentialRevision(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): VelaCredentialRevision;
/** Mark only the currently-active credential revision as rejected upstream. */
export declare function markVelaAuthorizationExpired(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): string;
/** Test/logout seam. A rotated credential naturally has a different revision. */
export declare function clearVelaAuthorizationState(): void;
export declare function readVelaControlApiContext(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>): VelaControlApiContext | null;
export declare function readVelaApiContext(env?: NodeJS.ProcessEnv, configuredEnv?: Record<string, string>, snapshot?: VelaProfileConfigSnapshot): VelaApiContext;
export declare function forgetVelaLogin(env?: NodeJS.ProcessEnv): void;
export interface SpawnedVelaLogin {
    pid: number;
    startedAt: string;
    profile: string;
    authAttemptId: string;
}
export declare function isVelaLoginInFlight(): boolean;
/**
 * True once every supervised login child has finished its `close`/`error`
 * terminal handler and no late proxy fallback is still pending.
 *
 * Stronger than `isVelaLoginInFlight()` for tests that must observe the
 * close-deferred late-fallback decision: the public idle projection can
 * flip true between `exit` and `close` when the attempt was canceled.
 */
export declare function isVelaLoginSupervisorSettled(): boolean;
export interface CancelVelaLoginResult {
    canceled: boolean;
    pids: number[];
}
export declare function cancelVelaLogin(expectedAuthAttemptId?: string | null, expectedAuthRequestId?: string | null): CancelVelaLoginResult;
export interface SpawnVelaLoginDeps {
    configuredEnv?: Record<string, string>;
    baseEnv?: NodeJS.ProcessEnv;
    attribution?: AmrEntryAttribution | null;
    correlationEnv?: Record<string, string>;
    defaultApiUrl?: string | null;
    waitForActivation?: boolean;
}
export interface SpawnVelaLoginWithFallbackDeps extends SpawnVelaLoginDeps {
    authAttemptId?: string | null;
    authRequestId?: string | null;
    proxyApiUrl: string;
}
export declare function parseVelaAuthAttemptId(input: unknown): string | null;
export declare function parseVelaAuthRequestId(input: unknown): string | null;
export declare function readVelaLoginAttemptSnapshot(): VelaLoginAttemptSnapshot;
export declare function spawnVelaLogin(deps?: SpawnVelaLoginDeps): Promise<SpawnedVelaLogin>;
export declare function spawnVelaLoginWithFallback(deps: SpawnVelaLoginWithFallbackDeps): Promise<SpawnedVelaLogin>;
export declare function parseVelaLoginAttribution(input: unknown): AmrEntryAttribution | null;
export declare function parseAmrEntryAnalyticsPayload(input: unknown): AmrEntryAnalyticsPayload | null;
export declare function parseAmrOnboardingProfileAnalyticsPayload(input: unknown): AmrOnboardingProfileAnalyticsPayload | null;
export declare function mirrorAmrEntryAnalytics(payload: AmrEntryAnalyticsPayload, deps?: MirrorAmrEntryAnalyticsDeps): Promise<MirrorAmrEntryAnalyticsResult>;
export declare function mirrorAmrOnboardingProfileAnalytics(payload: AmrOnboardingProfileAnalyticsPayload, deps?: MirrorAmrEntryAnalyticsDeps): Promise<MirrorAmrEntryAnalyticsResult>;
