import type { WorkspaceBillingPreflight, WorkspaceBillingCatalog, WorkspaceBillingSnapshot, WorkspaceBillingSummary, WorkspaceTeamBillingPlanId, WorkspaceWalletBalance } from '@open-design/contracts';
/** Run `vela billing <args>` and resolve its stdout. */
export type RunVelaBilling = (args: string[]) => Promise<string>;
/** Wall-clock budget for `vela billing preflight`. A hung CLI must not pin
 * recovery polling or the workspace billing route. */
export declare const BILLING_PREFLIGHT_TIMEOUT_MS = 60000;
export interface FetchVelaBillingOptions {
    /** Injectable child-process runner; defaults to spawning the vela binary. */
    run?: RunVelaBilling;
    /** Settings-selected AMR environment applied to the spawned Vela command. */
    configuredEnv?: Record<string, string>;
}
/** Missing capability is distinct from a successful empty pool. */
export declare function fetchVelaBillingPreflight(workspaceId: string, modelId: string | null, options?: FetchVelaBillingOptions): Promise<WorkspaceBillingPreflight | null>;
/** Optional send-time hint; old CLI/API failures stay unknown without a legacy fallback. */
export declare function fetchVelaBillingFundingCheck(workspaceId: string, modelId: string | null, options?: FetchVelaBillingOptions): Promise<WorkspaceBillingPreflight | null>;
export declare function parseBillingPreflight(stdout: string, workspaceId: string, modelId: string | null): WorkspaceBillingPreflight | null;
export declare class VelaWorkspaceBillingSnapshotUnsupportedError extends Error {
    readonly code = "billing_workspace_snapshot_unsupported";
    constructor();
}
export interface VelaWorkspaceBillingProjection {
    snapshot: WorkspaceBillingSnapshot | null;
    workspaceBalance: WorkspaceWalletBalance | null;
}
/** The Go CLI preserves the backend status/code in its wrapped stderr text,
 * while injected/newer adapters may expose a string code directly. */
export declare function isVelaWorkspaceAuthorizationError(error: unknown): boolean;
/** Fetch Vela's account-scoped billing summary through the CLI 收口. */
export declare function fetchVelaBillingSummary(options?: FetchVelaBillingOptions): Promise<WorkspaceBillingSummary | null>;
/**
 * Fetch one explicit workspace wallet. The requested id travels as a CLI
 * argument, never as ambient active-workspace state, and the parser requires
 * Vela to return the same identity with billing-scope v2.
 */
export declare function fetchVelaWorkspaceBalance(workspaceId: string, options?: FetchVelaBillingOptions): Promise<WorkspaceWalletBalance | null>;
/**
 * Prefer Vela's atomic plan+wallet snapshot. An old CLI/server may report the
 * typed unsupported sentinel. Older Cobra builds instead reject the first new
 * command flag before resolving the unknown subcommand; both compatibility
 * cases fall back to the legacy wallet command. Auth/network/parse failures
 * stay unavailable instead of being misclassified as an old server.
 */
export declare function fetchVelaWorkspaceBillingProjection(workspaceId: string, options?: FetchVelaBillingOptions): Promise<VelaWorkspaceBillingProjection>;
export interface BillingCheckoutOptions extends FetchVelaBillingOptions {
    /** Team workspace id whose subscription is being purchased. */
    workspaceId?: string;
    /** Vela team subscription plan id. */
    planId?: WorkspaceTeamBillingPlanId;
    /** Seats to purchase for the team subscription (>= 1). */
    seats?: number;
    /** Where Stripe returns the user after success / cancel. */
    successUrl?: string;
    cancelUrl?: string;
}
/**
 * Start a team-subscription checkout via the CLI 收口 and return the Stripe
 * checkout URL to open, or null when the CLI / session / backend route is
 * unavailable. Mirrors A's `POST …/billing/team-subscription/checkout-sessions`
 * behind `vela billing checkout`. Never throws — a null return means "no URL",
 * so the caller shows an error toast instead of crashing.
 */
export declare function fetchBillingCheckoutUrl(options?: BillingCheckoutOptions): Promise<string | null>;
export declare function fetchVelaBillingCatalog(workspaceId: string, options?: FetchVelaBillingOptions): Promise<WorkspaceBillingCatalog | null>;
/** Map `vela billing summary` without inventing a workspace identity. */
export declare function parseBillingSummary(stdout: string): WorkspaceBillingSummary | null;
/** Parse only a backend-proven balance for the exact requested workspace. */
export declare function parseWorkspaceWalletBalance(stdout: string, requestedWorkspaceId: string): WorkspaceWalletBalance | null;
/** Parse only a backend-proven snapshot for the exact requested workspace. */
export declare function parseWorkspaceBillingSnapshot(stdout: string, requestedWorkspaceId: string): WorkspaceBillingSnapshot | null;
export declare function parseBillingCatalog(stdout: string): WorkspaceBillingCatalog | null;
