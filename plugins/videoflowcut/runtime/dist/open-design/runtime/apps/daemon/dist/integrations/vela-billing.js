import { runVelaCommand } from './vela-command.js';
/** Wall-clock budget for `vela billing preflight`. A hung CLI must not pin
 * recovery polling or the workspace billing route. */
export const BILLING_PREFLIGHT_TIMEOUT_MS = 60_000;
/** Missing capability is distinct from a successful empty pool. */
export async function fetchVelaBillingPreflight(workspaceId, modelId, options = {}) {
    return fetchVelaFundingPreview('preflight', workspaceId, modelId, options);
}
/** Optional send-time hint; old CLI/API failures stay unknown without a legacy fallback. */
export async function fetchVelaBillingFundingCheck(workspaceId, modelId, options = {}) {
    return fetchVelaFundingPreview('funding-check', workspaceId, modelId, options);
}
async function fetchVelaFundingPreview(command, workspaceId, modelId, options) {
    const args = [command, '--workspace-id', workspaceId, '--format', 'json'];
    if (modelId)
        args.push('--model', modelId);
    let stdout;
    try {
        stdout = await resolveVelaBillingRunner(options)(args);
    }
    catch (error) {
        if (isVelaWorkspaceAuthorizationError(error))
            throw error;
        // Old binaries, old servers and transient failures carry no quota evidence.
        return null;
    }
    return parseBillingPreflight(stdout, workspaceId, modelId);
}
export function parseBillingPreflight(stdout, workspaceId, modelId) {
    try {
        const raw = JSON.parse(stdout);
        const plan = raw.codingPlan;
        const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
        const credits = (value) => typeof value === 'string' && /^\d+$/.test(value);
        if (raw.schemaVersion !== 1 || raw.workspaceId !== workspaceId ||
            !raw.workspaceMemberId?.trim() || raw.modelId !== modelId || !date(raw.generatedAt) ||
            typeof raw.balanceUsd !== 'string' || !/^-?\d+(\.\d+)?$/.test(raw.balanceUsd) ||
            !['coding_plan', 'wallet', 'gateway'].includes(raw.funding) ||
            (raw.fundingCheck !== undefined && !['available', 'insufficient', 'unknown'].includes(raw.fundingCheck)) ||
            (raw.modelCovered !== null && typeof raw.modelCovered !== 'boolean') ||
            !plan || plan.workspaceId !== workspaceId || !date(plan.generatedAt) ||
            typeof plan.eligible !== 'boolean' ||
            (plan.tier !== null && !['go', 'plus', 'pro', 'max'].includes(plan.tier)) ||
            !Array.isArray(plan.windows) ||
            (raw.funding === 'coding_plan' && plan.windows.length === 0) ||
            !plan.windows.every((w) => typeof w.policyId === 'string' && w.policyId.length > 0 &&
                Number.isSafeInteger(w.durationSeconds) && w.durationSeconds > 0 &&
                ['activity_triggered', 'anchored_recurring'].includes(w.resetMode) &&
                credits(w.usedCredits) && credits(w.remainingCredits) && credits(w.limitCredits) &&
                BigInt(w.limitCredits) > 0n && BigInt(w.remainingCredits) <= BigInt(w.limitCredits) &&
                (w.windowStart === null || date(w.windowStart)) && (w.resetsAt === null || date(w.resetsAt))))
            return null;
        return raw;
    }
    catch {
        return null;
    }
}
export class VelaWorkspaceBillingSnapshotUnsupportedError extends Error {
    code = 'billing_workspace_snapshot_unsupported';
    constructor() {
        super('workspace billing snapshot unsupported');
        this.name = 'VelaWorkspaceBillingSnapshotUnsupportedError';
    }
}
/** The Go CLI preserves the backend status/code in its wrapped stderr text,
 * while injected/newer adapters may expose a string code directly. */
export function isVelaWorkspaceAuthorizationError(error) {
    const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string'
        ? error.code.trim().toLowerCase()
        : '';
    if (code === 'workspace_not_authorized' ||
        code === 'workspace_access_revoked' ||
        code === 'auth_required' ||
        code === 'forbidden') {
        return true;
    }
    const message = error instanceof Error ? error.message : String(error ?? '');
    return (/api request failed with status (?:401|403)(?::|\b)/i.test(message) ||
        /\b(?:workspace_not_authorized|workspace_access_revoked|auth_required)\b/i.test(message));
}
/** Fetch Vela's account-scoped billing summary through the CLI 收口. */
export async function fetchVelaBillingSummary(options = {}) {
    const run = resolveVelaBillingRunner(options);
    let stdout;
    try {
        stdout = await run(['summary', '--format', 'json']);
    }
    catch {
        return null;
    }
    return parseBillingSummary(stdout);
}
/**
 * Fetch one explicit workspace wallet. The requested id travels as a CLI
 * argument, never as ambient active-workspace state, and the parser requires
 * Vela to return the same identity with billing-scope v2.
 */
