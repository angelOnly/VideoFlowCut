import type { TeamProject } from '@open-design/contracts';
import { type VelaTeamProjectCatalog } from './vela-cli-team-projects.js';
export interface CreateTeamProjectsListerOptions {
    /** Injectable Vela catalog for tests. */
    teamProjectCatalog?: VelaTeamProjectCatalog;
    env?: NodeJS.ProcessEnv;
}
export declare function createTeamProjectsLister(options: CreateTeamProjectsListerOptions): (workspaceId: string) => Promise<TeamProject[]>;
