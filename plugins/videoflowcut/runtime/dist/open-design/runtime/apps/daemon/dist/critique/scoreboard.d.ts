import type { CritiqueConfig, PanelistRole, RoundDecision } from '@open-design/contracts/critique';
/**
 * Per-round scores indexed by panelist role. Absent roles are undefined.
 * @see specs/current/critique-theater.md § Composite score formula
 */
export type RoleScores = Partial<Record<PanelistRole, number>>;
/**
 * Accumulated state for a single round's scoring pass.
 * @see specs/current/critique-theater.md § Composite score formula
 */
export interface RoundState {
    n: number;
    scores: RoleScores;
    mustFix: number;
    composite: number;
}
/**
 * Computes the weighted composite score for a set of panelist scores.
 * Absent roles are excluded; weights redistribute proportionally over
 * present roles only. Returns 0 when no role has a score.
 *
 * @see specs/current/critique-theater.md § Composite score formula
 */
export declare function computeComposite(scores: RoleScores, weights: CritiqueConfig['weights']): number;
/**
 * Applies the convergence rule: returns 'ship' when composite >= threshold
 * (with float epsilon 1e-9) AND mustFix === 0; otherwise 'continue'.
 *
 * @see specs/current/critique-theater.md § Convergence rule
 */
export declare function decideRound(composite: number, mustFix: number, cfg: CritiqueConfig): RoundDecision;
/**
 * Selects the best round according to fallbackPolicy when no <SHIP> arrived.
 * Returns the elected RoundState or null when the list is empty or policy
 * is 'fail'.
 *
 * @see specs/current/critique-theater.md § Failure modes (recovery)
 */
export declare function selectFallbackRound(rounds: RoundState[], policy: CritiqueConfig['fallbackPolicy']): RoundState | null;
