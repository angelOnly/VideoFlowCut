import { readOdNextRolloutControlStatus, } from '../strategies/od-next/rollout.js';
/** Read-only engineering status: the active default or an environment override.
 * Legacy saved preferences remain readable for compatibility but no longer
 * control this daemon's rollout. No user Labs switch consumes this status.
 */
export function registerStrategyRolloutRoutes(app, deps) {
    app.get('/api/strategies/od-next/rollout', deps.requireLocalDaemonRequest, async (_req, res) => {
        const body = {
            status: readOdNextRolloutControlStatus(process.env, await deps.readOdNextPreference()),
        };
        res.json(body);
    });
}
//# sourceMappingURL=strategy-rollout.js.map