export async function fetchVelaWorkspaceBalance(workspaceId, options = {}) {
    const requestedWorkspaceId = workspaceId.trim();
    if (!requestedWorkspaceId)
        return null;
    const run = resolveVelaBillingRunner(options);
    let stdout;
    try {
        stdout = await run([
            'workspace-balance',
            '--workspace-id',
            requestedWorkspaceId,
            '--format',
            'json',
        ]);
    }
    catch {
        return null;
    }
    return parseWorkspaceWalletBalance(stdout, requestedWorkspaceId);
}
/**
 * Prefer Vela's atomic plan+wallet snapshot. An old CLI/server may report the
 * typed unsupported sentinel. Older Cobra builds instead reject the first new
 * command flag before resolving the unknown subcommand; both compatibility
 * cases fall back to the legacy wallet command. Auth/network/parse failures
 * stay unavailable instead of being misclassified as an old server.
 */
export async function fetchVelaWorkspaceBillingProjection(workspaceId, options = {}) {
    const requestedWorkspaceId = workspaceId.trim();
    if (!requestedWorkspaceId) {
        return { snapshot: null, workspaceBalance: null };
    }
    const run = resolveVelaBillingRunner(options);
    try {
        const stdout = await run([
            'workspace-snapshot',
            '--workspace-id',
            requestedWorkspaceId,
            '--format',
            'json',
        ]);
        const snapshot = parseWorkspaceBillingSnapshot(stdout, requestedWorkspaceId);
        if (!snapshot) {
            throw new Error(`workspace billing snapshot is invalid for ${requestedWorkspaceId}`);
        }
        return {
            snapshot,
            workspaceBalance: {
                workspaceId: snapshot.workspaceId,
                workspaceMemberId: snapshot.workspaceMemberId,
                balanceUsd: snapshot.wallet.balanceUsd,
                billingScopeVersion: 2,
                expiresAt: snapshot.wallet.expiresAt,
                updatedAt: snapshot.wallet.updatedAt,
            },
        };
    }
    catch (error) {
        if (!(error instanceof VelaWorkspaceBillingSnapshotUnsupportedError) &&
            !isWorkspaceBillingSnapshotUnsupported(error, '')) {
            throw error;
        }
        const legacyStdout = await run([
            'workspace-balance',
            '--workspace-id',
            requestedWorkspaceId,
            '--format',
            'json',
        ]);
        const workspaceBalance = parseWorkspaceWalletBalance(legacyStdout, requestedWorkspaceId);
        if (!workspaceBalance) {
            throw new Error(`workspace balance response is invalid for ${requestedWorkspaceId}`);
        }
        return {
            snapshot: null,
            workspaceBalance,
        };
    }
}
/**
 * Start a team-subscription checkout via the CLI 收口 and return the Stripe
 * checkout URL to open, or null when the CLI / session / backend route is
 * unavailable. Mirrors A's `POST …/billing/team-subscription/checkout-sessions`
 * behind `vela billing checkout`. Never throws — a null return means "no URL",
 * so the caller shows an error toast instead of crashing.
 */
