import type { Express } from 'express';
import type Database from 'better-sqlite3';
import type { DesignSystemTokenContractRebuildJobResponse } from '@open-design/contracts';
import { type TeamResourceStateProvider } from '../collab/team-resource-state.js';
import { type VerifyWorkspaceRequestAuthority } from '../collab/workspace-resource-mutation.js';
import type { RouteDeps } from '../server-context.js';
export interface RegisterAtomRoutesDeps {
    db: Database.Database;
    resources: {
        FIRST_PARTY_ATOMS: Array<{
            id: string;
            taskKinds: string[];
            [key: string]: unknown;
        }>;
    };
}
export interface RegisterStaticResourceRoutesDeps extends RouteDeps<'db' | 'http' | 'paths' | 'resources'> {
    /** Settled, TTL-bounded authority for pure local catalog reads. */
    verifyWorkspaceReadAuthority?: VerifyWorkspaceRequestAuthority;
    /** Fresh authority for mutations, materialization, and detail reads. */
    verifyWorkspaceRequestAuthority?: VerifyWorkspaceRequestAuthority;
    tokenContractRebuild?: {
        maybeStartForImportedDesignSystem?: (designSystemId: string) => Promise<DesignSystemTokenContractRebuildJobResponse | undefined>;
    };
    /** Team-resource copy red-line (D3). When present, a frozen team skill cannot
     *  be edit-shadowed into a personal editable copy. Omit to skip (no-op). */
    teamResources?: TeamResourceStateProvider;
}
export declare function registerAtomRoutes(app: Express, ctx: RegisterAtomRoutesDeps): void;
export declare function registerStaticResourceRoutes(app: Express, ctx: RegisterStaticResourceRoutesDeps): void;
export declare function assembleExample(templateHtml: string, slidesHtml: string, title: string): string;
export declare function rewriteSkillAssetUrls(html: string, skillId: string, workspaceQuery?: string): string;
