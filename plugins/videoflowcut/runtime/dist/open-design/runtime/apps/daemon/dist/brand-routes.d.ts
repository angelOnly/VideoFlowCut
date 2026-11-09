import type { Application, Request, Response } from 'express';
import { type insertProject } from './db.js';
import type { CreatedProjectWorkspaceResolver } from './collab/created-project-workspace.js';
import type { AuthorizeProjectRequest } from './collab/project-request-authority.js';
import type { WorkspaceResourceContext } from './collab/workspace-resource-mutation.js';
import type { DesignSystemSummary, UserDesignSystemInput } from './design-systems/index.js';
import { startBrandExtraction } from './brands/index.js';
export interface BrandRoutesDeps {
    /** `<dataDir>/brands` — root of all brand directories. */
    brandsRoot: string;
    /** `<dataDir>/design-systems` — where extracted brands register their
     *  `user:<id>` design system, so selecting a brand in the composer reuses
     *  the existing design-system apply flow. */
    userDesignSystemsRoot: string;
    /** The workspace an extracted brand's design system should be claimed by
     *  (#145), resolved from the exact request's explicit identity. */
    resolveDesignSystemWorkspaceId?: (req: Request) => Promise<string | null>;
    /** Exact-scope creator owned by server.ts; keeps metadata and the generic
     * workspace_resources envelope in one operation. */
    createWorkspaceOwnedDesignSystem?: (root: string, input: UserDesignSystemInput, context: WorkspaceResourceContext | null) => Promise<DesignSystemSummary>;
    /** Roll back both the filesystem record and its generic envelope. */
    deleteWorkspaceOwnedDesignSystem?: (root: string, designSystemId: string) => Promise<boolean>;
    /** Exact read gate shared with the design-system data plane. */
    authorizeDesignSystemRead?: (req: Request, res: Response, designSystemId: string, allowNavigationQuery?: boolean) => Promise<boolean>;
    /** Whether this logical design-system id has a persisted Workspace owner. */
    isDesignSystemWorkspaceBound?: (designSystemId: string) => boolean;
    /** Canonical design-system deletion gate shared with its own DELETE route. */
    deleteDesignSystemForRequest?: (req: Request, res: Response, designSystemId: string, options?: {
        beforeDelete?: () => Promise<boolean>;
    }) => Promise<boolean>;
    /** Exact read gate for logo bytes served from the backing project. */
    authorizeProjectRequest?: AuthorizeProjectRequest;
    /** `<dataDir>/projects` — backing brand-extraction projects. */
    projectsRoot: string;
    /**
     * Where a brand-extraction project belongs. Verifies an asserted workspace
     * identity, then degrades to the daemon's own signed-in workspace rather than
     * refusing — see `createdProjectWorkspaceHome` in
     * `collab/created-project-workspace.ts`.
     */
    resolveCreatedProjectHome?: CreatedProjectWorkspaceResolver;
    /** Skills root — the agent-driven kit page is rendered from the bundled
     *  `brand-extract` template under here. */
    skillsRoot: string;
    /** Runtime data dir — passed to `finalizeBrand` so a finalized brand is
     *  sedimented into `<dataDir>/memory`. */
    dataDir: string;
    /** Shared app database used to register the backing project + conversation. */
    db: Parameters<typeof insertProject>[0];
    /** In-memory run registry, when available, so brand status can reconcile with
     *  active/just-finished backing extraction runs before they age out. */
    runs?: {
        list: (filter?: {
            projectId?: string;
            conversationId?: string;
        }) => Array<{
            id: string;
            projectId?: string | null;
            conversationId?: string | null;
            status: string;
            updatedAt?: number;
            error?: string | null;
            errorCode?: string | null;
        }>;
    };
    /** Optional id factory; defaults inside the brand engine when omitted. */
    randomId?: () => string;
    /** Optional extraction overrides used by deterministic harnesses. */
    prefetch?: Parameters<typeof startBrandExtraction>[0]['prefetch'];
    logoFallback?: Parameters<typeof startBrandExtraction>[0]['logoFallback'];
    imageryFallback?: Parameters<typeof startBrandExtraction>[0]['imageryFallback'];
    /** Selected agent identity for programmatic transcript rows. */
    resolveTranscriptAgent?: () => Promise<{
        agentId?: string | null;
        agentName?: string | null;
    } | null>;
}
export declare function registerBrandRoutes(app: Application, deps: BrandRoutesDeps): void;