export async function fetchBillingCheckoutUrl(options = {}) {
    const workspaceId = options.workspaceId?.trim();
    if (!workspaceId)
        return null;
    const planId = options.planId ?? 'team_plus';
    const seats = options.seats && options.seats > 0 ? Math.floor(options.seats) : 1;
    const args = [
        'checkout',
        '--workspace-id',
        workspaceId,
        '--plan-id',
        planId,
        '--seats',
        String(seats),
        '--format',
        'json',
    ];
    if (options.successUrl)
        args.push('--success-url', options.successUrl);
    if (options.cancelUrl)
        args.push('--cancel-url', options.cancelUrl);
    const run = resolveVelaBillingRunner(options);
    let stdout;
    try {
        stdout = await run(args);
    }
    catch {
        return null;
    }
    const trimmed = stdout.trim();
    if (!trimmed)
        return null;
    try {
        const raw = JSON.parse(trimmed);
        return typeof raw.checkoutUrl === 'string' && raw.checkoutUrl ? raw.checkoutUrl : null;
    }
    catch {
        return null;
    }
}
export async function fetchVelaBillingCatalog(workspaceId, options = {}) {
    const trimmedWorkspaceId = workspaceId.trim();
    if (!trimmedWorkspaceId)
        return null;
    const run = resolveVelaBillingRunner(options);
    let stdout;
    try {
        stdout = await run([
            'team-catalog',
            '--workspace-id',
            trimmedWorkspaceId,
            '--format',
            'json',
        ]);
    }
    catch {
        return null;
    }
    return parseBillingCatalog(stdout);
}
/** Map `vela billing summary` without inventing a workspace identity. */
export function parseBillingSummary(stdout) {
    const trimmed = stdout.trim();
    if (!trimmed)
        return null;
    let raw;
    try {
        raw = JSON.parse(trimmed);
    }
    catch {
        return null;
    }
    const balances = (raw.balances ?? {});
    const creditsPerUsd = positiveRate(raw.creditsPerUsd);
    return {
        workspaceId: null,
        membershipTier: str(raw.membershipTier),
        totalAvailableCredits: credits(balances.totalAvailableCredits),
        subscriptionCredits: credits(balances.subscriptionCredits),
        rechargeCredits: credits(balances.rechargeCredits),
        balanceUsd: str(raw.balanceUsd) || '0',
        ...(creditsPerUsd === null ? {} : { creditsPerUsd }),
        subscriptionStatus: str(raw.subscriptionStatus),
        availableActions: Array.isArray(raw.availableActions)
            ? raw.availableActions.filter((a) => typeof a === 'string')
            : [],
        workspaceBalance: null,
    };
}
/** Parse only a backend-proven balance for the exact requested workspace. */
export function parseWorkspaceWalletBalance(stdout, requestedWorkspaceId) {
    const requested = requestedWorkspaceId.trim();
    const trimmed = stdout.trim();
    if (!requested || !trimmed)
        return null;
    let raw;
    try {
        raw = JSON.parse(trimmed);
    }
    catch {
        return null;
    }
    const workspaceId = str(raw.workspaceId).trim();
    const workspaceMemberId = str(raw.workspaceMemberId).trim();
    const balanceUsd = str(raw.balanceUsd).trim();
    if (raw.billingScopeVersion !== 2 ||
        workspaceId !== requested ||
        !workspaceMemberId ||
        !balanceUsd) {
        return null;
    }
    return {
        workspaceId,
        workspaceMemberId,
        balanceUsd,
        billingScopeVersion: 2,
        expiresAt: nullableString(raw.expiresAt),
        updatedAt: nullableString(raw.updatedAt),
    };
}
/** Parse only a backend-proven snapshot for the exact requested workspace. */
export function parseWorkspaceBillingSnapshot(stdout, requestedWorkspaceId) {
    const requested = requestedWorkspaceId.trim();
    const trimmed = stdout.trim();
    if (!requested || !trimmed)
        return null;
    let raw;
    try {
        raw = JSON.parse(trimmed);
    }
    catch {
        return null;
    }
    const workspaceId = str(raw.workspaceId).trim();
    const workspaceMemberId = str(raw.workspaceMemberId).trim();
    const billing = objectRecord(raw.billing);
    const wallet = objectRecord(raw.wallet);
    const revisions = objectRecord(raw.revisions);
    const revisionClocks = objectRecord(raw.revisionClocks);
    const billingState = nullableBillingState(billing.billingState);
    const balanceUsd = str(wallet.balanceUsd).trim();
    const billingRevision = str(revisions.billing).trim();
    const walletRevision = str(revisions.wallet).trim();
    const billingRevisionClock = parseWorkspaceBillingRevisionClock(revisionClocks.billing);
    const walletRevisionClock = parseWorkspaceBillingRevisionClock(revisionClocks.wallet);
    if (raw.schemaVersion !== 1 ||
        raw.billingScopeVersion !== 2 ||
        !isObjectRecord(raw.billing) ||
        !isObjectRecord(raw.wallet) ||
        !isObjectRecord(raw.revisions) ||
        workspaceId !== requested ||
        !workspaceMemberId ||
        !balanceUsd ||
        !billingRevision ||
        !walletRevision ||
        !isNullableBillingState(billing.billingState) ||
        !isNullableNonEmptyString(billing.planId) ||
        !isNullableNonEmptyString(wallet.expiresAt) ||
        !isNullableNonEmptyString(wallet.updatedAt)) {
        return null;
    }
    return {
        schemaVersion: 1,
        workspaceId,
        workspaceMemberId,
        billingScopeVersion: 2,
        billing: {
            billingState,
            planId: nullableString(billing.planId),
        },
        wallet: {
            balanceUsd,
            expiresAt: nullableString(wallet.expiresAt),
            updatedAt: nullableString(wallet.updatedAt),
        },
        revisions: {
            billing: billingRevision,
            wallet: walletRevision,
        },
        ...(billingRevisionClock && walletRevisionClock
            ? {
                revisionClocks: {
                    billing: billingRevisionClock,
                    wallet: walletRevisionClock,
                },
            }
            : {}),
    };
}
function parseWorkspaceBillingRevisionClock(value) {
    if (!isObjectRecord(value))
        return null;
    const epoch = str(value.epoch).trim();
    const counter = str(value.counter).trim();
    if (!epoch || !/^(?:0|[1-9]\d*)$/.test(counter))
        return null;
    return { epoch, counter };
}
/**
 * An exchange rate is only usable when it is a positive finite number. B sends
 * money-adjacent fields as numbers or as decimal strings, so both are read, but
 * a zero / negative / unparseable rate is reported as absent rather than as a
 * bad divisor — a client that divides by it would print wrong money.
 */
