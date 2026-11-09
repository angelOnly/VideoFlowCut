import type { Express, RequestHandler } from 'express';
import { type OdNextRolloutAppConfig } from '../strategies/od-next/rollout.js';
/** Read-only engineering status: the active default or an environment override.
 * Legacy saved preferences remain readable for compatibility but no longer
 * control this daemon's rollout. No user Labs switch consumes this status.
 */
export declare function registerStrategyRolloutRoutes(app: Express, deps: {
    requireLocalDaemonRequest: RequestHandler;
    /**
     * The legacy preference reader is retained without changing the route contract.
     * Current rollout policy ignores its value.
     */
    readOdNextPreference: () => Promise<OdNextRolloutAppConfig>;
}): void;
