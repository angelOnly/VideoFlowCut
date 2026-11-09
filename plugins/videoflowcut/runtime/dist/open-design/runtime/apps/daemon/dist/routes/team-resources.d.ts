import type { Express } from 'express';
import type { TeamResourceStateProvider } from '../collab/team-resource-state.js';
export interface RegisterTeamResourceRoutesDeps {
    teamResources: TeamResourceStateProvider;
}
/**
 * Team-resource routes (D1 state model + D3 enforcement). The copy-check runs
 * the real copy red-line guard against the resolved resource state, so a frozen
 * team resource is rejected with a 403 the same way the copy-out routes will be.
 * The state provider is the E-resource-hub seam (the resource-hub owner).
 */
export declare function registerTeamResourceRoutes(app: Express, deps: RegisterTeamResourceRoutesDeps): void;