function positiveRate(value) {
    if (typeof value !== 'number' && typeof value !== 'string')
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
/** B sends credit buckets as decimal strings; a missing/garbage bucket is 0. */
function credits(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}
export function parseBillingCatalog(stdout) {
    const trimmed = stdout.trim();
    if (!trimmed)
        return null;
    let raw;
    try {
        raw = JSON.parse(trimmed);
    }
    catch {
        return null;
    }
    const workspaceId = str(raw.workspaceId);
    const billingInterval = raw.billingInterval === 'monthly' ? 'monthly' : null;
    if (!workspaceId || !billingInterval || !Array.isArray(raw.plans))
        return null;
    const plans = raw.plans
        .map((plan) => {
        if (!plan || typeof plan !== 'object')
            return null;
        const record = plan;
        const planId = parseTeamPlanId(record.planId);
        const seatUnitAmountCents = Number(record.seatUnitAmountCents);
        const minSeats = Number(record.minSeats);
        const currency = record.currency === 'usd' ? 'usd' : null;
        const status = record.status === 'active' || record.status === 'disabled'
            ? record.status
            : null;
        if (!planId ||
            !currency ||
            !status ||
            !Number.isFinite(seatUnitAmountCents) ||
            seatUnitAmountCents <= 0 ||
            !Number.isFinite(minSeats) ||
            minSeats <= 0) {
            return null;
        }
        return {
            planId,
            seatUnitAmountCents,
            currency,
            minSeats,
            status,
        };
    })
        .filter((plan) => plan !== null);
    return { workspaceId, billingInterval, plans };
}
function str(value) {
    return typeof value === 'string' ? value : '';
}
function nullableString(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function objectRecord(value) {
    return isObjectRecord(value)
        ? value
        : {};
}
function isObjectRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
const WORKSPACE_BILLING_STATES = new Set([
    'free',
    'active',
    'past_due',
    'canceled',
    'inactive',
    'locked',
]);
function nullableBillingState(value) {
    return typeof value === 'string' &&
        WORKSPACE_BILLING_STATES.has(value)
        ? value
        : null;
}
function isNullableBillingState(value) {
    return value == null ||
        (typeof value === 'string' &&
            WORKSPACE_BILLING_STATES.has(value));
}
function isNullableNonEmptyString(value) {
    return value == null || (typeof value === 'string' && value.trim().length > 0);
}
function parseTeamPlanId(value) {
    return value === 'team_plus' || value === 'team_pro' || value === 'team_max'
        ? value
        : null;
}
function resolveVelaBillingRunner(options) {
    return options.run ?? ((args) => defaultRunVelaBilling(args, options.configuredEnv));
}
const defaultRunVelaBilling = async (args, configuredEnv = {}) => {
    let stderr = '';
    try {
        return await runVelaCommand(['billing', ...args], {
            configuredEnv: {
                ...configuredEnv,
                VELA_INVOCATION_SOURCE: 'open-design',
            },
            maxBuffer: 4 * 1024 * 1024,
            ...(args[0] === 'preflight' || args[0] === 'funding-check' ? { timeoutMs: BILLING_PREFLIGHT_TIMEOUT_MS } : {}),
            onStderr: (value) => {
                stderr = value;
            },
        });
    }
    catch (error) {
        if (args[0] === 'workspace-snapshot' &&
            isWorkspaceBillingSnapshotUnsupported(error, stderr)) {
            throw new VelaWorkspaceBillingSnapshotUnsupportedError();
        }
        throw error;
    }
};
function isWorkspaceBillingSnapshotUnsupported(error, stderr) {
    const detail = [
        stderr,
        error instanceof Error ? error.message : String(error),
    ].join('\n').toLowerCase();
    return (detail.includes('billing_workspace_snapshot_unsupported') ||
        detail.includes('workspace billing snapshot unsupported') ||
        detail.includes('unknown flag: --workspace-id') ||
        (detail.includes('unknown command') &&
            detail.includes('workspace-snapshot')));
}
//# sourceMappingURL=vela-billing.js.map