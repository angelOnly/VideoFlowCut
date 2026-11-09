// Team-wide shared-project discovery. The Vela CLI is the only production
// transport: it reuses the login session and keeps backend credentials out of
// the OpenDesign daemon.
import { createVelaCliTeamProjectCatalog, shouldUseVelaCliTeamProjectCatalog, } from './vela-cli-team-projects.js';
export function createTeamProjectsLister(options) {
    const env = options.env ?? process.env;
    return async (workspaceId) => {
        const scopedWorkspaceId = workspaceId.trim();
        if (!scopedWorkspaceId)
            return [];
        if (options.teamProjectCatalog)
            return options.teamProjectCatalog.list(workspaceId);
        if (!shouldUseVelaCliTeamProjectCatalog(env))
            return [];
        return createVelaCliTeamProjectCatalog().list(scopedWorkspaceId);
    };
}
//# sourceMappingURL=team-projects.js.map